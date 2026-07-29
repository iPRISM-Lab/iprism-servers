import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { parseCvText } from './cv-import-parser.js';

const MAX_PDF_BYTES = 15 * 1024 * 1024;
const MAX_MODEL_TEXT = 18_000;
let modelWorker = null;
let requestSequence = 0;

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function importCvPdf(file, onProgress = () => {}) {
    validatePdf(file);
    onProgress({ stage: 'Reading PDF', percent: 2 });
    const { text, pageCount } = await extractPdfText(file, ({ page, total }) => {
        onProgress({ stage: `Reading page ${page} of ${total}`, percent: 3 + Math.round((page / total) * 27) });
    });

    if (text.replace(/\s/g, '').length < 80) {
        throw new Error('This PDF has no selectable text. Scanned CVs require OCR, which is not enabled yet.');
    }

    const baseline = parseCvText(text);
    let entities = [];
    let warning = '';
    try {
        onProgress({ stage: 'Loading local language model', percent: 32 });
        entities = await analyzeWithTransformer(selectModelText(text), (progress) => {
            onProgress({
                stage: progress.stage || 'Analyzing CV locally',
                percent: Math.max(32, Math.min(94, progress.percent || 32))
            });
        });
    } catch (error) {
        console.warn('Transformer enrichment was unavailable:', error);
        warning = 'The local language model was unavailable, so the import used the built-in parser only.';
    }

    onProgress({ stage: 'Preparing review', percent: 97 });
    const profile = entities.length ? parseCvText(text, entities) : baseline;
    return { profile, pageCount, characterCount: text.length, modelUsed: entities.length > 0, warning };
}

async function extractPdfText(file, onPage) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({ data: bytes, isEvalSupported: false });
    const document = await loadingTask.promise;
    const pages = [];

    try {
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
            const page = await document.getPage(pageNumber);
            const content = await page.getTextContent();
            pages.push(reconstructPage(content.items));
            page.cleanup();
            onPage({ page: pageNumber, total: document.numPages });
        }
    } finally {
        await document.destroy();
    }

    return { text: pages.join('\n\n'), pageCount: pages.length };
}

function reconstructPage(items) {
    const positioned = items
        .filter((item) => typeof item.str === 'string' && item.str.trim())
        .map((item) => ({
            text: item.str.trim(),
            x: Number(item.transform?.[4] || 0),
            y: Number(item.transform?.[5] || 0),
            width: Number(item.width || 0),
            height: Math.max(1, Math.abs(Number(item.height || item.transform?.[3] || 1)))
        }));
    if (!positioned.length) return '';

    const rows = [];
    for (const item of positioned.sort((left, right) => right.y - left.y || left.x - right.x)) {
        const tolerance = Math.max(2, item.height * 0.35);
        let row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= tolerance);
        if (!row) {
            row = { y: item.y, height: item.height, items: [] };
            rows.push(row);
        }
        row.items.push(item);
        row.height = Math.max(row.height, item.height);
    }

    rows.sort((left, right) => right.y - left.y);
    const output = [];
    rows.forEach((row, index) => {
        row.items.sort((left, right) => left.x - right.x);
        let line = '';
        let edge = null;
        for (const item of row.items) {
            const gap = edge === null ? 0 : item.x - edge;
            if (line && gap > Math.max(2, item.height * 0.2)) line += ' ';
            line += item.text;
            edge = item.x + item.width;
        }
        if (index > 0) {
            const previous = rows[index - 1];
            if (previous.y - row.y > Math.max(previous.height, row.height) * 1.65) output.push('');
        }
        output.push(line.replace(/\s+/g, ' ').trim());
    });
    return output.join('\n');
}

function analyzeWithTransformer(text, onProgress) {
    const worker = getModelWorker();
    const requestId = ++requestSequence;
    return new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => {
            cleanup();
            reject(new Error('The local language model timed out'));
        }, 5 * 60 * 1000);

        const handleMessage = (event) => {
            if (event.data?.requestId !== requestId) return;
            if (event.data.type === 'progress') {
                onProgress(event.data);
                return;
            }
            cleanup();
            if (event.data.type === 'complete') resolve(event.data.entities || []);
            else reject(new Error(event.data.message || 'The local language model failed'));
        };
        const cleanup = () => {
            window.clearTimeout(timeout);
            worker.removeEventListener('message', handleMessage);
        };

        worker.addEventListener('message', handleMessage);
        worker.postMessage({ type: 'analyze', requestId, text });
    });
}

function getModelWorker() {
    if (!modelWorker) modelWorker = new Worker(new URL('./cv-ml.worker.js', import.meta.url), { type: 'module' });
    return modelWorker;
}

function selectModelText(text) {
    if (text.length <= MAX_MODEL_TEXT) return text;
    const headingMatches = [...text.matchAll(/^(?:education|academic appointments|academic positions|experience|publications|awards|skills|programming languages)\s*$/gim)];
    const excerpts = [text.slice(0, 6_000)];
    for (const match of headingMatches.slice(0, 8)) excerpts.push(text.slice(match.index, match.index + 1_600));
    return excerpts.join('\n').slice(0, MAX_MODEL_TEXT);
}

function validatePdf(file) {
    if (!file) throw new Error('Choose a PDF file');
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new Error('Choose a PDF CV');
    if (file.size > MAX_PDF_BYTES) throw new Error('The PDF must be smaller than 15 MB');
}

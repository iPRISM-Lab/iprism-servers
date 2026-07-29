import { env, pipeline } from '@huggingface/transformers';

const MODEL_ID = 'onnx-community/distilbert-NER-ONNX';
const CHUNK_SIZE = 1_200;
let classifierPromise = null;

env.allowLocalModels = false;
env.useBrowserCache = true;
env.useWasmCache = true;
if (env.backends.onnx?.wasm) env.backends.onnx.wasm.numThreads = 1;

self.addEventListener('message', async (event) => {
    if (event.data?.type !== 'analyze') return;
    const { requestId, text } = event.data;
    let phase = 'loading the model';
    try {
        const classifier = await getClassifier(requestId);
        phase = 'running inference';
        const chunks = createChunks(text);
        const entities = [];
        for (let index = 0; index < chunks.length; index += 1) {
            const tokens = await classifier(chunks[index], { ignore_labels: ['O'] });
            entities.push(...aggregateEntities(tokens));
            self.postMessage({
                type: 'progress',
                requestId,
                stage: `Analyzing text ${index + 1} of ${chunks.length}`,
                percent: 60 + Math.round(((index + 1) / chunks.length) * 33)
            });
        }
        self.postMessage({ type: 'complete', requestId, entities: deduplicateEntities(entities) });
    } catch (error) {
        classifierPromise = null;
        const detail = error instanceof Error ? error.message : String(error?.message || error || 'unknown error');
        const message = `Transformer failed while ${phase}: ${detail}`;
        console.error('Transformer worker failed:', error);
        self.postMessage({ type: 'error', requestId, message });
    }
});

function getClassifier(requestId) {
    if (!classifierPromise) classifierPromise = loadClassifier(requestId);
    return classifierPromise;
}

async function loadClassifier(requestId) {
    const progressCallback = (status) => {
        if (status.status !== 'progress') return;
        const progress = Number(status.progress || 0);
        self.postMessage({
            type: 'progress',
            requestId,
            stage: status.file ? `Downloading ${shortFileName(status.file)}` : 'Downloading local language model',
            percent: 34 + Math.round((progress / 100) * 24)
        });
    };

    return await pipeline('token-classification', MODEL_ID, {
        progress_callback: progressCallback
    });
}

function createChunks(text) {
    const paragraphs = String(text || '').split(/\n{2,}/).map((value) => value.trim()).filter(Boolean);
    const chunks = [];
    let current = '';
    for (const paragraph of paragraphs) {
        const pieces = paragraph.length > CHUNK_SIZE ? splitLongText(paragraph) : [paragraph];
        for (const piece of pieces) {
            if (current && current.length + piece.length + 2 > CHUNK_SIZE) {
                chunks.push(current);
                current = '';
            }
            current += `${current ? '\n\n' : ''}${piece}`;
        }
    }
    if (current) chunks.push(current);
    return chunks.slice(0, 16);
}

function splitLongText(value) {
    const pieces = [];
    for (let offset = 0; offset < value.length; offset += CHUNK_SIZE) pieces.push(value.slice(offset, offset + CHUNK_SIZE));
    return pieces;
}

function aggregateEntities(tokens) {
    const output = [];
    let current = null;
    for (const token of tokens || []) {
        const [prefix, type] = String(token.entity || '').split('-');
        if (!type) continue;
        const word = String(token.word || '').trim();
        if (!word) continue;
        if (prefix === 'B' || !current || current.type !== type) {
            if (current) output.push(finalizeEntity(current));
            current = { type, words: [word], scores: [Number(token.score || 0)] };
        } else {
            current.words.push(word);
            current.scores.push(Number(token.score || 0));
        }
    }
    if (current) output.push(finalizeEntity(current));
    return output;
}

function finalizeEntity(entity) {
    const text = entity.words.reduce((result, word) => {
        if (word.startsWith('##')) return `${result}${word.slice(2)}`;
        return `${result}${result ? ' ' : ''}${word}`;
    }, '');
    const score = entity.scores.reduce((sum, value) => sum + value, 0) / entity.scores.length;
    return { type: entity.type, text, score };
}

function deduplicateEntities(entities) {
    const best = new Map();
    for (const entity of entities) {
        const key = `${entity.type}:${entity.text.toLowerCase()}`;
        if (!best.has(key) || best.get(key).score < entity.score) best.set(key, entity);
    }
    return [...best.values()].sort((left, right) => right.score - left.score);
}

function shortFileName(value) {
    return String(value).split('/').at(-1) || 'model';
}

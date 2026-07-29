# CV publishing

The Hub stores private CV drafts in Supabase and publishes static CV pages inside the main iPRISM Pages repository. Every CV uses the shared template and receives a path such as:

```text
https://iprism-lab.github.io/iprism-servers/cv/username/
```

## Architecture

1. GitHub authentication identifies the Hub user.
2. `cv_profiles` stores one owner-protected JSON draft per user.
3. The private `cv-photos` bucket stores profile images under the user's UUID.
4. The browser can extract a text-based PDF locally with PDF.js and enrich names, organizations, and locations with Transformers.js.
5. The authenticated `publish-cv` Edge Function generates static HTML and commits it under `public/cv/<slug>/` in the main repository.
6. The existing GitHub Actions Pages workflow rebuilds the project site.

Published CVs have no runtime dependency on Supabase or the Hub. The generated HTML and profile image are static files.

## GitHub setup

Create an organization automation token that can read organization membership and write repository contents in `iPRISM-Lab/iprism-servers`. The publisher makes one atomic Git commit per publication and does not create repositories, DNS records, or Pages configurations.

The publisher writes `.iprism-cv.json` inside every managed CV directory. It refuses to overwrite a path owned by a different profile. Renaming a public URL removes the previous managed directory in the same commit.

Pushes made by the automation token must be allowed to trigger `.github/workflows/deploy-pages.yml` on `main`.

## Supabase deployment

Link the repository, apply the migration, configure function secrets, and deploy the function:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase secrets set \
  GITHUB_TOKEN=<github-automation-token> \
  GITHUB_ORG=iPRISM-Lab \
  GITHUB_PAGES_REPOSITORY=iprism-servers \
  GITHUB_PAGES_BASE_URL=https://iprism-lab.github.io/iprism-servers \
  ALLOWED_ORIGINS=https://iprism-lab.github.io,http://127.0.0.1:5173
npx supabase functions deploy publish-cv
```

Supabase provides `SUPABASE_URL` and the project secret to the deployed function automatically. `GITHUB_PAGES_REPOSITORY` defaults to `iprism-servers`, and `GITHUB_PAGES_BASE_URL` defaults to the organization project-site URL, but explicit production values are recommended.

## PDF import

The PDF importer accepts text-based PDFs up to 15 MB. PDF.js extracts text in the browser, then a quantized DistilBERT NER model runs in a Web Worker through Transformers.js using single-threaded WASM for broad GitHub Pages compatibility. Model assets are downloaded from Hugging Face on first use and cached by the browser.

The importer never applies results silently. Users review individual personal fields and collection entries, existing populated personal fields are unchecked by default, and duplicate publications and programming languages are omitted. Applying selected results saves the draft immediately.

Scanned image-only PDFs are rejected with an OCR-specific message. OCR is intentionally outside the first importer version.

## Publication behavior

Publishing is idempotent. Later publications update the same managed directory. GitHub Pages may briefly show the previous version while the repository workflow rebuilds and deploys the latest commit.

Existing CV repositories and custom DNS records created by the previous publisher are not deleted automatically. Republishing moves the database's public URL to the central project path.

## Data access

CV drafts and source profile photos remain private. Row Level Security limits each draft and photo folder to its authenticated owner. The Edge Function independently verifies active GitHub organization membership before publishing. Only the Edge Function uses server credentials, and the GitHub token is never sent to the browser.

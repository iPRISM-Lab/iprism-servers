# CV publishing

The Hub stores private CV drafts in Supabase and publishes independent static sites to GitHub Pages. Each CV uses the same generated template and receives an exact DNS record such as `username.cv.example.org`.

## Architecture

1. GitHub authentication identifies the Hub user.
2. `cv_profiles` stores one owner-protected JSON draft per user.
3. The private `cv-photos` bucket stores profile images under the user's UUID.
4. The authenticated `publish-cv` Edge Function generates static HTML, copies the profile image, creates or updates the managed GitHub repository, configures Pages, and creates the user's Cloudflare CNAME record.
5. Published sites have no runtime dependency on Supabase or the Hub.

The publisher creates one public repository per CV. It does not use wildcard DNS records.

## One-time GitHub setup

1. In the GitHub organization settings, open **Pages** and verify the base CV domain. Keep GitHub's TXT verification record in DNS.
2. Create an organization automation token that can create public repositories, read organization members, and has write access to repository administration, contents, and Pages.
3. Ensure organization policy allows the token to create repositories and publish GitHub Pages sites.

The publisher adds a marker file to every managed repository. It refuses to overwrite an existing repository without the matching profile marker.

## One-time Cloudflare setup

Create an API token scoped to the CV domain's zone with `DNS Read` and `DNS Write`. Record the zone ID. The function creates a separate, unproxied CNAME for every published CV and points it to `<organization>.github.io`.

## Supabase deployment

Link the repository to the Supabase project, apply the migration, configure function secrets, and deploy the function:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase secrets set \
  GITHUB_TOKEN=<github-automation-token> \
  GITHUB_ORG=iPrism-Lab \
  CV_BASE_DOMAIN=cv.example.org \
  CLOUDFLARE_API_TOKEN=<cloudflare-token> \
  CLOUDFLARE_ZONE_ID=<cloudflare-zone-id> \
  ALLOWED_ORIGINS=https://iprism-lab.github.io,http://localhost:5173
npx supabase functions deploy publish-cv
```

Supabase provides `SUPABASE_URL` and the project secret to the deployed function automatically.

## Hub deployment

Add `VITE_CV_BASE_DOMAIN` as a GitHub Actions repository variable. Its value must match the function's `CV_BASE_DOMAIN` secret exactly.

After the Hub deployment completes, **CV Builder** appears under **Main**. A user can edit and autosave a draft, upload a profile photo, preview the standard template, reserve a unique subdomain, and publish.

## Publication behavior

Publishing is idempotent: later publishes update the same managed repository. If a user changes their subdomain, the publisher updates the Pages custom domain and removes the previous managed DNS record. GitHub may take up to an hour to provision HTTPS for a new custom domain; publishing still completes and a later publish retries HTTPS enforcement.

## Data access

CV drafts and source profile photos are private. Row Level Security limits each draft and photo folder to its authenticated owner, while column grants prevent clients from changing publisher-managed repository and DNS state. The Edge Function independently verifies active GitHub organization membership before publishing. Only the Edge Function uses server credentials, and GitHub and Cloudflare tokens are never sent to the browser.

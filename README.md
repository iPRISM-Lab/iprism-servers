![iPRISM Hub banner](public/media/readme-banner-preview.png)

# iPRISM Hub

Internal documentation hub for iPRISM Lab infrastructure, server access, operational notes, and shared tooling.


## Open the site

Production URL:

```txt
https://iprism-lab.github.io/iprism-servers/
```

The app uses GitHub sign-in. Access is limited to approved users and can also be restricted by GitHub organization membership.

Banner preview page:

```txt
https://iprism-lab.github.io/iprism-servers/readme-banner.html
```

## Authentication

The app supports GitHub-only sign-in, and only members of the iPRISM-Lab will have access.


## Content editing

Most handbook content is maintained as Markdown.

Current structure:

- Infrastructure pages:
  - `docs/server-nvidia.md`
  - `docs/server-amd.md`
- Operations pages:
  - `docs/backup.md`
  - `docs/monitoring.md`
  - `docs/commands.md`
- Additional documentation pages:
  - other files in `docs/`

If you want a page to be rendered from Markdown, add or update the corresponding file in `docs/`.

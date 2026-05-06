<img width="1328" height="474" alt="iPRISM Hub banner" src="assets/hub-documentation/image1.png" />

# iPRISM Hub Documentation Handbook

## Overview

This handbook explains how to open the iPRISM Hub and how to add new Markdown documentation pages to the site.

The Hub is the internal documentation site for iPRISM Lab infrastructure, server notes, tool handbooks, and operational procedures.

## Open the Hub

Production site:

```text
https://iprism-lab.github.io/iprism-servers/
```

Sign in with GitHub. Access is limited to approved iPRISM users and may require membership in the configured GitHub organization.

## Add a New Page

Create a new `.md` file inside `docs/`.

Use a lowercase, hyphenated filename:

```text
docs/example-handbook.md
```

The Hub will show this page as:

```text
Example handbook
```

## Add Images

Store documentation images under `assets/`, grouped by page name.

Example:

```text
assets/example-handbook/image1.png
assets/example-handbook/network-diagram.png
```

Reference images from Markdown with the same path:

```md
![Short image description](assets/example-handbook/image1.png)
```

The Hub keeps Markdown images inside the document width automatically, so large screenshots will not overflow the page.

## Basic Page Template

Use this structure for new documentation:

```md
# Page Title

## Overview

Short explanation of what this page documents.

## Access

Add URLs, ports, credentials policy, or contact points.

## Procedure

1. First step
2. Second step
3. Third step

## Troubleshooting

- Common issue
- How to fix it

## Contact

Who owns or maintains this documentation.
```

## Add Links

Link to another Hub documentation page:

```md
[Open the Portainer handbook](#doc-portainer)
```

Link to a section inside the same page:

```md
[Jump to Troubleshooting](#troubleshooting)
```

Then create the matching heading:

```md
## Troubleshooting
```

The Hub automatically creates heading anchors from Markdown headings.

## Check the Site Locally

Run the development server:

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, usually:

```text
http://localhost:5173/iprism-servers/
```

## Before Publishing

Check the page before merging:

1. Confirm the page appears in the Hub.
2. Confirm links and table-of-contents anchors work.
3. Confirm code blocks render correctly.
4. Confirm warning callouts render correctly.
5. Confirm there are no broken images or missing files.

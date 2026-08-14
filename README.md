# gsarti.com

Personal academic website of Gabriele Sarti, built with [Astro](https://astro.build).
Migrated from the previous Hugo Academic site ([website-content](https://github.com/gsarti/website-content)).

## Canonical content

The website and academic CV read the same YAML files. Add or change a fact once:

| I want to… | Edit |
|---|---|
| Add a **publication** | Add one complete entry to the matching type group in `src/data/publications.yaml` |
| Change a **position** | `src/data/positions.yaml` |
| Change an **education entry** | `src/data/education.yaml` |
| Add an **academic visit** | `src/data/visits.yaml` |
| Add an **award** or **grant** | `src/data/awards.yaml` or `src/data/grants.yaml` |
| Add **teaching**, **advising**, or **service** | `src/data/teaching.yaml`, `src/data/advising.yaml`, or `src/data/service.yaml` |
| Add **press coverage**, **engagement**, or an **academic reference** | `src/data/press.yaml`, `src/data/engagements.yaml`, or `src/data/references.yaml` |
| Add a **current or past project** | Append an entry to `src/data/projects.yaml` with `current` or `past` |
| Add a **tool, model, or dataset** | Append an entry to `src/data/tools.yaml`, `src/data/models.yaml`, or `src/data/datasets.yaml` |
| Add a **talk** | Append an entry to `src/data/talks.yaml` |
| Add an **event** | Append an entry to `src/data/events.yaml` |
| Add a **map location** used by events or career records | Add it once to `src/data/places.yaml`, then reference its ID with `mapPlace` |
| Add a **news** item | Append an entry to `src/data/news.yaml` |
| Update **identity, contact links, bio or interests** | `src/data/profile.yaml` |
| Update the **About** or **Stuff** page | `src/pages/about.mdx` or `src/pages/stuff.mdx` |
| Write a **blog post** | New folder `src/content/blog/<slug>/index.mdx` (images alongside) |
| Change **navigation** | `src/config/site.ts` |
| Change **CV grouping or deliberate page breaks** | `src/data/cv.yaml` |
| Tweak **colors, fonts, spacing** | Design tokens at the top of `src/styles/global.css` |

Entry schemas are validated at build time (`src/content.config.ts`) — a typo in a
YAML file fails the build with a clear error rather than deploying silently broken.

`publications.yaml` is comprehensive, not just the homepage selection. Set
`featuredOrder` on the papers that should appear under Research; omit it from all
others. Keep each type group newest-first: its YAML order generates CV labels
such as `[C13]`, so dense per-paper numbering is never hand-maintained. The
optional `citation` block holds structured volume, issue, page, DOI, publisher
and thesis metadata used to generate BibTeX and CV details. Publication
`awardIds` point to canonical entries in `awards.yaml`. A matching image or GIF in
`src/assets/publications/<publication-id>.*` is picked up automatically.
Projects use matching images from `src/assets/projects/`. Tools, models and
datasets can set an optional `image` from their respective folder under
`src/assets/`, use `padImage: false` for edge-to-edge artwork, and set
`whiteBackground: true` when transparent image regions should sit on white.
Every resource has a `date`, used to display tools, models and datasets from
newest to oldest. Tools also have a `status` of `WIP`, `Active`, or `Archived`,
shown as a colored tag on their cards.
They accept any non-empty labels in their `links` lists and can
also reference one or more papers with `publicationIds`; the resource card then
shows a Cite button whose dialog combines every referenced paper in each
supported citation format. Projects
reference related entries with `publicationIds`, `toolIds`, `modelIds`, and
`datasetIds`; these IDs are validated against their canonical YAML files. Each
project `funding` entry can be a `grants.yaml` ID or a website-only free-form
entry such as `{ title: "Compute credits", source: "Example Lab" }`. The source
line is optional, and free-form entries are not included in the CV.

Run `npm run validate` after content edits. It applies both the cross-file
integrity checks and Astro's full content schemas, catching duplicate IDs, broken
cross-references, malformed records, invalid date ranges and published papers
whose canonical `Paper` link still points to arXiv.

## Development

```sh
npm install
npm run dev      # background dev server
npm run dev:logs
npm run dev:stop
npm run build    # production build into dist/
```

## CV

The CV is authored in [Typst](https://typst.app/) and reads the same YAML files as
the website. Its output remains at
`public/files/gabriele_sarti_academic_cv.pdf`, so the public URL is unchanged.
For a deliberately shorter CV rendering, an event may add `cv.display` or the
structured `cv.label`, `cv.description`, and `cv.location` overrides while its
canonical website title and location remain unchanged. Career records can
similarly provide `organizationShort`, `cvOrganization`, or
`cvOrganizationUrl` when the CV needs a shorter or more specific presentation.

Install Typst once:

```sh
brew install typst
```

Then build once or rebuild continuously:

```sh
npm run cv:build
npm run cv:watch
```

The repository recommends the Tinymist VS Code extension and includes `CV: build
PDF`, `CV: watch`, and `Content: validate YAML` tasks. `CV: build PDF` is the
default build task, so it is available directly with <kbd>Ctrl/Cmd</kbd> +
<kbd>Shift</kbd> + <kbd>B</kbd>. The old LaTeX sources have been removed; Typst
and the canonical YAML files are the only CV sources.
Deployments install the pinned Typst version and regenerate the PDF before the
site build, so committed YAML changes cannot ship with a stale CV.

## Structure

| Path | Purpose |
|---|---|
| `src/pages/` | File-based routes, including the MDX About and Stuff pages |
| `src/components/` | Reusable page sections, cards, dialogs, and interactive UI |
| `src/data/` | Canonical YAML records shared by the website and CV |
| `src/content/blog/` | Blog posts and their colocated media |
| `src/assets/` | Images processed by Astro, grouped by content type |
| `src/cv/` | Typst CV source and theme |
| `public/` | Files copied verbatim, including the generated CV and thesis mini-sites |
| `redirects.mjs` | Legacy URL compatibility, partly generated from canonical YAML IDs |

## Deployment

This repository is [gsarti/gsarti.github.io](https://github.com/gsarti/gsarti.github.io).
Pushing source changes to `master` triggers `.github/workflows/deploy.yml`, which
regenerates the academic CV, builds the Astro site, and deploys `dist/` through
GitHub Pages at [gsarti.com](https://gsarti.com). The workflow uses GitHub's
native Pages artifact deployment and does not require a deploy key or a separate
compiled-output branch.

Notes:
- `scholar_monitor` is a **separate repository** served as a GitHub project page
  under gsarti.com — deploying this site does not affect it.
- Astro routes are defined by `src/pages/`; `redirects.mjs` only preserves legacy
  URLs and clean entry points for standalone public sites.
- Legacy publication, talk, and project detail redirects are generated from their
  current YAML IDs. Publications resolve to their canonical `Paper` links; talks
  and projects resolve to the matching anchors on `/events` and `/projects`.
- Old `/activities`, `/talks`, and `/tools` entry points resolve to their current
  sections. Removed translation-validator aliases resolve to their hosted artifact
  instead of deleted public folders.
- The PhD/MSc thesis mini-sites are copied verbatim from `public/phd-thesis` and
  `public/msc-thesis`. The legacy `/thesis` entry URL resolves to the MSc site.

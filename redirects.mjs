import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const scholarUrl = 'https://scholar.google.com/citations?user=sK0B_08AAAAJ';
const readRecords = (filename) => {
  const records = parse(readFileSync(new URL(`./src/data/${filename}`, import.meta.url), 'utf8'));
  return Array.isArray(records) ? records : [];
};

// Keep legacy detail URLs in sync with the canonical YAML records.
const publicationRedirects = Object.fromEntries(
  readRecords('publications.yaml').flatMap((publication) => {
    const paper = publication.links?.find((link) => link.label?.toLowerCase() === 'paper');
    return paper ? [[`/publication/${publication.id}`, paper.url]] : [];
  })
);
const talkRedirects = Object.fromEntries(
  readRecords('talks.yaml').map((talk) => [`/talk/${talk.id}`, `/events#${talk.id}`])
);
const projectRedirects = Object.fromEntries(
  readRecords('projects.yaml').map((project) => [`/project/${project.id}`, `/projects#${project.id}`])
);

const legacyRedirects = {
  '/publication': scholarUrl,
  '/publications': scholarUrl,
  '/talk': '/events#talks',
  '/talks': '/events#talks',
  '/post': '/blog',
  '/project': '/projects',
  '/activities': '/events',
  '/tools': '/projects#projects-tools',
  '/authors/gsarti': '/',
  '/post/iclr2020-transformers': '/blog/iclr2020-transformers',
};

const readHelpArtifact =
  'https://claude.ai/public/artifacts/93750a2a-7e34-4cf9-b152-b0a561c725fd';
const translationValidatorArtifact =
  'https://claude.ai/public/artifacts/7654bac0-0a79-41b4-aca9-557e4520f75a';
const legacyToolRedirects = {
  '/langlearn/read-help': readHelpArtifact,
  '/langlearn/trans-check': translationValidatorArtifact,
  '/en-ru-translation-validator': translationValidatorArtifact,
  '/transcheck-enru': translationValidatorArtifact,
};

// Astro's dev server does not automatically resolve directory-style URLs for
// standalone sites copied into public/. Keep their clean public-facing URLs.
const publicSiteRedirects = {
  '/slightly-pasta': '/slightly-pasta/index.html',
  '/phd-thesis': '/phd-thesis/index.html',
  '/msc-thesis': '/msc-thesis/introduction.html',
  '/thesis': '/msc-thesis/introduction.html',
};

export const redirects = {
  ...legacyRedirects,
  ...legacyToolRedirects,
  ...publicationRedirects,
  ...talkRedirects,
  ...projectRedirects,
  ...publicSiteRedirects,
};

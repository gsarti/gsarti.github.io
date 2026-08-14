import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parse } from 'yaml';

const root = process.cwd();
const readYaml = (name) =>
  parse(fs.readFileSync(path.join(root, 'src', 'data', name), 'utf8'));
const failures = [];
const fail = (message) => failures.push(message);

const publications = readYaml('publications.yaml');
const projects = readYaml('projects.yaml');
const tools = readYaml('tools.yaml');
const models = readYaml('models.yaml');
const datasets = readYaml('datasets.yaml');
const talks = readYaml('talks.yaml');
const events = readYaml('events.yaml');
const places = readYaml('places.yaml');
const teaching = readYaml('teaching.yaml');
const advising = readYaml('advising.yaml');
const service = readYaml('service.yaml');
const positions = readYaml('positions.yaml');
const education = readYaml('education.yaml');
const visits = readYaml('visits.yaml');
const awards = readYaml('awards.yaml');
const grants = readYaml('grants.yaml');
const press = readYaml('press.yaml');
const engagements = readYaml('engagements.yaml');
const references = readYaml('references.yaml');
const profile = readYaml('profile.yaml');
const cv = readYaml('cv.yaml');
const asArray = (value) => (Array.isArray(value) ? value : []);
const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const assertUniqueIds = (records, label) => {
  const seen = new Set();
  for (const [index, record] of records.entries()) {
    if (!record.id) {
      fail(`${label}[${index}] has no id`);
      continue;
    }
    if (seen.has(record.id)) fail(`${label} contains duplicate id "${record.id}"`);
    seen.add(record.id);
  }
  return seen;
};

const publicationIds = assertUniqueIds(publications, 'publications');
const projectIds = assertUniqueIds(projects, 'projects');
const toolIds = assertUniqueIds(tools, 'tools');
const modelIds = assertUniqueIds(models, 'models');
const datasetIds = assertUniqueIds(datasets, 'datasets');
const talkIds = assertUniqueIds(talks, 'talks');
const attendedEventIds = assertUniqueIds(events, 'events');
const appearanceIds = new Set([...talkIds, ...attendedEventIds]);
if (appearanceIds.size !== talkIds.size + attendedEventIds.size) {
  fail('talks.yaml and events.yaml contain an overlapping id');
}
const placeIds = assertUniqueIds(places, 'places');
const positionIds = assertUniqueIds(positions, 'positions');
assertUniqueIds(education, 'education');
assertUniqueIds(visits, 'visits');
const awardIds = assertUniqueIds(awards, 'awards');
const grantIds = assertUniqueIds(grants, 'grants');
assertUniqueIds(teaching, 'teaching');
assertUniqueIds(advising, 'advising');

if (!positionIds.has(profile.currentPositionId)) {
  fail(`profile.yaml references unknown current position "${profile.currentPositionId}"`);
} else {
  const currentPosition = positions.find(
    (position) => position.id === profile.currentPositionId
  );
  if (!currentPosition.homepagePresentation) {
    fail(`current position "${profile.currentPositionId}" has no homepagePresentation`);
  }
}

const contributionMarker = /[*†]/u;
for (const publication of publications) {
  const paperLinks = (publication.links ?? []).filter(
    (link) => link.label.toLowerCase() === 'paper'
  );
  if (paperLinks.length !== 1) {
    fail(
      `publication "${publication.id}" must have exactly one Paper link (found ${paperLinks.length})`
    );
  }
  if (
    ['conference', 'workshop', 'journal'].includes(publication.type) &&
    publication.status !== 'forthcoming' &&
    paperLinks[0]?.url.includes('arxiv.org')
  ) {
    fail(`published publication "${publication.id}" uses arXiv as its canonical Paper link`);
  }
  if (publication.cv) {
    fail(`publication "${publication.id}" uses deprecated duplicated cv metadata`);
  }
  if (publication.projects) {
    fail(
      `publication "${publication.id}" uses deprecated inverse project references; use projects.yaml publicationIds`
    );
  }
  if (/equal contribution/i.test(publication.note ?? '')) {
    fail(`publication "${publication.id}" duplicates its structured contribution as a note`);
  }
  if (publication.type === 'thesis') {
    if (!publication.citation?.school || !publication.citation?.thesisType) {
      fail(`thesis "${publication.id}" requires citation.school and citation.thesisType`);
    }
  }
  if (publication.type === 'edited' && !publication.citation?.publisher) {
    fail(`edited work "${publication.id}" requires citation.publisher`);
  }
  const linkedDoi = paperLinks[0]?.url.match(/doi\.org\/(.+)$/i)?.[1]?.toLowerCase();
  const citationDoi = publication.citation?.doi?.toLowerCase();
  if (linkedDoi && linkedDoi !== citationDoi) {
    fail(`publication "${publication.id}" must store its canonical DOI in citation.doi`);
  }
  for (const awardId of publication.awardIds ?? []) {
    if (!awardIds.has(awardId)) {
      fail(`publication "${publication.id}" references unknown award "${awardId}"`);
    }
  }
  for (const author of publication.authors ?? []) {
    if (/^et al\.$/iu.test(author.trim())) {
      fail(`publication "${publication.id}" stores "et al." as an author`);
    }
    if (contributionMarker.test(author)) {
      fail(`publication "${publication.id}" embeds a contribution marker in author "${author}"`);
    }
  }
  for (const contribution of publication.contributions ?? []) {
    for (const author of contribution.authors ?? []) {
      if (!publication.authors.includes(author)) {
        fail(
          `publication "${publication.id}" contribution references unknown author "${author}"`
        );
      }
    }
  }
}

const featuredOrders = publications
  .filter((publication) => publication.featuredOrder !== undefined)
  .map((publication) => publication.featuredOrder);
if (new Set(featuredOrders).size !== featuredOrders.length) {
  fail('publication featuredOrder values must be unique');
}
const sortedFeaturedOrders = [...featuredOrders].sort((a, b) => a - b);
if (sortedFeaturedOrders.some((order, index) => order !== index + 1)) {
  fail(`publication featuredOrder values must be the contiguous range 1-${featuredOrders.length}`);
}

const publicationCategory = (publication) =>
  publication.type === 'thesis' ? 'manuscript' : publication.type;
const categoryOrder = asArray(cv.publicationCategoryOrder);
if (categoryOrder.length === 0 || categoryOrder.some((value) => !isNonEmptyString(value))) {
  fail('cv.yaml publicationCategoryOrder must be a non-empty string array');
}
if (new Set(categoryOrder).size !== categoryOrder.length) {
  fail('cv.yaml publicationCategoryOrder contains duplicate categories');
}
const publicationCategories = new Set(publications.map(publicationCategory));
for (const category of publicationCategories) {
  if (!categoryOrder.includes(category)) {
    fail(`cv.yaml publicationCategoryOrder omits publication category "${category}"`);
  }
}
for (const category of categoryOrder) {
  if (!publicationCategories.has(category)) {
    fail(`cv.yaml publicationCategoryOrder contains unused category "${category}"`);
  }
  if (!isNonEmptyString(cv.publicationCategoryLabels?.[category])) {
    fail(`cv.yaml publicationCategoryLabels has no label for "${category}"`);
  }
}
let previousCategoryIndex = -1;
for (const publication of publications) {
  const category = publicationCategory(publication);
  const categoryIndex = categoryOrder.indexOf(category);
  if (categoryIndex === -1) {
    fail(`publication "${publication.id}" has unknown CV category "${category}"`);
    continue;
  }
  if (categoryIndex < previousCategoryIndex) {
    fail(
      `publication "${publication.id}" breaks canonical category ordering in publications.yaml`
    );
  }
  previousCategoryIndex = categoryIndex;
}

for (const educationEntry of education) {
  if (
    educationEntry.thesisPublicationId &&
    !publicationIds.has(educationEntry.thesisPublicationId)
  ) {
    fail(
      `education "${educationEntry.id}" references unknown thesis publication "${educationEntry.thesisPublicationId}"`
    );
  }
}
for (const advisingEntry of advising) {
  for (const id of advisingEntry.publicationIds ?? []) {
    if (!publicationIds.has(id)) {
      fail(`advising "${advisingEntry.id}" references unknown publication "${id}"`);
    }
  }
}

const canonicalPublicationUrls = new Map(
  publications.flatMap((publication) =>
    (publication.links ?? []).map((link) => [link.url, publication.id])
  )
);
const canonicalPublicationTitles = new Map(
  publications.map((publication) => [publication.title.trim().toLowerCase(), publication.id])
);
const canonicalPaperUrls = new Map(
  publications.flatMap((publication) =>
    (publication.links ?? [])
      .filter((link) => link.label.toLowerCase() === 'paper')
      .map((link) => [link.url, publication.id])
  )
);
const publicationsById = new Map(
  publications.map((publication) => [publication.id, publication])
);
const validProjectCategories = new Set([
  'current',
  'past',
]);
for (const project of projects) {
  if (!validProjectCategories.has(project.category)) {
    fail(`project "${project.id}" has unknown category "${project.category}"`);
  }
  const references = asArray(project.publicationIds);
  if (new Set(references).size !== references.length) {
    fail(`project "${project.id}" contains duplicate publicationIds`);
  }
  for (const publicationId of references) {
    const publication = publicationsById.get(publicationId);
    if (!publication) {
      fail(`project "${project.id}" references unknown publication "${publicationId}"`);
      continue;
    }
    if (
      project.description?.includes(`[${publication.title}](`)
    ) {
      fail(
        `project "${project.id}" embeds a paper URL for canonical publication "${publicationId}" in its description`
      );
    }
  }
  for (const [field, resourceLabel, knownIds] of [
    ['toolIds', 'tool', toolIds],
    ['modelIds', 'model', modelIds],
    ['datasetIds', 'dataset', datasetIds],
  ]) {
    const resourceReferences = asArray(project[field]);
    if (new Set(resourceReferences).size !== resourceReferences.length) {
      fail(`project "${project.id}" contains duplicate ${field}`);
    }
    for (const resourceId of resourceReferences) {
      if (!knownIds.has(resourceId)) {
        fail(
          `project "${project.id}" references unknown ${resourceLabel} "${resourceId}"`
        );
      }
    }
  }
  const fundingEntries = asArray(project.funding);
  const fundingReferences = fundingEntries.filter((entry) => typeof entry === 'string');
  const fundingTexts = fundingEntries
    .filter((entry) => entry && typeof entry === 'object' && 'title' in entry)
    .map((entry) => `${entry.title}\u0000${entry.source ?? ''}`);
  if (new Set(fundingReferences).size !== fundingReferences.length) {
    fail(`project "${project.id}" contains duplicate funding grant ids`);
  }
  if (new Set(fundingTexts).size !== fundingTexts.length) {
    fail(`project "${project.id}" contains duplicate free-form funding text`);
  }
  for (const grantId of fundingReferences) {
    if (!grantIds.has(grantId)) {
      fail(`project "${project.id}" references unknown funding grant "${grantId}"`);
    }
  }
  for (const entry of fundingEntries) {
    if (
      typeof entry !== 'string' &&
      (
        !entry ||
        typeof entry !== 'object' ||
        !isNonEmptyString(entry.title) ||
        (entry.source !== undefined && !isNonEmptyString(entry.source))
      )
    ) {
      fail(`project "${project.id}" has malformed free-form funding entry`);
    }
  }
  for (const link of asArray(project.links)) {
    const canonicalId = canonicalPaperUrls.get(link.url);
    if (canonicalId) {
      fail(
        `project "${project.id}" duplicates the canonical Paper URL for publication "${canonicalId}"`
      );
    }
    if (references.length > 0 && /\bpaper\b/i.test(link.label)) {
      fail(
        `project "${project.id}" stores paper link "${link.label}"; use publicationIds instead`
      );
    }
  }
}
for (const [resourceType, resources] of [
  ['tool', tools],
  ['model', models],
  ['dataset', datasets],
]) {
  for (const resource of resources) {
    const references = asArray(resource.publicationIds);
    if (new Set(references).size !== references.length) {
      fail(`${resourceType} "${resource.id}" contains duplicate publicationIds`);
    }
    for (const id of references) {
      if (!publicationIds.has(id)) {
        fail(`${resourceType} "${resource.id}" references unknown publication "${id}"`);
      }
    }
    for (const link of asArray(resource.links)) {
      if (!isNonEmptyString(link.label)) {
        fail(`${resourceType} "${resource.id}" has an empty link label`);
      }
      if (!isNonEmptyString(link.url)) {
        fail(`${resourceType} "${resource.id}" has an empty "${link.label}" URL`);
      }
    }
  }
}
for (const event of [...talks, ...events]) {
  if (event.location && !event.mapPlace) {
    fail(`event "${event.id}" has a location but no canonical mapPlace`);
  }
  if (event.mapPlace && !placeIds.has(event.mapPlace)) {
    fail(`event "${event.id}" references unknown map place "${event.mapPlace}"`);
  }

  for (const paper of event.papers ?? []) {
    if (typeof paper === 'string') {
      fail(`event "${event.id}" stores a raw paper URL instead of a paper reference object`);
      continue;
    }
    if (paper.publicationId) {
      if (!publicationIds.has(paper.publicationId)) {
        fail(
          `event "${event.id}" references unknown publication "${paper.publicationId}"`
        );
      }
      if (paper.url || paper.label) {
        fail(
          `event "${event.id}" paper reference "${paper.publicationId}" mixes canonical and external fields`
        );
      }
      continue;
    }
    if (!paper.url || !paper.label) {
      fail(`event "${event.id}" external paper reference requires both url and label`);
      continue;
    }
    const canonicalId = canonicalPublicationUrls.get(paper.url);
    if (canonicalId) {
      fail(
        `event "${event.id}" uses an external URL for canonical publication "${canonicalId}"`
      );
    }
    const titleMatchId = canonicalPublicationTitles.get(paper.label.trim().toLowerCase());
    if (titleMatchId) {
      fail(
        `event "${event.id}" uses an external label for canonical publication "${titleMatchId}"`
      );
    }
  }
}

for (const [recordType, records] of [
  ['position', positions],
  ['education', education],
  ['visit', visits],
]) {
  for (const record of records) {
    if (!record.mapPlace) {
      fail(`${recordType} "${record.id}" has no canonical mapPlace`);
    } else if (!placeIds.has(record.mapPlace)) {
      fail(`${recordType} "${record.id}" references unknown map place "${record.mapPlace}"`);
    }
  }
}

const coordinateOwners = new Map();
for (const place of places) {
  if (!place.coordinates) {
    if (place.id !== 'online') fail(`map place "${place.id}" has no coordinates`);
    continue;
  }
  const [longitude, latitude] = place.coordinates;
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    fail(`map place "${place.id}" has invalid coordinates`);
  }
  const coordinateKey = place.coordinates.join(',');
  const existingPlace = coordinateOwners.get(coordinateKey);
  if (existingPlace) {
    fail(`map places "${existingPlace}" and "${place.id}" share the same coordinates`);
  } else {
    coordinateOwners.set(coordinateKey, place.id);
  }
}

const groupedDisseminationKeys = ['invitedLectures', 'academicSeminars'];
const flatDisseminationKeys = [
  'otherPresentations',
  'scienceCommunication',
  'industrialSeminars',
];
const eventIdGroups = [];
for (const key of groupedDisseminationKeys) {
  const groups = cv.dissemination?.[key];
  if (!Array.isArray(groups)) {
    fail(`cv.yaml dissemination.${key} must be an array`);
    continue;
  }
  for (const [index, group] of groups.entries()) {
    if (!isNonEmptyString(group?.title)) {
      fail(`cv.yaml dissemination.${key}[${index}] requires a title`);
    }
    if (!Array.isArray(group?.eventIds) || group.eventIds.length === 0) {
      fail(`cv.yaml dissemination.${key}[${index}] requires eventIds`);
      continue;
    }
    if (
      group.pageBreakBefore !== undefined &&
      typeof group.pageBreakBefore !== 'boolean'
    ) {
      fail(`cv.yaml dissemination.${key}[${index}].pageBreakBefore must be boolean`);
    }
    eventIdGroups.push(...group.eventIds);
  }
}
for (const key of flatDisseminationKeys) {
  const ids = cv.dissemination?.[key];
  if (!Array.isArray(ids)) {
    fail(`cv.yaml dissemination.${key} must be an array`);
    continue;
  }
  eventIdGroups.push(...ids);
}
for (const id of new Set(
  eventIdGroups.filter((value, index) => eventIdGroups.indexOf(value) !== index)
)) {
  fail(`cv.yaml references event "${id}" more than once`);
}
for (const id of eventIdGroups) {
  if (!isNonEmptyString(id)) {
    fail('cv.yaml contains an empty/non-string event reference');
    continue;
  }
  if (!appearanceIds.has(id)) fail(`cv.yaml references unknown talk/event "${id}"`);
}

const defaultSectionLabels = {
  currentPosition: 'Current Position',
  education: 'Education',
  experience: 'Experience',
  teachingAndAdvising: 'Teaching and Advising',
  awards: 'Awards',
  grants: 'Scholarships and Grants',
  publications: 'Publications',
  service: 'Professional Service',
  dissemination: 'Dissemination Activities',
  press: 'Press Coverage',
  engagements: 'Mentorship and Social Engagements',
  references: 'Academic References',
};
const configuredSectionLabels = cv.sectionLabels ?? {};
const validBreakLabels = new Set(
  Object.entries(defaultSectionLabels).map(
    ([key, fallback]) => configuredSectionLabels[key] ?? fallback
  )
);
if (!Array.isArray(cv.pageBreakBeforeSections)) {
  fail('cv.yaml pageBreakBeforeSections must be an array');
} else {
  for (const label of cv.pageBreakBeforeSections) {
    if (!validBreakLabels.has(label)) {
      fail(`cv.yaml pageBreakBeforeSections contains unknown section "${label}"`);
    }
  }
  if (new Set(cv.pageBreakBeforeSections).size !== cv.pageBreakBeforeSections.length) {
    fail('cv.yaml pageBreakBeforeSections contains duplicates');
  }
}

const checkRange = (record, label) => {
  if (!record.dateStart || !record.dateEnd) return;
  if (new Date(record.dateStart) > new Date(record.dateEnd)) {
    fail(`${label} "${record.id ?? record.name ?? record.title}" starts after it ends`);
  }
};
for (const record of [
  ...positions,
  ...education,
  ...visits,
]) {
  checkRange(record, 'career record');
}
for (const record of [...teaching, ...advising]) {
  checkRange(record, 'activity record');
}

if (failures.length) {
  console.error(`Canonical data validation failed with ${failures.length} issue(s):`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

const featuredCount = featuredOrders.length;
console.log(
  `Canonical data valid: ${publications.length} publications (${featuredCount} featured), ` +
    `${projects.length} projects, ${tools.length} tools, ${models.length} models, ` +
    `${datasets.length} datasets, ${talks.length} talks, ${events.length} events, ` +
    `${advising.length} advisees.`
);

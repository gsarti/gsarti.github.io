import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { parse } from 'yaml';

const yamlArray = (path: string) => file(path, { parser: (text) => parse(text) });
const yamlIndexedArray = (path: string) =>
  file(path, {
    parser: (text) =>
      (parse(text) as Record<string, unknown>[]).map((record, index) => ({
        id: String(index),
        ...record,
      })),
  });
const yamlObject = (path: string) =>
  file(path, { parser: (text) => [{ id: 'main', ...parse(text) }] });

const linkSchema = z.object({
  label: z.string(),
  url: z.string(),
  kind: z.enum(['pdf', 'code', 'dataset', 'poster', 'slides', 'video', 'demo', 'website', 'other']),
});

const publications = defineCollection({
  loader: yamlArray('src/data/publications.yaml'),
  schema: z.object({
    title: z.string(),
    authors: z.array(z.string()),
    date: z.coerce.date(),
    type: z.enum(['journal', 'conference', 'workshop', 'preprint', 'thesis', 'edited']),
    status: z.enum(['published', 'forthcoming', 'preprint']).optional(),
    venue: z.string().optional(),
    venueShort: z.string().optional(),
    citation: z
      .object({
        containerTitle: z.string().optional(),
        doi: z.string().optional(),
        volume: z.string().optional(),
        issue: z.string().optional(),
        pages: z.string().optional(),
        articleNumber: z.string().optional(),
        publisher: z.string().optional(),
        editors: z.array(z.string()).optional(),
        school: z.string().optional(),
        thesisType: z.enum(['phd', 'masters']).optional(),
        corporateAuthors: z.array(z.string()).optional(),
      })
      .optional(),
    abstract: z.string().optional(),
    summary: z.string().optional(),
    note: z.string().optional(),
    distinction: z.string().optional(),
    awardIds: z.array(z.string()).default([]),
    links: z.array(linkSchema).default([]),
    image: z.string().optional(),
    featuredOrder: z.number().int().positive().optional(),
    contributions: z
      .array(
        z.object({
          authors: z.array(z.string()).min(1),
          label: z.string(),
        })
      )
      .default([]),
    authorDisplay: z
      .object({
        web: z
          .object({
            head: z.number().int().nonnegative(),
            tail: z.number().int().nonnegative(),
            includeSelf: z.boolean().optional(),
          })
          .optional(),
        cv: z
          .object({
            head: z.number().int().nonnegative(),
            tail: z.number().int().nonnegative(),
            includeSelf: z.boolean().optional(),
          })
          .optional(),
      })
      .optional(),
  }),
});

const eventPaperSchema = z.union([
  z.object({
    publicationId: z.string(),
  }),
  z.object({
    url: z.string(),
    label: z.string(),
  }),
]);

const talks = defineCollection({
  loader: yamlArray('src/data/talks.yaml'),
  schema: z.object({
    title: z.string(),
    event: z.string(),
    eventUrl: z.string().optional(),
    location: z.string().optional(),
    mapPlace: z.string().optional(),
    date: z.coerce.date(),
    summary: z.string().optional(),
    links: z.array(linkSchema).default([]),
  }),
});

const events = defineCollection({
  loader: yamlArray('src/data/events.yaml'),
  schema: z.object({
    name: z.string(),
    date: z.coerce.date(),
    url: z.string().optional(),
    location: z.string().optional(),
    mapPlace: z.string().optional(),
    description: z.string().optional(),
    papers: z.array(eventPaperSchema).default([]),
  }),
});

const places = defineCollection({
  loader: yamlArray('src/data/places.yaml'),
  schema: z.object({
    label: z.string(),
    coordinates: z
      .tuple([
        z.number().min(-180).max(180),
        z.number().min(-90).max(90),
      ])
      .optional(),
  }),
});

const projectEntrySchema = z.object({
    title: z.string(),
    summary: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    publicationIds: z.array(z.string()).default([]),
    toolIds: z.array(z.string()).default([]),
    modelIds: z.array(z.string()).default([]),
    datasetIds: z.array(z.string()).default([]),
    links: z.array(linkSchema).default([]),
    funding: z
      .array(
        z.union([
          z.string(),
          z.object({
            title: z.string().trim().min(1),
            source: z.string().trim().min(1).optional(),
          }),
        ])
      )
      .default([]),
    period: z.string().nullish(),
    collaborators: z.array(z.string()).default([]),
    image: z.string().optional(),
    description: z.string().optional(),
});

const projects = defineCollection({
  loader: yamlArray('src/data/projects.yaml'),
  schema: projectEntrySchema.extend({
    category: z.enum(['current', 'past']),
  }),
});

const resourceLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
});

const resourceEntrySchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  summary: z.string().optional(),
  image: z.string().optional(),
  padImage: z.boolean().default(true),
  whiteBackground: z.boolean().default(false),
  publicationIds: z.array(z.string()).default([]),
  links: z.array(resourceLinkSchema).default([]),
});

const tools = defineCollection({
  loader: yamlArray('src/data/tools.yaml'),
  schema: resourceEntrySchema.extend({
    status: z.enum(['WIP', 'Active', 'Archived']),
  }),
});

const models = defineCollection({
  loader: yamlArray('src/data/models.yaml'),
  schema: resourceEntrySchema,
});

const datasets = defineCollection({
  loader: yamlArray('src/data/datasets.yaml'),
  schema: resourceEntrySchema,
});

const news = defineCollection({
  loader: file('src/data/news.yaml', {
    parser: (text) =>
      (parse(text) as Record<string, unknown>[]).map((n, i) => ({ id: String(i), ...n })),
  }),
  schema: z.object({
    date: z.coerce.date(),
    label: z.string(),
    text: z.string(),
  }),
});

const teaching = defineCollection({
  loader: yamlArray('src/data/teaching.yaml'),
  schema: z.object({
    course: z.string(),
    dateStart: z.coerce.date(),
    dateEnd: z.coerce.date(),
    role: z.string(),
    coInstructors: z.array(z.string()).default([]),
    degree: z.string(),
    university: z.string(),
    website: z.string().optional(),
    repository: z.string().optional(),
  }),
});

const advising = defineCollection({
  loader: yamlArray('src/data/advising.yaml'),
  schema: z.object({
    name: z.string(),
    level: z.enum(['phd', 'msc', 'bsc']),
    description: z.string(),
    dateStart: z.coerce.date(),
    dateEnd: z.coerce.date().optional(),
    ongoing: z.boolean().default(false),
    coSupervisors: z.array(z.string()).default([]),
    website: z.string().optional(),
    programUrl: z.string().optional(),
    image: z.string().optional(),
    projectName: z.string().nullish(),
    publicationIds: z.array(z.string()).default([]),
  }),
});

const service = defineCollection({
  loader: yamlIndexedArray('src/data/service.yaml'),
  schema: z.object({
    role: z.string(),
    venue: z.string(),
    url: z.string().optional(),
    linkLabel: z.string().optional(),
    dateStart: z.number().int().optional(),
    dateEnd: z.number().int().optional(),
    ongoing: z.boolean().default(false),
    years: z.array(z.number().int()).optional(),
  }),
});

const careerEntryBase = z.object({
  dateStart: z.coerce.date(),
  dateEnd: z.coerce.date(),
});

const positions = defineCollection({
  loader: yamlArray('src/data/positions.yaml'),
  schema: careerEntryBase.extend({
    dateEnd: z.coerce.date().optional(),
    organization: z.string(),
    organizationUrl: z.string().optional(),
    cvOrganization: z.string().optional(),
    cvOrganizationUrl: z.string().optional(),
    location: z.string(),
    mapPlace: z.string(),
    title: z.string(),
    ongoing: z.boolean().default(false),
    expectedEnd: z.boolean().default(false),
    homepage: z.boolean().default(false),
    homepagePresentation: z
      .object({
        role: z.string(),
        lab: z.string().optional(),
        labUrl: z.string().url().optional(),
        department: z.string().optional(),
      })
      .optional(),
    logos: z.array(z.string()).default([]),
    description: z.string().optional(),
    descriptionLinks: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
    hosts: z.array(z.string()).default([]),
  }).refine((position) => position.ongoing || position.dateEnd !== undefined, {
    message: 'Completed positions require an end date',
    path: ['dateEnd'],
  }),
});

const education = defineCollection({
  loader: yamlArray('src/data/education.yaml'),
  schema: careerEntryBase.extend({
    institution: z.string(),
    institutionUrl: z.string().optional(),
    location: z.string(),
    mapPlace: z.string(),
    country: z.string().optional(),
    degree: z.string(),
    homepageDegree: z.string().optional(),
    homepage: z.boolean().default(false),
    logos: z.array(z.string()).default([]),
    advisors: z.array(z.string()).default([]),
    thesisPublicationId: z.string().optional(),
    description: z.string().optional(),
  }),
});

const visits = defineCollection({
  loader: yamlArray('src/data/visits.yaml'),
  schema: careerEntryBase.extend({
    organization: z.string(),
    organizationUrl: z.string().optional(),
    location: z.string(),
    mapPlace: z.string(),
    host: z.string(),
    description: z.string(),
    descriptionUrl: z.string().optional(),
  }),
});

const awards = defineCollection({
  loader: yamlArray('src/data/awards.yaml'),
  schema: z.object({
    title: z.string(),
    organization: z.string(),
    year: z.number().int(),
    url: z.string().optional(),
    publicationLabel: z.string().optional(),
  }),
});

const grants = defineCollection({
  loader: yamlArray('src/data/grants.yaml'),
  schema: z.object({
    title: z.string(),
    organization: z.string(),
    organizationShort: z.string().optional(),
    year: z.number().int(),
    amount: z.string().optional(),
  }),
});

const press = defineCollection({
  loader: yamlIndexedArray('src/data/press.yaml'),
  schema: z.object({
    outlet: z.string(),
    title: z.string(),
    year: z.number().int(),
    url: z.string(),
  }),
});

const engagements = defineCollection({
  loader: yamlIndexedArray('src/data/engagements.yaml'),
  schema: z.object({
    period: z.string(),
    role: z.string(),
    organization: z.string(),
    url: z.string().optional(),
  }),
});

const references = defineCollection({
  loader: yamlIndexedArray('src/data/references.yaml'),
  schema: z.object({
    name: z.string(),
    title: z.string(),
    institution: z.string(),
    email: z.string(),
  }),
});

const profile = defineCollection({
  loader: yamlObject('src/data/profile.yaml'),
  schema: z.object({
    name: z.string(),
    currentPositionId: z.string(),
    website: z.string(),
    emails: z.array(z.string()).min(1),
    address: z.object({ street: z.string() }),
    socials: z.array(z.object({ label: z.string(), icon: z.string(), url: z.string() })),
    bio: z.string(),
    interests: z.array(z.object({ name: z.string(), icon: z.string() })),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/index.mdx', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string().optional(),
      date: z.coerce.date(),
      tags: z.array(z.string()).default([]),
      cover: image().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = {
  publications,
  talks,
  events,
  places,
  projects,
  tools,
  models,
  datasets,
  news,
  teaching,
  advising,
  service,
  positions,
  education,
  visits,
  awards,
  grants,
  press,
  engagements,
  references,
  profile,
  blog,
};

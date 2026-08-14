import type { CollectionEntry } from 'astro:content';

type Publication = CollectionEntry<'publications'>;

const bibtexEscapes = (value: string) =>
  value
    .replaceAll('\\', '\\textbackslash{}')
    .replaceAll('&', '\\&')
    .replaceAll('%', '\\%')
    .replaceAll('#', '\\#')
    .replaceAll('_', '\\_')
    .replaceAll('á', "{\\'a}")
    .replaceAll('Á', "{\\'A}")
    .replaceAll('é', "{\\'e}")
    .replaceAll('É', "{\\'E}")
    .replaceAll('í', "{\\'i}")
    .replaceAll('Í', "{\\'I}")
    .replaceAll('ó', "{\\'o}")
    .replaceAll('Ó', "{\\'O}")
    .replaceAll('ú', "{\\'u}")
    .replaceAll('Ú', "{\\'U}")
    .replaceAll('à', "{\\`a}")
    .replaceAll('è', "{\\`e}")
    .replaceAll('ì', "{\\`i}")
    .replaceAll('ò', "{\\`o}")
    .replaceAll('ù', "{\\`u}")
    .replaceAll('ä', '{\\"a}')
    .replaceAll('ë', '{\\"e}')
    .replaceAll('ï', '{\\"i}')
    .replaceAll('ö', '{\\"o}')
    .replaceAll('ü', '{\\"u}')
    .replaceAll('ñ', '{\\~n}')
    .replaceAll('ç', '{\\c{c}}');

const paperUrl = (publication: Publication) =>
  publication.data.links.find((link) => link.label.toLowerCase() === 'paper')?.url ??
  publication.data.links.find((link) => link.label.toLowerCase().includes('arxiv'))?.url ??
  publication.data.links[0]?.url;

const authorWithMarker = (publication: Publication, author: string) =>
  `${author}${contributionMarker(publication, author)}`;

const surnameWithMarker = (publication: Publication, author: string) => {
  const surname = author.trim().split(/\s+/).at(-1) ?? author;
  return `${surname}${contributionMarker(publication, author)}`;
};

const joinHumanList = (values: string[]) => {
  if (values.length <= 1) return values[0] ?? '';
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
};

const markdownLink = (label: string, url?: string) => (url ? `[${label}](${url})` : label);

export interface PublicationCitationFormats {
  full: {
    authors: string;
    year: string;
    title: string;
    url?: string;
    containerTitle?: string;
    containerPrefix?: string;
    publisher?: string;
    value: string;
  };
  informal: {
    title: string;
    url?: string;
    parenthetical: string;
    value: string;
  };
  markdown: string;
  bibtex: string;
}

/** Build BibTeX from canonical publication fields instead of storing a second copy. */
export function publicationToBibtex(publication: Publication): string {
  const { data } = publication;
  const citation = data.citation ?? {};
  const year = data.date.getUTCFullYear();
  const firstAuthor = data.authors[0]?.split(/\s+/).at(-1)?.replace(/\W+/g, '') || 'sarti';
  const titleToken =
    data.title
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.find((token) => token.length > 3) ?? publication.id.replaceAll('-', '');
  const key = `${firstAuthor.toLowerCase()}${year}${titleToken}`;
  const publicationUrl = paperUrl(publication);

  const entryType =
    data.type === 'journal' || data.type === 'preprint'
      ? 'article'
      : data.type === 'thesis'
        ? citation.thesisType === 'masters'
          ? 'mastersthesis'
          : 'phdthesis'
        : data.type === 'edited'
          ? 'proceedings'
          : 'inproceedings';

  const corporateAuthors = new Set(citation.corporateAuthors ?? []);
  const renderName = (name: string) => {
    if (corporateAuthors.has(name)) return `{${bibtexEscapes(name)}}`;
    const parts = name.trim().split(/\s+/);
    const surname = parts.pop() ?? name;
    const givenNames = parts.join(' ');
    const marker = contributionMarker(publication, name);
    const bibtexMarker = marker === '*' ? '$^*$' : marker === '†' ? '$^\\dagger$' : '';
    return `${bibtexEscapes(surname)}${bibtexMarker}, ${bibtexEscapes(givenNames)}`;
  };
  const renderNames = (names: string[]) =>
    names
      .map(renderName)
      .join('  and\n      ');
  const containerTitle = citation.containerTitle ?? data.venue ?? '';
  const fields: [string, string][] = [['title', data.title]];

  if (entryType === 'proceedings') {
    fields.push(['editor', renderNames(citation.editors ?? data.authors)]);
  } else {
    fields.push(['author', renderNames(data.authors)]);
  }

  if (data.type === 'journal') fields.push(['journal', containerTitle]);
  if (data.type === 'preprint') {
    const arxivId =
      publicationUrl?.match(/arxiv\.org\/(?:abs|pdf)\/([^/?#]+)/)?.[1]?.replace(/\.pdf$/i, '') ??
      data.venue?.match(/CoRR\/(.+)$/)?.[1];
    fields.push(['journal', 'CoRR']);
    if (arxivId) {
      fields.push(['eprint', arxivId], ['archivePrefix', 'arXiv']);
    }
  }
  if (entryType === 'inproceedings') fields.push(['booktitle', containerTitle]);
  if (entryType === 'phdthesis' || entryType === 'mastersthesis') {
    fields.push(['school', citation.school ?? '']);
  }

  if (citation.volume) fields.push(['volume', citation.volume]);
  if (citation.issue) fields.push(['number', citation.issue]);
  if (citation.pages) fields.push(['pages', citation.pages.replace(/(?<=\d)-(?=\d)/g, '--')]);
  if (citation.articleNumber) fields.push(['number', citation.articleNumber]);
  if (citation.publisher) fields.push(['publisher', citation.publisher]);
  fields.push(['year', String(year)]);
  if (citation.doi) fields.push(['doi', citation.doi]);
  if (publicationUrl) fields.push(['url', publicationUrl]);

  const body = fields
    .filter(([, value]) => value.length > 0)
    .map(([name, value]) => {
      const renderedValue =
        name === 'author' || name === 'editor' ? value : bibtexEscapes(value);
      return `  ${name} = "${renderedValue}",`;
    })
    .join('\n');
  return `@${entryType}{${key},\n${body}\n}`;
}

/** Generate all website citation variants from the canonical publication record. */
export function publicationToCitationFormats(
  publication: Publication
): PublicationCitationFormats {
  const { data } = publication;
  const citation = data.citation ?? {};
  const year = String(data.date.getUTCFullYear());
  const url = paperUrl(publication);
  const authors = joinHumanList(data.authors.map((author) => authorWithMarker(publication, author)));
  const containerTitle = citation.containerTitle ?? data.venue;
  const containerPrefix =
    data.type === 'conference' || data.type === 'workshop' ? 'In ' : undefined;
  const linkedTitle = markdownLink(data.title, url);
  const fullParts = [`${authors}.`, `${year}.`, `${linkedTitle}.`];
  if (containerTitle) {
    fullParts.push(`${containerPrefix ?? ''}*${containerTitle}*.`);
  }
  if (citation.publisher) fullParts.push(`${citation.publisher}.`);

  const leadAuthors = data.authors.slice(0, 1);
  if (data.authors[0] && contributionMarker(publication, data.authors[0]) === '*') {
    for (const author of data.authors.slice(1)) {
      if (contributionMarker(publication, author) !== '*') break;
      leadAuthors.push(author);
    }
  }
  const renderedLeadAuthors = leadAuthors.map((author) => surnameWithMarker(publication, author));
  const informalAuthors =
    data.authors.length > leadAuthors.length
      ? `${renderedLeadAuthors.join(', ')} et al.`
      : joinHumanList(renderedLeadAuthors);
  const venueLabel = data.venueShort ?? [data.venue, year].filter(Boolean).join(' ');
  const parenthetical = [informalAuthors, venueLabel].filter(Boolean).join(', ');
  const informalValue = `${linkedTitle} (${parenthetical})`;

  return {
    full: {
      authors,
      year,
      title: data.title,
      url,
      containerTitle,
      containerPrefix,
      publisher: citation.publisher,
      value: fullParts.join(' '),
    },
    informal: {
      title: data.title,
      url,
      parenthetical,
      value: informalValue,
    },
    markdown: informalValue,
    bibtex: publicationToBibtex(publication),
  };
}

export function displayedAuthors(
  publication: Publication,
  target: 'web' | 'cv' = 'web'
): (string | { etAl: true; includeSelf?: boolean })[] {
  const { authors, authorDisplay } = publication.data;
  const policy = authorDisplay?.[target];
  if (!policy || authors.length <= policy.head + policy.tail) return authors;
  return [
    ...authors.slice(0, policy.head),
    { etAl: true as const, includeSelf: policy.includeSelf },
    ...(policy.tail > 0 ? authors.slice(-policy.tail) : []),
  ];
}

export function contributionMarker(publication: Publication, author: string): string {
  const contribution = publication.data.contributions.find((contribution) =>
    contribution.authors.includes(author)
  );
  if (!contribution) return '';
  const label = contribution.label.toLowerCase();
  if (label.includes('equal advising')) return '†';
  if (label.includes('equal contribution')) return '*';
  return '';
}

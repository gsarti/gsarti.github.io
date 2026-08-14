/** Group items by year, newest year first. Items are kept in input order. */
export function groupByYear<T>(items: T[], getDate: (item: T) => Date): [number, T[]][] {
  const groups = new Map<number, T[]>();
  for (const item of items) {
    const year = getDate(item).getFullYear();
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push(item);
  }
  return [...groups.entries()].sort((a, b) => b[0] - a[0]);
}

/** Bold the site author's name inside an author list. */
export function highlightAuthor(author: string): string {
  const trimmedAuthor = author.trim();
  const contributionMarker = trimmedAuthor.match(/[*†]+$/u)?.[0] ?? '';
  const nameWithoutContributionMarker = trimmedAuthor
    .slice(0, trimmedAuthor.length - contributionMarker.length)
    .trim();

  return nameWithoutContributionMarker === 'Gabriele Sarti'
    ? `<strong>Gabriele Sarti</strong>${contributionMarker
      ? `<span class="author-contribution-marker">${contributionMarker}</span>`
      : ''}`
    : author;
}

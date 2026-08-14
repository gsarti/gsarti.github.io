/**
 * Navigation configuration. Personal details and social links live in
 * src/data/profile.yaml and are loaded through Astro's validated collection.
 */

export interface NavLink {
  label: string;
  href: string;
  /** Open in a new tab (external sites and PDFs). */
  external?: boolean;
}

export interface NavItem extends Partial<NavLink> {
  label: string;
  /** When set, the item renders as a dropdown. */
  children?: NavLink[];
}

export const NAV: NavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Projects', href: '/projects' },
  { label: 'Events', href: '/events' },
  { label: 'Stuff', href: '/stuff' },
  { label: 'Bio', href: '/bio' },
  // { label: 'Blog', href: '/blog' },
  { label: 'CV', href: '/files/gabriele_sarti_academic_cv.pdf', external: true },
];

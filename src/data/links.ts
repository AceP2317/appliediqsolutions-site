/**
 * Single source of truth for Ian's profile links + contact emails.
 * Consumed by: BaseLayout (Person JSON-LD `sameAs`), SiteFooter (icon row),
 * /bio Connect block, /contact channel line, and the BusinessCard pages.
 * Adding a network later (e.g. Nextdoor) = one entry here with its 24×24
 * brand-path `d` string — footer, bio, and the cards inherit it automatically.
 */
export interface SocialLink {
  id: string;
  name: string;
  href: string;
  /** Short handle for card sub-lines, e.g. 'in/ian-provencher'. */
  handle: string;
  /** 24×24 brand-mark path data, rendered fill=currentColor (Lucide dropped its brand logos). */
  iconPath: string;
}

export const socialLinks: SocialLink[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/ian-provencher/',
    handle: 'in/ian-provencher',
    iconPath:
      'M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z',
  },
  {
    id: 'github',
    name: 'GitHub',
    href: 'https://github.com/AceP2317',
    handle: 'AceP2317',
    iconPath:
      'M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.2 11.19.6.11.82-.26.82-.57v-2c-3.34.72-4.04-1.58-4.04-1.58-.55-1.37-1.34-1.74-1.34-1.74-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.22 1.84 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.58-2.67-.3-5.47-1.31-5.47-5.84 0-1.29.47-2.34 1.23-3.17-.12-.3-.53-1.52.12-3.16 0 0 1-.32 3.3 1.21a11.6 11.6 0 0 1 6 0C17.3 4.9 18.3 5.22 18.3 5.22c.65 1.64.24 2.86.12 3.16.77.83 1.23 1.88 1.23 3.17 0 4.54-2.81 5.53-5.49 5.83.43.37.82 1.1.82 2.22v3.29c0 .31.21.69.83.57C20.57 21.91 24 17.5 24 12.29 24 5.78 18.63.5 12 .5z',
  },
  {
    id: 'nextdoor',
    name: 'Nextdoor',
    href: 'https://nextdoor.com/page/appliediq-solutions-new-bern-nc/',
    handle: 'New Bern, NC',
    // The Nextdoor "nest n" glyph, normalized to fill the 24-box like its siblings.
    iconPath:
      'M1.14 2.25C0.51 2.25 0 2.76 0 3.4L0 6.84C0 9.69 2.3 12 5.14 12L5.72 12L5.72 20.6C5.72 21.24 6.23 21.75 6.86 21.75L11.43 21.75C12.06 21.75 12.57 21.24 12.57 20.6L12.57 11.42C12.57 10.16 13.59 9.13 14.86 9.13C16.12 9.13 17.14 10.16 17.14 11.42L17.14 20.6C17.14 21.24 17.65 21.75 18.28 21.75L22.86 21.75C23.49 21.75 24 21.24 24 20.6L24 11.42C24 6.36 19.91 2.25 14.86 2.25C11.72 2.25 8.95 3.84 7.31 6.25C7.05 6.2 6.86 5.97 6.86 5.69L6.86 3.4C6.86 2.76 6.35 2.25 5.72 2.25ZM1.14 2.25',
  },
  {
    id: 'workspace',
    name: 'Workspace',
    href: 'https://ian-provencher.com',
    handle: 'ian-provencher.com',
    // Globe / "public" glyph (Material) — reads as "personal site" beside the brand marks.
    iconPath:
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 0 1 5.08 16zm2.95-8H5.08a7.987 7.987 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z',
  },
];

/** Person JSON-LD `sameAs` — derived so it can never drift from the visible links. */
export const sameAs = socialLinks.map((l) => l.href);

export const siteEmail = 'contact@appliediqsolutions.com';
export const cardEmail = 'ian@appliediqsolutions.com';

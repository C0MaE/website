import { fetchData } from './fetchData';

export const SITE_URL = 'https://comae.dev';
export const SITE_NAME = 'CoMaE';

export interface Hero { typewriterWords: string[]; bio: string; now?: { label: string; href?: string }[] }
export interface Project { title: string; description: string; tags: string[]; github: string | null; live: string | null; featured: boolean; image: string | null }
export interface ResearchProject { title: string; description: string; affiliation: string | null; affiliationUrl: string | null; tags: string[]; github: string | null; image: string | null; video: string | null }
export interface SkillCategory { name: string; icon: string; skills: string[] }
export interface TimelineEvent { year: string; title: string; place: string; description: string; type: string; ongoing?: boolean; until?: string }
export interface Contact { email: string; socials: { label: string; href: string }[] }

/** Everything the page is built from, loaded once so SEO data and page content never disagree */
export async function loadSite() {
  const [hero, projects, research, skills, timeline, contact] = await Promise.all([
    fetchData<Hero>('hero.json'),
    fetchData<Project[]>('projects.json'),
    fetchData<ResearchProject[]>('research.json'),
    fetchData<SkillCategory[]>('skills.json'),
    fetchData<TimelineEvent[]>('timeline.json'),
    fetchData<Contact>('contact.json'),
  ]);
  return { hero, projects, research, skills, timeline, contact };
}
export type Site = Awaited<ReturnType<typeof loadSite>>;

const absolute = (path: string) => new URL(path, SITE_URL).href;
// End a sentence with a full stop unless it already has one
const sentence = (t: string) => (/[.!?]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);
const isCurrent = (e: TimelineEvent) => !e.until && (e.ongoing || !/\d{4}/.test(e.year));

export const pageTitle = (s: Site) => `${SITE_NAME} — ${s.hero.typewriterWords.slice(0, 2).join(' & ')} in Kiel`;

// Kept around 160 characters, which is what search results show
export function pageDescription(s: Site) {
  const work = [...s.research, ...s.projects.filter(p => p.featured)].slice(0, 3).map(p => p.title.split(' – ')[0]);
  return `${SITE_NAME}: physics student at Kiel University and fullstack developer writing Rust, research software and simulations — ${work.join(', ')} and more.`;
}

/** schema.org graph: who this is, what they work on, and the site itself */
export function structuredData(s: Site) {
  const person = `${SITE_URL}/#person`;
  const work = [
    ...s.research.map(r => ({ ...r, live: null as string | null, kind: 'research' })),
    ...s.projects.map(p => ({ ...p, affiliation: null as string | null, kind: 'project' })),
  ];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: 'en',
        publisher: { '@id': person },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${SITE_URL}/#profile`,
        url: SITE_URL,
        name: pageTitle(s),
        isPartOf: { '@id': `${SITE_URL}/#website` },
        mainEntity: { '@id': person },
      },
      {
        '@type': 'Person',
        '@id': person,
        name: SITE_NAME,
        url: SITE_URL,
        image: absolute('/apple-touch-icon.png'),
        description: pageDescription(s),
        jobTitle: s.hero.typewriterWords.slice(0, 2).join(', '),
        homeLocation: { '@type': 'Place', name: 'Kiel, Germany' },
        affiliation: s.timeline.filter(isCurrent).map(e => ({ '@type': 'Organization', name: e.place })),
        knowsAbout: [...new Set(s.skills.flatMap(c => c.skills))],
        sameAs: s.contact.socials.map(x => x.href),
      },
      {
        '@type': 'ItemList',
        '@id': `${SITE_URL}/#work`,
        name: 'Projects and research software',
        itemListElement: work.map((w, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': w.github ? 'SoftwareSourceCode' : 'CreativeWork',
            name: w.title,
            description: w.description,
            url: w.live ?? w.github ?? SITE_URL,
            ...(w.github && { codeRepository: w.github }),
            ...(w.image && { image: absolute(w.image) }),
            keywords: w.tags.join(', '),
            author: { '@id': person },
            ...(w.affiliation && { sourceOrganization: { '@type': 'Organization', name: w.affiliation } }),
          },
        })),
      },
    ],
  };
}

/** Plain-language summary for AI assistants and crawlers, served at /llms.txt (llmstxt.org) */
export function llmsTxt(s: Site) {
  const link = (title: string, url: string | null) => (url ? `[${title}](${url})` : title);
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${pageDescription(s)}`,
    '',
    s.hero.bio,
    '',
    `Roles: ${s.hero.typewriterWords.join(', ')}. Based in Kiel, Germany.`,
    '',
    '## Now',
    '',
    ...s.timeline.filter(isCurrent).reverse().map(e => `- ${e.title} — ${e.place}${/\d{4}/.test(e.year) ? ` (since ${e.year})` : ''}`),
    '',
    '## Research & university work',
    '',
    ...s.research.map(r => `- ${link(r.title, r.github)}${r.affiliation ? ` (${r.affiliation})` : ''}: ${sentence(r.description)} Tech: ${r.tags.join(', ')}.`),
    '',
    '## Projects',
    '',
    ...s.projects.map(p => `- ${link(p.title, p.live ?? p.github)}: ${sentence(p.description)} Tech: ${p.tags.join(', ')}.${p.live && p.github ? ` Source: ${p.github}` : ''}`),
    '',
    '## Journey',
    '',
    ...[...s.timeline].reverse().map(e => `- ${e.year}${e.until ? ` – ${e.until}` : isCurrent(e) && /\d{4}/.test(e.year) ? ' – present' : ''}: ${e.title}, ${e.place}. ${sentence(e.description)}`),
    '',
    '## Skills',
    '',
    ...s.skills.map(c => `- ${c.name}: ${c.skills.join(', ')}`),
    '',
    '## Links',
    '',
    `- Website: ${SITE_URL}`,
    ...s.contact.socials.map(x => `- ${x.label}: ${x.href}`),
    '- Contact: via the email button on the website',
    '',
  ];
  return lines.join('\n');
}

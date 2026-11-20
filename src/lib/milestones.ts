// Milestones of a project in progress: a MILESTONES.md in the project's repo with a Markdown checklist
//
//   - [x] Peak shapes and exposure-time model, with tests
//   - [ ] Noisy spectra and a baseline without ML
//
// Ticked items are done, the first open one is in progress and the rest are still to do.
// Only top-level items count, so indented ones can hold notes that stay in the repo.
import { fetchRepoFile } from './repoFile';

export interface Milestone { label: string; status: 'done' | 'active' | 'todo' }

export function parseMilestones(md: string): Milestone[] {
  let open = 0;
  return [...md.matchAll(/^[-*+][ \t]+\[([ xX])\][ \t]+(.+?)\s*$/gm)].map(([, mark, label]): Milestone => ({
    label,
    status: mark !== ' ' ? 'done' : open++ === 0 ? 'active' : 'todo',
  }));
}

export const fetchMilestones = (url: string) => fetchRepoFile(url, parseMilestones);

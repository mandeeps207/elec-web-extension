// Source review: 2026-09-14. These are drafts, not qualification determinations.
const home = 'https://elec.training/';
const guide = 'https://elec.training/news/how-to-become-an-electrician/';
export const links = [
  { label: 'Visit Elec Training', url: home },
  { label: 'Read the Full Electrician Qualification Guide', url: guide },
];
export const copy = {
  intro: 'Explore a typical route from your starting point. Individual circumstances may differ.',
  question: 'Where are you currently in your electrical career?',
  draft: 'Draft guidance — requires Charanjit’s approval. Not for public release.',
  resultHeading: 'Your likely route',
  unresolvedHeading: 'Your route needs clarification',
  caveatHeading: 'Before you take the next step',
  reset: 'Choose a different starting point',
};
const level2 = { title: 'Level 2 diploma', explanation: 'Build a foundation in electrical installation.' };
const level3 = { title: 'Level 3 diploma', explanation: 'Continue your electrical installation training.' };
const workplace = { title: 'Workplace experience and NVQ', explanation: 'Build site evidence and complete assessment for the Level 3 NVQ.' };
const assessment = { title: 'AM2 and NVQ certification', explanation: 'The published career map places AM2 after the portfolio, followed by the NVQ claim.' };
const card = { title: 'Check ECS Gold Card requirements', explanation: 'Confirm eligibility before applying.' };
const diplomaCaveat = 'A diploma alone does not complete the workplace qualification route. Confirm your certificates and the applicable route with Elec Training.';
const review = { status: 'unapproved', approvedBy: null, approvedOn: null, lastReviewed: '2026-09-14' };
export const routes = [
  {
    id: 'new', label: 'I’m completely new', state: 'draft',
    intro: 'One typical option is the diploma route below. The guide also describes apprenticeships.',
    steps: [level2, level3, workplace, assessment, card],
    caveats: [diplomaCaveat], sources: [home, guide], review: { ...review },
    uncertainty: 'Confirm suitability, current diploma codes, wiring-regulations training and UK nation coverage. This is one option, not a universal route.'
  },
  {
    id: 'level-2', label: 'I’ve completed Level 2', state: 'draft',
    intro: 'If your certificate is an appropriate electrical installation diploma, Level 3 may be next.',
    steps: [level3, workplace, assessment, card],
    caveats: [diplomaCaveat], sources: [home, guide], review: { ...review },
    uncertainty: 'A level number does not establish the subject or equivalence of a certificate. Confirm entry requirements.'
  },
  {
    id: 'level-3', label: 'I’ve completed Level 3', state: 'draft',
    intro: 'If this is an electrical installation diploma, workplace assessment may still be needed.',
    steps: [workplace, assessment, card],
    caveats: [diplomaCaveat], sources: [home, guide], review: { ...review },
    uncertainty: 'Distinguish a Level 3 diploma from an already completed NVQ or apprenticeship. Confirm remaining requirements.'
  },
  {
    id: 'site-experience', label: 'I’m currently gaining site experience', state: 'unresolved',
    intro: 'Site experience alone does not identify your next qualification.',
    steps: [{ title: 'Review your training and site evidence', explanation: 'Discuss your certificates and work with Elec Training to identify the appropriate route.' }],
    caveats: ['The guide distinguishes experience with and without qualifications. Your selection does not tell us which applies.'],
    sources: [home, guide], review: { ...review },
    uncertainty: 'Prior qualifications, type of work, experience duration and NVQ enrolment are unknown; no fixed route assigned.'
  },
  {
    id: 'experienced', label: 'I’m an experienced electrician', state: 'unresolved',
    intro: 'An experienced-worker route may be relevant, but eligibility needs individual review.',
    steps: [{ title: 'Confirm which route applies', explanation: 'Ask Elec Training to review your qualifications and experience before choosing further assessment.' }],
    caveats: ['The guide distinguishes domestic and broader experienced-worker routes. This checker cannot confirm eligibility.'],
    sources: [guide], review: { ...review },
    uncertainty: 'The guide has different experience thresholds in its route finder and prose. Do not infer eligibility, assessment variant or Gold Card entitlement.'
  }
];

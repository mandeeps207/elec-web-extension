import { routes, links, copy } from '../data/qualification-routes.js';

const byId = (id) => document.getElementById(id);
const element = (tag, text) => {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
};
byId('intro').textContent = copy.intro;
byId('question').textContent = copy.question;
byId('reset').textContent = copy.reset;
byId('caveat-heading').textContent = copy.caveatHeading;
if (copy.notice) {
  byId('review-notice').textContent = copy.notice;
  byId('review-notice').hidden = false;
}

let lastChoice;
function showRoute(route, button) {
  lastChoice = button;
  byId('selected-label').textContent = route.label;
  byId('result-heading').textContent = route.heading;
  byId('result-intro').textContent = route.intro;
  byId('steps').replaceChildren(...route.steps.map((step) => {
    const item = document.createElement('li');
    item.append(element('h2', step.title), element('p', step.explanation));
    return item;
  }));
  byId('caveats').replaceChildren(...route.caveats.map((text) => element('p', text)));
  byId('starting-point').hidden = true;
  byId('introduction').hidden = true;
  byId('resources').hidden = false;
  byId('result').hidden = false;
  // Move focus to announce the changed section; a live region would duplicate it.
  byId('result-heading').focus();
  document.body.scrollTo(0, 0);
}
for (const route of routes) {
  const button = element('button', route.label);
  button.type = 'button';
  button.className = 'choice';
  button.dataset.route = route.id;
  button.addEventListener('click', () => showRoute(route, button));
  byId('choices').append(button);
}
byId('reset').addEventListener('click', () => {
  byId('result').hidden = true;
  byId('starting-point').hidden = false;
  byId('introduction').hidden = false;
  byId('resources').hidden = true;
  lastChoice?.focus();
});
for (const link of links) {
  const url = new URL(link.url);
  if (url.protocol !== 'https:' || url.hostname !== 'elec.training' || url.search || url.hash || url.username || url.password || url.port) {
    throw new Error('Unexpected resource URL');
  }
  const anchor = element('a', link.label);
  anchor.href = url.href;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.title = 'Opens in a new tab';
  byId('links').append(anchor);
}

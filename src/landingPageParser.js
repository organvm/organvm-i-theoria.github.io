const SECTION_HEADING = '<div class="section-heading">';
const SECTION_GRID_OPEN = '<div class="repo-grid">';
const SECTION_GRID_CLOSE = '</div>';

function parseAttribute(html, name) {
  const match = html.match(new RegExp(`${name}="([^"]+)"`));
  return match ? match[1] : '';
}

function extractSectionBlock(html, sectionTitle) {
  const titleIndex = html.indexOf(`<h2>${sectionTitle}</h2>`);
  if (titleIndex === -1) {
    throw new Error(`Missing section title: ${sectionTitle}`);
  }

  const headingIndex = html.lastIndexOf(SECTION_HEADING, titleIndex);
  if (headingIndex === -1) {
    throw new Error(`Missing section heading container for: ${sectionTitle}`);
  }

  const gridStart = html.indexOf(SECTION_GRID_OPEN, headingIndex);
  if (gridStart === -1) {
    throw new Error(`Missing repo grid for section: ${sectionTitle}`);
  }

  const nextHeading = html.indexOf(SECTION_HEADING, gridStart + SECTION_GRID_OPEN.length);
  const mainClose = html.indexOf('</main>', gridStart + SECTION_GRID_OPEN.length);
  const boundary = Math.min(
    nextHeading === -1 ? Number.POSITIVE_INFINITY : nextHeading,
    mainClose === -1 ? Number.POSITIVE_INFINITY : mainClose,
  );

  if (boundary === Number.POSITIVE_INFINITY) {
    return html.slice(gridStart);
  }

  return html.slice(gridStart, boundary);
}

function parseCard(openTag, content) {
  const url = parseAttribute(openTag, 'href');
  const auditState = parseAttribute(openTag, 'data-audit-state');
  const name = (content.match(/<div class="repo-name">([\s\S]*?)<\/div>/) || [])[1] || '';
  const description = (content.match(/<div class="repo-desc">([\s\S]*?)<\/div>/) || [])[1] || '';
  const tags = [...content.matchAll(/<span class="tag[^\"]*">([\s\S]*?)<\/span>/g)].map(([, tag]) => tag.trim());

  return {
    name: name.trim(),
    description: description.trim(),
    tags,
    url,
    auditState,
  };
}

export function extractCardsForSection(html, sectionTitle) {
  const sectionHtml = extractSectionBlock(html, sectionTitle);
  const cardMatches = [...sectionHtml.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];

  return cardMatches
    .filter(([match]) => match.includes('class="repo-card"'))
    .map(([fullMatch, openTag, content]) => parseCard(`${openTag}>`, content));
}

export function countCards(cards, state) {
  if (!state) return cards.length;
  return cards.filter((card) => card.auditState === state).length;
}

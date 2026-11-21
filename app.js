(() => {
  const items = window.catalogItems || [];
  const grid = document.getElementById('tool-grid');
  const results = document.getElementById('results-line');
  const search = document.getElementById('search');
  const more = document.getElementById('load-more');
  const formatFilter = document.getElementById('format-filter');
  const formatLabel = document.getElementById('format-filter-label');
  const state = { domain: 'All', kind: 'all', query: '', shown: 9 };

  function selectGroup(attribute, value) {
    document.querySelectorAll(`[${attribute}]`).forEach(button => {
      const active = button.dataset[attribute.replace('data-', '').replace(/-([a-z])/g, (_, c) => c.toUpperCase())] === value;
      button.classList.toggle(attribute === 'data-filter-domain' ? 'active' : 'selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function filteredItems() {
    const query = state.query.trim().toLocaleLowerCase();
    return items.filter(item =>
      (state.domain === 'All' || item.domain === state.domain) &&
      (state.kind === 'all' || item.kind === state.kind) &&
      (!query || `${item.title} ${item.description} ${item.domain}`.toLocaleLowerCase().includes(query))
    );
  }

  function action(url, label) {
    const link = document.createElement('a');
    link.href = url;
    link.textContent = label;
    link.target = '_blank';
    link.rel = 'noopener';
    return link;
  }

  function card(item) {
    const article = document.createElement('article');
    article.className = 'tool-card';
    const media = document.createElement('div');
    media.className = 'tool-media';
    const image = document.createElement('img');
    image.src = item.image;
    image.alt = `${item.title} preview`;
    image.loading = 'lazy';
    media.append(image);
    const content = document.createElement('div');
    content.className = 'tool-content';
    const meta = document.createElement('span');
    meta.className = 'tool-meta';
    meta.textContent = `${item.domain} · ${item.kind === 'app' ? 'Browser app' : 'AI plugin'}`;
    const title = document.createElement('h3');
    title.textContent = item.title;
    const description = document.createElement('p');
    description.className = 'tool-description';
    description.textContent = item.description;
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    actions.append(action(item.primary_url, item.primary_label));
    actions.append(action(item.secondary_url, item.secondary_label));
    content.append(meta, title, description, actions);
    article.append(media, content);
    return article;
  }

  function render() {
    const matches = filteredItems();
    grid.replaceChildren();
    if (matches.length) {
      grid.append(...matches.slice(0, state.shown).map(card));
    } else {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const title = document.createElement('strong');
      title.textContent = 'No solutions found';
      const hint = document.createElement('span');
      hint.textContent = 'Try a different search or choose another collection.';
      empty.append(title, hint);
      grid.append(empty);
    }
    const visible = Math.min(matches.length, state.shown);
    results.textContent = matches.length ? `Showing ${visible} of ${matches.length} ${matches.length === 1 ? 'solution' : 'solutions'}` : 'No matching solutions';
    more.hidden = visible >= matches.length;
  }

  document.querySelectorAll('[data-filter-domain]').forEach(button => button.addEventListener('click', () => {
    state.domain = button.dataset.filterDomain;
    state.shown = 9;
    selectGroup('data-filter-domain', state.domain);
    render();
  }));
  document.querySelectorAll('[data-filter-kind]').forEach(button => button.addEventListener('click', () => {
    state.kind = button.dataset.filterKind;
    state.shown = 9;
    selectGroup('data-filter-kind', state.kind);
    formatLabel.textContent = state.kind === 'all' ? 'More filters' : button.textContent;
    formatFilter.open = false;
    render();
  }));
  document.querySelectorAll('[data-domain]').forEach(button => button.addEventListener('click', () => {
    state.domain = button.dataset.domain;
    state.kind = 'all';
    state.query = '';
    state.shown = 9;
    search.value = '';
    selectGroup('data-filter-domain', state.domain);
    selectGroup('data-filter-kind', 'all');
    formatLabel.textContent = 'More filters';
    formatFilter.open = false;
    render();
    document.getElementById('browse').scrollIntoView({ behavior: 'smooth' });
  }));
  search.addEventListener('input', () => {
    state.query = search.value;
    state.shown = 9;
    render();
  });
  more.addEventListener('click', () => {
    state.shown += 9;
    render();
  });
  const help = document.getElementById('how-it-works');
  document.querySelector('a[href="#how-it-works"]').addEventListener('click', () => { help.open = true; });
  if (location.hash === '#how-it-works') help.open = true;
  render();
})();

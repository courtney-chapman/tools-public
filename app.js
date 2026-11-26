(() => {
  const items = window.catalogItems || [];
  const formats = window.catalogFormats || [];
  const sections = document.getElementById('catalog-sections');
  const jumps = document.getElementById('catalog-jumps');
  const results = document.getElementById('results-line');
  const search = document.getElementById('search');
  const pageSize = 6;
  const state = { domain: 'All', query: '', shown: Object.fromEntries(formats.map(format => [format.id, pageSize])) };

  function resetShown() {
    formats.forEach(format => { state.shown[format.id] = pageSize; });
  }

  function selectDomain() {
    document.querySelectorAll('[data-filter-domain]').forEach(button => {
      const active = button.dataset.filterDomain === state.domain;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function filteredItems() {
    const normalize = value => value.toLocaleLowerCase().replace(/[‐‑‒–—-]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    const query = normalize(state.query);
    return items.filter(item => {
      const format = formats.find(candidate => candidate.id === item.format);
      const searchText = [item.title, item.description, item.domain, format?.label || ''].join(' ');
      return (state.domain === 'All' || item.domain === state.domain) &&
        (!query || normalize(searchText).includes(query));
    });
  }

  function action(url, label, primary = false) {
    const link = document.createElement('a');
    link.href = url;
    link.textContent = label;
    if (primary) link.classList.add('tool-primary');
    if (/^https?:\/\//.test(url)) {
      link.target = '_blank';
      link.rel = 'noopener';
    }
    return link;
  }

  function promptBlock(item) {
    const block = document.createElement('details');
    block.className = 'prompt-block';
    const summary = document.createElement('summary');
    summary.textContent = 'Try a fictional first prompt';
    const field = document.createElement('textarea');
    field.readOnly = true;
    field.setAttribute('aria-label', 'First prompt for ' + item.title);
    field.value = item.starter_prompt;
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'copy-prompt';
    copy.textContent = 'Copy prompt';
    const expected = document.createElement('p');
    const lead = document.createElement('strong');
    lead.textContent = 'What to expect: ';
    expected.append(lead, document.createTextNode(item.expected_result));
    block.append(summary, field, copy, expected);
    return block;
  }

  function card(item, format) {
    const article = document.createElement('article');
    article.className = 'tool-card';
    article.dataset.catalogId = item.id;
    const media = document.createElement('div');
    media.className = 'tool-media';
    const image = document.createElement('img');
    image.src = item.image;
    image.alt = item.title + ' preview';
    image.loading = 'lazy';
    media.append(image);
    const content = document.createElement('div');
    content.className = 'tool-content';
    const meta = document.createElement('span');
    meta.className = 'tool-meta';
    meta.textContent = item.domain + ' · ' + format.singular;
    const title = document.createElement('h3');
    title.textContent = item.title;
    const description = document.createElement('p');
    description.className = 'tool-description';
    description.textContent = item.description;
    content.append(meta, title, description);
    if (format.card_note) {
      const note = document.createElement('p');
      note.className = 'tool-format-note';
      note.textContent = format.card_note;
      content.append(note);
    }
    if (item.requirements) {
      const requirements = document.createElement('p');
      requirements.className = 'tool-format-note';
      requirements.textContent = item.requirements;
      content.append(requirements);
    }
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    actions.append(action(item.primary_url, format.primary_label, true));
    if (item.secondary_url && format.secondary_label) {
      actions.append(action(item.secondary_url, format.secondary_label));
    }
    if (item.tertiary_url) {
      actions.append(action(item.tertiary_url, "Download HTML"));
    }
    content.append(actions);
    if (item.starter_prompt) content.append(promptBlock(item));
    article.append(media, content);
    return article;
  }

  function render() {
    const matches = filteredItems();
    sections.replaceChildren();
    jumps.replaceChildren();
    if (!matches.length) {
      jumps.hidden = true;
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const title = document.createElement('strong');
      title.textContent = 'No solutions found';
      const hint = document.createElement('span');
      hint.textContent = 'Try a different search or choose another collection.';
      empty.append(title, hint);
      sections.append(empty);
      results.textContent = 'No matching solutions';
      return;
    }
    jumps.hidden = false;
    let visibleTotal = 0;
    formats.forEach(format => {
      const group = matches.filter(item => item.format === format.id);
      if (!group.length) return;
      const id = 'format-' + format.id;
      const jump = document.createElement('a');
      jump.href = '#' + id;
      jump.textContent = format.label + ' (' + group.length + ')';
      jumps.append(jump);
      const section = document.createElement('section');
      section.className = 'catalog-format';
      section.id = id;
      section.setAttribute('aria-labelledby', id + '-title');
      const heading = document.createElement('div');
      heading.className = 'catalog-format-heading';
      const title = document.createElement('h3');
      title.id = id + '-title';
      title.textContent = format.label;
      const instruction = document.createElement('p');
      instruction.textContent = format.instruction;
      heading.append(title, instruction);
      const grid = document.createElement('div');
      grid.className = 'tool-grid';
      const visible = Math.min(group.length, state.shown[format.id] || pageSize);
      visibleTotal += visible;
      grid.append(...group.slice(0, visible).map(item => card(item, format)));
      section.append(heading);
      if (format.guide_template_id) {
        const template = document.getElementById(format.guide_template_id);
        if (template) section.append(template.content.cloneNode(true));
      }
      section.append(grid);
      if (visible < group.length) {
        const end = document.createElement('div');
        end.className = 'browse-end';
        const more = document.createElement('button');
        more.className = 'button button-outline';
        more.type = 'button';
        more.textContent = 'Show more ' + format.label;
        more.addEventListener('click', () => {
          state.shown[format.id] += pageSize;
          render();
          document.getElementById(id)?.scrollIntoView({ block: 'start' });
        });
        end.append(more);
        section.append(end);
      }
      sections.append(section);
    });
    results.textContent = 'Showing ' + visibleTotal + ' of ' + matches.length + ' ' +
      (matches.length === 1 ? 'solution' : 'solutions');
  }

  document.querySelectorAll('[data-filter-domain]').forEach(button => button.addEventListener('click', () => {
    state.domain = button.dataset.filterDomain;
    resetShown();
    selectDomain();
    render();
  }));
  document.querySelectorAll('[data-domain]').forEach(button => button.addEventListener('click', () => {
    state.domain = button.dataset.domain;
    state.query = '';
    search.value = '';
    resetShown();
    selectDomain();
    render();
    document.getElementById('browse').scrollIntoView({ behavior: 'smooth' });
  }));
  search.addEventListener('input', () => {
    state.query = search.value;
    resetShown();
    render();
  });
  const demoVideos = [...document.querySelectorAll('.demo-video')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const visibleVideos = new Set();
  function syncDemo(video) {
    if (visibleVideos.has(video) && !reducedMotion.matches) video.play().catch(() => {});
    else video.pause();
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visibleVideos.add(entry.target);
        else visibleVideos.delete(entry.target);
        syncDemo(entry.target);
      });
    }, { threshold: 0.5 });
    demoVideos.forEach(video => observer.observe(video));
  } else {
    demoVideos.forEach(video => { visibleVideos.add(video); syncDemo(video); });
  }
  reducedMotion.addEventListener?.('change', () => demoVideos.forEach(syncDemo));
  render();
  if (location.hash.startsWith('#format-')) {
    document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }
})();

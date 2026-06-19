/*
  Black & white ebook library
  - Lists PDFs from /books (static hosting)
  - Preview using PDF.js
  - Download via direct link

  NOTE: Browsers cannot upload directly into your server's /books folder
  without a backend. This UI supports selecting a PDF, then it
  initiates a local download or opens the file.
*/

(() => {
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const countEl = document.getElementById('count');

  const fileInput = document.getElementById('fileInput');

  const previewPlaceholder = document.getElementById('previewPlaceholder');
  const viewerEl = document.getElementById('viewer');


  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const pageNumEl = document.getElementById('pageNum');
  const pageCountEl = document.getElementById('pageCount');
  const downloadLink = document.getElementById('downloadLink');

  // -------------------------
  // Helpers
  // -------------------------
  const escapeHtml = (s) => String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','<')
    .replaceAll('>','>')
    .replaceAll('"','"')
    .replaceAll("'",'&#039;');

  function normalizeFilename(name){
    return name.replace(/[^a-zA-Z0-9._-]/g,'_');
  }

  // -------------------------
  // Listing PDFs in /books
  // -------------------------
  // To list files without a backend, we need an index file.
  // We'll look for /books/index.json.
  async function loadIndex() {
    const url = '/books/index.json';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    // Expected: { files: [{ name, href }] }
    if (!data || !Array.isArray(data.files)) return [];
    return data.files
      .filter(f => f && typeof f.href === 'string')
      .map(f => ({
        name: f.name || f.href.split('/').pop(),
        href: f.href
      }));
  }

  function setEmpty(show){
    empty.style.display = show ? 'block' : 'none';
  }

  function setPreviewState({title, href}){
    viewerEl.style.display = 'block';
    previewPlaceholder.style.display = 'none';
    downloadLink.href = href;
    downloadLink.download = title;
  }

  // -------------------------
  // PDF preview (native HTML)
  // -------------------------
  // Using an <iframe> gives a guaranteed preview without PDF.js rendering issues.
  const pdfFrame = document.getElementById('pdfFrame');

  async function loadAndPreview(href, title){
    // Keep existing preview UI, but render via native browser PDF viewer.
    setPreviewState({ title, href });

    if (pdfFrame) {
      pdfFrame.src = href;
    }

    // Since we don't control page rendering with native viewer,
    // keep controls disabled/hidden states.
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    pageNumEl.textContent = '1';
    pageCountEl.textContent = '—';
  }


  prevBtn.addEventListener('click', async () => {
    if (!pdfDoc) return;
    await renderPage(pageNum - 1);
  });

  nextBtn.addEventListener('click', async () => {
    if (!pdfDoc) return;
    await renderPage(pageNum + 1);
  });

  // -------------------------
  // Build cards
  // -------------------------
  function makeCard({name, href}){
    const filename = String(name || href.split('/').pop());
    const safeTitle = escapeHtml(filename.replace(/\.pdf$/i,''));

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.setAttribute('data-href', href);
    card.setAttribute('data-title', filename);

    card.innerHTML = `
      <div class="card-title">${safeTitle}</div>
      <div class="card-sub">pdf</div>
      <div class="badge">preview</div>
    `;

    card.addEventListener('click', async () => {
      await loadAndPreview(href, filename);
    });

    return card;
  }

  // -------------------------
  // Upload handling
  // -------------------------
  // Without a backend, we can't move files into /books.
  // We'll instead open the selected PDF locally.
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    // Create blob URL for local preview/download.
    const url = URL.createObjectURL(file);
    loadAndPreview(url, file.name).catch(() => {
      window.open(url, '_blank', 'noopener');
    });
  });

  // -------------------------
  // Init
  // -------------------------
  async function init(){
    const files = await loadIndex();

    grid.innerHTML = '';

    if (!files.length) {
      countEl.textContent = '0';
      setEmpty(true);
      return;
    }

    setEmpty(false);
    countEl.textContent = String(files.length);

    for (const f of files) {
      grid.appendChild(makeCard(f));
    }
  }

  init().catch(() => {
    setEmpty(true);
    countEl.textContent = '0';
  });
})();


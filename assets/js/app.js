/**
 * 書香「永」恆，「貞」惜閱讀－永貞國小圖書館閱讀推動成果網站
 * Frontend Controller 3.1 - Pure Architecture & Clean Responsive Explorer
 */

(function () {
  'use strict';

  const data = window.YONGZHEN_READING_DATA;
  if (!data) {
    console.error('Yongzhen Reading Data not loaded!');
    return;
  }

  // Safe Storage Wrapper with In-Memory Fallback
  const memoryStorage = {};
  function getSafeStorage(key, defaultVal) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        return val !== null ? val : defaultVal;
      }
    } catch (e) {
      console.warn('localStorage is restricted; using memory fallback:', e);
    }
    return memoryStorage[key] !== undefined ? memoryStorage[key] : defaultVal;
  }

  function setSafeStorage(key, val) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, val);
      }
    } catch (e) {
      console.warn('localStorage write failed; saving in memory:', e);
    }
    memoryStorage[key] = val;
  }

  // App State
  const state = {
    category: 'all',
    section: 'all',
    mediaTypeFilter: 'all',
    search: '',
    sortBy: 'newest',
    page: 1,
    perPage: 24,
    viewMode: 'grid', // 'grid' | 'list'
    theme: getSafeStorage('yz_reading_theme', 'light'),
    currentModalWish: null,
    currentVisionVersion: '最終版',
    isDrawerOpen: false
  };

  // DOM Elements
  const el = {
    categoryTabs: document.getElementById('categoryTabs'),
    mediaTypeFilters: document.getElementById('mediaTypeFilters'),
    sectionSelect: document.getElementById('sectionSelect'),
    searchInput: document.getElementById('searchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    sortSelect: document.getElementById('sortSelect'),
    viewModeGrid: document.getElementById('viewModeGrid'),
    viewModeList: document.getElementById('viewModeList'),
    resultsCount: document.getElementById('resultsCount'),
    cardsGrid: document.getElementById('cardsGrid'),
    paginationWrapper: document.getElementById('paginationWrapper'),
    visionTabs: document.getElementById('visionTabs'),
    visionGrid: document.getElementById('visionGrid'),
    modalBackdrop: document.getElementById('modalBackdrop'),
    modalMedia: document.getElementById('modalMedia'),
    modalMetaRow: document.getElementById('modalMetaRow'),
    modalTitle: document.getElementById('modalTitle'),
    modalHtmlContent: document.getElementById('modalHtmlContent'),
    modalActions: document.getElementById('modalActions'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    lightbox: document.getElementById('lightbox'),
    lightboxImg: document.getElementById('lightboxImg'),
    lightboxClose: document.getElementById('lightboxClose'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    backToTopBtn: document.getElementById('backToTopBtn'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileDrawer: document.getElementById('mobileDrawer'),
    mobileDrawerBackdrop: document.getElementById('mobileDrawerBackdrop'),
    mobileDrawerClose: document.getElementById('mobileDrawerClose'),
    statSections: document.getElementById('statSections'),
    statWishes: document.getElementById('statWishes'),
    statMedia: document.getElementById('statMedia'),
    statLinks: document.getElementById('statLinks')
  };

  // Init
  function init() {
    applyTheme(state.theme);
    renderStats();
    populateCategoryTabs();
    populateSectionSelect();
    renderLibraryVision(state.currentVisionVersion);
    bindEvents();
    renderCards();
  }

  // Theme Handling
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    setSafeStorage('yz_reading_theme', theme);
    if (el.themeToggleBtn) {
      const icon = el.themeToggleBtn.querySelector('i');
      if (icon) {
        if (theme === 'dark') icon.className = 'fa-solid fa-moon';
        else if (theme === 'sepia') icon.className = 'fa-solid fa-book';
        else icon.className = 'fa-solid fa-sun';
      }
    }
  }

  function cycleTheme() {
    const order = ['light', 'sepia', 'dark'];
    const nextIdx = (order.indexOf(state.theme) + 1) % order.length;
    state.theme = order[nextIdx];
    applyTheme(state.theme);
  }

  // Mobile Drawer Toggle
  function openDrawer() {
    state.isDrawerOpen = true;
    if (el.mobileDrawer) el.mobileDrawer.classList.add('active');
    if (el.mobileDrawerBackdrop) el.mobileDrawerBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    state.isDrawerOpen = false;
    if (el.mobileDrawer) el.mobileDrawer.classList.remove('active');
    if (el.mobileDrawerBackdrop) el.mobileDrawerBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Render Stats
  function renderStats() {
    if (el.statSections) el.statSections.textContent = data.stats.total_sections;
    if (el.statWishes) el.statWishes.textContent = data.stats.total_wishes;
    if (el.statMedia) el.statMedia.textContent = data.stats.total_media + '+';
    if (el.statLinks) el.statLinks.textContent = data.stats.total_links + '+';
  }

  // Populate Categories
  function populateCategoryTabs() {
    if (!el.categoryTabs) return;
    
    let html = `
      <button class="category-tab ${state.category === 'all' ? 'active' : ''}" data-cat="all">
        <i class="fa-solid fa-border-all"></i> 全部成果
        <span class="tab-badge">${data.wishes.length}</span>
      </button>
    `;

    data.categories.forEach(cat => {
      html += `
        <button class="category-tab ${state.category === cat.id ? 'active' : ''}" data-cat="${cat.id}">
          <i class="fa-solid ${cat.icon}"></i> ${escapeHtml(cat.name)}
          <span class="tab-badge">${cat.count}</span>
        </button>
      `;
    });

    el.categoryTabs.innerHTML = html;
  }

  // Populate Section Dropdown
  function populateSectionSelect() {
    if (!el.sectionSelect) return;

    let html = `<option value="all">📂 所有專欄單元 (${data.sections.length}個專欄)</option>`;
    data.sections.forEach(s => {
      html += `<option value="${s.id}">[${escapeHtml(s.category_name)}] ${escapeHtml(s.title)}</option>`;
    });

    el.sectionSelect.innerHTML = html;
  }

  // Render Library Vision
  function renderLibraryVision(version) {
    if (!el.visionGrid) return;

    const visionSections = data.sections.filter(s => s.category_id === 'library_design');
    const targetSection = visionSections.find(s => s.title.includes(version)) || visionSections[0];
    
    if (!targetSection) return;

    const items = data.wishes.filter(w => w.section_id === targetSection.id && w.local_media && (w.local_media.endsWith('.png') || w.local_media.endsWith('.jpg') || w.local_media.endsWith('.jpeg')));
    let html = '';
    items.forEach(item => {
      html += `
        <div class="vision-card" onclick="window.openDetailModal('${item.id}')">
          <img src="${item.local_media}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.onerror=null; this.src='assets/official/1660015942_634882_53.jpg';">
          <div class="vision-card-caption">${escapeHtml(item.title)}</div>
        </div>
      `;
    });

    el.visionGrid.innerHTML = html || '<p class="text-muted" style="grid-column:1/-1; text-align:center; padding:2rem;">此版本展示圖檔已整合至成果牆中</p>';
  }

  // Filter & Search Logic
  function getFilteredWishes() {
    let list = [...data.wishes];

    // Category filter
    if (state.category !== 'all') {
      list = list.filter(w => w.category_id === state.category);
    }

    // Media Type filter
    if (state.mediaTypeFilter !== 'all') {
      if (state.mediaTypeFilter === 'year114') {
        list = list.filter(w => {
          const combined = `${w.title || ''} ${w.snippet || ''} ${w.section_title || ''} ${w.category_name || ''}`;
          return combined.includes('114');
        });
      } else if (state.mediaTypeFilter === 'image') {
        list = list.filter(w => w.media_type === 'image');
      } else if (state.mediaTypeFilter === 'video') {
        list = list.filter(w => w.media_type === 'video' || w.link_type === 'youtube');
      } else if (state.mediaTypeFilter === 'audio') {
        list = list.filter(w => w.media_type === 'audio' || w.link_type === 'spotify');
      } else if (state.mediaTypeFilter === 'canva') {
        list = list.filter(w => w.link_type === 'canva' || (w.attachment_url && w.attachment_url.includes('canva')));
      } else if (state.mediaTypeFilter === 'pdf') {
        list = list.filter(w => w.media_type === 'pdf' || w.link_type === 'pdf' || (w.local_media && w.local_media.endsWith('.pdf')));
      } else if (state.mediaTypeFilter === 'form') {
        list = list.filter(w => w.link_type === 'form');
      }
    }

    // Section filter
    if (state.section !== 'all') {
      list = list.filter(w => w.section_id === state.section);
    }

    // Search query with compound Chinese & multi-token support
    if (state.search.trim()) {
      const query = state.search.toLowerCase().trim();
      const tokens = query.split(/\s+/).filter(Boolean);
      const subTokens = query.match(/114|113|112|115|閱讀|推動|深耕|mssr|說書|書展|主題|客語|生命|自主/gi) || [];
      const effectiveTokens = tokens.length > 1 ? tokens : (subTokens.length > 1 ? subTokens : [query]);

      list = list.filter(w => {
        const fullText = (
          (w.title || '') + ' ' +
          (w.snippet || '') + ' ' +
          (w.section_title || '') + ' ' +
          (w.category_name || '') + ' ' +
          (w.body_text || '')
        ).toLowerCase();

        if (fullText.includes(query)) return true;
        return effectiveTokens.every(tok => fullText.includes(tok.toLowerCase()));
      });
    }

    // Sort
    if (state.sortBy === 'newest') {
      list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    } else if (state.sortBy === 'oldest') {
      list.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
    } else if (state.sortBy === 'media') {
      list.sort((a, b) => (b.local_media ? 1 : 0) - (a.local_media ? 1 : 0));
    }

    return list;
  }

  // Render Cards
  function renderCards() {
    if (!el.cardsGrid) return;

    if (state.viewMode === 'list') {
      el.cardsGrid.classList.add('list-view');
    } else {
      el.cardsGrid.classList.remove('list-view');
    }

    const filtered = getFilteredWishes();
    const total = filtered.length;

    if (el.resultsCount) {
      el.resultsCount.textContent = `共找到 ${total} 筆推動成果紀錄`;
    }

    if (total === 0) {
      el.cardsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <i class="fa-regular fa-folder-open" style="font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.5;"></i>
          <h3 style="margin-bottom:0.5rem;">找不到符合條件的成果紀錄</h3>
          <p style="font-size:0.9rem;">請嘗試更換關鍵字或選擇其他分類與專欄</p>
        </div>
      `;
      if (el.paginationWrapper) el.paginationWrapper.innerHTML = '';
      return;
    }

    // Pagination
    const totalPages = Math.ceil(total / state.perPage);
    if (state.page > totalPages) state.page = 1;

    const start = (state.page - 1) * state.perPage;
    const end = Math.min(start + state.perPage, total);
    const pagedItems = filtered.slice(start, end);

    let html = '';
    pagedItems.forEach(w => {
      const catObj = data.categories.find(c => c.id === w.category_id) || { color: '#1b4931' };
      
      // Determine Media Presentation Block
      let mediaBlock = '';
      let typeBadge = '';

      if (w.media_type === 'image' && w.local_media) {
        typeBadge = '<span class="card-type-icon" title="成果照片"><i class="fa-solid fa-camera"></i></span>';
        mediaBlock = `
          <div class="card-media">
            <img src="${w.local_media}" alt="${escapeHtml(w.title)}" loading="lazy" onerror="this.onerror=null; this.src='assets/official/1660015942_634882_53.jpg';">
            <span class="card-category-badge" style="background: ${catObj.color};">${escapeHtml(w.category_name)}</span>
            ${typeBadge}
          </div>
        `;
      } else if (w.media_type === 'video' || w.link_type === 'youtube') {
        typeBadge = '<span class="card-type-icon" title="影音播放"><i class="fa-solid fa-play"></i></span>';
        mediaBlock = `
          <div class="card-media media-video-hero" style="background: linear-gradient(135deg, #1e293b, #0f172a);">
            <div class="media-icon-center"><i class="fa-solid fa-circle-play" style="font-size:3rem; color:#ef4444;"></i><span style="font-size:0.85rem; font-weight:700; color:#fff;">影音紀錄</span></div>
            <span class="card-category-badge" style="background: ${catObj.color};">${escapeHtml(w.category_name)}</span>
            ${typeBadge}
          </div>
        `;
      } else if (w.media_type === 'audio' || w.link_type === 'spotify') {
        typeBadge = '<span class="card-type-icon" title="廣播有聲書"><i class="fa-solid fa-podcast"></i></span>';
        mediaBlock = `
          <div class="card-media media-audio-hero" style="background: linear-gradient(135deg, #064e3b, #047857);">
            <div class="media-icon-center"><i class="fa-solid fa-headphones-simple" style="font-size:2.8rem; color:#34d399;"></i><span style="font-size:0.85rem; font-weight:700; color:#fff;">早修廣播與說書錄音</span></div>
            <span class="card-category-badge" style="background: ${catObj.color};">${escapeHtml(w.category_name)}</span>
            ${typeBadge}
          </div>
        `;
      } else if (w.link_type === 'canva') {
        typeBadge = '<span class="card-type-icon" title="Canva數位教材"><i class="fa-solid fa-palette"></i></span>';
        mediaBlock = `
          <div class="card-media media-canva-hero" style="background: linear-gradient(135deg, #0369a1, #0284c7);">
            <div class="media-icon-center"><i class="fa-solid fa-shapes" style="font-size:2.8rem; color:#7dd3fc;"></i><span style="font-size:0.85rem; font-weight:700; color:#fff;">Canva 數位簡報教材</span></div>
            <span class="card-category-badge" style="background: ${catObj.color};">${escapeHtml(w.category_name)}</span>
            ${typeBadge}
          </div>
        `;
      } else if (w.link_type === 'form') {
        typeBadge = '<span class="card-type-icon" title="學習單與問卷"><i class="fa-solid fa-file-pen"></i></span>';
        mediaBlock = `
          <div class="card-media media-form-hero" style="background: linear-gradient(135deg, #7c2d12, #c2410c);">
            <div class="media-icon-center"><i class="fa-solid fa-clipboard-question" style="font-size:2.8rem; color:#fdba74;"></i><span style="font-size:0.85rem; font-weight:700; color:#fff;">學習單與回饋問卷</span></div>
            <span class="card-category-badge" style="background: ${catObj.color};">${escapeHtml(w.category_name)}</span>
            ${typeBadge}
          </div>
        `;
      } else if (w.media_type === 'pdf') {
        typeBadge = '<span class="card-type-icon" title="PDF文件"><i class="fa-solid fa-file-pdf"></i></span>';
        mediaBlock = `
          <div class="card-media media-pdf-hero" style="background: linear-gradient(135deg, #831843, #be185d);">
            <div class="media-icon-center"><i class="fa-solid fa-file-lines" style="font-size:2.8rem; color:#fbcfe8;"></i><span style="font-size:0.85rem; font-weight:700; color:#fff;">PDF 成果文件</span></div>
            <span class="card-category-badge" style="background: ${catObj.color};">${escapeHtml(w.category_name)}</span>
            ${typeBadge}
          </div>
        `;
      } else if (w.media_type === 'excel' || (w.local_media && (w.local_media.endsWith('.xlsx') || w.local_media.endsWith('.xls')))) {
        typeBadge = '<span class="card-type-icon" title="Excel預算與統計表"><i class="fa-solid fa-file-excel"></i></span>';
        mediaBlock = `
          <div class="card-media media-excel-hero" style="background: linear-gradient(135deg, #065f46, #059669);">
            <div class="media-icon-center"><i class="fa-solid fa-file-excel" style="font-size:2.8rem; color:#a7f3d0;"></i><span style="font-size:0.85rem; font-weight:700; color:#fff;">官方工程預算書 (XLSX)</span></div>
            <span class="card-category-badge" style="background: ${catObj.color};">${escapeHtml(w.category_name)}</span>
            ${typeBadge}
          </div>
        `;
      } else {
        typeBadge = '<span class="card-type-icon" title="閱讀成果"><i class="fa-solid fa-book-open"></i></span>';
        mediaBlock = `
          <div class="card-media">
            <div class="card-media-placeholder">
              <i class="fa-solid ${catObj.icon || 'fa-book-open'}"></i>
              <span style="font-size:0.85rem; font-weight:700;">${escapeHtml(w.category_name)}</span>
            </div>
            <span class="card-category-badge" style="background: ${catObj.color};">${escapeHtml(w.category_name)}</span>
            ${typeBadge}
          </div>
        `;
      }

      html += `
        <article class="card-item" onclick="window.openDetailModal('${w.id}')" tabindex="0" role="button" aria-label="${escapeHtml(w.title)}">
          ${mediaBlock}
          <div class="card-content">
            <div class="card-section-name"><i class="fa-solid fa-bookmark"></i> ${escapeHtml(w.section_title)}</div>
            <h3 class="card-title">${escapeHtml(w.title)}</h3>
            <p class="card-snippet">${escapeHtml(w.snippet)}</p>
            <div class="card-footer">
              ${w.category_id === 'library_design' ? '<span style="color:var(--text-muted);"><i class="fa-solid fa-compass-drafting"></i> 空間意象藍圖</span>' : `<span>${formatDate(w.created_at)}</span>`}
              <span class="card-action-link">查看詳情 <i class="fa-solid fa-chevron-right"></i></span>
            </div>
          </div>
        </article>
      `;
    });

    el.cardsGrid.innerHTML = html;
    renderPagination(totalPages);
  }

  // Render Pagination Buttons
  function renderPagination(totalPages) {
    if (!el.paginationWrapper) return;
    if (totalPages <= 1) {
      el.paginationWrapper.innerHTML = '';
      return;
    }

    let html = `
      <button class="page-btn" ${state.page === 1 ? 'disabled' : ''} onclick="window.goToPage(${state.page - 1})" aria-label="上一頁">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= state.page - 2 && i <= state.page + 2)) {
        html += `<button class="page-btn ${state.page === i ? 'active' : ''}" onclick="window.goToPage(${i})" aria-label="第${i}頁">${i}</button>`;
      } else if (i === state.page - 3 || i === state.page + 3) {
        html += `<span style="padding: 0 4px; color: var(--text-muted);">...</span>`;
      }
    }

    html += `
      <button class="page-btn" ${state.page === totalPages ? 'disabled' : ''} onclick="window.goToPage(${state.page + 1})" aria-label="下一頁">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    `;

    el.paginationWrapper.innerHTML = html;
  }

  window.goToPage = function (p) {
    state.page = p;
    renderCards();
    const target = document.getElementById('achievementsWall');
    if (target) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elemRect = target.getBoundingClientRect().top;
      const elemPosition = elemRect - bodyRect;
      const offsetPosition = elemPosition - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Modal Dialog
  window.openDetailModal = function (wishId) {
    const wish = data.wishes.find(w => w.id === wishId);
    if (!wish) return;

    state.currentModalWish = wish;
    const catObj = data.categories.find(c => c.id === wish.category_id) || { color: '#1b4931' };

    // Modal Media Handler
    let mediaHtml = '';
    if (wish.youtube_id) {
      mediaHtml = `<iframe src="https://www.youtube.com/embed/${wish.youtube_id}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else if (wish.media_type === 'video' && wish.local_media) {
      mediaHtml = `<video controls autoplay style="max-height:440px; width:100%;"><source src="${wish.local_media}" type="video/mp4"></video>`;
    } else if (wish.media_type === 'audio' && wish.local_media) {
      mediaHtml = `
        <div style="width:100%; padding:2.5rem 1.5rem; background:linear-gradient(135deg, #064e3b, #047857); text-align:center; color:#fff; border-radius:8px;">
          <i class="fa-solid fa-headphones-simple" style="font-size:3.5rem; color:#34d399; margin-bottom:1rem;"></i>
          <h4 style="font-size:1.2rem; font-weight:700; margin-bottom:1rem;">有聲繪本與說書錄音檔</h4>
          <audio controls autoplay style="width:100%; max-width:500px;"><source src="${wish.local_media}" type="audio/mpeg"></audio>
        </div>
      `;
    } else if (wish.media_type === 'pdf' || (wish.local_media && wish.local_media.endsWith('.pdf'))) {
      const pdfPath = wish.local_media || wish.attachment_url;
      mediaHtml = `
        <div style="width:100%; padding:2.5rem 1.5rem; background:linear-gradient(135deg, #831843, #be185d); text-align:center; color:#fff; border-radius:8px;">
          <i class="fa-solid fa-file-pdf" style="font-size:3.5rem; color:#fbcfe8; margin-bottom:1rem;"></i>
          <h4 style="font-size:1.25rem; font-weight:700; margin-bottom:0.75rem;">${escapeHtml(wish.title)}</h4>
          <p style="font-size:0.95rem; opacity:0.95; margin-bottom:1.25rem;">📄 本成果為官方 PDF 計畫與成果文件，可直接點擊線上預覽或下載原檔：</p>
          <div style="display:flex; justify-content:center; gap:0.75rem; flex-wrap:wrap;">
            <a href="${pdfPath}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="background:#fff; color:#be185d; border-color:#fff; font-weight:700;">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> 在新分頁開啟 PDF
            </a>
            <a href="${pdfPath}" download class="btn btn-secondary" style="border-color:rgba(255,255,255,0.6); color:#fff; font-weight:700;">
              <i class="fa-solid fa-download"></i> 下載 PDF 文件
            </a>
          </div>
        </div>
      `;
    } else if (wish.media_type === 'excel' || (wish.local_media && (wish.local_media.endsWith('.xlsx') || wish.local_media.endsWith('.xls')))) {
      const xlsxPath = wish.local_media || wish.attachment_url;
      mediaHtml = `
        <div style="width:100%; padding:2.5rem 1.5rem; background:linear-gradient(135deg, #065f46, #059669); text-align:center; color:#fff; border-radius:8px;">
          <i class="fa-solid fa-file-excel" style="font-size:3.5rem; color:#a7f3d0; margin-bottom:1rem;"></i>
          <h4 style="font-size:1.25rem; font-weight:700; margin-bottom:0.75rem;">${escapeHtml(wish.title)}</h4>
          <p style="font-size:0.95rem; opacity:0.95; margin-bottom:1.25rem;">📊 本成果為官方詳細工程預算表與單價分析書，可直接點擊下載原檔：</p>
          <div style="display:flex; justify-content:center; gap:0.75rem; flex-wrap:wrap;">
            <a href="${xlsxPath}" download class="btn btn-primary" style="background:#fff; color:#065f46; border-color:#fff; font-weight:700;">
              <i class="fa-solid fa-download"></i> 下載完整預算書 (Excel)
            </a>
          </div>
        </div>
      `;
    } else if (wish.link_type === 'canva' || (wish.attachment_url && wish.attachment_url.includes('canva'))) {
      mediaHtml = `
        <div style="width:100%; padding:2.5rem 1.5rem; background:linear-gradient(135deg, #0369a1, #0284c7); text-align:center; color:#fff; border-radius:8px;">
          <i class="fa-solid fa-palette" style="font-size:3.5rem; color:#7dd3fc; margin-bottom:1rem;"></i>
          <h4 style="font-size:1.25rem; font-weight:700; margin-bottom:0.75rem;">${escapeHtml(wish.title)}</h4>
          <p style="font-size:0.95rem; opacity:0.95; margin-bottom:1.25rem;">🎨 本成果以 Canva 數位互動簡報發布，點擊下方即可在新視窗即時閱覽！</p>
          <a href="${wish.attachment_url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="background:#fff; color:#0284c7; border-color:#fff; font-weight:700;">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> 前往 Canva 官方互動網頁
          </a>
        </div>
      `;
    } else if (wish.media_type === 'image' && wish.local_media) {
      mediaHtml = `<img src="${wish.local_media}" alt="${escapeHtml(wish.title)}" style="cursor:zoom-in;" onclick="window.openLightbox('${wish.local_media}')" onerror="this.onerror=null; this.src='assets/official/1660015942_634882_53.jpg';">`;
    }

    el.modalMedia.innerHTML = mediaHtml;
    el.modalMedia.style.display = mediaHtml ? 'flex' : 'none';

    // Meta row
    el.modalMetaRow.innerHTML = `
      <span class="card-category-badge" style="position:static; background:${catObj.color};">${escapeHtml(wish.category_name)}</span>
      <span style="font-size:0.85rem; color:var(--text-muted);"><i class="fa-solid fa-folder"></i> ${escapeHtml(wish.section_title)}</span>
      ${wish.category_id === 'library_design' ? '<span style="font-size:0.85rem; color:var(--text-muted);"><i class="fa-solid fa-compass-drafting"></i> 空間意象藍圖</span>' : `<span style="font-size:0.85rem; color:var(--text-muted);"><i class="fa-regular fa-clock"></i> ${formatDate(wish.created_at)}</span>`}
    `;

    el.modalTitle.textContent = wish.title;

    // Body content
    let contentHtml = wish.body_html || '';
    if (!contentHtml && wish.snippet) {
      contentHtml = `<p>${escapeHtml(wish.snippet)}</p>`;
    }
    el.modalHtmlContent.innerHTML = contentHtml || '<p style="color:var(--text-muted);">本成果以圖片/影音/外部教材呈現，請參閱上方多媒體或下方按鈕連結。</p>';

    // Actions
    let actionButtons = '';
    if (wish.attachment_url) {
      let btnLabel = '開啟外部學習資源';
      let btnIcon = 'fa-arrow-up-right-from-square';
      if (wish.link_type === 'canva') {
        btnLabel = '開啟 Canva 數位簡報教材';
        btnIcon = 'fa-palette';
      } else if (wish.link_type === 'spotify') {
        btnLabel = '前往 Spotify 收聽廣播節目';
        btnIcon = 'fa-spotify';
      } else if (wish.link_type === 'youtube') {
        btnLabel = '於 YouTube 上觀看完整影片';
        btnIcon = 'fa-youtube';
      } else if (wish.link_type === 'form') {
        btnLabel = '填寫線上問卷 / 學習單';
        btnIcon = 'fa-clipboard-question';
      } else if (wish.link_type === 'pdf') {
        btnLabel = '下載 / 預覽 PDF 文件';
        btnIcon = 'fa-file-pdf';
      }

      actionButtons += `
        <a href="${wish.attachment_url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
          <i class="fa-solid ${btnIcon}"></i> ${btnLabel}
        </a>
      `;
    }

    if (wish.media_type === 'image' && wish.local_media) {
      actionButtons += `
        <button class="btn btn-secondary" onclick="window.openLightbox('${wish.local_media}')">
          <i class="fa-solid fa-magnifying-glass-plus"></i> 放大高畫質圖片
        </button>
      `;
    }

    if (wish.local_media && wish.local_media.endsWith('.pdf')) {
      actionButtons += `
        <a href="${wish.local_media}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
          <i class="fa-solid fa-file-pdf"></i> 在新視窗開啟完整 PDF
        </a>
      `;
    }

    if (wish.local_media && (wish.local_media.endsWith('.xlsx') || wish.local_media.endsWith('.xls'))) {
      actionButtons += `
        <a href="${wish.local_media}" download class="btn btn-secondary">
          <i class="fa-solid fa-file-excel"></i> 下載完整預算書 (Excel)
        </a>
      `;
    }

    // Always provide a convenient close button at bottom for mobile & tablet ergonomics
    actionButtons += `
      <button type="button" class="btn btn-secondary modal-close-bottom-btn" onclick="window.closeModal()" style="margin-left:auto;">
        <i class="fa-solid fa-xmark"></i> 關閉視窗
      </button>
    `;

    el.modalActions.innerHTML = actionButtons;
    el.modalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  function closeModal() {
    el.modalBackdrop.classList.remove('active');
    el.modalMedia.innerHTML = '';
    document.body.style.overflow = '';
  }
  window.closeModal = closeModal;

  // Lightbox
  window.openLightbox = function (src) {
    el.lightboxImg.src = src;
    el.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  function closeLightbox() {
    el.lightbox.classList.remove('active');
    el.lightboxImg.src = '';
    // Only restore scroll if modal is not active
    if (!el.modalBackdrop.classList.contains('active')) {
      document.body.style.overflow = '';
    }
  }

  // Bind Events
  function bindEvents() {
    // Mobile Drawer Open / Close
    if (el.mobileMenuBtn) el.mobileMenuBtn.addEventListener('click', openDrawer);
    if (el.mobileDrawerClose) el.mobileDrawerClose.addEventListener('click', closeDrawer);
    if (el.mobileDrawerBackdrop) el.mobileDrawerBackdrop.addEventListener('click', closeDrawer);

    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        closeDrawer();
      });
    });

    // Category Tabs Click
    if (el.categoryTabs) {
      el.categoryTabs.addEventListener('click', e => {
        const btn = e.target.closest('.category-tab');
        if (!btn) return;
        el.categoryTabs.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

        state.category = btn.getAttribute('data-cat');
        state.page = 1;
        renderCards();
      });
    }

    // Media Type Filter Chips Click
    if (el.mediaTypeFilters) {
      el.mediaTypeFilters.addEventListener('click', e => {
        const btn = e.target.closest('.media-filter-chip');
        if (!btn) return;
        el.mediaTypeFilters.querySelectorAll('.media-filter-chip').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        state.mediaTypeFilter = btn.getAttribute('data-type');
        state.page = 1;
        renderCards();
      });
    }

    // Section Dropdown
    if (el.sectionSelect) {
      el.sectionSelect.addEventListener('change', e => {
        state.section = e.target.value;
        state.page = 1;
        renderCards();
      });
    }

    // Sort Dropdown
    if (el.sortSelect) {
      el.sortSelect.addEventListener('change', e => {
        state.sortBy = e.target.value;
        state.page = 1;
        renderCards();
      });
    }

    // View Mode Toggle
    if (el.viewModeGrid) {
      el.viewModeGrid.addEventListener('click', () => {
        state.viewMode = 'grid';
        el.viewModeGrid.classList.add('active');
        if (el.viewModeList) el.viewModeList.classList.remove('active');
        renderCards();
      });
    }

    if (el.viewModeList) {
      el.viewModeList.addEventListener('click', () => {
        state.viewMode = 'list';
        el.viewModeList.classList.add('active');
        if (el.viewModeGrid) el.viewModeGrid.classList.remove('active');
        renderCards();
      });
    }

    // Search Input
    if (el.searchInput) {
      let timeout;
      el.searchInput.addEventListener('input', e => {
        clearTimeout(timeout);
        const val = e.target.value;
        if (el.searchClearBtn) {
          el.searchClearBtn.style.display = val ? 'flex' : 'none';
        }
        timeout = setTimeout(() => {
          state.search = val;
          state.page = 1;
          renderCards();
        }, 180);
      });
    }

    // Search Clear
    if (el.searchClearBtn) {
      el.searchClearBtn.addEventListener('click', () => {
        el.searchInput.value = '';
        el.searchClearBtn.style.display = 'none';
        state.search = '';
        state.page = 1;
        renderCards();
        el.searchInput.focus();
      });
    }

    // Vision Tabs
    if (el.visionTabs) {
      el.visionTabs.addEventListener('click', e => {
        const tab = e.target.closest('.vision-tab');
        if (!tab) return;
        el.visionTabs.querySelectorAll('.vision-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const ver = tab.getAttribute('data-ver');
        state.currentVisionVersion = ver;
        renderLibraryVision(ver);
      });
    }

    // Theme Toggle
    if (el.themeToggleBtn) {
      el.themeToggleBtn.addEventListener('click', cycleTheme);
    }

    // Modal Close
    if (el.modalCloseBtn) el.modalCloseBtn.addEventListener('click', closeModal);
    if (el.modalBackdrop) {
      el.modalBackdrop.addEventListener('click', e => {
        if (e.target === el.modalBackdrop) closeModal();
      });
    }

    // Lightbox Close
    if (el.lightboxClose) el.lightboxClose.addEventListener('click', closeLightbox);
    if (el.lightbox) {
      el.lightbox.addEventListener('click', e => {
        if (e.target === el.lightbox) closeLightbox();
      });
    }

    // Escape Key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeLightbox();
        closeModal();
        closeDrawer();
      }
    });

    // Scroll Back to Top
    window.addEventListener('scroll', () => {
      if (el.backToTopBtn) {
        if (window.scrollY > 350) el.backToTopBtn.classList.add('visible');
        else el.backToTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    if (el.backToTopBtn) {
      el.backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // Utilities
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  }

  // Start app on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

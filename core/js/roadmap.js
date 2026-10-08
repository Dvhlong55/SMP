/* ==========================================================================
   SMP — ROADMAP RENDERER (Editorial Table of Contents, Metro Timeline & Flowchart Tree)
   Primary Design Reference: SMP Home (shared.css) & roadmap.sh
   - Mặc định: Chế độ "Chi tiết" (Mục lục + Dòng thời gian với các thẻ bài học đầy đủ).
   - Chế độ "Sơ đồ cây": Lược đồ trực quan dạng flowchart (chỉ tiêu đề, không mô tả rườm rà,
                         không số sao, đường nối chặng và bài học sắc nét).
   - Ô có `url` → thẻ bấm được (dùng class .card-link để PostViewer của
                   shared.js mở bài viết giống hệt các thẻ bài viết thông thường).
   - Ô không có `url` → hiển thị "Sắp có" / "Đang biên soạn".
   ========================================================================== */
(function () {
    'use strict';

    const esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const pad = (n) => String(n).padStart(2, '0');

    function stationStats(st) {
        const total = (st.tiles || []).length;
        const ready = (st.tiles || []).filter(t => !!t.url).length;
        return { total, ready, ratio: total ? ready / total : 0 };
    }

    /* ----------------------------------------------------------------------
       1. VIEW CHI TIẾT: Cards & Stations
       ---------------------------------------------------------------------- */
    function renderCard(st, tile, idx) {
        const code = `${st.label || st.id}.${idx + 1}`;
        const ready = !!tile.url;

        const foot = ready
            ? `<a href="${esc(tile.url)}" class="card-link" aria-label="Đọc bài: ${esc(tile.title.replace(/\$/g, ''))}">Đọc bài</a>`
            : `<span class="rm-soon-text">Đang biên soạn</span>`;

        return `
            <article class="card rm-card ${ready ? 'is-ready' : 'is-soon'}">
                <div class="rm-card-top">
                    <span class="rm-card-code">${esc(code)}</span>
                </div>
                <h3 class="rm-card-title">${tile.title}</h3>
                ${tile.desc ? `<p class="rm-card-desc">${tile.desc}</p>` : ''}
                <div class="rm-card-foot">${foot}</div>
            </article>`;
    }

    function renderStation(st, phaseName) {
        const stats = stationStats(st);
        const label = st.label || pad(st.id);
        const statusText = stats.ready > 0 
            ? `${stats.ready}/${stats.total} bài viết` 
            : 'Đang cập nhật';

        return `
            <section class="rm-station" id="rm-station-${st.id}">
                <div class="rm-node" aria-hidden="true">${esc(label)}</div>
                <div class="rm-station-body">
                    <header class="rm-station-head">
                        <div class="rm-station-meta">
                            <span class="rm-station-kicker">Chặng ${esc(label)}</span>
                            <span class="rm-station-sep">·</span>
                            <span class="rm-station-phase">${esc(phaseName)}</span>
                            <span class="rm-station-sep">·</span>
                            <span class="rm-station-status">${statusText}</span>
                        </div>
                        <div class="rm-station-title-row">
                            <h2 class="rm-station-title">${st.title}</h2>
                            ${st.formula ? `<span class="rm-station-formula">${st.formula}</span>` : ''}
                        </div>
                        ${st.desc ? `<p class="rm-station-desc">${st.desc}</p>` : ''}
                    </header>
                    <div class="rm-cards">
                        ${(st.tiles || []).map((t, i) => renderCard(st, t, i)).join('')}
                    </div>
                </div>
            </section>`;
    }

    function renderTOC(phases, stations) {
        return `
            <nav class="rm-toc" aria-label="Mục lục chuyên đề">
                <div class="section-label"><span>Mục Lục Chuyên Đề</span></div>
                <div class="rm-toc-grid">
                    ${phases.map(ph => {
                        const phStations = stations.filter(s => s.phase === ph.id);
                        if (!phStations.length) return '';
                        const roman = ['I', 'II', 'III', 'IV', 'V'][(ph.id || 1) - 1] || ph.id;
                        return `
                            <div class="rm-toc-col">
                                <div class="rm-toc-phase-name">Giai đoạn ${roman} · ${esc(ph.name)}</div>
                                <div class="rm-toc-items">
                                    ${phStations.map(st => {
                                        const stats = stationStats(st);
                                        const num = esc(st.label || pad(st.id));
                                        const countText = stats.ready > 0 ? `${stats.ready} bài` : 'Đang cập nhật';
                                        return `
                                            <a href="#rm-station-${st.id}" class="rm-toc-row" data-target="rm-station-${st.id}">
                                                <span class="rm-toc-num">${num}</span>
                                                <span class="rm-toc-title">${st.title}</span>
                                                <span class="rm-toc-dots" aria-hidden="true"></span>
                                                <span class="rm-toc-status ${stats.ready === 0 ? 'is-soon' : ''}">${countText}</span>
                                            </a>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </nav>`;
    }

    /* ----------------------------------------------------------------------
       2. VIEW SƠ ĐỒ CÂY (roadmap.sh style Flowchart)
       - Không mô tả rườm rà (chỉ tiêu đề).
       - Không đánh số sao.
       - Tông màu chuẩn SMP (--accent-cyan, --accent-gold, --border-light).
       ---------------------------------------------------------------------- */
    function renderTree(phases, stations) {
        const totalTiles = stations.reduce((acc, st) => acc + (st.tiles || []).length, 0);
        const readyTiles = stations.reduce((acc, st) => acc + (st.tiles || []).filter(t => !!t.url).length, 0);

        let treeContentHtml = '';

        phases.forEach((ph, phIdx) => {
            const phStations = stations.filter(s => s.phase === ph.id);
            if (!phStations.length) return;
            const roman = ['I', 'II', 'III', 'IV', 'V'][(ph.id || 1) - 1] || ph.id;

            // Phase transition connector (giữa các giai đoạn)
            if (phIdx > 0) {
                treeContentHtml += `
                    <div class="rm-tree-phase-transition" aria-hidden="true">
                        <span class="rm-tree-trans-line"></span>
                        <span class="rm-tree-trans-arrow">↓</span>
                    </div>`;
            }

            // Milestone của Giai đoạn
            treeContentHtml += `
                <div class="rm-tree-phase" id="tree-phase-${ph.id}">
                    <div class="rm-tree-phase-node">
                        <span class="rm-tree-phase-kicker">Giai đoạn ${roman}</span>
                        <h2 class="rm-tree-phase-title">${esc(ph.name)}</h2>
                    </div>
                </div>`;

            // Từng chặng bên trong giai đoạn
            phStations.forEach((st) => {
                const label = st.label || pad(st.id);

                // Đường dẫn mũi tên đi vào chặng
                treeContentHtml += `
                    <div class="rm-tree-connector" aria-hidden="true">
                        <span class="rm-tree-conn-stem"></span>
                        <span class="rm-tree-conn-arrow">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
                        </span>
                    </div>`;

                // Cụm Chặng (Station Hub + Nhánh Topic Leaves)
                treeContentHtml += `
                    <section class="rm-tree-station" id="tree-station-${st.id}">
                        <div class="rm-tree-hub">
                            <span class="rm-tree-hub-code">Chặng ${esc(label)}</span>
                            <h3 class="rm-tree-hub-title">${st.title}</h3>
                            ${st.formula ? `<span class="rm-tree-hub-formula">${st.formula}</span>` : ''}
                        </div>
                        <div class="rm-tree-stem" aria-hidden="true"></div>
                        <div class="rm-tree-leaves">
                            ${(st.tiles || []).map((t, idx) => {
                                const code = `${st.label || st.id}.${idx + 1}`;
                                const ready = !!t.url;
                                const cleanTitle = t.title.replace(/\$/g, '');
                                if (ready) {
                                    return `
                                        <a href="${esc(t.url)}" class="rm-tree-node is-ready card-link" aria-label="Đọc bài: ${esc(cleanTitle)}">
                                            <span class="rm-tree-node-code">${esc(code)}</span>
                                            <span class="rm-tree-node-title">${t.title}</span>
                                            <span class="rm-tree-node-link" aria-hidden="true">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
                                            </span>
                                        </a>`;
                                } else {
                                    return `
                                        <div class="rm-tree-node is-soon">
                                            <span class="rm-tree-node-code">${esc(code)}</span>
                                            <span class="rm-tree-node-title">${t.title}</span>
                                            <span class="rm-tree-node-tag">Sắp có</span>
                                        </div>`;
                                }
                            }).join('')}
                        </div>
                    </section>`;
            });
        });

        return `
            <div class="rm-tree-toolbar">
                <div class="rm-tree-stats">
                    <span class="rm-tree-stat-pill"><strong>${phases.length}</strong> Giai đoạn</span>
                    <span class="rm-tree-stat-sep">·</span>
                    <span class="rm-tree-stat-pill"><strong>${stations.length}</strong> Chặng</span>
                    <span class="rm-tree-stat-sep">·</span>
                    <span class="rm-tree-stat-pill"><strong>${totalTiles}</strong> Chuyên đề</span>
                    <span class="rm-tree-stat-badge"><strong>${readyTiles}</strong> bài đã phát hành</span>
                </div>
                <div class="rm-tree-legend">
                    <span class="rm-tree-legend-item is-ready">
                        <span class="rm-tree-legend-dot"></span> Đã có bài đọc
                    </span>
                    <span class="rm-tree-legend-item is-soon">
                        <span class="rm-tree-legend-dot"></span> Đang biên soạn
                    </span>
                </div>
            </div>
            <div class="rm-tree-canvas">
                ${treeContentHtml}
            </div>`;
    }

    /* ----------------------------------------------------------------------
       3. RENDER CHÍNH
       ---------------------------------------------------------------------- */
    function render(container, data) {
        if (!container || !data) return;
        const stations = data.stations || [];
        const phases = data.phases || [];
        const phaseById = Object.fromEntries(phases.map(p => [p.id, p]));

        // Hero Section + Cần gạt chuyển view (ngay dưới dòng mô tả)
        const heroHtml = `
            <header class="rm-hero">
                <div class="rm-hero-kicker">VMO · Số Học</div>
                <div class="rm-hero-head">
                    <h1 class="rm-hero-title">${esc(data.title || 'Lộ Trình Số Học Olympic')}</h1>
                    <a href="/pages/toanhoc.html?filter=vmo&sub=so-hoc" class="rm-hero-action">
                        <span>Danh sách bài viết</span> →
                    </a>
                </div>
                <p class="rm-hero-desc">
                    Hệ thống chuyên đề và giáo trình chọn lọc bồi dưỡng thi Học sinh Giỏi Quốc gia (VMO), phân bố từ nền tảng đồng dư đến đa thức số học.
                </p>
                <div class="rm-view-switch-row">
                    <span class="rm-view-switch-label">Chế độ xem:</span>
                    <div class="rm-view-switch" role="tablist" aria-label="Chế độ hiển thị lộ trình" data-active="detailed">
                        <button type="button" class="rm-view-tab is-active" data-view="detailed" role="tab" aria-selected="true" id="tab-detailed">
                            <span class="rm-view-tab-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                            </span>
                            <span class="rm-view-tab-text">Chi tiết</span>
                        </button>
                        <button type="button" class="rm-view-tab" data-view="tree" role="tab" aria-selected="false" id="tab-tree">
                            <span class="rm-view-tab-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="6" height="6" rx="1"></rect><rect x="15" y="3" width="6" height="6" rx="1"></rect><rect x="9" y="15" width="6" height="6" rx="1"></rect><path d="M6 9v3a3 3 0 0 0 3 3h3m6-6v3a3 3 0 0 1-3 3"></path></svg>
                            </span>
                            <span class="rm-view-tab-text">Sơ đồ cây (roadmap.sh)</span>
                        </button>
                        <span class="rm-view-switch-indicator" aria-hidden="true"></span>
                    </div>
                </div>
            </header>`;

        // TOC Section
        const tocHtml = renderTOC(phases, stations);

        // Timeline Section (Chi tiết)
        let timelineHtml = '';
        let lastPhase = null;
        stations.forEach((st) => {
            const ph = phaseById[st.phase] || { id: st.phase, name: '' };
            if (st.phase !== lastPhase) {
                const roman = ['I', 'II', 'III', 'IV', 'V'][(ph.id || 1) - 1] || ph.id;
                timelineHtml += `
                    <div class="rm-phase">
                        <div class="section-label"><span>Giai đoạn ${roman} · ${esc(ph.name)}</span></div>
                    </div>`;
                lastPhase = st.phase;
            }
            timelineHtml += renderStation(st, ph.name);
        });

        // Flowchart Tree Section
        const treeHtml = renderTree(phases, stations);

        container.innerHTML = `
            <div class="rm-root">
                ${heroHtml}
                <!-- 1. Chế độ xem Chi tiết (Mặc định) -->
                <div class="rm-view-detailed" id="rm-view-detailed">
                    ${tocHtml}
                    <div class="section-label rm-timeline-label"><span>Lộ Trình Học Tập</span></div>
                    <div class="rm-timeline">
                        <div class="rm-spine" aria-hidden="true"></div>
                        <div class="rm-spine-fill" aria-hidden="true"></div>
                        ${timelineHtml}
                    </div>
                </div>
                <!-- 2. Chế độ xem Sơ đồ cây (roadmap.sh) -->
                <div class="rm-view-tree" id="rm-view-tree" hidden>
                    ${treeHtml}
                </div>
                <footer class="rm-colophon">
                    <div class="rm-colophon-divider" aria-hidden="true"></div>
                    <blockquote class="rm-quote">
                        “Toán học là nữ hoàng của các ngành khoa học, và Số học là nữ hoàng của Toán học.”
                    </blockquote>
                    <cite class="rm-cite">— Carl Friedrich Gauss —</cite>
                </footer>
            </div>`;

        bind(container);
        typeset(container);
    }

    /* ----------------------------------------------------------------------
       4. SỰ KIỆN TƯƠNG TÁC
       ---------------------------------------------------------------------- */
    function bind(container) {
        const root = container.querySelector('.rm-root');
        if (!root) return;

        // 1) Smooth scroll for TOC links
        root.querySelectorAll('.rm-toc-row').forEach(row => {
            row.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = row.dataset.target;
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    if (window.history && window.history.pushState) {
                        window.history.pushState(null, '', '#' + targetId);
                    }
                }
            });
        });

        // 2) Scroll timeline progress (1px subtle cyan hairline)
        const timeline = root.querySelector('.rm-timeline');
        const fill = root.querySelector('.rm-spine-fill');
        const stationEls = Array.from(root.querySelectorAll('.rm-station'));
        let ticking = false;

        const updateTimeline = () => {
            ticking = false;
            if (!timeline || !timeline.offsetParent) return;
            const rect = timeline.getBoundingClientRect();
            const anchor = window.innerHeight * 0.45;
            const h = rect.height;
            const progress = Math.min(Math.max(anchor - rect.top, 0), h);
            if (fill) fill.style.height = progress + 'px';
            stationEls.forEach(s => {
                const node = s.querySelector('.rm-node');
                if (!node) return;
                const top = node.getBoundingClientRect().top + node.offsetHeight / 2;
                s.classList.toggle('is-passed', top < anchor);
            });
        };

        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(updateTimeline);
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        updateTimeline();

        // 3) Switch chuyển đổi chế độ xem (Detailed <-> Tree)
        const detailedView = root.querySelector('#rm-view-detailed');
        const treeView = root.querySelector('#rm-view-tree');
        const switchEl = root.querySelector('.rm-view-switch');
        const tabs = root.querySelectorAll('.rm-view-tab');

        function setView(viewName) {
            if (!detailedView || !treeView || !switchEl) return;
            const isTree = viewName === 'tree';

            switchEl.setAttribute('data-active', isTree ? 'tree' : 'detailed');

            tabs.forEach(tab => {
                const active = tab.dataset.view === (isTree ? 'tree' : 'detailed');
                tab.classList.toggle('is-active', active);
                tab.setAttribute('aria-selected', String(active));
            });

            if (isTree) {
                detailedView.setAttribute('hidden', '');
                treeView.removeAttribute('hidden');
                typeset(treeView);
            } else {
                treeView.setAttribute('hidden', '');
                detailedView.removeAttribute('hidden');
                updateTimeline();
            }
        }

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                setView(tab.dataset.view);
            });
        });

        // Click trên thanh trượt cũng gạt đổi chế độ
        if (switchEl) {
            switchEl.addEventListener('click', (e) => {
                if (e.target.closest('.rm-view-tab')) return;
                const current = switchEl.getAttribute('data-active') || 'detailed';
                setView(current === 'detailed' ? 'tree' : 'detailed');
            });
        }
    }

    function typeset(el) {
        const run = () => {
            if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
                if (typeof MathJax.typesetClear === 'function') MathJax.typesetClear([el]);
                MathJax.typesetPromise([el]).catch(() => {});
            }
        };
        if (window.MathJax && MathJax.startup && MathJax.startup.promise) {
            MathJax.startup.promise.then(run);
        } else {
            window.addEventListener('load', run, { once: true });
        }
        run();
    }

    window.SMPRoadmap = { render };
})();

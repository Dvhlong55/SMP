/* ==========================================================================
   SMP — ROADMAP RENDERER (Editorial Table of Contents, Metro Timeline & Serpentine Tree)
   Primary Design Reference: SMP Home (shared.css) & Mindmap / Winding Skill Tree
   - Mặc định: Chế độ "Chi tiết" (Mục lục + Dòng thời gian với các thẻ bài học đầy đủ).
   - Chế độ "Sơ đồ cây": Sơ đồ lượn sóng (Serpentine Tree) với trục chính uốn lượn,
                         nhánh nét đứt rẽ ngang sang từng bài học (chỉ tiêu đề, không sao,
                         không mô tả dài).
   - Ô có `url` → thẻ bấm được (dùng class .card-link để PostViewer của
                   shared.js mở bài viết giống hệt các thẻ bài viết thông thường).
   - Ô không có `url` → hiển thị "Sắp có".
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
       1. VIEW CHI TIẾT: Cards, Stations & TOC
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
       2. VIEW SƠ ĐỒ CÂY LƯỢN SÓNG (Serpentine Mindmap Tree)
       - Trục chính uốn lượn zig-zag kết nối các chặng kiến thức.
       - Các bài học con rẽ nhánh nét đứt sang bên cạnh (Chỉ Tiêu Đề, Không Sao).
       ---------------------------------------------------------------------- */
    function renderTree(phases, stations) {
        let treeHtml = `
            <div class="rm-tree-scroll-wrapper">
                <div class="rm-mobile-hint">
                    <span>👉 Vuốt ngang để quan sát toàn bộ sơ đồ cây</span>
                </div>
                <div class="rm-serpentine-canvas" id="rm-serpentine-canvas">
                    <svg class="rm-serpentine-svg" id="rm-serpentine-svg" aria-hidden="true"></svg>

                    <div class="rm-tree-topbar">
                        <div class="rm-tree-root-box">
                            <div class="rm-tree-root-node" id="rm-tree-root">VMO · SỐ HỌC OLYMPIC</div>
                        </div>
                        <div class="rm-tree-legend-box">
                            <div class="rm-legend-item">
                                <span class="rm-legend-chip is-hub"></span>
                                <span>Chặng kiến thức</span>
                            </div>
                            <div class="rm-legend-item">
                                <span class="rm-legend-chip is-ready"></span>
                                <span>Đã có bài viết</span>
                            </div>
                            <div class="rm-legend-item">
                                <span class="rm-legend-chip is-soon"></span>
                                <span>Đang biên soạn</span>
                            </div>
                        </div>
                    </div>`;

        let lastPhase = null;
        stations.forEach((st, idx) => {
            // So le: chặng lẻ hub bên phải (bài học bên trái), chặng chẵn hub bên trái (bài học bên phải)
            const side = (idx % 2 === 0) ? 'right' : 'left';
            const label = st.label || pad(st.id);
            const ph = phases.find(p => p.id === st.phase);

            // Mốc chuyển tiếp Giai đoạn
            if (lastPhase !== null && st.phase !== lastPhase && ph) {
                const roman = ['I', 'II', 'III', 'IV', 'V'][(ph.id || 1) - 1] || ph.id;
                treeHtml += `
                    <div class="rm-st-phase-milestone" data-phase-id="${ph.id}">
                        <span class="rm-st-phase-kicker">Giai đoạn ${roman}</span>
                        <span class="rm-st-phase-name">${esc(ph.name)}</span>
                    </div>`;
            }
            lastPhase = st.phase;

            const isGrid2 = (st.tiles || []).length > 4;

            const cardsHtml = `
                <div class="rm-st-cards-group ${isGrid2 ? 'is-grid-2' : ''}">
                    ${(st.tiles || []).map((t, tIdx) => {
                        const code = `${st.label || st.id}.${tIdx + 1}`;
                        const ready = !!t.url;
                        const cleanTitle = t.title.replace(/\$/g, '');
                        if (ready) {
                            return `
                                <a href="${esc(t.url)}" class="rm-st-card is-ready card-link" data-code="${esc(code)}" aria-label="Đọc bài: ${esc(cleanTitle)}">
                                    <span class="rm-st-card-code">${esc(code)}</span>
                                    <span class="rm-st-card-title">${t.title}</span>
                                    <span class="rm-st-card-link" aria-hidden="true">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
                                    </span>
                                </a>`;
                        } else {
                            return `
                                <div class="rm-st-card is-soon" data-code="${esc(code)}">
                                    <span class="rm-st-card-code">${esc(code)}</span>
                                    <span class="rm-st-card-title">${t.title}</span>
                                    <span class="rm-st-card-tag">Sắp có</span>
                                </div>`;
                        }
                    }).join('')}
                </div>`;

            const hubHtml = `
                <div class="rm-st-col-hub">
                    <div class="rm-st-hub" data-station-id="${st.id}">
                        <span class="rm-st-hub-badge">Chặng ${esc(label)}</span>
                        <span class="rm-st-hub-title">${st.title}</span>
                    </div>
                </div>`;

            if (side === 'right') {
                treeHtml += `
                    <div class="rm-st-row" data-station-id="${st.id}" data-side="right">
                        <div class="rm-st-col-cards">
                            ${cardsHtml}
                        </div>
                        ${hubHtml}
                    </div>`;
            } else {
                treeHtml += `
                    <div class="rm-st-row" data-station-id="${st.id}" data-side="left">
                        ${hubHtml}
                        <div class="rm-st-col-cards">
                            ${cardsHtml}
                        </div>
                    </div>`;
            }
        });

        treeHtml += `
                </div>
            </div>`;

        return treeHtml;
    }

    /* ----------------------------------------------------------------------
       3. VẼ CÁC ĐƯỜNG CONG SVG NỐI TRỤC & NHÁNH
       ---------------------------------------------------------------------- */
    function drawSerpentineConnections(canvasEl) {
        if (!canvasEl) return;
        const svg = canvasEl.querySelector('#rm-serpentine-svg');
        if (!svg) return;

        const canvasRect = canvasEl.getBoundingClientRect();
        const w = canvasRect.width;
        const h = canvasRect.height;
        if (w === 0 || h === 0) return;

        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.setAttribute('width', String(w));
        svg.setAttribute('height', String(h));

        const getAnchor = (el) => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {
                left: r.left - canvasRect.left,
                right: r.right - canvasRect.left,
                top: r.top - canvasRect.top,
                bottom: r.bottom - canvasRect.top,
                cx: r.left - canvasRect.left + r.width / 2,
                cy: r.top - canvasRect.top + r.height / 2
            };
        };

        const paths = [];

        // 1. Trục chính uốn lượn: Root -> Station Hubs + Phase Milestones
        const trunkElements = [];
        const rootEl = canvasEl.querySelector('#rm-tree-root');
        if (rootEl) trunkElements.push(rootEl);

        const nodesInOrder = canvasEl.querySelectorAll('.rm-st-hub, .rm-st-phase-milestone');
        nodesInOrder.forEach(n => trunkElements.push(n));

        for (let i = 0; i < trunkElements.length - 1; i++) {
            const from = getAnchor(trunkElements[i]);
            const to = getAnchor(trunkElements[i + 1]);
            if (!from || !to) continue;

            const x1 = from.cx;
            const y1 = from.bottom;
            const x2 = to.cx;
            const y2 = to.top;
            const dy = Math.max(y2 - y1, 20);

            // Đường cong S mềm mại
            const d = `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.5}, ${x2} ${y2 - dy * 0.5}, ${x2} ${y2}`;
            paths.push(`<path d="${d}" class="rm-trunk-path" />`);
        }

        // 2. Nhánh nét đứt fanning out từ Hub sang các bài học con
        const rows = canvasEl.querySelectorAll('.rm-st-row');
        rows.forEach(row => {
            const hub = row.querySelector('.rm-st-hub');
            const cards = row.querySelectorAll('.rm-st-card');
            const hubA = getAnchor(hub);
            if (!hubA || !cards.length) return;

            const side = row.dataset.side;

            cards.forEach(card => {
                const cardA = getAnchor(card);
                if (!cardA) return;

                let x1, y1, x2, y2, cp1x, cp1y, cp2x, cp2y;

                if (side === 'right') {
                    // Hub bên phải, bài học bên trái: từ cạnh trái Hub sang cạnh phải Card
                    x1 = hubA.left;
                    y1 = hubA.cy;
                    x2 = cardA.right;
                    y2 = cardA.cy;
                    const dx = Math.max(Math.abs(x1 - x2), 20);
                    cp1x = x1 - dx * 0.45;
                    cp1y = y1;
                    cp2x = x2 + dx * 0.45;
                    cp2y = y2;
                } else {
                    // Hub bên trái, bài học bên phải: từ cạnh phải Hub sang cạnh trái Card
                    x1 = hubA.right;
                    y1 = hubA.cy;
                    x2 = cardA.left;
                    y2 = cardA.cy;
                    const dx = Math.max(Math.abs(x2 - x1), 20);
                    cp1x = x1 + dx * 0.45;
                    cp1y = y1;
                    cp2x = x2 - dx * 0.45;
                    cp2y = y2;
                }

                const cardCode = card.dataset.code || '';
                const d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
                paths.push(`<path d="${d}" class="rm-branch-path" data-for-card="${cardCode}" />`);
            });
        });

        svg.innerHTML = paths.join('');
    }

    /* ----------------------------------------------------------------------
       4. RENDER CHÍNH
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
                            <span class="rm-view-tab-text">Sơ đồ cây (Mindmap)</span>
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

        // Serpentine Tree Section
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
                <!-- 2. Chế độ xem Sơ đồ cây lượn sóng (Mindmap) -->
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
       5. SỰ KIỆN TƯƠNG TÁC
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

        // 2) Scroll timeline progress (View chi tiết)
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
        const canvasEl = root.querySelector('#rm-serpentine-canvas');

        let resizeTimer = null;
        const triggerDraw = () => {
            if (treeView && !treeView.hasAttribute('hidden') && canvasEl) {
                requestAnimationFrame(() => drawSerpentineConnections(canvasEl));
            }
        };

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
                typeset(treeView, triggerDraw);
                triggerDraw();
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

        // Tự động vẽ lại nhánh SVG khi co giãn màn hình hoặc canvas thay đổi
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(triggerDraw, 80);
        }, { passive: true });

        if (window.ResizeObserver && canvasEl) {
            const ro = new ResizeObserver(() => triggerDraw());
            ro.observe(canvasEl);
        }

        // Hiệu ứng tương tác: Rê chuột vào bài học con làm sáng nhánh nét đứt tương ứng
        if (canvasEl) {
            canvasEl.addEventListener('mouseenter', (e) => {
                const card = e.target.closest('.rm-st-card');
                if (!card) return;
                const code = card.dataset.code;
                const path = canvasEl.querySelector(`.rm-branch-path[data-for-card="${code}"]`);
                if (path) path.classList.add('is-hovered');
            }, true);

            canvasEl.addEventListener('mouseleave', (e) => {
                const card = e.target.closest('.rm-st-card');
                if (!card) return;
                const code = card.dataset.code;
                const path = canvasEl.querySelector(`.rm-branch-path[data-for-card="${code}"]`);
                if (path) path.classList.remove('is-hovered');
            }, true);
        }
    }

    function typeset(el, onDone) {
        const run = () => {
            if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
                if (typeof MathJax.typesetClear === 'function') MathJax.typesetClear([el]);
                MathJax.typesetPromise([el]).then(() => {
                    if (onDone) onDone();
                }).catch(() => {
                    if (onDone) onDone();
                });
            } else if (onDone) {
                onDone();
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

/* ==========================================================================
   SMP — ROADMAP RENDERER (Editorial Table of Contents & Timeline)
   Primary Design Reference: SMP Home (shared.css)
   - Ô có `url`  → thẻ bấm được (dùng class .card-link để PostViewer của
                   shared.js mở bài viết giống hệt các thẻ bài viết thông thường).
   - Ô không có `url` → hiển thị "Đang biên soạn".
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

    function render(container, data) {
        if (!container || !data) return;
        const stations = data.stations || [];
        const phases = data.phases || [];
        const phaseById = Object.fromEntries(phases.map(p => [p.id, p]));

        // --- 1. EDITORIAL HERO ---
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
            </header>`;

        // --- 2. MỤC LỤC CHUYÊN ĐỀ ---
        const tocHtml = renderTOC(phases, stations);

        // --- 3. DÒNG LỘ TRÌNH CHI TIẾT ---
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

        container.innerHTML = `
            <div class="rm-root">
                ${heroHtml}
                ${tocHtml}
                <div class="section-label rm-timeline-label"><span>Lộ Trình Học Tập</span></div>
                <div class="rm-timeline">
                    <div class="rm-spine" aria-hidden="true"></div>
                    <div class="rm-spine-fill" aria-hidden="true"></div>
                    ${timelineHtml}
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

        const update = () => {
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
                requestAnimationFrame(update);
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        update();
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

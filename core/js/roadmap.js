/* ==========================================================================
   SMP — ROADMAP RENDERER (Editorial / Mathematical Notes Style)
   Dùng:  SMPRoadmap.render(containerElement, window.SMP_ROADMAP_SOHOC)
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

    function renderArticle(st, tile, idx) {
        const code = `${st.label || st.id}.${idx + 1}`;
        const ready = !!tile.url;
        const count = tile.count ? `${tile.count} bài tập` : '';

        return `
            <article class="rm-article ${ready ? 'is-ready' : 'is-soon'}">
                <div class="rm-article-main">
                    <div class="rm-article-heading">
                        <span class="rm-article-code">${esc(code)}</span>
                        <h4 class="rm-article-title">
                            ${ready
                                ? `<a href="${esc(tile.url)}" class="card-link rm-article-link">${tile.title}</a>`
                                : `<span>${tile.title}</span>`
                            }
                        </h4>
                    </div>
                    ${tile.desc ? `<p class="rm-article-desc">${tile.desc}</p>` : ''}
                </div>

                <div class="rm-article-side">
                    ${ready
                        ? `
                            ${count ? `<span class="rm-article-count">${esc(count)}</span>` : ''}
                            <a href="${esc(tile.url)}" class="card-link rm-article-action" aria-label="Đọc bài: ${esc(tile.title.replace(/\$/g, ''))}">
                                <span>Đọc chuyên đề</span>
                                <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
                            </a>
                          `
                        : `
                            <span class="rm-article-pending">Đang biên soạn</span>
                          `
                    }
                </div>
            </article>
        `;
    }

    function renderStation(st) {
        const stats = stationStats(st);
        const label = st.label || pad(st.id);
        const complete = stats.ready === stats.total && stats.total > 0;
        const classes = ['rm-station'];
        if (stats.ready === 0) classes.push('is-empty');
        if (complete) classes.push('is-complete');

        return `
            <section class="${classes.join(' ')}" id="rm-station-${st.id}">
                <div class="rm-station-node" aria-hidden="true">
                    <span>${esc(label)}</span>
                </div>

                <div class="rm-station-body">
                    <header class="rm-station-head">
                        <div class="rm-station-title-row">
                            <h3 class="rm-station-title">
                                <span class="rm-station-num">${esc(label)}.</span>
                                ${st.title}
                            </h3>
                            ${st.formula ? `<div class="rm-station-formula" aria-label="Công thức đặc trưng">${st.formula}</div>` : ''}
                        </div>
                        ${st.desc ? `<p class="rm-station-desc">${st.desc}</p>` : ''}
                    </header>

                    <div class="rm-articles">
                        ${(st.tiles || []).map((t, i) => renderArticle(st, t, i)).join('')}
                    </div>
                </div>
            </section>
        `;
    }

    function render(container, data) {
        if (!container || !data) return;
        const stations = data.stations || [];
        const phases = data.phases || [];
        const phaseById = Object.fromEntries(phases.map(p => [p.id, p]));

        // Số liệu tổng quan
        let totalTiles = 0, readyTiles = 0;
        stations.forEach(st => (st.tiles || []).forEach(t => {
            totalTiles++;
            if (t.url) readyTiles++;
        }));
        const mainStations = stations.filter(s => !s.label).length;

        // 1. HERO & TABLE OF CONTENTS
        const hero = `
            <header class="rm-hero">
                <div class="rm-hero-meta">
                    <span class="rm-kicker">Chuyên Đề Olympic · VMO</span>
                    <a href="/pages/toanhoc.html?filter=vmo&sub=so-hoc" class="rm-alt-link" title="Chuyển sang chế độ xem danh sách thẻ bài viết">
                        <span>Danh sách bài viết</span>
                        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
                    </a>
                </div>

                <h1 class="rm-title">${esc(data.title || 'Lộ Trình Số Học Olympic')}</h1>

                ${data.subtitle ? `<p class="rm-subtitle">${data.subtitle}</p>` : ''}

                <div class="rm-hero-details">
                    <span>${mainStations} Chuyên đề cốt lõi</span>
                    <span class="rm-dot" aria-hidden="true">·</span>
                    <span>${phases.length} Giai đoạn</span>
                    <span class="rm-dot" aria-hidden="true">·</span>
                    <span>1 Tuyển tập tổng hợp</span>
                    <span class="rm-dot" aria-hidden="true">·</span>
                    <span class="rm-hero-count">Đã hoàn thiện ${readyTiles}/${totalTiles} chuyên đề</span>
                </div>

                <!-- MỤC LỤC CHUYÊN ĐỀ (Table of Contents) -->
                <nav class="rm-toc" aria-label="Mục lục chuyên đề">
                    <div class="rm-toc-head">
                        <span class="rm-toc-caption">MỤC LỤC CHUYÊN ĐỀ</span>
                        <span class="rm-toc-meta">${mainStations} chuyên đề · Tuyển chọn VMO 2026–2027</span>
                    </div>

                    <div class="rm-toc-grid">
                        ${stations.map(st => {
                            const stats = stationStats(st);
                            const num = st.label || pad(st.id);
                            const statusText = stats.ready === 0 ? 'Đang biên soạn' : `${stats.ready} bài`;
                            const isSoon = stats.ready === 0;

                            return `
                                <a href="#rm-station-${st.id}" class="rm-toc-row ${isSoon ? 'is-soon' : ''}" data-target="rm-station-${st.id}">
                                    <span class="rm-toc-num">${esc(num)}</span>
                                    <span class="rm-toc-title">${esc(st.title.replace(/\$/g, ''))}</span>
                                    <span class="rm-toc-leader" aria-hidden="true"></span>
                                    <span class="rm-toc-status">${esc(statusText)}</span>
                                </a>
                            `;
                        }).join('')}
                    </div>
                </nav>
            </header>
        `;

        // 2. TIMELINE NỘI DUNG CÁC GIAI ĐOẠN & CHUYÊN ĐỀ
        let timelineContent = '';
        let lastPhase = null;

        stations.forEach(st => {
            const ph = phaseById[st.phase] || { id: st.phase, name: '' };
            if (st.phase !== lastPhase) {
                const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][(ph.id || 1) - 1] || ph.id;
                timelineContent += `
                    <div class="rm-phase">
                        <div class="rm-phase-tag">GIAI ĐOẠN ${roman}</div>
                        <h2 class="rm-phase-name">${esc(ph.name)}</h2>
                        ${ph.desc ? `<p class="rm-phase-desc">${esc(ph.desc)}</p>` : ''}
                    </div>
                `;
                lastPhase = st.phase;
            }
            timelineContent += renderStation(st);
        });

        // 3. COLOPHON (Lời kết & Danh ngôn)
        const colophon = `
            <footer class="rm-colophon">
                <div class="rm-colophon-rule" aria-hidden="true">
                    <span class="rm-colophon-mark">§</span>
                </div>
                <blockquote class="rm-quote">
                    <p>“Toán học là nữ hoàng của các ngành khoa học, và Số học là nữ hoàng của Toán học.”</p>
                    <cite>— Carl Friedrich Gauss —</cite>
                </blockquote>
                <div class="rm-colophon-info">
                    <span>Ban Biên Tập Chuyên Đề Số Học · Secrets of Mathematical Principles</span>
                    <small>Các chuyên đề đang biên soạn sẽ được cập nhật liên tục theo kế hoạch ôn tập</small>
                </div>
            </footer>
        `;

        container.innerHTML = `
            <div class="rm-root">
                ${hero}
                <div class="rm-timeline">
                    <div class="rm-spine" aria-hidden="true"></div>
                    <div class="rm-spine-progress" aria-hidden="true"></div>
                    ${timelineContent}
                </div>
                ${colophon}
            </div>
        `;

        bind(container);
        typeset(container);
    }

    // ---------------------------------------------------------------------
    // TƯƠNG TÁC: Cuộn mượt Mục lục, chỉ báo thanh tiến trình
    // ---------------------------------------------------------------------
    function bind(container) {
        const root = container.querySelector('.rm-root');
        if (!root) return;

        // 1. Cuộn mượt khi click vào Mục lục
        root.querySelectorAll('.rm-toc-row').forEach(row => {
            row.addEventListener('click', (e) => {
                const targetId = row.dataset.target;
                const target = document.getElementById(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // 2. Click toàn bộ bài viết để mở bài (nếu có link)
        root.querySelectorAll('.rm-article.is-ready').forEach(article => {
            article.addEventListener('click', (e) => {
                if (e.target.closest('a')) return;
                const link = article.querySelector('.rm-article-link');
                if (link) link.click();
            });
        });

        // 3. Đường chỉ báo tiến trình cuộn dọc
        const timeline = root.querySelector('.rm-timeline');
        const spineProgress = root.querySelector('.rm-spine-progress');
        const stationEls = Array.from(root.querySelectorAll('.rm-station'));
        let ticking = false;

        const updateScroll = () => {
            ticking = false;
            if (!timeline || !timeline.offsetParent) return;

            const rect = timeline.getBoundingClientRect();
            const anchor = window.innerHeight * 0.45;
            const h = rect.height;
            const progress = Math.min(Math.max(anchor - rect.top, 0), h);

            if (spineProgress) {
                spineProgress.style.height = progress + 'px';
            }

            stationEls.forEach(s => {
                const top = s.getBoundingClientRect().top;
                s.classList.toggle('is-passed', top < anchor);
            });
        };

        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(updateScroll);
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        updateScroll();
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

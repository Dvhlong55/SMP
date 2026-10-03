/* ==========================================================================
   SMP — ROADMAP RENDERER
   Dùng:  SMPRoadmap.render(containerElement, window.SMP_ROADMAP_SOHOC)
   - Ô có `url`  → thẻ bấm được (dùng class .card-link để PostViewer của
                   shared.js mở bài viết giống hệt các thẻ bài viết thông thường).
   - Ô không có `url` → hiển thị "Đang cập nhật".
   ========================================================================== */
(function () {
    'use strict';

    // Dải màu của lộ trình: cyan → xanh → tím → hồng → cam → vàng
    const HUE_START = 188;
    const HUE_END = 400; // 400 ≡ 40 (vàng gold)

    const esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const pad = (n) => String(n).padStart(2, '0');

    const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

    function stationStats(st) {
        const total = st.tiles.length;
        const ready = st.tiles.filter(t => !!t.url).length;
        return { total, ready, ratio: total ? ready / total : 0 };
    }

    function statusOf(stats) {
        if (stats.ready === 0) return { text: 'Đang cập nhật', soon: true };
        if (stats.ready === stats.total) return { text: 'Đã hoàn thiện', soon: false };
        return { text: 'Đang bổ sung', soon: false };
    }

    function renderTile(st, tile, idx) {
        const code = `${st.label || st.id}.${idx + 1}`;
        const ready = !!tile.url;
        const kind = tile.kind ? `<span class="rm-kind">${esc(tile.kind)}</span>` : '';
        const count = tile.count ? `<span class="rm-count">${tile.count} bài</span>` : '<span class="rm-count"></span>';

        const foot = ready
            ? `${count}<a href="${esc(tile.url)}" class="card-link rm-tile-link" aria-label="Đọc bài: ${esc(tile.title.replace(/\$/g, ''))}">Đọc bài</a>`
            : `<span class="rm-soon-badge">Đang cập nhật</span>`;

        return `
            <article class="rm-tile rm-reveal ${ready ? 'is-ready' : 'is-soon'}" ${ready ? '' : 'aria-disabled="true"'}>
                <div class="rm-tile-top">
                    <span class="rm-tile-code">${esc(code)}</span>
                    ${kind}
                </div>
                <h4>${tile.title}</h4>
                <p>${tile.desc || ''}</p>
                <div class="rm-tile-foot">${foot}</div>
            </article>`;
    }

    function renderStation(st, hue, phaseName) {
        const stats = stationStats(st);
        const status = statusOf(stats);
        const label = st.label || pad(st.id);
        const complete = stats.ready === stats.total && stats.total > 0;
        const classes = ['rm-station'];
        if (stats.ready === 0) classes.push('is-empty');
        if (complete) classes.push('is-complete');

        return `
            <section class="${classes.join(' ')}" id="rm-station-${st.id}" style="--h:${hue}">
                <div class="rm-node" aria-hidden="true">${esc(label)}${complete ? ICON_CHECK : ''}</div>
                <header class="rm-head rm-reveal">
                    <div class="rm-head-top">
                        <span class="rm-head-code">${st.label ? 'Chặng cuối' : 'Chặng ' + pad(st.id)} · ${esc(phaseName)}</span>
                        <span class="rm-status ${status.soon ? 'is-soon' : ''}">${status.text}</span>
                    </div>
                    <h3>${st.title}</h3>
                    <p>${st.desc || ''}</p>
                    <div class="rm-progress">
                        <div class="rm-progress-bar"><span data-w="${Math.round(stats.ratio * 100)}"></span></div>
                        <small>${stats.ready}/${stats.total} bài đã có</small>
                    </div>
                </header>
                <div class="rm-tiles">
                    ${st.tiles.map((t, i) => renderTile(st, t, i)).join('')}
                </div>
            </section>`;
    }

    function render(container, data) {
        if (!container || !data) return;
        const stations = data.stations || [];
        const phases = data.phases || [];
        const phaseById = Object.fromEntries(phases.map(p => [p.id, p]));

        // Tổng hợp số liệu
        let totalTiles = 0, readyTiles = 0, problemCount = 0;
        stations.forEach(st => st.tiles.forEach(t => {
            totalTiles++;
            if (t.url) { readyTiles++; problemCount += (t.count || 0); }
        }));
        const pct = totalTiles ? Math.round(readyTiles / totalTiles * 100) : 0;
        const soonTiles = totalTiles - readyTiles;
        const mainStations = stations.filter(s => !s.label).length;

        const hueOf = (i) => {
            const n = Math.max(stations.length - 1, 1);
            return Math.round(HUE_START + (HUE_END - HUE_START) * (i / n)) % 360;
        };

        // --- HERO ---
        const R = 54, C = 2 * Math.PI * R;
        const hero = `
            <div class="rm-hero rm-reveal">
                <div class="rm-hero-deco" aria-hidden="true">
                    <span>a ≡ b (mod n)</span><span>φ(n)</span><span>v<sub>p</sub></span><span>(a/p)</span>
                </div>
                <div class="rm-hero-inner">
                    <div class="rm-hero-text">
                        <div class="rm-kicker">VMO · Số Học</div>
                        <h2 class="rm-title">${esc(data.title || 'Lộ trình')}</h2>
                        <p class="rm-subtitle">${data.subtitle || ''}</p>
                    </div>
                    <div class="rm-ring" role="img" aria-label="Đã có ${readyTiles}/${totalTiles} chủ đề">
                        <svg viewBox="0 0 132 132">
                            <defs>
                                <linearGradient id="rmRingGrad" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stop-color="hsl(188 80% 50%)"/>
                                    <stop offset="55%" stop-color="hsl(270 75% 62%)"/>
                                    <stop offset="100%" stop-color="hsl(40 90% 55%)"/>
                                </linearGradient>
                            </defs>
                            <circle class="rm-ring-track" cx="66" cy="66" r="${R}"/>
                            <circle class="rm-ring-bar" cx="66" cy="66" r="${R}"
                                stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${C.toFixed(2)}"
                                data-target="${(C * (1 - pct / 100)).toFixed(2)}"/>
                        </svg>
                        <div class="rm-ring-label"><b>${pct}%</b><small>hoàn thiện</small></div>
                    </div>
                </div>
                <div class="rm-stats">
                    <span class="rm-stat"><b>${mainStations}</b> chuyên đề</span>
                    <span class="rm-stat"><i></i><b>${readyTiles}</b> bài viết đã có</span>
                    <span class="rm-stat is-soon"><i></i><b>${soonTiles}</b> chủ đề đang cập nhật</span>
                    ${problemCount ? `<span class="rm-stat"><b>${problemCount}+</b> bài tập</span>` : ''}
                </div>
                <nav class="rm-index" aria-label="Mục lục lộ trình">
                    ${stations.map((st, i) => {
                        const s = stationStats(st);
                        return `<button type="button" class="rm-index-chip ${s.ready === 0 ? 'is-empty' : ''}" style="--h:${hueOf(i)}" data-target="rm-station-${st.id}">
                                    <span>${esc(st.label || st.id)}</span>${st.title}
                                </button>`;
                    }).join('')}
                </nav>
            </div>`;

        // --- TRACK ---
        let track = '';
        let lastPhase = null;
        stations.forEach((st, i) => {
            const ph = phaseById[st.phase] || { id: st.phase, name: '' };
            if (st.phase !== lastPhase) {
                const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][(ph.id || 1) - 1] || ph.id;
                track += `
                    <div class="rm-phase rm-reveal">
                        <span class="rm-phase-dot" aria-hidden="true"></span>
                        <span class="rm-phase-label">Giai đoạn ${roman} · ${esc(ph.name)}</span>
                        ${ph.desc ? `<span class="rm-phase-desc">${esc(ph.desc)}</span>` : ''}
                    </div>`;
                lastPhase = st.phase;
            }
            track += renderStation(st, hueOf(i), ph.name);
        });

        container.innerHTML = `
            <div class="rm-root">
                ${hero}
                <div class="rm-track">
                    <div class="rm-spine" aria-hidden="true"></div>
                    <div class="rm-spine-fill" aria-hidden="true"></div>
                    ${track}
                </div>
                <div class="rm-finish rm-reveal">
                    “Học Số học như leo núi — mỗi chặng là một tầm nhìn mới.”
                    <small>Các ô viền nét đứt sẽ sớm được cập nhật</small>
                </div>
            </div>`;

        bind(container);
        typeset(container);
    }

    // ---------------------------------------------------------------------
    // Tương tác: hiệu ứng xuất hiện, đường tiến trình theo cuộn, đốm sáng, mục lục
    // ---------------------------------------------------------------------
    function bind(container) {
        const root = container.querySelector('.rm-root');
        if (!root) return;

        // 1) Hiện dần khi cuộn tới
        const revealEls = root.querySelectorAll('.rm-reveal');
        const onIn = (el) => {
            el.classList.add('is-in');
            el.querySelectorAll('.rm-progress-bar span').forEach(b => { b.style.width = b.dataset.w + '%'; });
            el.querySelectorAll('.rm-ring-bar').forEach(c => { c.style.strokeDashoffset = c.dataset.target; });
        };
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach(e => { if (e.isIntersecting) { onIn(e.target); io.unobserve(e.target); } });
            }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
            revealEls.forEach(el => io.observe(el));
        } else {
            revealEls.forEach(onIn);
        }

        // 2) Đường lộ trình "chạy" theo vị trí cuộn + đánh dấu các chặng đã qua
        const track = root.querySelector('.rm-track');
        const fill = root.querySelector('.rm-spine-fill');
        const stationEls = Array.from(root.querySelectorAll('.rm-station'));
        let ticking = false;
        const update = () => {
            ticking = false;
            if (!track.offsetParent) return; // đang bị ẩn
            const rect = track.getBoundingClientRect();
            const anchor = window.innerHeight * 0.55;
            const h = rect.height;
            track.style.setProperty('--rm-track-h', h + 'px');
            const progress = Math.min(Math.max(anchor - rect.top, 0), h);
            fill.style.height = progress + 'px';
            stationEls.forEach(s => {
                const node = s.querySelector('.rm-node');
                const top = node.getBoundingClientRect().top + node.offsetHeight / 2;
                s.classList.toggle('is-passed', top < anchor);
            });
        };
        const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
        document.addEventListener('scroll', onScroll, { passive: true, capture: true });
        window.addEventListener('resize', onScroll, { passive: true });
        root._rmUpdate = update;
        update();

        // 3) Đốm sáng theo con trỏ trên ô
        root.addEventListener('pointermove', (e) => {
            const tile = e.target.closest('.rm-tile.is-ready');
            if (!tile) return;
            const r = tile.getBoundingClientRect();
            tile.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            tile.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });

        // 4) Mục lục: cuộn mượt tới chặng
        root.querySelectorAll('.rm-index-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const target = document.getElementById(chip.dataset.target);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
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
            // MathJax chưa tải xong: thử lại sau, khi tải xong MathJax cũng tự typeset toàn trang
            window.addEventListener('load', run, { once: true });
        }
    }

    // Gọi lại khi container vừa được hiện ra (ví dụ chuyển tab)
    function refresh(container) {
        const root = container && container.querySelector('.rm-root');
        if (root && root._rmUpdate) root._rmUpdate();
    }

    window.SMPRoadmap = { render, refresh };
})();

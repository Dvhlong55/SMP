// ============================================================================
//  ROAD2VMO TEST — EXAM ROOM ENGINE (SMP-MATH)
// ============================================================================
(function () {
    const EXAMS = window.ROAD2VMO_EXAMS || {};
    const params = new URLSearchParams(window.location.search);

    const currentRound = EXAMS[params.get("test")] ? params.get("test") : "1";
    const sessionParam = params.get("session") || params.get("day");
    const currentSession = (sessionParam === "afternoon" || sessionParam === "2") ? "afternoon" : "morning";
    const FIXED_DURATION_MIN = 180; // Chuẩn VMO: luôn 180 phút (3 tiếng) mỗi ngày
    let currentMode = "strict";
    let soundEnabled = true;
    let paperFontRem = 1.04;
    let tickInterval = null;
    let uploadInterval = null;
    let authPollInterval = null;
    let firedCues = { m60: false, m15: false, m0: false };

    const root = document.getElementById("r2v-app");
    if (!root) return;

    function getAuthUser() {
        const token = localStorage.getItem("smp_access_token");
        const username = localStorage.getItem("smp_username");
        if (token && username && username.trim()) {
            return { token, username: username.trim() };
        }
        return null;
    }

    function stateKey(sessionOverride) {
        const s = sessionOverride || currentSession;
        return `smp_r2v_state_r${currentRound}_${s}`;
    }

    function loadState(sessionOverride) {
        try {
            const raw = localStorage.getItem(stateKey(sessionOverride));
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function saveState(st) {
        try {
            localStorage.setItem(stateKey(), JSON.stringify(st));
        } catch (e) {}
    }

    function clearState() {
        try {
            localStorage.removeItem(stateKey());
        } catch (e) {}
    }

    function isBothDaysFinished() {
        const m = loadState("morning");
        const a = loadState("afternoon");
        return Boolean(m && m.phase === "finished" && a && a.phase === "finished");
    }

    function enterFullscreen() {
        try {
            const el = document.documentElement;
            if (el.requestFullscreen) {
                el.requestFullscreen().catch(() => {});
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            } else if (el.msRequestFullscreen) {
                el.msRequestFullscreen();
            }
        } catch (e) {}
    }

    function exitFullscreenIfActive() {
        try {
            if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        } catch (e) {}
    }

    function formatHMS(totalSec) {
        const s = Math.max(0, Math.floor(totalSec));
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return [h, m, sec].map(v => String(v).padStart(2, "0")).join(":");
    }

    function playChime(freq = 880, count = 1) {
        if (!soundEnabled) return;
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            for (let i = 0; i < count; i++) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.value = freq;
                const t0 = ctx.currentTime + i * 0.28;
                gain.gain.setValueAtTime(0.001, t0);
                gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t0);
                osc.stop(t0 + 0.46);
            }
        } catch (e) {}
    }

    function typesetMath(el) {
        if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
            window.MathJax.typesetPromise(el ? [el] : undefined).then(() => {
                if (typeof window.fixMathJaxOverflow === "function") {
                    window.fixMathJaxOverflow();
                }
            }).catch(() => {});
        }
    }

    function stopTimers() {
        if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
        if (uploadInterval) { clearInterval(uploadInterval); uploadInterval = null; }
        if (authPollInterval) { clearInterval(authPollInterval); authPollInterval = null; }
    }

    const BELL_ON_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="M4 2C2.8 3.7 2 5.7 2 8"/><path d="M22 8c0-2.3-.8-4.3-2-6"/></svg>`;
    const BELL_OFF_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5"/><path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><line x1="2" y1="2" x2="22" y2="22"/></svg>`;

    function renderTopNav() {
        return `
        <div class="r2v-topbar-strip">
            <a class="r2v-back-link" href="/posts/math/vmo/road2vmo-test.html">&larr; Về bài giới thiệu Road2VMO Test</a>
        </div>`;
    }

    // ========================================================================
    //  CỔNG YÊU CẦU ĐĂNG NHẬP TÀI KHOẢN SMP
    // ========================================================================
    function renderAuthGate() {
        document.body.classList.remove("r2v-exam-active");
        stopTimers();
        const exam = EXAMS[currentRound];
        const sess = exam.sessions[currentSession];

        root.innerHTML = `
        ${renderTopNav()}
        <div class="r2v-card fade-up" style="max-width: 620px; margin: 18px auto; text-align: center;">
            <span class="r2v-badge-gold">Yêu Cầu Tài Khoản SMP</span>
            <h1 class="r2v-lobby-title" style="font-size: 1.7rem;">${exam.title} &bull; ${sess.label}</h1>
            <p style="font-size: 0.95rem; line-height: 1.7; opacity: 0.88; margin: 12px 0 22px;">
                Vui lòng đăng nhập hoặc đăng ký tài khoản SMP để vào phòng chờ thi thử và tự động cấp Giấy chứng nhận (Certificate) theo tài khoản của bạn.
            </p>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center;">
                <button type="button" class="r2v-btn-primary" id="r2v-login-btn">Đăng nhập tài khoản SMP</button>
                <button type="button" class="r2v-btn-gold" id="r2v-register-btn">Đăng ký tài khoản mới</button>
            </div>
        </div>`;

        document.getElementById("r2v-login-btn").addEventListener("click", () => {
            if (window.openAuthModal) window.openAuthModal("login");
        });
        document.getElementById("r2v-register-btn").addEventListener("click", () => {
            if (window.openAuthModal) window.openAuthModal("register");
        });

        authPollInterval = setInterval(() => {
            if (getAuthUser()) {
                boot();
            }
        }, 600);
    }

    // ========================================================================
    //  GIAI ĐOẠN 1: SẢNH CHỜ (PRE-EXAM LOBBY)
    // ========================================================================
    function renderLobby(user) {
        document.body.classList.remove("r2v-exam-active");
        stopTimers();
        const exam = EXAMS[currentRound];
        const sess = exam.sessions[currentSession];

        root.innerHTML = `
        ${renderTopNav()}
        <div class="r2v-card fade-up">
            <div class="r2v-lobby-header">
                <span class="r2v-badge-gold">Phòng Thi Thử VMO Trực Tuyến</span>
                <h1 class="r2v-lobby-title">${exam.title}</h1>
                <div style="opacity: 0.85; font-size: 0.96rem;">${sess.label} &bull; 180 phút &bull; Thí sinh: <b>${user.username}</b></div>
            </div>

            <div class="r2v-option-group" style="max-width: 560px; margin: 0 auto 24px;">
                <h4>Chọn Chế Độ Giám Thị</h4>
                <button type="button" class="r2v-choice-card ${currentMode === "strict" ? "selected" : ""}" data-select-mode="strict">
                    <div class="r2v-choice-title">Thi thật (Strict Mode — 180 phút)</div>
                    <div class="r2v-choice-desc">Đếm ngược từ 03:00:00, tự động phóng toàn màn hình và lưu mốc giờ vào trình duyệt (F5 không bị mất giờ).</div>
                </button>
                <button type="button" class="r2v-choice-card ${currentMode === "stopwatch" ? "selected" : ""}" data-select-mode="stopwatch">
                    <div class="r2v-choice-title">Tự luyện (Stopwatch Mode)</div>
                    <div class="r2v-choice-desc">Đồng hồ bấm giờ đếm xuôi từ 00:00:00 để tự đo tốc độ giải từng bài.</div>
                </button>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 12px;">
                <button type="button" class="r2v-btn-primary" id="r2v-start-btn">
                    Bắt đầu tính giờ &amp; Mở đề (${sess.label})
                </button>
            </div>
        </div>`;

        root.querySelectorAll("[data-select-mode]").forEach(btn => {
            btn.addEventListener("click", () => {
                currentMode = btn.getAttribute("data-select-mode");
                renderLobby(user);
            });
        });
        document.getElementById("r2v-start-btn").addEventListener("click", () => {
            enterFullscreen();
            const st = {
                phase: "active",
                mode: currentMode,
                durationSec: FIXED_DURATION_MIN * 60,
                startTime: Date.now(),
                finishedAt: null
            };
            firedCues = { m60: false, m15: false, m0: false };
            saveState(st);
            playChime(784, 1);
            renderActiveExam(st, user);
        });
    }

    // ========================================================================
    //  GIAI ĐOẠN 2: PHÒNG THI TRỰC TUYẾN (ACTIVE EXAM ROOM)
    // ========================================================================
    function renderActiveExam(st, user) {
        document.body.classList.add("r2v-exam-active");
        stopTimers();
        const exam = EXAMS[currentRound];
        const sess = exam.sessions[currentSession];

        root.innerHTML = `
        <div class="r2v-exam-layout fade-up">
            <div class="r2v-card" id="r2v-paper-card" style="font-size: ${paperFontRem}rem;">
                <div class="r2v-exam-toolbar">
                    <div>
                        <span class="r2v-badge-gold" style="margin-bottom: 4px;">${exam.title} &bull; ${sess.label}</span>
                        <div class="r2v-jump-list" style="margin-top: 6px;">
                            ${sess.problems.map((p, i) => `
                                <button type="button" class="r2v-mini-btn" data-jump="r2v-prob-${i}">${p.code}</button>
                            `).join("")}
                        </div>
                    </div>
                    <div class="r2v-font-controls">
                        <span style="font-size: 0.78rem; opacity: 0.7;">Cỡ chữ:</span>
                        <button type="button" class="r2v-mini-btn" id="r2v-font-dec">A-</button>
                        <button type="button" class="r2v-mini-btn" id="r2v-font-inc">A+</button>
                    </div>
                </div>

                ${sess.problems.map((p, i) => `
                    <div class="r2v-problem-block" id="r2v-prob-${i}">
                        <h3 class="smp-problem-header" style="margin-top: 4px !important;">
                            <span class="smp-problem-badge">${p.code}</span>
                            <span style="font-size: 0.85rem; opacity: 0.75;">(${p.maxScore},0 điểm)</span>
                        </h3>
                        <p>${p.statement}</p>
                    </div>
                `).join("")}
            </div>

            <aside class="r2v-card r2v-proctor-panel">
                <div style="display: flex; justify-content: flex-end; margin-bottom: 4px;">
                    <button type="button" class="r2v-mini-btn" id="r2v-sound-toggle" title="${soundEnabled ? "Tắt chuông báo mốc giờ" : "Bật chuông báo mốc giờ"}" aria-label="Chuông báo mốc giờ" style="display: inline-flex; align-items: center; justify-content: center; padding: 6px 8px;">
                        ${soundEnabled ? BELL_ON_SVG : BELL_OFF_SVG}
                    </button>
                </div>
                <div class="r2v-timer-display" id="r2v-clock" style="margin-top: 4px;">--:--:--</div>

                <button type="button" class="r2v-btn-danger" id="r2v-finish-btn">
                    Kết thúc &amp; Nộp bài
                </button>
            </aside>
        </div>`;

        typesetMath(document.getElementById("r2v-paper-card"));

        root.querySelectorAll("[data-jump]").forEach(btn => {
            btn.addEventListener("click", () => {
                const target = document.getElementById(btn.getAttribute("data-jump"));
                if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });

        document.getElementById("r2v-font-dec").addEventListener("click", () => {
            paperFontRem = Math.max(0.86, +(paperFontRem - 0.06).toFixed(2));
            document.getElementById("r2v-paper-card").style.fontSize = paperFontRem + "rem";
        });
        document.getElementById("r2v-font-inc").addEventListener("click", () => {
            paperFontRem = Math.min(1.36, +(paperFontRem + 0.06).toFixed(2));
            document.getElementById("r2v-paper-card").style.fontSize = paperFontRem + "rem";
        });
        document.getElementById("r2v-sound-toggle").addEventListener("click", (e) => {
            soundEnabled = !soundEnabled;
            const btn = e.currentTarget;
            btn.innerHTML = soundEnabled ? BELL_ON_SVG : BELL_OFF_SVG;
            btn.title = soundEnabled ? "Tắt chuông báo mốc giờ" : "Bật chuông báo mốc giờ";
        });
        document.getElementById("r2v-finish-btn").addEventListener("click", () => {
            if (confirm("Xác nhận kết thúc giờ làm bài và chuyển sang cổng nộp bài & Certificate?")) {
                exitFullscreenIfActive();
                st.phase = "finished";
                st.finishedAt = Date.now();
                saveState(st);
                playChime(1046, 2);
                renderPostHub(st, user);
            }
        });

        function updateClock() {
            const elapsed = Math.floor((Date.now() - st.startTime) / 1000);
            const clockEl = document.getElementById("r2v-clock");
            if (!clockEl) return;

            if (st.mode === "strict") {
                const rem = st.durationSec - elapsed;
                clockEl.textContent = formatHMS(rem);
                clockEl.classList.remove("warning", "danger");
                if (rem <= 900 && rem > 0) {
                    clockEl.classList.add("danger");
                    if (!firedCues.m15) { firedCues.m15 = true; playChime(880, 2); }
                } else if (rem <= 3600 && rem > 900) {
                    clockEl.classList.add("warning");
                    if (!firedCues.m60) { firedCues.m60 = true; playChime(660, 1); }
                }
                if (rem <= 0) {
                    if (!firedCues.m0) { firedCues.m0 = true; playChime(1046, 3); }
                    exitFullscreenIfActive();
                    st.phase = "finished";
                    st.finishedAt = Date.now();
                    saveState(st);
                    renderPostHub(st, user);
                }
            } else {
                clockEl.textContent = formatHMS(elapsed);
            }
        }
        updateClock();
        tickInterval = setInterval(updateClock, 1000);
    }

    // ========================================================================
    //  GIAI ĐOẠN 3: MÀN HÌNH SAU GIỜ THI (CLASSROOM + BAREM + CERTIFICATE)
    // ========================================================================
    function renderPostHub(st, user) {
        document.body.classList.remove("r2v-exam-active");
        stopTimers();
        const exam = EXAMS[currentRound];
        const sess = exam.sessions[currentSession];
        const maxTotal = sess.problems.reduce((s, p) => s + p.maxScore, 0);
        const bothDone = isBothDaysFinished();
        const otherSession = currentSession === "morning" ? "afternoon" : "morning";
        const otherLabel = otherSession === "morning" ? "Ngày 1" : "Ngày 2";

        root.innerHTML = `
        ${renderTopNav()}
        <div class="r2v-hub-grid fade-up">
            <!-- KHỐI 1: CỔNG NỘP BÀI CLASSROOM -->
            <div class="r2v-card" style="margin-bottom: 0;">
                <span class="r2v-badge-gold">Bước 1 &bull; Nộp Bài</span>
                <h2 style="margin: 6px 0 10px; font-size: 1.35rem;">Cổng Nộp Bài Google Classroom</h2>
                <p style="font-size: 0.92rem; line-height: 1.65; opacity: 0.9;">
                    Chụp ảnh hoặc scan bài làm thành file PDF và nộp tại cổng Classroom của <b>${exam.title}</b>.
                </p>
                <div style="padding: 10px 14px; border-radius: 8px; background: rgba(92, 225, 230, 0.08); border: 1px solid rgba(92, 225, 230, 0.25); margin: 12px 0; font-family: 'JetBrains Mono', monospace; font-size: 0.82rem;">
                    Thời gian scan &amp; nộp bài còn lại: <b id="r2v-upload-clock" style="color: #f0c040; font-size: 1rem;">15:00</b><br>
                    Tên file: <code>${exam.fileNamingRule}</code>
                </div>
                <div style="margin-top: 14px;">
                    <a href="${exam.classroomUrl}" target="_blank" rel="noopener noreferrer" class="r2v-btn-primary">
                        Mở Google Classroom (${exam.title}) &rarr;
                    </a>
                </div>
            </div>

            <!-- KHỐI 2: BAREM & TỰ CHẤM ĐIỂM -->
            <div class="r2v-card" style="margin-bottom: 0;">
                <span class="r2v-badge-gold">Bước 2 &bull; Đáp án &amp; Tự chấm</span>
                <h2 style="margin: 6px 0 10px; font-size: 1.35rem;">Barem Chấm Điểm (${sess.label})</h2>
                ${exam.isSolutionPublished ? `
                    <div id="r2v-rubric-box">
                        ${sess.problems.map((p) => `
                            <div style="margin-bottom: 12px;">
                                <div style="font-weight: 700; font-size: 0.92rem; margin-bottom: 4px; color: var(--accent-cyan);">${p.code} (${p.maxScore},0 điểm)</div>
                                ${p.rubric.map((r) => `
                                    <label class="r2v-rubric-item">
                                        <span><input type="checkbox" class="r2v-rubric-cb" data-pts="${r.points}" style="margin-right: 8px;">${r.step}</span>
                                        <span class="r2v-rubric-score">+${r.points.toFixed(1)}đ</span>
                                    </label>
                                `).join("")}
                            </div>
                        `).join("")}
                        <div style="margin-top: 12px; padding: 12px 14px; border-radius: 8px; background: rgba(240, 192, 64, 0.12); border: 1px solid rgba(240, 192, 64, 0.4); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                            <span>Tổng điểm tự chấm: <b id="r2v-total-score" style="font-size: 1.15rem; color: #f0c040;">0.0 / ${maxTotal}.0</b></span>
                            <span id="r2v-award-est" style="font-size: 0.82rem; font-family: 'JetBrains Mono', monospace;">Chưa tích điểm</span>
                        </div>
                        ${sess.solutionPdfUrl ? `<div style="margin-top: 12px;"><a href="${sess.solutionPdfUrl}" target="_blank" class="r2v-btn-gold">Tải PDF Lời giải chi tiết</a></div>` : ""}
                    </div>
                ` : `
                    <div class="r2v-locked-box">
                        <div style="font-weight: 700; margin-bottom: 6px;">&#x1F512; Barem &amp; Đáp án đang tạm khóa</div>
                        <div>${exam.solutionReleaseNote}</div>
                    </div>
                `}
            </div>
        </div>

        <!-- KHỐI 3: CERTIFICATE ĐIỆN TỬ (CHỈ TRAO KHI HOÀN THÀNH CẢ 2 NGÀY) -->
        <div class="r2v-card fade-up" id="r2v-cert-card">
            <span class="r2v-badge-gold">Bước 3 &bull; Certificate</span>
            <h2 style="margin: 6px 0 10px; font-size: 1.45rem;">Certificate — ${exam.title}</h2>
            ${bothDone ? `
                <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <div style="font-size: 0.92rem; opacity: 0.88;">
                        Thí sinh: <b>${user.username}</b> &bull; Đã hoàn thành cả Ngày 1 &amp; Ngày 2
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        <button type="button" class="r2v-btn-primary" id="r2v-download-cert-btn">Tải Certificate (PNG)</button>
                        <button type="button" class="r2v-btn-gold" id="r2v-print-cert-btn">In / Lưu PDF</button>
                    </div>
                </div>
                <div class="r2v-cert-canvas-wrap">
                    <canvas id="r2v-cert-canvas" width="1600" height="1130"></canvas>
                </div>
            ` : `
                <div class="r2v-locked-box">
                    <div style="font-weight: 700; margin-bottom: 6px;">&#x1F512; Certificate chỉ được cấp khi hoàn thành cả 2 ngày thi</div>
                    <div>Bạn đã hoàn thành <b>${sess.label}</b>. Vui lòng hoàn thành nốt <b>${otherLabel}</b> của ${exam.title} để mở khóa Certificate.</div>
                    <div style="margin-top: 12px;">
                        <a href="/pages/road2vmo-exam.html?test=${currentRound}&amp;session=${otherSession}" class="r2v-btn-primary">
                            Vào phòng thi ${otherLabel} (${exam.title}) &rarr;
                        </a>
                    </div>
                </div>
            `}
        </div>`;

        const uploadEnd = (st.finishedAt || Date.now()) + 15 * 60 * 1000;
        function updateUploadClock() {
            const el = document.getElementById("r2v-upload-clock");
            if (!el) return;
            const rem = Math.max(0, Math.floor((uploadEnd - Date.now()) / 1000));
            const mm = String(Math.floor(rem / 60)).padStart(2, "0");
            const ss = String(rem % 60).padStart(2, "0");
            el.textContent = `${mm}:${ss}`;
        }
        updateUploadClock();
        uploadInterval = setInterval(updateUploadClock, 1000);

        if (exam.isSolutionPublished) {
            const cbs = root.querySelectorAll(".r2v-rubric-cb");
            cbs.forEach(cb => cb.addEventListener("change", () => {
                let sum = 0;
                cbs.forEach(x => { if (x.checked) sum += parseFloat(x.getAttribute("data-pts") || "0"); });
                document.getElementById("r2v-total-score").textContent = `${sum.toFixed(1)} / ${maxTotal}.0`;
                const ratio = maxTotal > 0 ? sum / maxTotal : 0;
                let est = "Cần cố gắng thêm";
                if (ratio >= 0.8) est = "Mức Giải Nhất VMO";
                else if (ratio >= 0.65) est = "Mức Giải Nhì VMO";
                else if (ratio >= 0.5) est = "Mức Giải Ba VMO";
                else if (ratio >= 0.35) est = "Mức Giải Khuyến Khích";
                document.getElementById("r2v-award-est").textContent = est;
            }));
        }

        if (bothDone) {
            const canvas = document.getElementById("r2v-cert-canvas");
            drawCertificate(canvas, {
                studentName: user.username,
                examTitle: exam.title
            });

            document.getElementById("r2v-download-cert-btn").addEventListener("click", () => {
                const link = document.createElement("a");
                const safeName = user.username.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]+/g, "_");
                link.download = `Certificate_${exam.id}_${safeName}.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
            });

            document.getElementById("r2v-print-cert-btn").addEventListener("click", () => {
                const dataUrl = canvas.toDataURL("image/png");
                const w = window.open("", "_blank");
                if (!w) return;
                w.document.write(`<!DOCTYPE html><html><head><title>Certificate - ${exam.title}</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#FAF7D8;}img{max-width:100%;height:auto;}@media print{@page{size:landscape;margin:0;}body{margin:0;}}</style></head><body><img src="${dataUrl}" onload="window.print();"></body></html>`);
                w.document.close();
            });
        }
    }

    // ========================================================================
    //  CERTIFICATE GENERATOR (SACKS SPIRAL + CREAM / COBALT / RED SMP)
    // ========================================================================
    function drawCertificate(canvas, info) {
        const ctx = canvas.getContext("2d");
        const W = canvas.width;
        const H = canvas.height;
        const CREAM = "#FAF7D8";
        const COBALT = "#1B365D";
        const RED = "#B93131";

        // Nền kem smpCream
        ctx.fillStyle = CREAM;
        ctx.fillRect(0, 0, W, H);

        // Background Xoắn ốc Sacks ở chính giữa
        const cx = W / 2;
        const cy = H / 2 + 10;
        const scale = 76; // 5.5cm -> ~418px radius

        ctx.save();
        ctx.strokeStyle = "rgba(27, 54, 93, 0.16)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 5.5 * scale, 0, Math.PI * 2);
        ctx.stroke();

        const baseArr = window.SMP_SACKS_BASE || [];
        ctx.fillStyle = "rgba(27, 54, 93, 0.22)";
        for (let i = 0; i < baseArr.length; i += 2) {
            ctx.beginPath();
            ctx.arc(cx + baseArr[i] * scale, cy - baseArr[i + 1] * scale, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        const redArr = window.SMP_SACKS_RED || [];
        ctx.fillStyle = "rgba(185, 49, 49, 0.28)";
        for (let i = 0; i < redArr.length; i += 2) {
            ctx.beginPath();
            ctx.arc(cx + redArr[i] * scale, cy - redArr[i + 1] * scale, 2.7, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Khung viền kép Cobalt & Red
        ctx.strokeStyle = COBALT;
        ctx.lineWidth = 7;
        ctx.strokeRect(42, 42, W - 84, H - 84);

        ctx.strokeStyle = RED;
        ctx.lineWidth = 2.2;
        ctx.strokeRect(60, 60, W - 120, H - 120);

        const corners = [[42, 42, 1, 1], [W - 42, 42, -1, 1], [42, H - 42, 1, -1], [W - 42, H - 42, -1, -1]];
        corners.forEach(([x, y, sx, sy]) => {
            ctx.fillStyle = RED;
            ctx.fillRect(x - 6, y - 6, 12, 12);
            ctx.strokeStyle = RED;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + sx * 18, y + sy * 48);
            ctx.lineTo(x + sx * 18, y + sy * 18);
            ctx.lineTo(x + sx * 48, y + sy * 18);
            ctx.stroke();
        });

        // Tiêu đề tinh gọn
        ctx.textAlign = "center";
        ctx.fillStyle = COBALT;
        ctx.font = "700 76px 'Playfair Display', 'Times New Roman', serif";
        ctx.fillText("CERTIFICATE", W / 2, 238);

        ctx.fillStyle = RED;
        ctx.font = "italic 32px 'Times New Roman', serif";
        ctx.fillText("Hoàn thành thi thử VMO 2026", W / 2, 294);

        ctx.strokeStyle = "rgba(185, 49, 49, 0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 200, 332);
        ctx.lineTo(W / 2 + 200, 332);
        ctx.stroke();

        // Tên tài khoản thí sinh
        ctx.fillStyle = COBALT;
        ctx.font = "700 74px 'Playfair Display', 'Times New Roman', serif";
        ctx.fillText(info.studentName.toUpperCase(), W / 2, 510);

        ctx.strokeStyle = "rgba(27, 54, 93, 0.38)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 330, 542);
        ctx.lineTo(W / 2 + 330, 542);
        ctx.stroke();

        // Chỉ để lại 1 dòng ở giữa
        ctx.fillStyle = RED;
        ctx.font = "700 44px 'Playfair Display', 'Times New Roman', serif";
        ctx.fillText(info.examTitle, W / 2, 650);

        // Góc phải dưới: chỉ để SMP phía trên
        const sigX = W - 320;
        ctx.fillStyle = RED;
        ctx.font = "700 42px 'Playfair Display', 'Times New Roman', serif";
        ctx.fillText("SMP", sigX, 912);
        ctx.strokeStyle = "rgba(27, 54, 93, 0.35)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(sigX - 155, 932);
        ctx.lineTo(sigX + 155, 932);
        ctx.stroke();
        ctx.fillStyle = COBALT;
        ctx.font = "500 19px 'JetBrains Mono', monospace";
        ctx.fillText("Secrets of Mathematical Principles", sigX, 964);
    }

    function boot() {
        const exam = EXAMS[currentRound];
        if (exam && exam.isLocked) {
            stopTimers();
            root.innerHTML = `
            ${renderTopNav()}
            <div class="r2v-card fade-up" style="max-width: 620px; margin: 18px auto; text-align: center;">
                <span class="r2v-badge-gold">&#x1F512; Chưa Mở Đề</span>
                <h1 class="r2v-lobby-title" style="font-size: 1.7rem;">${exam.title}</h1>
                <p style="font-size: 0.95rem; line-height: 1.7; opacity: 0.88; margin: 12px 0 22px;">
                    Đợt thi này hiện đang khóa và chưa tới thời gian mở đề. Vui lòng quay lại khi có thông báo mở thi.
                </p>
                <a href="/posts/math/vmo/road2vmo-test.html" class="r2v-btn-primary">&larr; Về trang Road2VMO Test</a>
            </div>`;
            return;
        }
        const user = getAuthUser();
        if (!user) {
            renderAuthGate();
            return;
        }
        const st = loadState();
        if (st && st.phase === "active") {
            renderActiveExam(st, user);
        } else if (st && st.phase === "finished") {
            renderPostHub(st, user);
        } else {
            renderLobby(user);
        }
    }

    boot();
})();

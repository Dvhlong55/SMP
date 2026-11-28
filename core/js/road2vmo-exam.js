// ============================================================================
//  ROAD2VMO TEST — EXAM ROOM ENGINE (SMP-MATH)
// ============================================================================
(function () {
    const EXAMS = window.ROAD2VMO_EXAMS || {};
    const params = new URLSearchParams(window.location.search);

    let currentRound = EXAMS[params.get("test")] ? params.get("test") : "1";
    let currentSession = params.get("session") === "afternoon" ? "afternoon" : "morning";
    let currentDurationMin = 120; // Mặc định 2 tiếng/buổi (khuyến khích), có thể chọn 270 phút chuẩn VMO
    let currentMode = "strict";   // "strict" (đếm ngược) | "stopwatch" (đếm xuôi)
    let soundEnabled = true;
    let paperFontRem = 1.04;
    let tickInterval = null;
    let uploadInterval = null;
    let firedCues = { m60: false, m15: false, m0: false };

    const root = document.getElementById("r2v-app");
    if (!root) return;

    function stateKey() {
        return `smp_r2v_state_r${currentRound}_${currentSession}`;
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(stateKey());
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

    function updateUrlParams() {
        if (history.replaceState) {
            const u = new URL(window.location.href);
            u.searchParams.set("test", currentRound);
            u.searchParams.set("session", currentSession);
            history.replaceState(null, "", u.toString());
        }
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
    }

    function renderTopNav() {
        return `
        <div class="r2v-topbar-strip">
            <a class="r2v-back-link" href="/posts/math/vmo/road2vmo-test.html">&larr; Về bài giới thiệu Road2VMO Test</a>
            <div class="r2v-round-tabs">
                ${["1", "2", "3"].map(r => `
                    <button type="button" class="r2v-pill-btn ${currentRound === r ? "active" : ""}" data-switch-round="${r}">
                        Lần ${r}
                    </button>
                `).join("")}
            </div>
        </div>`;
    }

    function bindTopNav() {
        root.querySelectorAll("[data-switch-round]").forEach(btn => {
            btn.addEventListener("click", () => {
                currentRound = btn.getAttribute("data-switch-round");
                updateUrlParams();
                boot();
            });
        });
    }

    // ========================================================================
    //  GIAI ĐOẠN 1: SẢNH CHỜ (PRE-EXAM LOBBY)
    // ========================================================================
    function renderLobby() {
        stopTimers();
        const exam = EXAMS[currentRound];
        const sess = exam.sessions[currentSession];

        root.innerHTML = `
        ${renderTopNav()}
        <div class="r2v-card fade-up">
            <div class="r2v-lobby-header">
                <span class="r2v-badge-gold">Phòng Thi Thử VMO Trực Tuyến</span>
                <h1 class="r2v-lobby-title">${exam.title}</h1>
                <div style="opacity: 0.8; font-size: 0.95rem;">${exam.subtitle} &bull; ${sess.label}</div>
            </div>

            <div class="r2v-rules-box">
                <b>Quy chế & Lịch làm bài:</b>
                <ul style="margin: 6px 0 0 18px; padding: 0;">
                    <li><b>Cơ cấu 2 buổi:</b> Mỗi đợt thi gồm <b>Buổi Sáng (Ngày 1)</b> và <b>Buổi Chiều (Ngày 2)</b>. Khuyến khích thí sinh làm tối thiểu <b>2 tiếng/buổi (120 phút)</b> hoặc thi đúng chuẩn VMO <b>4 tiếng 30 phút (270 phút)</b>.</li>
                    <li><b>Học sinh lớp VMO SMP:</b> <b>Bắt buộc</b> hoàn thành và nộp bài vào <b>Thứ 5</b> qua cổng Google Classroom của ${exam.title}.</li>
                    <li><b>Thí sinh tự do bên ngoài:</b> Tự do chọn thời điểm làm bài phù hợp và nhận <b>Giấy chứng nhận (Certificate)</b> ngay sau khi hoàn thành.</li>
                </ul>
            </div>

            <div class="r2v-lobby-grid">
                <div class="r2v-option-group">
                    <h4>1. Chọn Buổi Thi</h4>
                    ${["morning", "afternoon"].map(sk => {
                        const sObj = exam.sessions[sk];
                        return `
                        <button type="button" class="r2v-choice-card ${currentSession === sk ? "selected" : ""}" data-select-session="${sk}">
                            <div class="r2v-choice-title">${sObj.label}</div>
                            <div class="r2v-choice-desc">${sObj.problems.length} bài toán tự luận (thang ${sObj.problems.length * 7} điểm)</div>
                        </button>`;
                    }).join("")}
                </div>

                <div class="r2v-option-group">
                    <h4>2. Chọn Thời Lượng</h4>
                    <button type="button" class="r2v-choice-card ${currentDurationMin === 120 ? "selected" : ""}" data-select-dur="120">
                        <div class="r2v-choice-title">120 phút (2 tiếng / buổi) — Khuyến khích</div>
                        <div class="r2v-choice-desc">Phù hợp chia làm 2 buổi Sáng & Chiều trong ngày (tối thiểu 2 tiếng mỗi buổi).</div>
                    </button>
                    <button type="button" class="r2v-choice-card ${currentDurationMin === 270 ? "selected" : ""}" data-select-dur="270">
                        <div class="r2v-choice-title">270 phút (4 tiếng 30 phút) — Chuẩn VMO</div>
                        <div class="r2v-choice-desc">Trải nghiệm áp lực thời gian chuẩn phòng thi Học sinh giỏi Quốc gia.</div>
                    </button>
                </div>

                <div class="r2v-option-group">
                    <h4>3. Chế Độ Giám Thị</h4>
                    <button type="button" class="r2v-choice-card ${currentMode === "strict" ? "selected" : ""}" data-select-mode="strict">
                        <div class="r2v-choice-title">Thi thật (Strict Mode)</div>
                        <div class="r2v-choice-desc">Đếm ngược tự động, lưu mốc giờ vào trình duyệt (F5 không bị mất giờ).</div>
                    </button>
                    <button type="button" class="r2v-choice-card ${currentMode === "stopwatch" ? "selected" : ""}" data-select-mode="stopwatch">
                        <div class="r2v-choice-title">Tự luyện (Stopwatch Mode)</div>
                        <div class="r2v-choice-desc">Đồng hồ bấm giờ đếm xuôi từ 00:00:00 để tự đo tốc độ giải từng bài.</div>
                    </button>
                </div>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 12px;">
                <button type="button" class="r2v-btn-primary" id="r2v-start-btn">
                    Bắt đầu tính giờ &amp; Mở đề (${currentSession === "morning" ? "Buổi Sáng" : "Buổi Chiều"})
                </button>
                <button type="button" class="r2v-btn-gold" id="r2v-skip-hub-btn">
                    Đã làm xong &rarr; Nộp bài / Barem / Certificate
                </button>
            </div>
        </div>`;

        bindTopNav();
        root.querySelectorAll("[data-select-session]").forEach(btn => {
            btn.addEventListener("click", () => {
                currentSession = btn.getAttribute("data-select-session");
                updateUrlParams();
                boot();
            });
        });
        root.querySelectorAll("[data-select-dur]").forEach(btn => {
            btn.addEventListener("click", () => {
                currentDurationMin = parseInt(btn.getAttribute("data-select-dur"), 10);
                renderLobby();
            });
        });
        root.querySelectorAll("[data-select-mode]").forEach(btn => {
            btn.addEventListener("click", () => {
                currentMode = btn.getAttribute("data-select-mode");
                renderLobby();
            });
        });
        document.getElementById("r2v-start-btn").addEventListener("click", () => {
            const st = {
                phase: "active",
                mode: currentMode,
                durationSec: currentDurationMin * 60,
                startTime: Date.now(),
                finishedAt: null
            };
            firedCues = { m60: false, m15: false, m0: false };
            saveState(st);
            playChime(784, 1);
            renderActiveExam(st);
        });
        document.getElementById("r2v-skip-hub-btn").addEventListener("click", () => {
            const st = {
                phase: "finished",
                mode: currentMode,
                durationSec: currentDurationMin * 60,
                startTime: Date.now() - currentDurationMin * 60 * 1000,
                finishedAt: Date.now()
            };
            saveState(st);
            renderPostHub(st);
        });
    }

    // ========================================================================
    //  GIAI ĐOẠN 2: PHÒNG THI TRỰC TUYẾN (ACTIVE EXAM ROOM)
    // ========================================================================
    function renderActiveExam(st) {
        stopTimers();
        const exam = EXAMS[currentRound];
        const sess = exam.sessions[currentSession];

        root.innerHTML = `
        ${renderTopNav()}
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
                <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.75; text-align: center;">
                    ${st.mode === "strict" ? "Giám Thị Đếm Ngược" : "Đồng Hồ Tự Luyện"}
                </div>
                <div class="r2v-timer-display" id="r2v-clock">--:--:--</div>
                <div id="r2v-timer-status" style="text-align: center; font-size: 0.8rem; opacity: 0.8; margin-bottom: 10px;">
                    Làm bài trên giấy nháp &amp; giấy thi thật
                </div>

                <div class="r2v-audio-row">
                    <span>Chuông báo mốc giờ</span>
                    <button type="button" class="r2v-mini-btn" id="r2v-sound-toggle">
                        ${soundEnabled ? "Đang bật" : "Đã tắt"}
                    </button>
                </div>

                <button type="button" class="r2v-btn-danger" id="r2v-finish-btn">
                    Kết thúc &amp; Nộp bài
                </button>
                <button type="button" class="r2v-mini-btn" id="r2v-reset-lobby-btn" style="width: 100%; margin-top: 10px; opacity: 0.75;">
                    &larr; Quay lại sảnh chờ
                </button>
            </aside>
        </div>`;

        bindTopNav();
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
            e.target.textContent = soundEnabled ? "Đang bật" : "Đã tắt";
        });
        document.getElementById("r2v-finish-btn").addEventListener("click", () => {
            if (confirm("Xác nhận kết thúc giờ làm bài và chuyển sang cổng nộp bài & Certificate?")) {
                st.phase = "finished";
                st.finishedAt = Date.now();
                saveState(st);
                playChime(1046, 2);
                renderPostHub(st);
            }
        });
        document.getElementById("r2v-reset-lobby-btn").addEventListener("click", () => {
            if (confirm("Thoát phòng thi hiện tại để chọn lại chế độ ở sảnh chờ?")) {
                clearState();
                renderLobby();
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
                    st.phase = "finished";
                    st.finishedAt = Date.now();
                    saveState(st);
                    renderPostHub(st);
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
    function renderPostHub(st) {
        stopTimers();
        const exam = EXAMS[currentRound];
        const sess = exam.sessions[currentSession];
        const elapsedMin = Math.max(1, Math.round(((st.finishedAt || Date.now()) - st.startTime) / 60000));
        const maxTotal = sess.problems.reduce((s, p) => s + p.maxScore, 0);

        root.innerHTML = `
        ${renderTopNav()}
        <div class="r2v-hub-grid fade-up">
            <!-- KHỐI 1: CỔNG NỘP BÀI CLASSROOM -->
            <div class="r2v-card" style="margin-bottom: 0;">
                <span class="r2v-badge-gold">Bước 1 &bull; Dành cho HS lớp VMO SMP</span>
                <h2 style="margin: 6px 0 10px; font-size: 1.35rem;">Cổng Nộp Bài Google Classroom</h2>
                <p style="font-size: 0.92rem; line-height: 1.65; opacity: 0.9;">
                    Học sinh lớp VMO SMP bắt buộc làm vào <b>Thứ 5</b>, chụp ảnh/scan bài viết tay thành PDF và nộp vào đúng link của <b>${exam.title}</b>.
                </p>
                <div style="padding: 10px 14px; border-radius: 8px; background: rgba(92, 225, 230, 0.08); border: 1px solid rgba(92, 225, 230, 0.25); margin: 12px 0; font-family: 'JetBrains Mono', monospace; font-size: 0.82rem;">
                    Thời gian scan &amp; nộp bài còn lại: <b id="r2v-upload-clock" style="color: #f0c040; font-size: 1rem;">15:00</b><br>
                    Tên file chuẩn: <code>${exam.fileNamingRule}</code>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px;">
                    <a href="${exam.classroomUrl}" target="_blank" rel="noopener noreferrer" class="r2v-btn-primary">
                        Mở Google Classroom (${exam.title}) &rarr;
                    </a>
                    <button type="button" class="r2v-mini-btn" id="r2v-retake-btn">Làm lại / Đổi buổi</button>
                </div>
            </div>

            <!-- KHỐI 2: BAREM & TỰ CHẤM ĐIỂM -->
            <div class="r2v-card" style="margin-bottom: 0;">
                <span class="r2v-badge-gold">Bước 2 &bull; Đáp án &amp; Tự chấm</span>
                <h2 style="margin: 6px 0 10px; font-size: 1.35rem;">Barem Chấm Điểm (${sess.label})</h2>
                ${exam.isSolutionPublished ? `
                    <div id="r2v-rubric-box">
                        ${sess.problems.map((p, pi) => `
                            <div style="margin-bottom: 12px;">
                                <div style="font-weight: 700; font-size: 0.92rem; margin-bottom: 4px; color: var(--accent-cyan);">${p.code} (${p.maxScore},0 điểm)</div>
                                ${p.rubric.map((r, ri) => `
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
                        <div style="margin-top: 8px; font-size: 0.82rem; opacity: 0.78;">
                            (Thí sinh tự do có thể trao đổi hướng giải ở khung bình luận bên dưới trong lúc chờ mở đáp án.)
                        </div>
                    </div>
                `}
            </div>
        </div>

        <!-- KHỐI 3: CERTIFICATE ĐIỆN TỬ -->
        <div class="r2v-card fade-up" id="r2v-cert-card">
            <span class="r2v-badge-gold">Bước 3 &bull; Giấy Chứng Nhận Hoàn Thành</span>
            <h2 style="margin: 6px 0 8px; font-size: 1.45rem;">Certificate — Road2VMO Test</h2>
            <p style="font-size: 0.92rem; opacity: 0.85; margin-bottom: 16px;">
                Dành cho cả học sinh trong lớp và thí sinh tự do sau khi hoàn thành bài thi. Nhập họ tên của bạn để tạo và tải xuống chứng nhận điện tử.
            </p>

            <div class="r2v-cert-controls">
                <div class="r2v-input-group">
                    <label for="r2v-cert-name">Họ và tên thí sinh</label>
                    <input type="text" id="r2v-cert-name" placeholder="Ví dụ: Nguyễn Văn A" value="${localStorage.getItem("smp_r2v_cert_name") || ""}">
                </div>
                <div class="r2v-input-group">
                    <label for="r2v-cert-school">Trường / Tỉnh (tùy chọn)</label>
                    <input type="text" id="r2v-cert-school" placeholder="Ví dụ: THPT Chuyên..." value="${localStorage.getItem("smp_r2v_cert_school") || ""}">
                </div>
                <div class="r2v-input-group">
                    <label for="r2v-cert-scope">Phạm vi ghi nhận</label>
                    <select id="r2v-cert-scope" style="width:100%; padding:9px 12px; border-radius:8px; border:1px solid var(--border-light, rgba(255,255,255,0.18)); background:rgba(128,128,128,0.08); color:inherit; font-family:inherit; font-size:0.92rem;">
                        <option value="${sess.label}">${sess.label}</option>
                        <option value="Hoàn thành trọn vẹn 2 buổi (Sáng &amp; Chiều)">Hoàn thành trọn vẹn 2 buổi (Sáng &amp; Chiều)</option>
                    </select>
                </div>
                <button type="button" class="r2v-btn-primary" id="r2v-download-cert-btn">Tải Certificate (PNG)</button>
                <button type="button" class="r2v-btn-gold" id="r2v-print-cert-btn">In / Lưu PDF</button>
            </div>

            <div class="r2v-cert-canvas-wrap">
                <canvas id="r2v-cert-canvas" width="1600" height="1130"></canvas>
            </div>
        </div>`;

        bindTopNav();

        // 15-minute scan/upload countdown
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

        document.getElementById("r2v-retake-btn").addEventListener("click", () => {
            clearState();
            renderLobby();
        });

        // Interactive Rubric Scoring
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

        // Certificate Renderer
        const nameInput = document.getElementById("r2v-cert-name");
        const schoolInput = document.getElementById("r2v-cert-school");
        const scopeSelect = document.getElementById("r2v-cert-scope");
        const canvas = document.getElementById("r2v-cert-canvas");

        function redrawCert() {
            const nameVal = nameInput.value.trim() || "THÍ SINH THAM DỰ";
            const schoolVal = schoolInput.value.trim();
            localStorage.setItem("smp_r2v_cert_name", nameInput.value);
            localStorage.setItem("smp_r2v_cert_school", schoolInput.value);
            drawCertificate(canvas, {
                studentName: nameVal,
                school: schoolVal,
                examTitle: exam.title,
                scope: scopeSelect.value,
                elapsedMin: elapsedMin,
                certId: `SMP-R2V-L${exam.round}-${String(Math.abs(hashCode(nameVal + exam.id))).slice(0, 6).padStart(6, "0")}`
            });
        }

        nameInput.addEventListener("input", redrawCert);
        schoolInput.addEventListener("input", redrawCert);
        scopeSelect.addEventListener("change", redrawCert);
        redrawCert();

        document.getElementById("r2v-download-cert-btn").addEventListener("click", () => {
            redrawCert();
            const link = document.createElement("a");
            const safeName = (nameInput.value.trim() || "ThiSinh").replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]+/g, "_");
            link.download = `Certificate_${exam.id}_${safeName}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        });

        document.getElementById("r2v-print-cert-btn").addEventListener("click", () => {
            redrawCert();
            const dataUrl = canvas.toDataURL("image/png");
            const w = window.open("", "_blank");
            if (!w) return;
            w.document.write(`<!DOCTYPE html><html><head><title>Certificate - ${exam.title}</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff;}img{max-width:100%;height:auto;}@media print{@page{size:landscape;margin:0;}body{margin:0;}}</style></head><body><img src="${dataUrl}" onload="window.print();"></body></html>`);
            w.document.close();
        });
    }

    function hashCode(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) - h) + str.charCodeAt(i);
            h |= 0;
        }
        return h;
    }

    function drawCertificate(canvas, info) {
        const ctx = canvas.getContext("2d");
        const W = canvas.width;
        const H = canvas.height;

        // Background gradient (deep academic midnight navy)
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, "#0b111e");
        bg.addColorStop(0.5, "#111b2e");
        bg.addColorStop(1, "#090e19");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Subtle radial glow
        const glow = ctx.createRadialGradient(W / 2, H * 0.44, 60, W / 2, H * 0.44, 650);
        glow.addColorStop(0, "rgba(92, 225, 230, 0.09)");
        glow.addColorStop(0.6, "rgba(240, 192, 64, 0.05)");
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);

        // Outer Gold Frame & Inner Cyan Accent Frame
        ctx.strokeStyle = "#f0c040";
        ctx.lineWidth = 6;
        ctx.strokeRect(42, 42, W - 84, H - 84);

        ctx.strokeStyle = "rgba(92, 225, 230, 0.55)";
        ctx.lineWidth = 2;
        ctx.strokeRect(60, 60, W - 120, H - 120);

        // Corner ornaments
        const corners = [[42, 42, 1, 1], [W - 42, 42, -1, 1], [42, H - 42, 1, -1], [W - 42, H - 42, -1, -1]];
        ctx.fillStyle = "#f0c040";
        corners.forEach(([cx, cy, sx, sy]) => {
            ctx.fillRect(cx - 6, cy - 6, 12, 12);
            ctx.strokeStyle = "#f0c040";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx + sx * 18, cy + sy * 48);
            ctx.lineTo(cx + sx * 18, cy + sy * 18);
            ctx.lineTo(cx + sx * 48, cy + sy * 18);
            ctx.stroke();
        });

        // Header Brand
        ctx.textAlign = "center";
        ctx.fillStyle = "#5ce1e6";
        ctx.font = "700 24px 'JetBrains Mono', monospace";
        ctx.fillText("SECRETS OF MATHEMATICAL PRINCIPLES  •  SMP-MATH", W / 2, 138);

        // Title
        ctx.fillStyle = "#f0c040";
        ctx.font = "700 66px 'Playfair Display', 'Times New Roman', serif";
        ctx.fillText("CERTIFICATE OF PARTICIPATION", W / 2, 232);

        ctx.fillStyle = "#cbd5e1";
        ctx.font = "italic 28px 'Times New Roman', serif";
        ctx.fillText("Giấy Chứng Nhận Hoàn Thành Kỳ Thi Thử Olympic Toán Quốc Gia", W / 2, 282);

        // Divider line
        ctx.strokeStyle = "rgba(240, 192, 64, 0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 220, 316);
        ctx.lineTo(W / 2 + 220, 316);
        ctx.stroke();

        // Intro line
        ctx.fillStyle = "#94a3b8";
        ctx.font = "400 26px 'Times New Roman', serif";
        ctx.fillText("Trân trọng chứng nhận thí sinh", W / 2, 386);

        // Student Name
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 72px 'Playfair Display', 'Times New Roman', serif";
        ctx.fillText(info.studentName.toUpperCase(), W / 2, 476);

        // Name underline
        ctx.strokeStyle = "rgba(92, 225, 230, 0.45)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 340, 504);
        ctx.lineTo(W / 2 + 340, 504);
        ctx.stroke();

        let yShift = 0;
        if (info.school) {
            ctx.fillStyle = "#cbd5e1";
            ctx.font = "italic 26px 'Times New Roman', serif";
            ctx.fillText(info.school, W / 2, 548);
            yShift = 36;
        }

        // Achievement text
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "400 28px 'Times New Roman', serif";
        ctx.fillText("Đã nghiêm túc hoàn thành bài thi thử theo quy chuẩn VMO:", W / 2, 588 + yShift);

        ctx.fillStyle = "#5ce1e6";
        ctx.font = "700 40px 'Playfair Display', 'Times New Roman', serif";
        ctx.fillText(info.examTitle, W / 2, 648 + yShift);

        ctx.fillStyle = "#f0c040";
        ctx.font = "600 25px 'JetBrains Mono', monospace";
        ctx.fillText(`${info.scope}  •  Thời lượng ghi nhận: ${info.elapsedMin} phút`, W / 2, 698 + yShift);

        // Official Seal in bottom-left / center-bottom
        const sealX = 280;
        const sealY = 920;
        ctx.save();
        ctx.strokeStyle = "#f0c040";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(sealX, sealY, 74, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(92, 225, 230, 0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sealX, sealY, 62, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#f0c040";
        ctx.font = "700 26px 'Playfair Display', serif";
        ctx.fillText("SMP", sealX, sealY - 4);
        ctx.fillStyle = "#5ce1e6";
        ctx.font = "700 15px 'JetBrains Mono', monospace";
        ctx.fillText("ROAD2VMO", sealX, sealY + 24);
        ctx.restore();

        // Date & Verification Code (center-bottom)
        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
        ctx.textAlign = "center";
        ctx.fillStyle = "#94a3b8";
        ctx.font = "500 20px 'JetBrains Mono', monospace";
        ctx.fillText(`Ngày cấp: ${dateStr}`, W / 2, 905);
        ctx.fillText(`Mã xác thực: ${info.certId}`, W / 2, 940);

        // Signature (bottom-right)
        const sigX = W - 320;
        ctx.fillStyle = "#f0c040";
        ctx.font = "italic 36px 'Playfair Display', 'Times New Roman', serif";
        ctx.fillText("SMP Academic Board", sigX, 902);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sigX - 150, 920);
        ctx.lineTo(sigX + 150, 920);
        ctx.stroke();
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "500 19px 'JetBrains Mono', monospace";
        ctx.fillText("Secrets of Mathematical Principles", sigX, 952);
    }

    function boot() {
        const st = loadState();
        if (st && st.phase === "active") {
            renderActiveExam(st);
        } else if (st && st.phase === "finished") {
            renderPostHub(st);
        } else {
            renderLobby();
        }
    }

    boot();
})();

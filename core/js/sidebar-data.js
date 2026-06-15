const LEFT_TAGS_HTML = `
        <div class="side-widget fade-up">
            <ul class="side-widget-list">
                <li><a href="/SMP/pages/toanhoc.html?filter=vmo">VMO <span>11</span></a></li>
                <li><a href="/SMP/pages/toanhoc.html?filter=thcs">THCS <span>35</span></a></li>
                <li><a href="/SMP/pages/toanhoc.html?filter=thpt">THPT <span>1</span></a></li>
                <li><a href="/SMP/pages/toanhoc.html?filter=uni">Đại Học <span>1</span></a></li>
                <li><a href="/SMP/pages/toanhoc.html?filter=challenge">Thách Thức <span>2</span></a></li>
                <li><a href="/SMP/pages/toanhoc.html?filter=trao-doi">Trao Đổi <span>1</span></a></li>
                <li><a href="/SMP/pages/toanhoc.html?filter=tools">Tool <span>3</span></a></li>
            </ul>
            
            <hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin: 16px 0;">
            
            <ul class="side-widget-list">
                <li><a href="/SMP/pages/forum.html">⧉ Forum</a></li>
                <li><a href="/SMP/pages/saved.html">🖫 Saved</a></li>
                <li>
                    <a href="javascript:void(0)" onclick="if(window.toggleNotificationDropdown) window.toggleNotificationDropdown(event)">
                        <span style="position:relative;">
                            🔔 Thông báo
                            <span id="side-notif-badge" style="display:none; position:absolute; top:-2px; right:-8px; background:var(--accent-red,#e74c3c); width:8px; height:8px; border-radius:50%;"></span>
                        </span>
                    </a>
                </li>
            </ul>
        </div>
`;

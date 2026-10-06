/**
 * ==============================================================================
 * SMP LaTeX Quick Viewer & Composer — Background Service Worker (Manifest V3)
 * ==============================================================================
 */

const CONTEXT_MENU_TRANSLATE = "smp-translate-latex";
const CONTEXT_MENU_COMPOSE = "smp-compose-latex";

// Thiết lập Context Menu khi cài đặt extension
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: CONTEXT_MENU_TRANSLATE,
        title: "SMP — Biên Dịch",
        contexts: ["selection"]
    });

    chrome.contextMenus.create({
        id: CONTEXT_MENU_COMPOSE,
        title: "SMP — Soạn Thảo Công Thức",
        contexts: ["editable", "page"]
    });
});

// Hàm hỗ trợ gửi tin nhắn hoặc inject script nếu trang chưa tải xong
function sendMessageOrInject(tabId, message) {
    chrome.tabs.sendMessage(tabId, message).catch(err => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: [
                "katex/katex.min.js",
                "katex/contrib/auto-render.min.js",
                "html2canvas.min.js",
                "normalizer.js",
                "content.js"
            ]
        }).then(() => {
            chrome.tabs.sendMessage(tabId, message);
        }).catch(e => console.error("[SMP] Lỗi inject script:", e));
    });
}

// Xử lý khi người dùng chọn context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab || !tab.id) return;
    if (info.menuItemId === CONTEXT_MENU_TRANSLATE) {
        const selectedText = info.selectionText || "";
        sendMessageOrInject(tab.id, {
            action: "SMP_TRANSLATE_SELECTION",
            text: selectedText
        });
    } else if (info.menuItemId === CONTEXT_MENU_COMPOSE) {
        sendMessageOrInject(tab.id, {
            action: "SMP_OPEN_COMPOSER"
        });
    }
});

// Xử lý phím tắt Alt+Shift+X và Alt+Shift+C
chrome.commands.onCommand.addListener((command, tab) => {
    if (!tab || !tab.id) return;
    if (command === "translate-latex") {
        sendMessageOrInject(tab.id, {
            action: "SMP_TRANSLATE_HOTKEY"
        });
    } else if (command === "compose-latex") {
        sendMessageOrInject(tab.id, {
            action: "SMP_OPEN_COMPOSER"
        });
    }
});

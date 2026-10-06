/**
 * ==============================================================================
 * SMP LaTeX Quick Viewer — Background Service Worker (Manifest V3)
 * ==============================================================================
 */

const CONTEXT_MENU_ID = "smp-translate-latex";

// Thiết lập Context Menu khi cài đặt extension
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: CONTEXT_MENU_ID,
        title: "SMP — Dịch LaTeX",
        contexts: ["selection"]
    });
    console.log("[SMP] Context menu 'SMP — Dịch LaTeX' đã được khởi tạo.");
});

// Xử lý khi người dùng chọn context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === CONTEXT_MENU_ID && tab && tab.id) {
        const selectedText = info.selectionText || "";
        chrome.tabs.sendMessage(tab.id, {
            action: "SMP_TRANSLATE_SELECTION",
            text: selectedText
        }).catch(err => {
            // Trường hợp tab chưa tải xong content script
            console.warn("[SMP] Chưa thể gửi tin nhắn tới content script, thử inject trực tiếp:", err);
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: [
                    "katex/katex.min.js",
                    "katex/contrib/auto-render.min.js",
                    "normalizer.js",
                    "content.js"
                ]
            }).then(() => {
                chrome.tabs.sendMessage(tab.id, {
                    action: "SMP_TRANSLATE_SELECTION",
                    text: selectedText
                });
            }).catch(e => console.error("[SMP] Lỗi inject script:", e));
        });
    }
});

// Xử lý phím tắt Alt+Shift+X
chrome.commands.onCommand.addListener((command, tab) => {
    if (command === "translate-latex" && tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, {
            action: "SMP_TRANSLATE_HOTKEY"
        }).catch(err => {
            console.warn("[SMP] Lỗi gọi phím tắt:", err);
        });
    }
});

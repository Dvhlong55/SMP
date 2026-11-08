/**
 * ==============================================================================
 * SMP - LaTeX Quick Viewer Showcase Controller
 * Secret of Mathematical Principles
 * ==============================================================================
 */

(function () {
    'use strict';

    /**
     * Chuyển đổi tab trong khu vực Showcase Ví dụ
     */
    window.switchShowcaseTab = function (index) {
        const tabs = document.querySelectorAll('.showcase-tab');
        const panels = document.querySelectorAll('.showcase-panel');

        tabs.forEach((tab, i) => {
            if (i === index) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        panels.forEach((panel, i) => {
            if (i === index) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
    };

    /**
     * Mở hộp thoại Hướng Dẫn Cài Đặt Extension
     */
    window.openGuideModal = function () {
        const modal = document.getElementById('guide-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    /**
     * Đóng hộp thoại Hướng Dẫn Cài Đặt Extension
     */
    window.closeGuideModal = function () {
        const modal = document.getElementById('guide-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    /**
     * Xem ảnh demo kích thước lớn (Lightbox)
     */
    window.openLightbox = function (src) {
        const lightbox = document.getElementById('lightbox-modal');
        const lightboxImg = document.getElementById('lightbox-img');
        if (lightbox && lightboxImg && src) {
            lightboxImg.src = src;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    /**
     * Đóng Lightbox
     */
    window.closeLightbox = function () {
        const lightbox = document.getElementById('lightbox-modal');
        if (lightbox) {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // Đóng modal khi bấm phím Escape hoặc click nền mờ ngoài modal
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeGuideModal();
            closeLightbox();
        }
    });

    const guideModalBackdrop = document.getElementById('guide-modal');
    if (guideModalBackdrop) {
        guideModalBackdrop.addEventListener('click', function (e) {
            if (e.target === guideModalBackdrop) {
                closeGuideModal();
            }
        });
    }

})();

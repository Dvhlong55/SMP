function toggleSnipGroup(labelEl) {
        var row = labelEl.parentElement;
        row.classList.toggle('collapsed');
        saveSnipLayout();
    }

    function saveSnipLayout() {
        var toolbar = document.getElementById('snippet-toolbar');
        var rows = toolbar.querySelectorAll('.snip-group-row');
        var layout = [];
        rows.forEach(function(r) {
            layout.push({
                group: r.getAttribute('data-group'),
                collapsed: r.classList.contains('collapsed')
            });
        });
        localStorage.setItem('mathTypeSnipLayout', JSON.stringify(layout));
    }

    function loadSnipLayout() {
        var saved = localStorage.getItem('mathTypeSnipLayout');
        if (!saved) return;
        try {
            var layout = JSON.parse(saved);
            var toolbar = document.getElementById('snippet-toolbar');
            var rowsMap = {};
            toolbar.querySelectorAll('.snip-group-row').forEach(function(r) {
                rowsMap[r.getAttribute('data-group')] = r;
            });
            
            layout.forEach(function(item) {
                var r = rowsMap[item.group];
                if (r) {
                    toolbar.appendChild(r); // Reorder
                    if (item.collapsed) r.classList.add('collapsed');
                    else r.classList.remove('collapsed');
                }
            });
        } catch(e) {}
    }

    function initDragAndDrop() {
        var toolbar = document.getElementById('snippet-toolbar');
        var dragSrcEl = null;

        function handleDragStart(e) {
            dragSrcEl = this;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', this.innerHTML);
            this.classList.add('dragging');
        }

        function handleDragOver(e) {
            if (e.preventDefault) e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            return false;
        }

        function handleDragEnter(e) {
            this.classList.add('drag-over');
        }

        function handleDragLeave(e) {
            this.classList.remove('drag-over');
        }

        function handleDrop(e) {
            if (e.stopPropagation) e.stopPropagation();
            if (dragSrcEl !== this) {
                var allRows = Array.from(toolbar.querySelectorAll('.snip-group-row'));
                var srcIdx = allRows.indexOf(dragSrcEl);
                var tgtIdx = allRows.indexOf(this);
                if (srcIdx < tgtIdx) {
                    this.parentNode.insertBefore(dragSrcEl, this.nextSibling);
                } else {
                    this.parentNode.insertBefore(dragSrcEl, this);
                }
            }
            return false;
        }

        function handleDragEnd(e) {
            this.classList.remove('dragging');
            toolbar.querySelectorAll('.snip-group-row').forEach(function(item) {
                item.classList.remove('drag-over');
            });
            saveSnipLayout();
        }

        var rows = toolbar.querySelectorAll('.snip-group-row');
        rows.forEach(function(row) {
            row.addEventListener('dragstart', handleDragStart, false);
            row.addEventListener('dragenter', handleDragEnter, false);
            row.addEventListener('dragover', handleDragOver, false);
            row.addEventListener('dragleave', handleDragLeave, false);
            row.addEventListener('drop', handleDrop, false);
            row.addEventListener('dragend', handleDragEnd, false);
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        loadSnipLayout();
        initDragAndDrop();
    });
    


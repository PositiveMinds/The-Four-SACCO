// Bootstrap Select Initialization
function initBootstrapSelect() {
    if (typeof $ === 'undefined' || typeof $.fn.selectpicker === 'undefined') {
        console.warn('jQuery or Bootstrap Select not loaded yet, retrying...');
        setTimeout(initBootstrapSelect, 100);
        return;
    }

    // Initialize all selectpicker elements
    $('.selectpicker').selectpicker({
        style: 'btn-outline-secondary',
        size: 8,
        liveSearch: true,
        liveSearchPlaceholder: 'Search...',
        noneSelectedText: 'Nothing selected',
        noneResultsText: 'No results matched {0}',
        countSelectedText: '{0} selected',
        maxOptionsText: 'Limit reached ({n} selected max)'
    });

    // Re-initialize when DOM changes (for dynamically added selects)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        if (node.classList && node.classList.contains('selectpicker')) {
                            $(node).selectpicker();
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll('.selectpicker').forEach(function(el) {
                                if (!$(el).data('selectpicker')) {
                                    $(el).selectpicker();
                                }
                            });
                        }
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Wait for DOM to be ready and jQuery to be available
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBootstrapSelect);
} else {
    initBootstrapSelect();
}

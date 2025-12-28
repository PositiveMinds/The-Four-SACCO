// Virtual Select Initialization
function initVirtualSelect() {
    if (typeof VirtualSelect === 'undefined') {
        console.warn('Virtual Select not loaded yet, retrying...');
        setTimeout(initVirtualSelect, 100);
        return;
    }

    console.log('Initializing Virtual Select...');

    // Initialize all virtual-select elements
    const selectElements = document.querySelectorAll('.virtual-select');
    console.log('Found ' + selectElements.length + ' virtual-select elements');
    
    selectElements.forEach(el => {
        console.log('Initializing select with id:', el.id);
        try {
            VirtualSelect.init({
                el: '#' + el.id,
                searchPlaceholderText: 'Search...',
                noOfDisplayRows: 8,
                autoSelectFirstOption: false
            });
        } catch (e) {
            console.error('Error initializing ' + el.id, e);
        }
    });

    // Re-initialize when DOM changes (for dynamically added selects)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        if (node.classList && node.classList.contains('virtual-select')) {
                            try {
                                VirtualSelect.init({
                                    el: '#' + node.id,
                                    searchPlaceholderText: 'Search...',
                                    noOfDisplayRows: 8
                                });
                            } catch (e) {
                                console.error('Error initializing new select', e);
                            }
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

// Wait for DOM to be ready and Virtual Select to be loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initVirtualSelect, 500);
    });
} else {
    setTimeout(initVirtualSelect, 500);
}

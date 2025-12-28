// jsPDF Loader
// Ensures jsPDF is properly loaded before the app tries to use it

const jsPDFLoader = {
    isLoaded: false,
    loadPromise: null,

    // Initialize jsPDF loading
    init() {
        console.log('jsPDF Loader: Initializing...');
        
        // Check if jsPDF is already available
        if (typeof window.jsPDF !== 'undefined') {
            console.log('✓ jsPDF already loaded');
            this.isLoaded = true;
            return Promise.resolve(true);
        }

        // Otherwise, wait for it to load
        return this.waitForJsPDF();
    },

    // Wait for jsPDF to load from CDN
    waitForJsPDF(maxWait = 15000) {
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = new Promise((resolve, reject) => {
            const startTime = Date.now();
            let lastError = null;

            const checkJsPDF = () => {
                if (typeof window.jsPDF !== 'undefined' && typeof window.jsPDF === 'function') {
                    console.log('✓ jsPDF loaded successfully');
                    this.isLoaded = true;
                    resolve(true);
                    return;
                }

                // Check if jspdf global is available (alternative property name)
                if (typeof window.jspdf !== 'undefined') {
                    console.log('✓ jspdf (lowercase) found, using as jsPDF');
                    if (typeof window.jspdf.jsPDF === 'function') {
                        window.jsPDF = window.jspdf.jsPDF;
                        this.isLoaded = true;
                        resolve(true);
                        return;
                    }
                }

                const elapsed = Date.now() - startTime;
                if (elapsed > maxWait) {
                    const msg = `jsPDF failed to load within ${maxWait}ms. Check CDN access.`;
                    console.error('✗ ' + msg);
                    console.error('Available window properties containing PDF:', Object.keys(window).filter(k => k.toLowerCase().includes('pdf')));
                    console.warn('Using export without PDF generation capability');
                    // Resolve anyway - let export.js handle the error gracefully
                    this.isLoaded = false;
                    resolve(false);
                    return;
                }

                // Try again in 100ms
                setTimeout(checkJsPDF, 100);
            };

            // Start checking
            checkJsPDF();
        });

        return this.loadPromise;
    },

    // Check if jsPDF is loaded
    check() {
        return typeof window.jsPDF !== 'undefined' && typeof window.jsPDF === 'function';
    },

    // Get jsPDF (synchronously if available)
    get() {
        if (typeof window.jsPDF !== 'undefined') {
            return window.jsPDF;
        }
        throw new Error('jsPDF not yet loaded. Call jsPDFLoader.init() first.');
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, checking jsPDF...');
    jsPDFLoader.init().catch(err => {
        console.error('Failed to load jsPDF:', err.message);
    });
});

// Also check immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => jsPDFLoader.init());
} else {
    jsPDFLoader.init();
}

// Provide fallback for PDF generation if jsPDF unavailable
window.getPDFGenerator = function() {
    if (jsPDFLoader.check()) {
        return { type: 'jspdf', instance: window.jsPDF };
    }
    if (typeof offlinePDF !== 'undefined') {
        return { type: 'offline', instance: offlinePDF };
    }
    return null;
};

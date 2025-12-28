/**
 * PWA Requirements Checker
 * Validates all PWA installation requirements and logs issues
 */
class PWAChecker {
    constructor() {
        this.requirements = {
            https: false,
            manifest: false,
            serviceWorker: false,
            icons: false,
            viewport: false,
            displayMode: false
        };
        this.errors = [];
    }

    async checkAll() {
        console.log('%c🔍 PWA Requirements Check Started', 'color: #FFCC00; font-weight: bold; font-size: 14px');
        
        this.checkHTTPS();
        this.checkManifest();
        await this.checkServiceWorker();
        this.checkViewport();
        this.checkDisplayMode();
        await this.checkIcons();
        
        this.logResults();
        return this.requirements;
    }

    checkHTTPS() {
        const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        this.requirements.https = isHTTPS;
        
        if (!isHTTPS) {
            this.errors.push('❌ HTTPS not enabled (or not localhost). PWA requires HTTPS for production.');
        } else {
            console.log('✅ HTTPS check passed');
        }
    }

    checkManifest() {
        const manifestLink = document.querySelector('link[rel="manifest"]');
        
        if (!manifestLink) {
            this.errors.push('❌ Manifest link not found in HTML');
            return;
        }

        const manifestHref = manifestLink.getAttribute('href');
        console.log(`📋 Manifest URL: ${manifestHref}`);

        fetch(manifestHref)
            .then(res => res.json())
            .then(manifest => {
                console.log('📋 Manifest loaded:', manifest);
                
                const checks = {
                    'name or short_name': manifest.name || manifest.short_name,
                    'start_url': manifest.start_url,
                    'display': manifest.display,
                    'icons': manifest.icons && manifest.icons.length > 0
                };

                let allValid = true;
                Object.entries(checks).forEach(([key, value]) => {
                    if (value) {
                        console.log(`✅ Manifest has ${key}`);
                    } else {
                        this.errors.push(`❌ Manifest missing: ${key}`);
                        allValid = false;
                    }
                });

                this.requirements.manifest = allValid;
            })
            .catch(err => {
                this.errors.push(`❌ Failed to load manifest: ${err.message}`);
                console.error('Manifest error:', err);
            });
    }

    async checkServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            this.errors.push('❌ Service Worker not supported in this browser');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            console.log('✅ Service Worker is registered and ready');
            this.requirements.serviceWorker = true;
        } catch (err) {
            this.errors.push(`❌ Service Worker error: ${err.message}`);
            console.error('Service Worker check failed:', err);
        }
    }

    checkViewport() {
        const viewport = document.querySelector('meta[name="viewport"]');
        
        if (viewport && viewport.getAttribute('content').includes('width=device-width')) {
            console.log('✅ Viewport meta tag is correct');
            this.requirements.viewport = true;
        } else {
            this.errors.push('❌ Missing or incorrect viewport meta tag');
        }
    }

    checkDisplayMode() {
        const displayMode = window.matchMedia('(display-mode: standalone)').matches
            ? 'standalone'
            : window.matchMedia('(display-mode: fullscreen)').matches
            ? 'fullscreen'
            : 'browser';
        
        console.log(`📱 Current display mode: ${displayMode}`);
        
        if (displayMode !== 'browser') {
            this.requirements.displayMode = true;
            console.log('✅ App is running in standalone/fullscreen mode');
        }
    }

    async checkIcons() {
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (!manifestLink) return;

        const manifestHref = manifestLink.getAttribute('href');
        try {
            const res = await fetch(manifestHref);
            const manifest = await res.json();
            
            if (!manifest.icons || manifest.icons.length === 0) {
                this.errors.push('❌ No icons defined in manifest');
                return;
            }

            let allIconsValid = true;
            const iconPromises = manifest.icons.map(icon => {
                return fetch(icon.src)
                    .then(res => {
                        if (res.ok) {
                            console.log(`✅ Icon found: ${icon.src} (${icon.sizes})`);
                            return true;
                        } else {
                            this.errors.push(`❌ Icon not found: ${icon.src}`);
                            allIconsValid = false;
                            return false;
                        }
                    })
                    .catch(err => {
                        this.errors.push(`❌ Icon check failed: ${icon.src} - ${err.message}`);
                        allIconsValid = false;
                        return false;
                    });
            });

            await Promise.all(iconPromises);
            this.requirements.icons = allIconsValid;
        } catch (err) {
            this.errors.push(`❌ Icon check error: ${err.message}`);
        }
    }

    logResults() {
        console.log('%c=== PWA Requirements Summary ===', 'color: #FFCC00; font-weight: bold; font-size: 12px');
        console.log('HTTPS:', this.requirements.https ? '✅' : '❌');
        console.log('Manifest:', this.requirements.manifest ? '✅' : '❌');
        console.log('Service Worker:', this.requirements.serviceWorker ? '✅' : '❌');
        console.log('Viewport:', this.requirements.viewport ? '✅' : '❌');
        console.log('Display Mode:', this.requirements.displayMode ? '✅ (Installed)' : '❌ (Not installed)');
        console.log('Icons:', this.requirements.icons ? '✅' : '❌');

        if (this.errors.length > 0) {
            console.log('%c=== Issues Found ===', 'color: #ff6b6b; font-weight: bold; font-size: 12px');
            this.errors.forEach(err => console.log(err));
        } else {
            console.log('%c✅ All PWA requirements met! Installation should work.', 'color: #51cf66; font-weight: bold; font-size: 12px');
        }
    }

    getReport() {
        return {
            requirements: this.requirements,
            errors: this.errors,
            isValid: this.errors.length === 0
        };
    }
}

// Auto-run checker when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pwaChecker = new PWAChecker();
        window.pwaChecker.checkAll();
    });
} else {
    window.pwaChecker = new PWAChecker();
    window.pwaChecker.checkAll();
}

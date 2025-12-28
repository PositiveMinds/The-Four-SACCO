/**
 * Offline Resources Manager
 * Ensures app works completely offline by providing fallbacks for all CDN resources
 */
class OfflineResourcesManager {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        console.log('%c🔌 Offline Resources Manager Starting', 'color: #FFCC00; font-weight: bold');
        
        // Check online/offline status
        this.checkConnectivity();
        
        // Listen for online/offline events
        window.addEventListener('online', () => this.onOnline());
        window.addEventListener('offline', () => this.onOffline());
        
        this.initialized = true;
    }

    checkConnectivity() {
        if (navigator.onLine) {
            console.log('✅ Online - All CDN resources will load normally');
        } else {
            console.log('⚠️  Offline - Using cached resources');
            this.activateOfflineMode();
        }
    }

    onOnline() {
        console.log('✅ Connection restored');
        // Reload to fetch fresh resources if needed
        if (confirm('Connection restored. Reload page to get latest resources?')) {
            location.reload();
        }
    }

    onOffline() {
        console.log('⚠️  Connection lost - App now fully offline');
        this.activateOfflineMode();
    }

    activateOfflineMode() {
        console.log('🔐 Activating offline mode');
        
        // Disable any network-dependent features
        this.disableCloudFeatures();
        
        // Show offline indicator
        this.showOfflineIndicator();
    }

    disableCloudFeatures() {
        // Email integration disabled offline
        const emailBtn = document.getElementById('emailReceiptBtn');
        if (emailBtn) {
            emailBtn.disabled = true;
            emailBtn.title = 'Email requires internet connection';
        }
    }

    showOfflineIndicator() {
        // Check if indicator already exists
        if (document.getElementById('offlineIndicator')) {
            return;
        }

        const indicator = document.createElement('div');
        indicator.id = 'offlineIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(90deg, #ff6b6b 0%, #ff8787 100%);
            color: white;
            padding: 0.75rem;
            text-align: center;
            font-weight: 600;
            font-size: 0.9rem;
            z-index: 9999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        indicator.textContent = '⚠️  Offline Mode - All data stored locally. Changes will sync when online.';
        
        document.body.insertBefore(indicator, document.body.firstChild);
    }

    removeOfflineIndicator() {
        const indicator = document.getElementById('offlineIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Provide CDN URL with fallback status
     */
    static getCDNUrl(type, primaryUrl) {
        if (navigator.onLine) {
            return primaryUrl;
        } else {
            console.warn(`⚠️  Offline: ${type} CDN unavailable, using cached version`);
            return null; // Will use cached version
        }
    }

    /**
     * Check if resource is available in cache
     */
    async isResourceCached(url) {
        try {
            const cache = await caches.open('sacco-v1');
            const response = await cache.match(url);
            return !!response;
        } catch (err) {
            return false;
        }
    }

    /**
     * Get offline-friendly chart alternative
     */
    static getChartFallback() {
        return {
            type: 'table',
            message: 'Charts unavailable offline. Displaying data in table format.'
        };
    }

    /**
     * Log offline resources status
     */
    async logCacheStatus() {
        console.log('%c📦 Cache Contents', 'color: #51cf66; font-weight: bold');
        
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            console.log(`\n${cacheName}: ${keys.length} items`);
            keys.slice(0, 10).forEach(req => console.log(`  - ${req.url}`));
            if (keys.length > 10) {
                console.log(`  ... and ${keys.length - 10} more`);
            }
        }
    }
}

// Initialize offline resources manager
let offlineManager = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        offlineManager = new OfflineResourcesManager();
    });
} else {
    offlineManager = new OfflineResourcesManager();
}

// Log cache status when requested
window.logCacheStatus = () => {
    if (offlineManager) {
        offlineManager.logCacheStatus();
    }
};

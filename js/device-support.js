/**
 * Multi-Device Support Module
 * Handles device detection, responsive behavior, and cross-device optimizations
 */

const DeviceSupport = {
    // Device detection properties
    device: {
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        isTouch: false,
        isHighDPI: false,
        isIOS: false,
        isAndroid: false,
        isStandalone: false, // PWA mode
        screenWidth: 0,
        screenHeight: 0,
        orientation: 'portrait',
        userAgent: ''
    },

    // Initialize device detection
    init() {
        this.detectDevice();
        this.detectOrientation();
        this.setupOrientationListener();
        this.setupResizeListener();
        this.setupTouchOptimization();
        this.detectAccessibility();
        this.setupPerformanceOptimizations();
        console.log('Device Support initialized:', this.device);
    },

    // Detect device type and capabilities
    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        this.device.userAgent = userAgent;

        // Screen dimensions
        this.device.screenWidth = Math.max(
            document.documentElement.clientWidth,
            window.innerWidth || 0
        );
        this.device.screenHeight = Math.max(
            document.documentElement.clientHeight,
            window.innerHeight || 0
        );

        // Touch detection
        this.device.isTouch = this.isTouchDevice();

        // High DPI detection
        this.device.isHighDPI = window.devicePixelRatio >= 2;

        // Mobile OS detection
        this.device.isIOS = /iphone|ipad|ipod/.test(userAgent);
        this.device.isAndroid = /android/.test(userAgent);

        // PWA detection
        this.device.isStandalone =
            window.navigator.standalone === true ||
            window.matchMedia('(display-mode: standalone)').matches ||
            window.matchMedia('(display-mode: fullscreen)').matches;

        // Device type classification
        if (this.device.screenWidth < 768) {
            this.device.isMobile = true;
            this.device.isTablet = false;
            this.device.isDesktop = false;
            document.documentElement.classList.add('device-mobile');
        } else if (this.device.screenWidth < 1024) {
            this.device.isMobile = false;
            this.device.isTablet = true;
            this.device.isDesktop = false;
            document.documentElement.classList.add('device-tablet');
        } else {
            this.device.isMobile = false;
            this.device.isTablet = false;
            this.device.isDesktop = true;
            document.documentElement.classList.add('device-desktop');
        }

        // Add class for touch devices
        if (this.device.isTouch) {
            document.documentElement.classList.add('touch-device');
        }

        // Add class for iOS
        if (this.device.isIOS) {
            document.documentElement.classList.add('ios-device');
        }

        // Add class for Android
        if (this.device.isAndroid) {
            document.documentElement.classList.add('android-device');
        }

        // Add class for PWA
        if (this.device.isStandalone) {
            document.documentElement.classList.add('pwa-mode');
        }
    },

    // Detect orientation
    detectOrientation() {
        const orientation =
            window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        this.device.orientation = orientation;
        document.documentElement.classList.add(`orientation-${orientation}`);
    },

    // Setup orientation change listener
    setupOrientationListener() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                document.documentElement.classList.remove(
                    'orientation-portrait',
                    'orientation-landscape'
                );

                this.detectOrientation();
                this.detectDevice(); // Re-detect as dimensions change
                this.optimizeForOrientation();
            }, 100);
        });
    },

    // Optimize layout for orientation
    optimizeForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;

        if (isLandscape && window.innerHeight < 500) {
            // Compact landscape mode
            document.documentElement.style.setProperty('--compact-mode', '1');
        } else {
            document.documentElement.style.setProperty('--compact-mode', '0');
        }
    },

    // Setup resize listener
    setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const oldWidth = this.device.screenWidth;
                this.detectDevice();

                // Trigger layout adjustment if breakpoint changed
                if (
                    (oldWidth < 768 && this.device.screenWidth >= 768) ||
                    (oldWidth >= 768 && this.device.screenWidth < 768) ||
                    (oldWidth < 1024 && this.device.screenWidth >= 1024) ||
                    (oldWidth >= 1024 && this.device.screenWidth < 1024)
                ) {
                    this.handleBreakpointChange();
                }
            }, 250);
        });
    },

    // Handle viewport breakpoint changes
    handleBreakpointChange() {
        // Trigger page refresh if needed
        if (window.UI && window.UI.refreshPage) {
            const activePage = document.querySelector('.page.active');
            if (activePage) {
                const pageName = activePage.id;
                window.UI.refreshPage(pageName);
            }
        }
    },

    // Check if device supports touch
    isTouchDevice() {
        return (
            (typeof window !== 'undefined' &&
                ('ontouchstart' in window ||
                    navigator.maxTouchPoints > 0 ||
                    navigator.msMaxTouchPoints > 0)) ||
            window.matchMedia('(hover: none)').matches
        );
    },

    // Setup touch optimizations
    setupTouchOptimization() {
        if (!this.device.isTouch) return;

        // Prevent double-tap zoom on buttons
        let lastTap = 0;
        document.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                e.preventDefault();
            }
            lastTap = currentTime;
        });

        // Optimize scrolling
        document.addEventListener('touchmove', (e) => {
            // Only passive listeners can prevent scrolling
        }, { passive: true });

        // Add touch feedback
        this.setupTouchFeedback();
    },

    // Setup visual feedback for touch interactions
    setupTouchFeedback() {
        const interactiveElements = document.querySelectorAll('button, .form-control, a, .card');

        interactiveElements.forEach((element) => {
            element.addEventListener('touchstart', function () {
                this.classList.add('touch-active');
            });

            element.addEventListener('touchend', function () {
                this.classList.remove('touch-active');
            });

            element.addEventListener('touchcancel', function () {
                this.classList.remove('touch-active');
            });
        });
    },

    // Detect accessibility preferences
    detectAccessibility() {
        // Reduce motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            document.documentElement.classList.add('reduce-motion');
        }

        // Dark mode preference
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDarkMode) {
            document.documentElement.classList.add('dark-mode');
        }

        // Large text preference
        const prefersLargeText = window.matchMedia('(prefers-contrast: more)').matches;
        if (prefersLargeText) {
            document.documentElement.classList.add('high-contrast');
        }

        // Listen for changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addListener((e) => {
            if (e.matches) {
                document.documentElement.classList.add('reduce-motion');
            } else {
                document.documentElement.classList.remove('reduce-motion');
            }
        });

        window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
            if (e.matches) {
                document.documentElement.classList.add('dark-mode');
            } else {
                document.documentElement.classList.remove('dark-mode');
            }
        });
    },

    // Setup performance optimizations
    setupPerformanceOptimizations() {
        // Lazy load images if available
        if ('IntersectionObserver' in window) {
            this.setupLazyLoading();
        }

        // Optimize for low-end devices
        if (this.isLowEndDevice()) {
            document.documentElement.classList.add('low-end-device');
            this.disableAnimations();
        }

        // Memory optimization on mobile
        if (this.device.isMobile) {
            this.optimizeMemory();
        }
    },

    // Check if device is low-end
    isLowEndDevice() {
        // Check device memory if available
        if (navigator.deviceMemory) {
            return navigator.deviceMemory < 4;
        }

        // Fallback: check for Android with low memory
        if (this.device.isAndroid) {
            return true; // Conservative approach
        }

        return false;
    },

    // Disable animations for performance
    disableAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            * {
                animation: none !important;
                transition: none !important;
            }
        `;
        document.head.appendChild(style);
    },

    // Optimize memory usage
    optimizeMemory() {
        // Limit number of visible items in lists
        const tables = document.querySelectorAll('table tbody tr');
        if (tables.length > 50) {
            // Implement pagination or virtual scrolling
            console.log('Large dataset detected, consider pagination');
        }

        // Clear cached data periodically on mobile
        if (!this.memoryOptimizationInterval) {
            this.memoryOptimizationInterval = setInterval(() => {
                // Trigger garbage collection if needed
                if (window.gc) {
                    window.gc();
                }
            }, 60000); // Every minute
        }
    },

    // Setup lazy loading
    setupLazyLoading() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    if (element.dataset.src) {
                        element.src = element.dataset.src;
                        observer.unobserve(element);
                    }
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach((img) => {
            observer.observe(img);
        });
    },

    // Get device info
    getDeviceInfo() {
        return {
            ...this.device,
            capabilities: {
                hasVibration: 'vibrate' in navigator,
                hasGeolocation: 'geolocation' in navigator,
                hasCamera: false, // Would need camera permission check
                hasNotifications: 'Notification' in window,
                hasServiceWorker: 'serviceWorker' in navigator,
                hasStorage: 'localStorage' in window,
                storageAvailable: this.getAvailableStorage(),
                networkConnection: this.getNetworkInfo(),
            },
        };
    },

    // Get available storage space
    getAvailableStorage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            return navigator.storage.estimate().then((estimate) => {
                return {
                    usage: estimate.usage,
                    quota: estimate.quota,
                    percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2),
                };
            });
        }
        return null;
    },

    // Get network connection info
    getNetworkInfo() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return {
                effectiveType: connection.effectiveType, // slow-2g, 2g, 3g, 4g
                downlink: connection.downlink, // Mbps
                rtt: connection.rtt, // milliseconds
                saveData: connection.saveData,
            };
        }
        return null;
    },

    // Adapt UI based on network
    adaptToNetwork() {
        const connection = navigator.connection;
        if (!connection) return;

        const effectiveType = connection.effectiveType;
        const saveData = connection.saveData;

        if (effectiveType === 'slow-2g' || effectiveType === '2g' || saveData) {
            document.documentElement.classList.add('slow-network');
            console.log('Slow network detected, reducing data usage');
        } else {
            document.documentElement.classList.remove('slow-network');
        }
    },

    // Get viewport info
    getViewportInfo() {
        return {
            width: this.device.screenWidth,
            height: this.device.screenHeight,
            aspectRatio: (this.device.screenWidth / this.device.screenHeight).toFixed(2),
            dpr: window.devicePixelRatio,
            physicalPPI: this.calculatePPI(),
        };
    },

    // Calculate physical PPI
    calculatePPI() {
        const ppi = window.devicePixelRatio * 96; // 96 is standard PPI
        return Math.round(ppi);
    },

    // Battery status monitoring
    monitorBattery() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then((battery) => {
                const updateBatteryStatus = () => {
                    if (battery.level <= 0.2) {
                        document.documentElement.classList.add('low-battery');
                    } else {
                        document.documentElement.classList.remove('low-battery');
                    }
                };

                updateBatteryStatus();
                battery.addEventListener('levelchange', updateBatteryStatus);
                battery.addEventListener('chargingchange', updateBatteryStatus);
            });
        }
    },

    // Request notification permission
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    },

    // Cleanup
    destroy() {
        if (this.memoryOptimizationInterval) {
            clearInterval(this.memoryOptimizationInterval);
        }
    },
};

// Initialize on document ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DeviceSupport.init());
} else {
    DeviceSupport.init();
}

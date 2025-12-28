/**
 * PWA Installation Handler
 * Manages app installation with multiple fallback strategies
 */
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.installBtn = null;
        this.promptAttempted = false;
        this.init();
    }

    init() {
        console.log('%c📱 PWA Installer initializing...', 'color: #FFCC00; font-weight: bold');

        // Check if app is already installed
        this.checkIfInstalled();

        if (!this.isInstalled) {
            // Listen for the beforeinstallprompt event (most important event)
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                this.deferredPrompt = e;
                console.log('%c✅ beforeinstallprompt event captured!', 'color: #51cf66; font-weight: bold');
                
                this.showInstallButton();
                this.showInstallBanner();
                
                // Auto-trigger after a short delay
                setTimeout(() => {
                    this.autoTriggerInstall();
                }, 1000);
            });

            // Fallback timeout - if beforeinstallprompt doesn't fire in 3 seconds
            setTimeout(() => {
                if (!this.deferredPrompt && !this.isInstalled) {
                    console.log('ℹ️  beforeinstallprompt event not captured (normal in some contexts)');
                    this.showInstallButton();
                    this.showInstallBanner();
                }
            }, 3000);
        }

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('%c✅ App installed successfully!', 'color: #51cf66; font-weight: bold');
            this.isInstalled = true;
            this.hideInstallButton();
            localStorage.setItem('pwaInstalled', 'true');
            this.deferredPrompt = null;

            if (typeof Swal !== 'undefined') {
                Swal.success('Installation Successful!', 'The Four SACCO is now installed on your device. You can use it offline anytime.');
            }
        });

        // Setup button listeners
        this.setupButtonListener();
    }

    checkIfInstalled() {
        // Check localStorage flag
        if (localStorage.getItem('pwaInstalled') === 'true') {
            console.log('✅ App already marked as installed in localStorage');
            this.isInstalled = true;
            this.hideInstallButton();
            return;
        }

        // Check if running as installed app on iOS
        if (window.navigator.standalone === true) {
            console.log('✅ App running in standalone mode (iOS)');
            this.isInstalled = true;
            localStorage.setItem('pwaInstalled', 'true');
            this.hideInstallButton();
            return;
        }

        // Check if app is in display mode standalone (Android)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('✅ App running in standalone mode (Android)');
            this.isInstalled = true;
            localStorage.setItem('pwaInstalled', 'true');
            this.hideInstallButton();
            return;
        }

        this.isInstalled = false;
        console.log('App is not installed yet');
    }

    setupButtonListener() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.attachButtonListener();
            });
        } else {
            this.attachButtonListener();
        }
    }

    attachButtonListener() {
        this.installBtn = document.getElementById('pwaInstallBtn');
        if (this.installBtn) {
            this.installBtn.addEventListener('click', () => {
                console.log('Install button clicked');
                this.handleInstallClick();
            });
        }
    }

    /**
     * Auto-trigger installation after a delay
     */
    autoTriggerInstall() {
        if (this.deferredPrompt && !this.isInstalled && !this.promptAttempted) {
            console.log('Showing installation prompt');
            
            if (typeof Swal !== 'undefined') {
                Swal.info('App Ready', 'The Four SACCO app is ready to be installed. You can use it offline.');
            }

            setTimeout(() => {
                this.handleInstallClick();
            }, 500);
        }
    }

    showInstallButton() {
        if (this.isInstalled) return;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.displayButton();
            });
        } else {
            this.displayButton();
        }
    }

    displayButton() {
        this.installBtn = document.getElementById('pwaInstallBtn');
        if (this.installBtn) {
            this.installBtn.style.display = 'block';
            console.log('✅ Install button displayed');
        }
    }

    showInstallBanner() {
        const banner = document.getElementById('installBanner');
        const dismissedBanner = localStorage.getItem('installBannerDismissed');
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (banner && !dismissedBanner && !isMobile && !this.isInstalled) {
            banner.style.display = 'block';
            console.log('✅ Install banner displayed');

            const installBtn = document.getElementById('installBannerBtn');
            const dismissBtn = document.getElementById('dismissBannerBtn');

            if (installBtn) {
                installBtn.addEventListener('click', () => this.handleInstallClick());
            }

            if (dismissBtn) {
                dismissBtn.addEventListener('click', () => {
                    banner.style.display = 'none';
                    localStorage.setItem('installBannerDismissed', 'true');
                });
            }
        }
    }

    hideInstallButton() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.removeButton();
            });
        } else {
            this.removeButton();
        }
    }

    removeButton() {
        this.installBtn = document.getElementById('pwaInstallBtn');
        if (this.installBtn) {
            this.installBtn.style.display = 'none';
        }
    }

    async handleInstallClick() {
        if (!this.deferredPrompt) {
            console.warn('⚠️  Install prompt not available');
            this.showAlternativeInstallInstructions();
            return;
        }

        try {
            this.promptAttempted = true;
            console.log('Triggering install prompt...');

            // Show the install prompt
            this.deferredPrompt.prompt();

            // Wait for user choice
            const { outcome } = await this.deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('%c✅ User accepted installation', 'color: #51cf66; font-weight: bold');
                this.isInstalled = true;
                localStorage.setItem('pwaInstalled', 'true');
                this.hideInstallButton();

                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Installation Complete!',
                        html: '<p>The Four SACCO is now installed on your device.</p><p>You can use all features offline.</p>',
                        confirmButtonColor: '#FFCC00',
                        confirmButtonText: 'Start Using'
                    });
                }
            } else {
                console.log('User dismissed installation prompt');
                if (typeof Swal !== 'undefined') {
                    Swal.info('Installation Deferred', 'You can install the app anytime by clicking the Install button in the top right.');
                }
            }

            this.deferredPrompt = null;
        } catch (error) {
            console.error('❌ Error handling install prompt:', error);
            this.showAlternativeInstallInstructions();
        }
    }

    showAlternativeInstallInstructions() {
        let title = '';
        let instructions = '';

        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            title = 'Install The Four on iOS';
            instructions = `
                <div style="text-align: left; margin-top: 1rem;">
                    <p style="font-size: 0.95rem; margin-bottom: 1rem;"><strong>iPhone, iPad & iPod</strong></p>
                    <ol style="margin-left: 1rem;">
                        <li>Tap the <strong>Share</strong> button (⬆️) at the bottom center</li>
                        <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                        <li>Customize the name if needed</li>
                        <li>Tap <strong>"Add"</strong> in the top right corner</li>
                        <li>The app will appear on your home screen</li>
                    </ol>
                    <p class="text-muted small" style="margin-top: 1rem; font-size: 0.85rem;">
                        ✓ Full offline support • Full screen experience
                    </p>
                </div>
            `;
        } else if (/Android/.test(navigator.userAgent)) {
            title = 'Install The Four on Android';
            instructions = `
                <div style="text-align: left; margin-top: 1rem;">
                    <p style="font-size: 0.95rem; margin-bottom: 1rem;"><strong>Android Phones & Tablets</strong></p>
                    <ol style="margin-left: 1rem;">
                        <li>Tap the <strong>Menu</strong> button (⋮ or ⊙) in the top right</li>
                        <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></li>
                        <li>Tap <strong>"Install"</strong> to confirm</li>
                        <li>The app will appear on your home screen</li>
                    </ol>
                    <p style="font-size: 0.9rem; margin-top: 1rem; margin-bottom: 1rem;"><strong>Alternative for older Android:</strong></p>
                    <ol style="margin-left: 1rem;">
                        <li>Tap the <strong>Menu</strong> button (⋮)</li>
                        <li>Tap <strong>"Add shortcut to home"</strong> or similar option</li>
                    </ol>
                    <p class="text-muted small" style="margin-top: 1rem; font-size: 0.85rem;">
                        ✓ Full offline support • Optimized for mobile & tablets
                    </p>
                </div>
            `;
        } else {
            title = 'Install The Four on Desktop/Laptop';
            instructions = `
                <div style="text-align: left; margin-top: 1rem;">
                    <p style="font-size: 0.95rem; margin-bottom: 1rem;"><strong>💻 Windows, Mac & Linux</strong></p>

                    <p style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">🌐 Chrome, Edge, or Brave (Recommended)</p>
                    <ol style="margin-left: 1rem; font-size: 0.9rem;">
                        <li>Look for the <strong>install icon</strong> (⬇️ or ⊞) on the <strong>right side of the address bar</strong></li>
                        <li>Click the icon and follow the prompts</li>
                        <li>The app installs on your Start Menu, Taskbar, or Applications folder</li>
                        <li>Opens in its own window without browser toolbars</li>
                    </ol>

                    <p style="font-size: 0.9rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">🦊 Firefox</p>
                    <ol style="margin-left: 1rem; font-size: 0.9rem;">
                        <li>Click the <strong>menu button</strong> (☰) in the top right</li>
                        <li>Select <strong>"Install The Four..."</strong></li>
                        <li>Click <strong>"Install"</strong> to confirm</li>
                    </ol>

                    <p style="font-size: 0.9rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;">🔧 Manual Desktop Shortcut</p>
                    <ol style="margin-left: 1rem; font-size: 0.9rem;">
                        <li><strong>Windows:</strong> Right-click the page → "Create Shortcut" → Place on Desktop</li>
                        <li><strong>Mac:</strong> Right-click the page → "Create Shortcut" → Save to Desktop</li>
                        <li><strong>Linux:</strong> Right-click the page → "Create Application Shortcut"</li>
                    </ol>

                    <p class="text-muted small" style="margin-top: 1.5rem; font-size: 0.85rem;">
                        ✓ Runs offline • No browser interface • Automatic updates • Works on all platforms
                    </p>
                </div>
            `;
        }

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: title,
                html: instructions,
                icon: 'info',
                confirmButtonText: 'Got it',
                confirmButtonColor: '#3b82f6',
                width: '600px',
                allowOutsideClick: true
            });
        } else {
            alert(`${title}\n\n${instructions}`);
        }
    }
}

// Initialize when DOM is ready
let pwaInstaller = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        pwaInstaller = new PWAInstaller();
    });
} else {
    pwaInstaller = new PWAInstaller();
}

// Sidebar Features Manager - QR Codes, Mobile Optimization, Digital Signatures
const SidebarFeatures = {
    currentTheme: 'gold',
    selectedLanguage: 'en',
    mobileOptimized: true,
    compactView: true,

    // Theme colors mapping
    themeColors: {
        gold: { primary: '#FFCC00', secondary: '#FFDC4E', text: '#000' },
        blue: { primary: '#0066CC', secondary: '#0052A3', text: '#FFF' },
        green: { primary: '#22C55E', secondary: '#16A34A', text: '#FFF' },
        red: { primary: '#EF4444', secondary: '#DC2626', text: '#FFF' }
    },

    // Localization strings
    translations: {
        en: {
            receiptFeatures: 'Receipt Features',
            qrCode: 'QR Code Verification',
            generateQR: 'Generate QR Code',
            mobileOptimization: 'Mobile Optimization',
            enableMobile: 'Enable mobile optimization',
            compactView: 'Use compact view',
            digitalSignatures: 'Digital Signatures',
            viewSample: 'View Sample',
            emailIntegration: 'Email Integration',
            sendReceipt: 'Send Receipt',
            languageSupport: 'Language Support',
            colorThemes: 'Color Themes'
        },
        sw: {
            receiptFeatures: 'Sifa za Hakati',
            qrCode: 'Uthibitisho wa Nambari QR',
            generateQR: 'Tengeneza Nambari QR',
            mobileOptimization: 'Uboreshaji wa Simu',
            enableMobile: 'Wezesha uboreshaji wa simu',
            compactView: 'Tumia muonekano wa kompakt',
            digitalSignatures: 'Saini za Kidijitali',
            viewSample: 'Angalia Mfano',
            emailIntegration: 'Ujumuishaji wa Barua Pepe',
            sendReceipt: 'Tuma Hakati',
            languageSupport: 'Msaada wa Lugha',
            colorThemes: 'Mada za Rangi'
        },
        lg: {
            receiptFeatures: 'Receipt Features',
            qrCode: 'QR Code Verification',
            generateQR: 'Generate QR Code',
            mobileOptimization: 'Mobile Optimization',
            enableMobile: 'Enable mobile optimization',
            compactView: 'Use compact view',
            digitalSignatures: 'Digital Signatures',
            viewSample: 'View Sample',
            emailIntegration: 'Email Integration',
            sendReceipt: 'Send Receipt',
            languageSupport: 'Language Support',
            colorThemes: 'Color Themes'
        }
    },

    init() {
        this.setupEventListeners();
        this.loadSettings();
    },

    setupEventListeners() {
        // Toggle sidebar - with null checks
        const toggleBtn = document.getElementById('toggleSidebarBtn');
        const closeBtn = document.getElementById('closeSidebarBtn');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.openSidebar());
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeSidebar();
            });
        }

        // QR Code generation
        const generateQRBtn = document.getElementById('generateQRBtn');
        if (generateQRBtn) {
            generateQRBtn.addEventListener('click', () => this.generateQRForMember());
        }

        // Digital signature info
        const signatureInfoBtn = document.getElementById('signatureInfoBtn');
        if (signatureInfoBtn) {
            signatureInfoBtn.addEventListener('click', () => this.showSignatureInfo());
        }

        // Email receipt
        const emailReceiptBtn = document.getElementById('emailReceiptBtn');
        const emailInput = document.getElementById('emailInput');
        
        if (emailReceiptBtn) {
            emailReceiptBtn.addEventListener('click', () => this.sendReceiptEmail());
        }
        if (emailInput) {
            emailInput.addEventListener('input', (e) => {
                const btn = document.getElementById('emailReceiptBtn');
                if (btn) btn.disabled = !this.isValidEmail(e.target.value);
            });
        }

        // Language selection
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.selectedLanguage = e.target.value;
                this.saveSettings();
            });
        }

        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const themeBtn = e.target.closest('.theme-btn');
                if (themeBtn) this.setTheme(themeBtn.dataset.theme);
            });
        });

        // Close sidebar on background overlay click
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('featuresSidebar');
            if (document.body.classList.contains('sidebar-open') && 
                !sidebar.contains(e.target) && 
                !document.getElementById('toggleSidebarBtn').contains(e.target)) {
                this.closeSidebar();
            }
        });
    },

    openSidebar() {
        const sidebar = document.getElementById('featuresSidebar');
        sidebar.classList.add('show');
        document.body.classList.add('sidebar-open');
    },

    closeSidebar() {
        const sidebar = document.getElementById('featuresSidebar');
        sidebar.classList.remove('show');
        document.body.classList.remove('sidebar-open');
    },

    // Generate QR code for selected member with their details
    async generateQRForMember() {
        try {
            // Get current member context or ask user
            const members = await Storage.getMembers();
            
            if (members.length === 0) {
                Swal.fire('Info', 'No members registered yet', 'info');
                return;
            }

            // Create member selection modal
            const memberOptions = members.map(m => `
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="member" id="member-${m.id}" value="${m.id}" ${members[0].id === m.id ? 'checked' : ''}>
                    <label class="form-check-label" for="member-${m.id}">
                        ${m.name} (ID: ${m.idNo})
                    </label>
                </div>
            `).join('');

            const { isConfirmed, value } = await Swal.fire({
                title: 'Select Member for QR Code',
                html: `
                    <div style="text-align: left; max-height: 300px; overflow-y: auto;">
                        ${memberOptions}
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Generate QR Code',
                didOpen: () => {
                    const checked = document.querySelector('input[name="member"]:checked');
                    if (checked) checked.focus();
                }
            });

            if (!isConfirmed) return;

            const selectedMemberId = document.querySelector('input[name="member"]:checked')?.value;
            const member = members.find(m => m.id === selectedMemberId);

            if (!member) {
                Swal.fire('Error', 'Please select a member', 'error');
                return;
            }

            // Get member financial data
            const savings = await Storage.getSavings();
            const loans = await Storage.getLoans();
            const withdrawals = await Storage.getWithdrawals();

            const memberSavings = savings
                .filter(s => s.memberId === member.id)
                .reduce((sum, s) => sum + s.amount, 0);

            const memberWithdrawals = withdrawals
                .filter(w => w.memberId === member.id)
                .reduce((sum, w) => sum + w.amount, 0);

            // Create human-readable QR data with only essential member information
            const qrDataString = `MEMBER PROFILE
${member.name}
ID: ${member.idNo}
Email: ${member.email}
Phone: ${member.phone}`;

            // Generate QR code
            const qrCode = await ReceiptGenerator.generateQRCode(qrDataString, 250);

            if (qrCode) {
                // Show preview
                const preview = document.getElementById('qrPreview');
                preview.innerHTML = `
                    <img src="${qrCode}" alt="QR Code" style="max-width: 100%; height: auto;">
                    <div style="margin-top: 10px; font-size: 0.8rem; color: var(--text-muted); text-align: left; background: white; padding: 10px; border-radius: 4px; font-family: monospace; line-height: 1.5;">
                        <div style="color: var(--dark); font-weight: bold; margin-bottom: 5px;">Scanned Data:</div>
                        <div style="white-space: pre-wrap; color: var(--text); font-size: 0.75rem;">
SACCO MEMBER
━━━━━━━━━━━━━━━━━━━━
Name: ${member.name}
Member ID: ${member.idNo}
Email: ${member.email}
Phone: ${member.phone}

Generated: ${new Date().toLocaleString()}
                        </div>
                    </div>
                `;
                preview.style.display = 'block';

                // Download option
                await Swal.fire({
                    title: 'QR Code Generated',
                    html: `
                        <img src="${qrCode}" style="max-width: 200px; margin: 10px 0; height: auto;">
                        <div style="margin-top: 15px; font-size: 0.85rem; text-align: left; background: #f5f5f5; padding: 12px; border-radius: 5px; font-family: monospace; line-height: 1.6; max-width: 100%; overflow-x: auto;">
                            <div style="font-weight: bold; color: #0f172a; margin-bottom: 8px;">📱 When Scanned:</div>
                            <div style="white-space: pre-wrap; color: #333; font-size: 0.8rem;">
SACCO MEMBER
━━━━━━━━━━━━━━━━━━━━
Name: ${member.name}
Member ID: ${member.idNo}
Email: ${member.email}
Phone: ${member.phone}

Generated: ${new Date().toLocaleString()}
                            </div>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonText: 'Download',
                    showCancelButton: true,
                    cancelButtonText: 'Close'
                }).then(result => {
                    if (result.isConfirmed) {
                        this.downloadQRCode(qrCode, `${member.name}_QR.png`);
                    }
                });
            } else {
                Swal.fire('Error', 'Failed to generate QR code. The QRCode library may not have loaded. Please check your internet connection and try again.', 'error');
            }
        } catch (error) {
            console.error('QR Generation error:', error);
            Swal.fire('Error', 'Failed to generate QR code: ' + error.message + '\n\nMake sure you have an active internet connection to load the QR code library.', 'error');
        }
    },

    downloadQRCode(dataUrl, filename) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    showSignatureInfo() {
        const signature = ReceiptGenerator.generateSignature();
        
        Swal.fire({
            title: 'Digital Signature Sample',
            html: `
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; font-family: monospace;">
                    <p style="margin: 0; color: #666; font-size: 0.9rem;">Sample Digital Signature:</p>
                    <p style="margin: 10px 0; font-weight: bold; font-size: 1.1rem; letter-spacing: 2px;">${signature}</p>
                </div>
                <p style="font-size: 0.9rem; color: #666; margin-top: 15px;">
                    Each receipt includes a unique digital signature generated with:
                </p>
                <ul style="text-align: left; font-size: 0.9rem;">
                    <li>Timestamp of receipt generation</li>
                    <li>Random cryptographic token</li>
                    <li>Organization identifier</li>
                    <li>Base64 encoding</li>
                </ul>
                <p style="font-size: 0.85rem; color: #999; margin-top: 15px;">
                    This ensures authenticity and prevents tampering with receipts.
                </p>
            `,
            icon: 'info'
        });
    },

    async sendReceiptEmail() {
        const email = document.getElementById('emailInput').value;

        if (!this.isValidEmail(email)) {
            Swal.fire('Error', 'Please enter a valid email address', 'error');
            return;
        }

        // Check if browser supports email sending
        const mailtoLink = `mailto:${email}?subject=Your SACCO Receipt&body=Please note: In this demo, email sending is simulated. In production, this would send via a backend service.`;
        
        Swal.fire({
            title: 'Email Receipt',
            html: `
                <p style="margin: 15px 0;">Email will be sent to: <strong>${email}</strong></p>
                <p style="font-size: 0.9rem; color: #666;">
                    <strong>Note:</strong> This demo uses a simulated email service. In production, receipts would be sent via SMTP.
                </p>
                <div style="background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: left; font-size: 0.85rem;">
                    <p><strong>Email would contain:</strong></p>
                    <ul>
                        <li>PDF receipt attachment</li>
                        <li>Member information</li>
                        <li>Transaction details</li>
                        <li>Digital signature</li>
                        <li>QR code for verification</li>
                    </ul>
                </div>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Simulate Send',
            cancelButtonText: 'Cancel'
        }).then(result => {
            if (result.isConfirmed) {
                Swal.fire('Success', `Email would be sent to ${email}`, 'success');
                document.getElementById('emailInput').value = '';
            }
        });
    },

    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    setTheme(theme) {
        this.currentTheme = theme;
        
        // Update active button
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-theme="${theme}"]`).classList.add('active');

        // Apply theme to document if needed
        this.applyThemeToReceipts();
        this.saveSettings();
    },

    applyThemeToReceipts() {
        const colors = this.themeColors[this.currentTheme];
        // This would be applied when generating receipts
        document.documentElement.style.setProperty('--receipt-primary', colors.primary);
        document.documentElement.style.setProperty('--receipt-secondary', colors.secondary);
    },

    formatNumber(num) {
        return new Intl.NumberFormat('en-US').format(Math.round(num));
    },

    saveSettings() {
        const settings = {
            theme: this.currentTheme,
            language: this.selectedLanguage,
            mobileOptimized: this.mobileOptimized,
            compactView: this.compactView
        };
        localStorage.setItem('sidebarFeatures', JSON.stringify(settings));
    },

    loadSettings() {
        try {
            const saved = localStorage.getItem('sidebarFeatures');
            if (saved) {
                const settings = JSON.parse(saved);
                this.currentTheme = settings.theme || 'gold';
                this.selectedLanguage = settings.language || 'en';
                this.mobileOptimized = settings.mobileOptimized !== false;
                this.compactView = settings.compactView !== false;

                // Apply loaded settings to UI
                const mobileToggle = document.getElementById('mobileOptimizeToggle');
                const compactToggle = document.getElementById('compactViewToggle');
                const langSelect = document.getElementById('languageSelect');
                const themeBtn = document.querySelector(`[data-theme="${this.currentTheme}"]`);
                
                if (mobileToggle) mobileToggle.checked = this.mobileOptimized;
                if (compactToggle) compactToggle.checked = this.compactView;
                if (langSelect) langSelect.value = this.selectedLanguage;
                if (themeBtn) themeBtn.classList.add('active');
                
                this.applyThemeToReceipts();
            }
        } catch (error) {
            console.warn('Failed to load sidebar settings:', error);
        }

        // Initialize mobile optimization listeners
        this.initMobileOptimization();
    },

    // Mobile Optimization Features
    initMobileOptimization() {
        const mobileOptimizeToggle = document.getElementById('mobileOptimizeToggle');
        const compactViewToggle = document.getElementById('compactViewToggle');
        const fontSizeSlider = document.getElementById('fontSizeSlider');
        const fontSizeValue = document.getElementById('fontSizeValue');
        const darkModeToggle = document.getElementById('darkModeToggle');

        // Mobile Optimization Toggle
        if (mobileOptimizeToggle) {
            mobileOptimizeToggle.addEventListener('change', () => {
                this.mobileOptimized = mobileOptimizeToggle.checked;
                localStorage.setItem('mobileOptimized', JSON.stringify(this.mobileOptimized));
                this.applyMobileOptimization();
            });
        }

        // Compact View Toggle
        if (compactViewToggle) {
            compactViewToggle.addEventListener('change', () => {
                this.compactView = compactViewToggle.checked;
                localStorage.setItem('compactView', JSON.stringify(this.compactView));
                this.applyCompactView();
            });
        }

        // Font Size Slider
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                const fontSize = e.target.value;
                if (fontSizeValue) fontSizeValue.textContent = fontSize;
                localStorage.setItem('fontSize', fontSize);
                this.applyFontSize(fontSize);
            });

            // Load saved font size
            const savedFontSize = localStorage.getItem('fontSize');
            if (savedFontSize) {
                fontSizeSlider.value = savedFontSize;
                if (fontSizeValue) fontSizeValue.textContent = savedFontSize;
                this.applyFontSize(savedFontSize);
            }
        }

        // Dark Mode Toggle
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', () => {
                const isDarkMode = darkModeToggle.checked;
                localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
                this.applyDarkMode(isDarkMode);
            });

            // Load saved dark mode setting
            const savedDarkMode = JSON.parse(localStorage.getItem('darkMode') || 'false');
            darkModeToggle.checked = savedDarkMode;
            this.applyDarkMode(savedDarkMode);
        }
    },

    applyMobileOptimization() {
        const body = document.body;
        if (this.mobileOptimized) {
            body.classList.add('mobile-optimized');
        } else {
            body.classList.remove('mobile-optimized');
        }
    },

    applyCompactView() {
        const main = document.querySelector('main');
        if (main) {
            if (this.compactView) {
                main.classList.add('compact-view');
            } else {
                main.classList.remove('compact-view');
            }
        }
    },

    applyFontSize(fontSize) {
        const root = document.documentElement;
        root.style.setProperty('--font-size-base', `${fontSize}px`);
    },

    applyDarkMode(isDarkMode) {
        const body = document.body;
        const root = document.documentElement;
        
        if (isDarkMode) {
            body.classList.add('dark-mode');
            root.style.setProperty('--light', '#1a1a1a');
            root.style.setProperty('--lighter', '#2d2d2d');
            root.style.setProperty('--dark', '#f0f0f0');
            root.style.setProperty('--text', '#e0e0e0');
            root.style.setProperty('--text-muted', '#a0a0a0');
            root.style.setProperty('--border', '#3a3a3a');
        } else {
            body.classList.remove('dark-mode');
            root.style.setProperty('--light', '#f8fafc');
            root.style.setProperty('--lighter', '#f1f5f9');
            root.style.setProperty('--dark', '#0f172a');
            root.style.setProperty('--text', '#334155');
            root.style.setProperty('--text-muted', '#64748b');
            root.style.setProperty('--border', '#e2e8f0');
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    SidebarFeatures.init();
});

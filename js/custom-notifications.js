// Custom Notification System - REPLACED WITH SWEETALERT2
// This file is kept for backward compatibility but delegates to SweetAlert2

// Wait for SweetAlert2 to load, then create a wrapper
class SweetAlert2Wrapper {
    constructor() {
        // Check if real Swal (SweetAlert2) is available
        let attempts = 0;
        const waitForSwal = setInterval(() => {
            if (typeof window.Swal !== 'undefined' && window.Swal.fire) {
                console.log('SweetAlert2 loaded successfully');
                clearInterval(waitForSwal);
            } else if (attempts++ > 50) {
                console.warn('SweetAlert2 failed to load after 5 seconds, using fallback');
                clearInterval(waitForSwal);
            }
        }, 100);
    }

    // Toast notification - auto-dismiss
    toast(title, message = '', type = 'info', duration = 5000) {
        if (typeof window.Swal === 'undefined' || !window.Swal.fire) {
            console.warn('SweetAlert2 not available');
            return;
        }

        const icons = {
            success: 'success',
            error: 'error',
            warning: 'warning',
            info: 'info',
            question: 'question'
        };

        return window.Swal.fire({
            icon: icons[type] || 'info',
            title: title,
            html: message,
            position: 'top-end',
            toast: true,
            timer: duration,
            timerProgressBar: true,
            showConfirmButton: false,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', window.Swal.stopTimer);
                toast.addEventListener('mouseleave', window.Swal.resumeTimer);
            }
        });
    }

    // Modal dialog - requires user interaction
    fire(config) {
        if (typeof window.Swal === 'undefined' || !window.Swal.fire) {
            console.warn('SweetAlert2 not available');
            return Promise.resolve({
                isConfirmed: false,
                isDenied: true,
                isDismissed: true
            });
        }

        const {
            title = '',
            html = '',
            icon = 'info',
            confirmButtonText = 'OK',
            cancelButtonText = 'Cancel',
            showCancelButton = false,
            input = null,
            inputPlaceholder = '',
            inputOptions = {},
            didOpen = null,
            willClose = null
        } = config;

        const swalConfig = {
            title: title,
            html: html,
            icon: icon,
            confirmButtonText: confirmButtonText,
            cancelButtonColor: '#6b7280',
            showCancelButton: showCancelButton,
            didOpen: didOpen,
            willClose: willClose
        };

        if (showCancelButton) {
            swalConfig.cancelButtonText = cancelButtonText;
        }

        if (input === 'select' && Object.keys(inputOptions).length > 0) {
            swalConfig.input = 'select';
            swalConfig.inputOptions = inputOptions;
            swalConfig.inputPlaceholder = inputPlaceholder;
        } else if (input) {
            swalConfig.input = input;
            swalConfig.inputPlaceholder = inputPlaceholder;
        }

        return window.Swal.fire(swalConfig);
    }

    // Success notification
    success(title, message = '') {
        return this.toast(title, message, 'success', 5000);
    }

    // Error notification
    error(title, message = '') {
        return this.toast(title, message, 'error', 5000);
    }

    // Warning notification
    warning(title, message = '') {
        return this.toast(title, message, 'warning', 5000);
    }

    // Info notification
    info(title, message = '') {
        return this.toast(title, message, 'info', 5000);
    }

    // Confirm dialog
    async confirm(title, message = '', confirmText = 'Confirm', cancelText = 'Cancel') {
        if (typeof window.Swal === 'undefined' || !window.Swal.fire) {
            return false;
        }

        const result = await window.Swal.fire({
            title,
            html: message,
            icon: 'question',
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            showCancelButton: true
        });
        return result.isConfirmed;
    }

    // Prompt dialog
    async prompt(title, message = '', inputPlaceholder = '', confirmText = 'OK', cancelText = 'Cancel') {
        if (typeof window.Swal === 'undefined' || !window.Swal.fire) {
            return null;
        }

        const result = await window.Swal.fire({
            title,
            html: message,
            icon: 'question',
            input: 'text',
            inputPlaceholder,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            showCancelButton: true
        });
        return result.isConfirmed ? result.value : null;
    }
}

// Create global instance and expose as Swal for backward compatibility
// If real Swal (SweetAlert2) is already loaded, we'll use it directly
// Otherwise, this wrapper will use it once it loads
if (typeof window.Swal === 'undefined' || !window.Swal.fire) {
    window.Swal = new SweetAlert2Wrapper();
}

// SweetAlert Integration for Notifications & Feedback
// This module integrates SweetAlert2 for better UX notifications and user feedback

class SweetAlertNotifications {
    constructor() {
        this.isAvailable = typeof window.Swal !== 'undefined' && window.Swal.fire;
        if (!this.isAvailable) {
            console.warn('SweetAlert2 not available, notifications will use fallback');
        }
    }

    /**
     * Show a success notification
     */
    success(title, message = '', position = 'top-end', duration = 5000) {
        if (!this.isAvailable) return;

        return window.Swal.fire({
            icon: 'success',
            title: title,
            html: message,
            position: position,
            toast: position !== 'center',
            timer: duration,
            timerProgressBar: true,
            showConfirmButton: duration === 0,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', window.Swal.stopTimer)
                toast.addEventListener('mouseleave', window.Swal.resumeTimer)
            }
        });
    }

    /**
     * Show an error notification
     */
    error(title, message = '', position = 'top-end', duration = 5000) {
        if (!this.isAvailable) return;

        return window.Swal.fire({
            icon: 'error',
            title: title,
            html: message,
            position: position,
            toast: position !== 'center',
            timer: duration,
            timerProgressBar: true,
            showConfirmButton: duration === 0,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', window.Swal.stopTimer)
                toast.addEventListener('mouseleave', window.Swal.resumeTimer)
            }
        });
    }

    /**
     * Show a warning notification
     */
    warning(title, message = '', position = 'top-end', duration = 5000) {
        if (!this.isAvailable) return;

        return window.Swal.fire({
            icon: 'warning',
            title: title,
            html: message,
            position: position,
            toast: position !== 'center',
            timer: duration,
            timerProgressBar: true,
            showConfirmButton: duration === 0,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', window.Swal.stopTimer)
                toast.addEventListener('mouseleave', window.Swal.resumeTimer)
            }
        });
    }

    /**
     * Show an info notification
     */
    info(title, message = '', position = 'top-end', duration = 5000) {
        if (!this.isAvailable) return;

        return window.Swal.fire({
            icon: 'info',
            title: title,
            html: message,
            position: position,
            toast: position !== 'center',
            timer: duration,
            timerProgressBar: true,
            showConfirmButton: duration === 0,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', window.Swal.stopTimer)
                toast.addEventListener('mouseleave', window.Swal.resumeTimer)
            }
        });
    }

    /**
     * Show a confirmation dialog
     */
    confirm(title, message = '', confirmText = 'Confirm', cancelText = 'Cancel', icon = 'question') {
        if (!this.isAvailable) return Promise.resolve(false);

        return window.Swal.fire({
            icon: icon,
            title: title,
            html: message,
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6b7280'
        }).then(result => result.isConfirmed);
    }

    /**
     * Show a prompt dialog
     */
    prompt(title, message = '', inputPlaceholder = '', confirmText = 'OK', cancelText = 'Cancel', inputType = 'text') {
        if (!this.isAvailable) return Promise.resolve(null);

        return window.Swal.fire({
            icon: 'question',
            title: title,
            html: message,
            input: inputType,
            inputPlaceholder: inputPlaceholder,
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6b7280',
            inputValidator: (value) => {
                if (!value) {
                    return 'Input cannot be empty!'
                }
            }
        }).then(result => result.isConfirmed ? result.value : null);
    }

    /**
     * Show a modal with custom HTML content
     */
    modal(title, html = '', confirmText = 'OK', showCancel = false, cancelText = 'Cancel') {
        if (!this.isAvailable) return Promise.resolve(false);

        const config = {
            title: title,
            html: html,
            showCancelButton: showCancel,
            confirmButtonText: confirmText,
            confirmButtonColor: '#3b82f6',
        };

        if (showCancel) {
            config.cancelButtonText = cancelText;
            config.cancelButtonColor = '#6b7280';
        }

        return window.Swal.fire(config).then(result => result.isConfirmed);
    }

    /**
     * Payment recorded notification
     */
    paymentRecorded(memberName, amount) {
        return this.success(
            '💳 Payment Recorded',
            `Payment of <strong>UGX ${this.formatNumber(amount)}</strong> recorded for <strong>${memberName}</strong>`
        );
    }

    /**
     * Loan created notification
     */
    loanCreated(memberName, amount, monthlyPayment) {
        return this.success(
            '💰 Loan Created',
            `Loan of <strong>UGX ${this.formatNumber(amount)}</strong> created for <strong>${memberName}</strong><br>Monthly Payment: <strong>UGX ${this.formatNumber(monthlyPayment)}</strong>`
        );
    }

    /**
     * Saving recorded notification
     */
    savingRecorded(memberName, amount) {
        return this.success(
            '🏦 Saving Recorded',
            `Saving of <strong>UGX ${this.formatNumber(amount)}</strong> recorded for <strong>${memberName}</strong>`
        );
    }

    /**
     * Withdrawal recorded notification
     */
    withdrawalRecorded(memberName, amount) {
        return this.success(
            '💸 Withdrawal Recorded',
            `Withdrawal of <strong>UGX ${this.formatNumber(amount)}</strong> recorded for <strong>${memberName}</strong>`
        );
    }

    /**
     * Member added notification
     */
    memberAdded(memberName, memberId) {
        return this.success(
            '👤 Member Added',
            `New member <strong>${memberName}</strong> (ID: ${memberId}) has been registered`
        );
    }

    /**
     * Loan overdue notification
     */
    loanOverdue(memberName, daysOverdue, amount) {
        return this.warning(
            '⚠️ Loan Overdue',
            `Loan payment for <strong>${memberName}</strong> is <strong>${daysOverdue} days overdue</strong><br>Amount: <strong>UGX ${this.formatNumber(amount)}</strong>`,
            'top-end',
            0 // No auto-close for warnings
        );
    }

    /**
     * Payment due soon notification
     */
    paymentDueSoon(memberName, daysUntilDue, amount) {
        return this.info(
            '📅 Payment Due Soon',
            `Payment for <strong>${memberName}</strong> is due in <strong>${daysUntilDue} day(s)</strong><br>Amount: <strong>UGX ${this.formatNumber(amount)}</strong>`
        );
    }

    /**
     * Multiple payments overdue alert
     */
    paymentsOverdue(count, totalAmount) {
        return this.error(
            '🔴 Overdue Payments Alert',
            `<strong>${count}</strong> payment(s) overdue with total amount of <strong>UGX ${this.formatNumber(totalAmount)}</strong>`,
            'center',
            0
        );
    }

    /**
     * Milestone achievement notification
     */
    milestoneAchieved(title, message) {
        return this.success(
            '🎉 ' + title,
            message,
            'center',
            0
        );
    }

    /**
     * Data export confirmation
     */
    exportConfirmation(fileName) {
        return this.success(
            '📥 Export Successful',
            `Your data has been exported to <strong>${fileName}</strong>`
        );
    }

    /**
     * Data backup confirmation
     */
    backupConfirmation(backupName) {
        return this.success(
            '💾 Backup Successful',
            `Backup created: <strong>${backupName}</strong>`
        );
    }

    /**
     * Data restore confirmation
     */
    restoreConfirmation(itemCount) {
        return this.success(
            '🔄 Restore Successful',
            `<strong>${itemCount}</strong> items restored successfully`
        );
    }

    /**
     * Error with details
     */
    errorWithDetails(title, message, details = '') {
        let html = message;
        if (details) {
            html += `<hr style="margin: 15px 0;"><small style="color: #666;">${details}</small>`;
        }
        return this.error(title, html, 'center', 0);
    }

    /**
     * Loading dialog
     */
    loading(title = 'Loading...', message = 'Please wait') {
        if (!this.isAvailable) return;

        return window.Swal.fire({
            title: title,
            html: message,
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                window.Swal.showLoading()
            }
        });
    }

    /**
     * Close loading dialog
     */
    closeLoading() {
        if (!this.isAvailable) return;
        window.Swal.close();
    }

    /**
     * Format number for display
     */
    formatNumber(num) {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }
}

// Create global instance
const SweetAlertUI = new SweetAlertNotifications();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SweetAlertUI;
}

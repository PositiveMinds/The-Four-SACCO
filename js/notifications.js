// Push Notifications System
class NotificationManager {
    constructor() {
        this.supported = 'Notification' in window && 'serviceWorker' in navigator;
        this.permission = Notification.permission;
        this.isSubscribed = false;
        this.init();
    }

    async init() {
        if (!this.supported) {
            console.warn('Push notifications not supported in this browser');
            return;
        }

        // Check if notifications are already subscribed
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            this.isSubscribed = !!subscription;
        }
    }

    async requestPermission() {
        if (!this.supported) {
            console.warn('Push notifications not supported');
            return false;
        }

        if (this.permission === 'granted') {
            return true;
        }

        if (this.permission === 'denied') {
            console.warn('User has denied notification permission');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                console.log('Notification permission granted');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    async subscribe() {
        if (!this.supported) return false;

        const hasPermission = await this.requestPermission();
        if (!hasPermission) return false;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                    'BLV7HVZ3VVpN8Z0ZZ3p5V0p5V3Z5V0p5V0p5V0p5V0p5V0p5V0p5V0p5V0p5V0p5V0p'
                )
            });

            this.isSubscribed = true;
            console.log('Push subscription successful');
            return subscription;
        } catch (error) {
            console.error('Push subscription failed:', error);
            return false;
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    async showNotification(title, options = {}) {
        if (!this.supported) {
            console.warn('Notifications not supported');
            return;
        }

        if (this.permission !== 'granted') {
            console.warn('Notification permission not granted');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
                icon: '/images/image-192.png',
                badge: '/images/image-192.png',
                ...options
            });
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    notifyPaymentRecorded(memberName, amount, loanId) {
        const options = {
            body: `Payment of UGX ${amount.toLocaleString()} recorded for ${memberName}`,
            tag: `payment-${loanId}-${Date.now()}`,
            requireInteraction: false,
            vibrate: [100, 50, 100],
            data: {
                type: 'payment',
                loanId,
                memberName,
                amount
            }
        };

        this.showNotification('💳 Payment Recorded', options);
    }

    notifyLoanCreated(memberName, amount, loanId) {
        const options = {
            body: `Loan of UGX ${amount.toLocaleString()} created for ${memberName}`,
            tag: `loan-${loanId}`,
            requireInteraction: false,
            vibrate: [100, 50, 100],
            data: {
                type: 'loan',
                loanId,
                memberName,
                amount
            }
        };

        this.showNotification('💰 Loan Created', options);
    }

    notifySavingRecorded(memberName, amount, savingId) {
        const options = {
            body: `Saving of UGX ${amount.toLocaleString()} recorded for ${memberName}`,
            tag: `saving-${savingId}`,
            requireInteraction: false,
            vibrate: [100, 50, 100],
            data: {
                type: 'saving',
                savingId,
                memberName,
                amount
            }
        };

        this.showNotification('🏦 Saving Recorded', options);
    }

    notifyWithdrawalRecorded(memberName, amount, withdrawalId) {
        const options = {
            body: `Withdrawal of UGX ${amount.toLocaleString()} recorded for ${memberName}`,
            tag: `withdrawal-${withdrawalId}`,
            requireInteraction: false,
            vibrate: [100, 50, 100],
            data: {
                type: 'withdrawal',
                withdrawalId,
                memberName,
                amount
            }
        };

        this.showNotification('💸 Withdrawal Recorded', options);
    }

    notifyMemberAdded(memberName, memberId) {
        const options = {
            body: `New member ${memberName} has been registered`,
            tag: `member-${memberId}`,
            requireInteraction: false,
            vibrate: [100, 50, 100],
            data: {
                type: 'member',
                memberId,
                memberName
            }
        };

        this.showNotification('👤 Member Added', options);
    }

    notifyLoanOverdue(memberName, loanId, daysOverdue) {
        const options = {
            body: `Loan payment is ${daysOverdue} days overdue for ${memberName}`,
            tag: `overdue-${loanId}`,
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200],
            data: {
                type: 'overdue',
                loanId,
                memberName,
                daysOverdue
            }
        };

        this.showNotification('⚠️ Loan Overdue', options);
    }

    notifyMilestoneAchieved(title, message) {
        const options = {
            body: message,
            tag: `milestone-${Date.now()}`,
            requireInteraction: false,
            vibrate: [100, 50, 100, 50, 100],
            data: {
                type: 'milestone'
            }
        };

        this.showNotification('🎉 ' + title, options);
    }

    notifyPaymentDue(memberName, loanId, dueAmount, daysUntilDue) {
        const urgency = daysUntilDue <= 0 ? '⚠️ OVERDUE' : '📅 DUE SOON';
        const body = daysUntilDue > 0 
            ? `Payment of UGX ${dueAmount.toLocaleString()} due in ${daysUntilDue} day(s) for ${memberName}`
            : `Payment of UGX ${dueAmount.toLocaleString()} is ${Math.abs(daysUntilDue)} day(s) overdue for ${memberName}`;
        
        const options = {
            body: body,
            tag: `due-${loanId}`,
            requireInteraction: daysUntilDue <= 0,
            vibrate: daysUntilDue <= 0 ? [300, 100, 300, 100, 300] : [100, 50, 100],
            data: {
                type: 'payment-due',
                loanId,
                memberName,
                dueAmount,
                daysUntilDue
            }
        };

        this.showNotification(urgency, options);
    }

    notifyPaymentsDueSoon(count, totalAmount) {
        const options = {
            body: `${count} payment(s) due soon with total amount of UGX ${totalAmount.toLocaleString()}`,
            tag: `payments-due-soon`,
            requireInteraction: false,
            vibrate: [100, 50, 100],
            data: {
                type: 'payments-due-soon',
                count,
                totalAmount
            }
        };

        this.showNotification('📋 Upcoming Payments', options);
    }

    notifyPaymentsOverdue(count, totalAmount) {
        const options = {
            body: `${count} payment(s) overdue with total amount of UGX ${totalAmount.toLocaleString()}`,
            tag: `payments-overdue`,
            requireInteraction: true,
            vibrate: [300, 100, 300, 100, 300],
            data: {
                type: 'payments-overdue',
                count,
                totalAmount
            }
        };

        this.showNotification('🔴 Overdue Payments Alert', options);
    }

    // Local notification fallback for browsers without push support
    showLocalNotification(title, options = {}) {
        if (this.permission === 'granted' && this.supported) {
            this.showNotification(title, options);
        } else {
            // Fallback to SweetAlert2 for better UX
            if (typeof window.Swal !== 'undefined' && window.Swal.fire) {
                window.Swal.fire({
                    title: title,
                    html: options.body || '',
                    icon: options.icon || 'info',
                    position: 'top-end',
                    timer: 5000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    toast: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', window.Swal.stopTimer);
                        toast.addEventListener('mouseleave', window.Swal.resumeTimer);
                    }
                });
            }
        }
    }
}

// Initialize global notification manager
const notificationManager = new NotificationManager();

// Payment reminder checker
class PaymentReminderChecker {
    constructor() {
        this.lastCheckTime = 0;
        this.checkInterval = 60 * 60 * 1000; // Check every hour
        this.notifiedLoans = new Set();
    }

    async checkDuePayments() {
        try {
            if (typeof Storage === 'undefined') {
                return;
            }

            const now = Date.now();
            if (now - this.lastCheckTime < this.checkInterval) {
                return; // Too soon, skip check
            }

            this.lastCheckTime = now;

            const loans = await Storage.getLoans() || [];
            const members = await Storage.getMembers() || [];
            const memberMap = {};
            
            members.forEach(m => memberMap[m.id] = m);

            const today = new Date();
            const dueSoon = [];
            const overdue = [];

            loans.forEach(loan => {
                const member = memberMap[loan.memberId];
                if (!member) return;

                // Calculate next due date
                const loanDate = new Date(loan.loanDate);
                const monthlyDueDate = new Date(loanDate);
                monthlyDueDate.setMonth(monthlyDueDate.getMonth() + 1);

                const dueDate = new Date(loan.dueDate || monthlyDueDate);
                const timeDiff = dueDate - today;
                const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

                // Skip if already notified
                const notificationKey = `${loan.id}-${dueDate.toISOString().split('T')[0]}`;
                if (this.notifiedLoans.has(notificationKey)) {
                    return;
                }

                // Calculate monthly installment
                const totalInterest = (loan.amount * (loan.interestRate || 0) * loan.term) / (12 * 100);
                const monthlyPayment = (loan.amount + totalInterest) / loan.term;

                if (daysDiff <= 0) {
                    // Payment is overdue
                    overdue.push({
                        member: member.name,
                        loanId: loan.id,
                        amount: monthlyPayment,
                        daysDue: daysDiff,
                        key: notificationKey
                    });
                } else if (daysDiff <= 7) {
                    // Payment due within 7 days
                    dueSoon.push({
                        member: member.name,
                        loanId: loan.id,
                        amount: monthlyPayment,
                        daysDue: daysDiff,
                        key: notificationKey
                    });
                }
            });

            // Send notifications
            if (overdue.length > 0) {
                const totalOverdue = overdue.reduce((sum, item) => sum + item.amount, 0);
                notificationManager.notifyPaymentsOverdue(overdue.length, totalOverdue);
                overdue.forEach(item => {
                    notificationManager.notifyPaymentDue(item.member, item.loanId, Math.round(item.amount), item.daysDue);
                    this.notifiedLoans.add(item.key);
                });
            }

            if (dueSoon.length > 0) {
                const totalDueSoon = dueSoon.reduce((sum, item) => sum + item.amount, 0);
                notificationManager.notifyPaymentsDueSoon(dueSoon.length, totalDueSoon);
                dueSoon.forEach(item => {
                    notificationManager.notifyPaymentDue(item.member, item.loanId, Math.round(item.amount), item.daysDue);
                    this.notifiedLoans.add(item.key);
                });
            }
        } catch (error) {
            console.error('Error checking due payments:', error);
        }
    }

    start() {
        // Check immediately
        this.checkDuePayments();
        
        // Check periodically
        setInterval(() => this.checkDuePayments(), this.checkInterval);
    }
}

// Initialize payment reminder checker
const paymentReminderChecker = new PaymentReminderChecker();

// Request permission on first interaction
document.addEventListener('click', async () => {
    if (notificationManager.permission === 'default') {
        await notificationManager.requestPermission();
    }
}, { once: true });

// Start payment reminder checker after a delay
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        paymentReminderChecker.start();
    }, 2000);
});

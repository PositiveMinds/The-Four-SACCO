// Storage Management Module (Using IndexedDB)

const Storage = {
     // In-memory cache for frequently accessed data
     _cache: {
         members: [],
         loans: [],
         payments: []
     },

     // Initialize storage with default data
     async init() {
         // Wait for IndexedDB to be ready
         await this.waitForDB();

         const defaultValues = {
             'members': [],
             'loans': [],
             'payments': [],
             'savings': [],
             'auditLog': [],
             'withdrawals': [],
             'userRole': 'admin'
         };

         for (const [key, defaultValue] of Object.entries(defaultValues)) {
             const existing = await this.get(key);
             if (!existing) {
                 await this.set(key, defaultValue);
             }
         }

         // Load cache with data
         await this._loadCache();

         // Clean up any corrupted member records
         await this._fixMemberIdNos();
     },

     // Fix any members with corrupted idNo values
     async _fixMemberIdNos() {
         const members = (await this.get('members')) || [];
         let needsUpdate = false;

         const fixedMembers = members.map((member, index) => {
             // If idNo is missing or not a string, regenerate it
             if (!member.idNo || typeof member.idNo !== 'string') {
                 member.idNo = `MEM-${String(index + 1).padStart(4, '0')}`;
                 needsUpdate = true;
             }
             return member;
         });

         if (needsUpdate) {
             await this.set('members', fixedMembers);
             this._cache.members = fixedMembers;
         }
     },

     // Load cache from database
     async _loadCache() {
         this._cache.members = (await this.get('members')) || [];
         this._cache.loans = (await this.get('loans')) || [];
         this._cache.payments = (await this.get('payments')) || [];
     },

     // Get member by ID from cache (synchronous)
     getMemberByIdSync(id) {
         return this._cache.members.find(m => m.id === id);
     },

     // Get loan by ID from cache (synchronous)
     getLoanByIdSync(id) {
         return this._cache.loans.find(l => l.id === id);
     },

    // Wait for IndexedDB to be initialized
    async waitForDB() {
        let attempts = 0;
        while (!IndexedDBManager.db && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 50));
            attempts++;
        }
        if (!IndexedDBManager.db) {
            throw new Error('IndexedDB failed to initialize');
        }
    },

    // Get data from IndexedDB
    async get(key) {
        try {
            await this.waitForDB();
            const data = await IndexedDBManager.get(key);
            return data || null;
        } catch (error) {
            console.error('Error reading from storage:', error);
            return null;
        }
    },

    // Set data in IndexedDB
    async set(key, value) {
        try {
            await this.waitForDB();
            // Deep clone to ensure only serializable data is stored
            const cleanValue = JSON.parse(JSON.stringify(value));
            await IndexedDBManager.set(key, cleanValue);
            return true;
        } catch (error) {
            console.error('Error writing to storage:', error);
            return false;
        }
    },

    // Clear all data
    async clear() {
        try {
            await this.waitForDB();
            await IndexedDBManager.clear();
            await this.init();
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    },

    // Members methods
    async addMember(member) {
        const members = (await this.get('members')) || [];
        member.id = Date.now().toString();
        member.createdAt = new Date().toISOString();
        // Create a clean copy to store
        const cleanMember = JSON.parse(JSON.stringify(member));
        members.push(cleanMember);
        await this.set('members', members);
        this._cache.members = members;  // Update cache
        return cleanMember;
    },

    async getMembers() {
        return (await this.get('members')) || [];
    },

    async getMemberById(id) {
        const members = await this.getMembers();
        return members.find(m => m.id === id);
    },

    async updateMember(id, updates) {
        const members = await this.getMembers();
        const memberIndex = members.findIndex(m => m.id === id);
        if (memberIndex === -1) {
            throw new Error('Member not found');
        }
        members[memberIndex] = { ...members[memberIndex], ...updates };
        await this.set('members', members);
        this._cache.members = members;  // Update cache
        return members[memberIndex];
    },

    async deleteMember(id) {
        const members = await this.getMembers();
        const filtered = members.filter(m => m.id !== id);
        await this.set('members', filtered);
        this._cache.members = filtered;  // Update cache
        return true;
    },

    // Loans methods
    async addLoan(loan) {
        const loans = (await this.get('loans')) || [];
        loan.id = Date.now().toString();
        loan.createdAt = new Date().toISOString();
        loan.paid = 0;
        loan.status = 'active';
        // Create a clean copy to store
        const cleanLoan = JSON.parse(JSON.stringify(loan));
        loans.push(cleanLoan);
        await this.set('loans', loans);
        this._cache.loans = loans;  // Update cache
        return cleanLoan;
    },

    async getLoans() {
        return (await this.get('loans')) || [];
    },

    async getLoanById(id) {
        const loans = await this.getLoans();
        return loans.find(l => l.id === id);
    },

    async updateLoan(id, updates) {
        const loans = await this.getLoans();
        const index = loans.findIndex(l => l.id === id);
        if (index !== -1) {
            loans[index] = { ...loans[index], ...updates };
            await this.set('loans', loans);
            this._cache.loans = loans;  // Update cache
            return loans[index];
        }
        return null;
    },

    async deleteLoan(id) {
        const loans = await this.getLoans();
        const filtered = loans.filter(l => l.id !== id);
        await this.set('loans', filtered);
        this._cache.loans = filtered;  // Update cache
        return true;
    },

    // Payments methods
    async addPayment(payment) {
        const payments = (await this.get('payments')) || [];
        payment.id = Date.now().toString();
        payment.createdAt = new Date().toISOString();
        // Create a clean copy to store
        const cleanPayment = JSON.parse(JSON.stringify(payment));
        payments.push(cleanPayment);
        
        // Update loan paid amount
        const loan = await this.getLoanById(payment.loanId);
        if (loan) {
            const newPaid = loan.paid + payment.amount;
            const newStatus = newPaid >= loan.amount ? 'completed' : 'active';
            await this.updateLoan(payment.loanId, { 
                paid: newPaid,
                status: newStatus
            });
        }

        await this.set('payments', payments);
        this._cache.payments = payments;  // Update cache
        return cleanPayment;
    },

    async getPayments() {
        return (await this.get('payments')) || [];
    },

    async getPaymentsByLoanId(loanId) {
        const payments = await this.getPayments();
        return payments.filter(p => p.loanId === loanId);
    },

    async deletePayment(id) {
        const payments = await this.getPayments();
        const payment = payments.find(p => p.id === id);
        if (payment) {
            const loan = await this.getLoanById(payment.loanId);
            if (loan) {
                const newPaid = Math.max(0, loan.paid - payment.amount);
                const newStatus = newPaid >= loan.amount ? 'completed' : 'active';
                await this.updateLoan(payment.loanId, {
                    paid: newPaid,
                    status: newStatus
                });
            }
        }

        const filtered = payments.filter(p => p.id !== id);
        await this.set('payments', filtered);
        return true;
    },

    // Savings methods
    async addSaving(saving) {
        const savings = (await this.get('savings')) || [];
        saving.id = Date.now().toString();
        saving.createdAt = new Date().toISOString();
        savings.push(saving);
        await this.set('savings', savings);
        return saving;
    },

    async getSavings() {
        return (await this.get('savings')) || [];
    },

    async getSavingsByMemberId(memberId) {
        const savings = await this.getSavings();
        return savings.filter(s => s.memberId === memberId);
    },

    async getTotalSavingsByMemberId(memberId) {
        const savings = await this.getSavingsByMemberId(memberId);
        return savings.reduce((sum, s) => sum + s.amount, 0);
    },

    async deleteSaving(id) {
        const savings = await this.getSavings();
        const filtered = savings.filter(s => s.id !== id);
        await this.set('savings', filtered);
        return true;
    },

    // Audit Log methods
    async addAuditLog(action, details) {
        const auditLog = (await this.get('auditLog')) || [];
        const userRole = await this.get('userRole');
        auditLog.push({
            id: Date.now().toString(),
            action,
            details,
            timestamp: new Date().toISOString(),
            userRole: userRole || 'admin'
        });
        await this.set('auditLog', auditLog);
    },

    async getAuditLog() {
        return (await this.get('auditLog')) || [];
    },

    // Withdrawal methods
    async addWithdrawal(withdrawal) {
        const withdrawals = (await this.get('withdrawals')) || [];
        withdrawal.id = Date.now().toString();
        withdrawal.createdAt = new Date().toISOString();
        withdrawals.push(withdrawal);
        await this.set('withdrawals', withdrawals);
        await this.addAuditLog('WITHDRAWAL', `${withdrawal.amount} withdrawn by member ${withdrawal.memberId}`);
        return withdrawal;
    },

    async getWithdrawals() {
        return (await this.get('withdrawals')) || [];
    },

    async getWithdrawalsByMemberId(memberId) {
        const withdrawals = await this.getWithdrawals();
        return withdrawals.filter(w => w.memberId === memberId);
    },

    async getTotalWithdrawalsByMemberId(memberId) {
        const withdrawals = await this.getWithdrawalsByMemberId(memberId);
        return withdrawals.reduce((sum, w) => sum + w.amount, 0);
    },

    // Backup and Restore
    async exportData() {
        return {
            members: await this.getMembers(),
            loans: await this.getLoans(),
            payments: await this.getPayments(),
            savings: await this.getSavings(),
            withdrawals: await this.getWithdrawals(),
            auditLog: await this.getAuditLog(),
            exportDate: new Date().toISOString()
        };
    },

    async importData(data) {
        if (data.members) await this.set('members', data.members);
        if (data.loans) await this.set('loans', data.loans);
        if (data.payments) await this.set('payments', data.payments);
        if (data.savings) await this.set('savings', data.savings);
        if (data.withdrawals) await this.set('withdrawals', data.withdrawals);
        if (data.auditLog) await this.set('auditLog', data.auditLog);
        await this.addAuditLog('DATA_IMPORT', 'Data imported from backup');
        return true;
    }
};

// Initialize storage on page load
document.addEventListener('DOMContentLoaded', async () => {
    await Storage.init();
});

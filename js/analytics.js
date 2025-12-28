/**
 * Analytics and Advanced Reporting Module
 * Provides comprehensive financial analysis and reports
 */

const Analytics = {
    /**
     * Get overdue loans report
     */
    getOverdueLoans() {
         const allLoans = Storage.getLoans();
         const loans = Array.isArray(allLoans) ? allLoans : [];
         const today = new Date();
         
         return loans.filter(loan => {
             const dueDate = new Date(loan.dueDate);
             return loan.status === 'active' && dueDate < today;
         }).map(loan => {
             const member = Storage.getMemberById(loan.memberId);
             const daysOverdue = Math.floor((today - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24));
             const penalty = loan.penalty || 0;
             
             return {
                 ...loan,
                 member,
                 daysOverdue,
                 penalty,
                 totalDue: (loan.amount || 0) - (loan.paid || 0) + penalty
             };
         });
     },

    /**
     * Get financial summary
     */
    getFinancialSummary() {
         const allLoans = Storage.getLoans();
         const loans = Array.isArray(allLoans) ? allLoans : [];
         const allPayments = Storage.getPayments();
         const payments = Array.isArray(allPayments) ? allPayments : [];
         const allSavings = Storage.getSavings();
         const savings = Array.isArray(allSavings) ? allSavings : [];
         const allWithdrawals = Storage.getWithdrawals();
         const withdrawals = Array.isArray(allWithdrawals) ? allWithdrawals : [];
         
         const totalDisbursed = loans.reduce((sum, l) => sum + (l.amount || 0), 0);
         const totalRepaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
         const totalSavings = savings.reduce((sum, s) => sum + (s.amount || 0), 0);
         const totalWithdrawals = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
         
         const totalInterest = loans.reduce((sum, l) => {
             const interest = (l.amount * (l.interestRate || 0) * (l.term || 0)) / (12 * 100);
             return sum + interest;
         }, 0);
        
        const totalPenalties = loans.reduce((sum, l) => sum + (l.penalty || 0), 0);
        
        return {
            totalDisbursed,
            totalRepaid,
            outstanding: totalDisbursed - totalRepaid,
            totalSavings,
            totalWithdrawals,
            savingsBalance: totalSavings - totalWithdrawals,
            totalInterest,
            totalPenalties,
            totalRevenue: totalInterest + totalPenalties,
            repaymentRate: totalDisbursed > 0 ? ((totalRepaid / totalDisbursed) * 100).toFixed(1) : 0
        };
    },

    /**
     * Get member credit score
     */
    getMemberCreditScore(memberId) {
         const member = Storage.getMemberById(memberId);
         const allLoans = Storage.getLoans();
         const memberLoans = Array.isArray(allLoans) ? allLoans.filter(l => l.memberId === memberId) : [];
        
        if (memberLoans.length === 0) return 100; // Perfect score if no loans
        
        let score = 100;
        
        memberLoans.forEach(loan => {
            // Penalize for overdue payments
            const dueDate = new Date(loan.dueDate);
            const today = new Date();
            if (dueDate < today && loan.status === 'active') {
                const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
                score -= Math.min(30, daysOverdue / 2); // Max 30 point penalty
            }
            
            // Reward for on-time repayment
            if (loan.status === 'completed') {
                score += 10;
            }
        });
        
        // Penalize for low repayment rate
        const totalLoaned = memberLoans.reduce((sum, l) => sum + l.amount, 0);
        const totalPaid = memberLoans.reduce((sum, l) => sum + l.paid, 0);
        const repaymentRate = (totalPaid / totalLoaned) * 100;
        
        if (repaymentRate < 50) score -= 20;
        else if (repaymentRate < 75) score -= 10;
        
        return Math.max(0, Math.min(100, score));
    },

    /**
     * Get loan performance metrics
     */
    getLoanPerformance() {
         const allLoans = Storage.getLoans();
         const loans = Array.isArray(allLoans) ? allLoans : [];
         
         const metrics = {
             total: loans.length,
             active: loans.filter(l => l.status === 'active').length,
             completed: loans.filter(l => l.status === 'completed').length,
             overdue: this.getOverdueLoans().length,
             defaultRate: 0,
             avgTerm: 0,
             avgAmount: 0
         };
         
         if (loans.length > 0) {
             metrics.defaultRate = ((metrics.overdue / loans.length) * 100).toFixed(1);
             metrics.avgTerm = (loans.reduce((sum, l) => sum + (l.term || 0), 0) / loans.length).toFixed(1);
             metrics.avgAmount = (loans.reduce((sum, l) => sum + (l.amount || 0), 0) / loans.length).toFixed(0);
         }
         
         return metrics;
     },

    /**
     * Get member portfolio
     */
    getMemberPortfolio(memberId) {
         const member = Storage.getMemberById(memberId);
         const allLoans = Storage.getLoans();
         const loans = Array.isArray(allLoans) ? allLoans.filter(l => l.memberId === memberId) : [];
         const allSavings = Storage.getSavingsByMemberId(memberId);
         const savings = Array.isArray(allSavings) ? allSavings : [];
         const allWithdrawals = Storage.getWithdrawalsByMemberId(memberId);
         const withdrawals = Array.isArray(allWithdrawals) ? allWithdrawals : [];
         
         const totalBorrowed = loans.reduce((sum, l) => sum + (l.amount || 0), 0);
         const totalRepaid = loans.reduce((sum, l) => sum + (l.paid || 0), 0);
         const totalSavings = savings.reduce((sum, s) => sum + (s.amount || 0), 0);
         const totalWithdrawals = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
         
         return {
             member,
             loans: {
                 total: loans.length,
                 active: loans.filter(l => l.status === 'active').length,
                 completed: loans.filter(l => l.status === 'completed').length,
                totalBorrowed,
                totalRepaid,
                outstanding: totalBorrowed - totalRepaid
            },
            savings: {
                totalContributions: savings.length,
                totalSaved: totalSavings,
                totalWithdrawn: totalWithdrawals,
                balance: totalSavings - totalWithdrawals
            },
            creditScore: this.getMemberCreditScore(memberId)
        };
    },

    /**
     * Generate collection efficiency report
     */
    getCollectionEfficiency() {
         const allLoans = Storage.getLoans();
         const loans = Array.isArray(allLoans) ? allLoans : [];
         const allPayments = Storage.getPayments();
         const payments = Array.isArray(allPayments) ? allPayments : [];
         
         const totalDue = loans.reduce((sum, l) => sum + (l.amount || 0), 0);
         const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const outstanding = totalDue - totalPaid;
        
        // Calculate collection efficiency
        const monthsActive = this.getMonthsActive();
        const monthlyTarget = totalDue / monthsActive;
        const monthlyCollected = totalPaid / monthsActive;
        const efficiency = monthlyTarget > 0 ? ((monthlyCollected / monthlyTarget) * 100).toFixed(1) : 0;
        
        return {
            totalDue,
            totalPaid,
            outstanding,
            monthlyTarget: monthlyTarget.toFixed(0),
            monthlyCollected: monthlyCollected.toFixed(0),
            collectionEfficiency: efficiency
        };
    },

    /**
     * Get months active
     */
    getMonthsActive() {
         const allLoans = Storage.getLoans();
         const loans = Array.isArray(allLoans) ? allLoans : [];
         if (loans.length === 0) return 1;
         
         const oldestLoan = loans.reduce((oldest, loan) => {
             const loanDate = new Date(loan.loanDate);
             const oldestDate = new Date(oldest.loanDate);
             return loanDate < oldestDate ? loan : oldest;
         });
        
        const today = new Date();
        const loanDate = new Date(oldestLoan.loanDate);
        const months = (today.getFullYear() - loanDate.getFullYear()) * 12 + 
                      (today.getMonth() - loanDate.getMonth());
        
        return Math.max(1, months);
    },

    /**
     * Get delinquency analysis
     */
    getDelinquencyAnalysis() {
        const overdueLoans = this.getOverdueLoans();
        
        const analysis = {
            total: overdueLoans.length,
            byDays: {
                '1-7': overdueLoans.filter(l => l.daysOverdue <= 7).length,
                '8-30': overdueLoans.filter(l => l.daysOverdue > 7 && l.daysOverdue <= 30).length,
                '31-90': overdueLoans.filter(l => l.daysOverdue > 30 && l.daysOverdue <= 90).length,
                '90+': overdueLoans.filter(l => l.daysOverdue > 90).length
            },
            totalAtRisk: overdueLoans.reduce((sum, l) => sum + l.totalDue, 0)
        };
        
        return analysis;
    },

    /**
     * Get top borrowers
     */
    getTopBorrowers(limit = 10) {
         const allLoans = Storage.getLoans();
         const loans = Array.isArray(allLoans) ? allLoans : [];
         
         const borrowers = {};
         loans.forEach(loan => {
            const member = Storage.getMemberById(loan.memberId);
            if (!borrowers[loan.memberId]) {
                borrowers[loan.memberId] = {
                    member,
                    totalBorrowed: 0,
                    totalRepaid: 0,
                    activeLoan: 0,
                    loanCount: 0
                };
            }
            borrowers[loan.memberId].totalBorrowed += loan.amount;
            borrowers[loan.memberId].totalRepaid += loan.paid;
            if (loan.status === 'active') borrowers[loan.memberId].activeLoan += loan.amount - loan.paid;
            borrowers[loan.memberId].loanCount++;
        });
        
        return Object.values(borrowers)
            .sort((a, b) => b.totalBorrowed - a.totalBorrowed)
            .slice(0, limit);
    },

    /**
     * Get top savers
     */
    getTopSavers(limit = 10) {
        const savings = Storage.getSavings();
        const withdrawals = Storage.getWithdrawals();
        
        const savers = {};
        savings.forEach(saving => {
            if (!savers[saving.memberId]) {
                savers[saving.memberId] = {
                    member: Storage.getMemberById(saving.memberId),
                    totalSaved: 0,
                    totalWithdrawn: 0,
                    contributionCount: 0
                };
            }
            savers[saving.memberId].totalSaved += saving.amount;
            savers[saving.memberId].contributionCount++;
        });
        
        withdrawals.forEach(withdrawal => {
            if (savers[withdrawal.memberId]) {
                savers[withdrawal.memberId].totalWithdrawn += withdrawal.amount;
            }
        });
        
        return Object.values(savers)
            .sort((a, b) => b.totalSaved - a.totalSaved)
            .slice(0, limit)
            .map(saver => ({
                ...saver,
                balance: saver.totalSaved - saver.totalWithdrawn
            }));
    }
};

/**
 * Analytics Logger & Debugger
 * Provides diagnostic and logging functions for analytics
 */

const AnalyticsLogger = {
    /**
     * Run complete diagnostics
     */
    async runDiagnostics() {
        console.clear();
        console.log('%c=== SACCO ANALYTICS DIAGNOSTICS ===', 'color: #2563eb; font-size: 16px; font-weight: bold;');
        
        try {
            // Get all data
            const members = await Storage.getMembers();
            const loans = await Storage.getLoans();
            const payments = await Storage.getPayments();
            const savings = await Storage.getSavings();
            const withdrawals = await Storage.getWithdrawals();

            // Display data inventory
            console.log('\n%c📊 DATA INVENTORY:', 'color: #0f172a; font-weight: bold;');
            console.table({
                'Members': members.length,
                'Loans': loans.length,
                'Payments': payments.length,
                'Savings': savings.length,
                'Withdrawals': withdrawals.length
            });

            // Check loan details
            if (loans.length > 0) {
                console.log('\n%c🔍 LOAN DETAILS:', 'color: #0f172a; font-weight: bold;');
                loans.forEach((loan, idx) => {
                    console.log(`Loan ${idx + 1}:`, {
                        Amount: loan.amount,
                        InterestRate: loan.interestRate + '%',
                        Term: loan.term + ' months',
                        Status: loan.status,
                        DueDate: loan.dueDate
                    });
                });
            }

            // Get analytics
            const summary = Analytics.getFinancialSummary();
            const performance = Analytics.getLoanPerformance();
            const efficiency = Analytics.getCollectionEfficiency();
            const delinquency = Analytics.getDelinquencyAnalysis();

            console.log('\n%c💰 FINANCIAL SUMMARY:', 'color: #0f172a; font-weight: bold;');
            console.table({
                'Total Disbursed': `UGX ${summary.totalDisbursed.toLocaleString()}`,
                'Total Repaid': `UGX ${summary.totalRepaid.toLocaleString()}`,
                'Outstanding': `UGX ${summary.outstanding.toLocaleString()}`,
                'Total Interest': `UGX ${summary.totalInterest.toFixed(0)}`,
                'Total Penalties': `UGX ${summary.totalPenalties.toFixed(0)}`,
                'Repayment Rate': summary.repaymentRate + '%'
            });

            console.log('\n%c📈 LOAN PERFORMANCE:', 'color: #0f172a; font-weight: bold;');
            console.table({
                'Total Loans': performance.total,
                'Active': performance.active,
                'Completed': performance.completed,
                'Overdue': performance.overdue,
                'Default Rate': performance.defaultRate + '%',
                'Avg Amount': `UGX ${performance.avgAmount}`
            });

            console.log('\n%c📦 COLLECTION EFFICIENCY:', 'color: #0f172a; font-weight: bold;');
            console.table({
                'Monthly Target': `UGX ${efficiency.monthlyTarget}`,
                'Monthly Collected': `UGX ${efficiency.monthlyCollected}`,
                'Efficiency': efficiency.collectionEfficiency + '%',
                'Months Active': Math.floor(efficiency.monthlyTarget > 0 ? efficiency.totalDue / efficiency.monthlyTarget : 0)
            });

            console.log('\n%c⚠️ DELINQUENCY ANALYSIS:', 'color: #0f172a; font-weight: bold;');
            console.table({
                '1-7 days': delinquency.byDays['1-7'],
                '8-30 days': delinquency.byDays['8-30'],
                '31-90 days': delinquency.byDays['31-90'],
                '90+ days': delinquency.byDays['90+'],
                'Total at Risk': `UGX ${delinquency.totalAtRisk.toFixed(0)}`
            });

            // Check HTML elements
            console.log('\n%c🎨 HTML ELEMENTS:', 'color: #0f172a; font-weight: bold;');
            const elements = [
                'repaymentRate', 'collectionEfficiency', 'totalInterest', 'defaultRate',
                'dashActiveSavers', 'dashTotalSavings', 'borrowerRate', 'avgLoanAmount',
                'delinquency1to7', 'delinquency8to30', 'delinquency31to90', 'delinquency90plus',
                'portfolioOutstanding', 'amountAtRisk', 'avgRepaymentRate', 'totalPenalties'
            ];
            
            let missingCount = 0;
            const elementStatus = {};
            elements.forEach(id => {
                const elem = document.getElementById(id);
                const exists = !!elem;
                if (!exists) missingCount++;
                elementStatus[id] = exists ? '✅' : '❌';
            });
            console.table(elementStatus);

            // Summary
            console.log('\n%c📋 STATUS SUMMARY:', 'color: #0f172a; font-weight: bold;');
            const issues = [];
            
            if (loans.length === 0) issues.push('❌ No loans in system');
            if (loans.length > 0 && loans.some(l => !l.interestRate)) issues.push('❌ Some loans missing interestRate');
            if (summary.totalInterest === 0 && loans.length > 0) issues.push('⚠️ Total Interest is 0 (check loan setup)');
            if (payments.length === 0 && loans.length > 0) issues.push('⚠️ No payments recorded yet');
            if (missingCount > 0) issues.push(`❌ ${missingCount} HTML elements missing`);

            if (issues.length === 0) {
                console.log('%c✅ All systems operational! Analytics are ready.', 'color: #10b981; font-weight: bold;');
            } else {
                issues.forEach(issue => console.log(`${issue}`));
            }

        } catch (error) {
            console.error('Diagnostic error:', error);
        }
    },

    /**
     * Log financial summary
     */
    logFinancialSummary() {
        const summary = Analytics.getFinancialSummary();
        console.log('%c💰 FINANCIAL SUMMARY', 'color: #2563eb; font-weight: bold;');
        console.table(summary);
        return summary;
    },

    /**
     * Log loan performance
     */
    logLoanPerformance() {
        const performance = Analytics.getLoanPerformance();
        console.log('%c📈 LOAN PERFORMANCE', 'color: #2563eb; font-weight: bold;');
        console.table(performance);
        return performance;
    },

    /**
     * Log collection efficiency
     */
    logCollectionEfficiency() {
        const efficiency = Analytics.getCollectionEfficiency();
        console.log('%c📦 COLLECTION EFFICIENCY', 'color: #2563eb; font-weight: bold;');
        console.table(efficiency);
        return efficiency;
    },

    /**
     * Log delinquency analysis
     */
    logDelinquencyAnalysis() {
        const delinquency = Analytics.getDelinquencyAnalysis();
        console.log('%c⚠️ DELINQUENCY ANALYSIS', 'color: #2563eb; font-weight: bold;');
        console.table(delinquency);
        return delinquency;
    },

    /**
     * Check if specific element exists and has content
     */
    checkElement(elementId) {
        const elem = document.getElementById(elementId);
        if (!elem) {
            console.error(`❌ Element #${elementId} not found in DOM`);
            return false;
        }
        console.log(`✅ Element #${elementId} exists`);
        console.log(`   Content: "${elem.textContent}"`);
        return true;
    },

    /**
     * Check all analytics elements
     */
    checkAllElements() {
        console.log('%c🎨 CHECKING ALL ANALYTICS ELEMENTS', 'color: #2563eb; font-weight: bold;');
        const elements = [
            'repaymentRate', 'collectionEfficiency', 'totalInterest', 'defaultRate',
            'dashActiveSavers', 'dashTotalSavings', 'borrowerRate', 'avgLoanAmount',
            'delinquency1to7', 'delinquency8to30', 'delinquency31to90', 'delinquency90plus',
            'portfolioOutstanding', 'amountAtRisk', 'avgRepaymentRate', 'totalPenalties'
        ];
        
        let found = 0, missing = 0;
        elements.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                console.log(`✅ ${id}: "${elem.textContent}"`);
                found++;
            } else {
                console.error(`❌ ${id}: MISSING`);
                missing++;
            }
        });
        
        console.log(`\n${found}/${elements.length} elements found`);
        if (missing > 0) console.error(`${missing} elements missing!`);
        return missing === 0;
    },

    /**
     * Verify all data sources
     */
    async verifySources() {
        console.log('%c🔍 VERIFYING DATA SOURCES', 'color: #2563eb; font-weight: bold;');
        
        const members = await Storage.getMembers();
        const loans = await Storage.getLoans();
        const payments = await Storage.getPayments();
        const savings = await Storage.getSavings();
        const withdrawals = await Storage.getWithdrawals();

        const status = {
            'Members accessible': members.length >= 0,
            'Loans accessible': loans.length >= 0,
            'Payments accessible': payments.length >= 0,
            'Savings accessible': savings.length >= 0,
            'Withdrawals accessible': withdrawals.length >= 0,
            'Loans have amounts': loans.every(l => l.amount > 0),
            'Loans have rates': loans.every(l => l.interestRate !== undefined),
            'Payments have amounts': payments.every(p => p.amount > 0),
            'Savings have amounts': savings.every(s => s.amount > 0)
        };

        console.table(status);
        
        const allGood = Object.values(status).every(v => v === true);
        if (allGood) {
            console.log('%c✅ All data sources verified!', 'color: #10b981; font-weight: bold;');
        } else {
            console.error('%c⚠️ Some data sources have issues', 'color: #ef4444;');
        }
        
        return status;
    },

    /**
     * Test complete flow with sample data
     */
    async testWithSampleData() {
        console.log('%c🧪 TESTING WITH SAMPLE DATA', 'color: #2563eb; font-weight: bold;');
        
        try {
            // Add member
            const member = await Storage.addMember({
                name: 'Test Member',
                email: 'test@example.com',
                phone: '+256 700 000 000'
            });
            console.log('✅ Member created:', member.id);

            // Add loan
            const loan = await Storage.addLoan({
                memberId: member.id,
                amount: 10000000,
                term: 12,
                interestRate: 5,
                loanDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
            });
            console.log('✅ Loan created:', loan.id);

            // Add payment
            const payment = await Storage.addPayment({
                loanId: loan.id,
                amount: 3000000,
                paymentDate: new Date().toISOString().split('T')[0]
            });
            console.log('✅ Payment created:', payment.id);

            // Add savings
            const saving = await Storage.addSaving({
                memberId: member.id,
                amount: 1000000,
                savingDate: new Date().toISOString().split('T')[0]
            });
            console.log('✅ Saving created:', saving.id);

            // Check analytics
            const summary = Analytics.getFinancialSummary();
            console.log('\n✅ Analytics calculated:');
            console.table({
                'Total Disbursed': `UGX ${summary.totalDisbursed}`,
                'Total Repaid': `UGX ${summary.totalRepaid}`,
                'Repayment Rate': summary.repaymentRate + '%',
                'Total Interest': `UGX ${summary.totalInterest.toFixed(0)}`
            });

            console.log('\n✅ Sample data test completed!');
        } catch (error) {
            console.error('❌ Test error:', error);
        }
    },

    /**
     * Clear test data
     */
    async clearTestData() {
        if (confirm('Clear all data? This cannot be undone!')) {
            await Storage.clear();
            console.log('%c✅ All data cleared', 'color: #10b981; font-weight: bold;');
            location.reload();
        }
    }
};

// Make logger available in console
window.AnalyticsLogger = AnalyticsLogger;
console.log('%cAnalytics Logger available: AnalyticsLogger.runDiagnostics()', 'color: #10b981;');

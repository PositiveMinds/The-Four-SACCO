// Transaction History and Member Records Module
// Manages viewing all transaction records, loans, and savings for each member

const TransactionManager = {
    currentMemberId: null,
    allTransactions: [],
    pageSize: 5,
    initialSize: 5,
    loadMoreSize: 5,
    currentPage: 1,
    allLoansDetails: [],
    currentLoansPage: 1,
    allSavingsDetails: [],
    currentSavingsPage: 1,

    async init() {
        this.setupEventListeners();
        this.loadMemberSelect();
    },

    resetTransactionsPagination() {
        this.currentPage = 1;
    },

    resetLoansPagination() {
        this.currentLoansPage = 1;
    },

    resetSavingsPagination() {
        this.currentSavingsPage = 1;
    },

    setupEventListeners() {
        const memberSelect = document.getElementById('transactionMemberSelect');
        if (memberSelect) {
            // Handle both native change and Select2 change events
            memberSelect.addEventListener('change', (e) => {
                this.currentMemberId = e.target.value;
                if (this.currentMemberId) {
                    this.loadMemberTransactions(this.currentMemberId);
                } else {
                    this.clearTransactionView();
                }
            });
            
            // Also bind to Select2 change event if Select2 is available
            if (typeof jQuery !== 'undefined') {
                jQuery(memberSelect).on('select2:select', (e) => {
                    this.currentMemberId = e.params.data.id;
                    if (this.currentMemberId) {
                        this.loadMemberTransactions(this.currentMemberId);
                    } else {
                        this.clearTransactionView();
                    }
                }).on('select2:clearing', () => {
                    this.currentMemberId = null;
                    this.clearTransactionView();
                });
            }
        }

        // Export transactions button
        const exportBtn = document.getElementById('exportTransactionsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportTransactions());
        }
    },

    async loadMemberSelect() {
        try {
            const members = await Storage.getMembers();
            const select = document.getElementById('transactionMemberSelect');
            
            if (select) {
                // Clear existing options (keep the first one)
                while (select.options.length > 1) {
                    select.remove(1);
                }

                // Add members
                members.forEach(member => {
                    const option = document.createElement('option');
                    option.value = member.id;
                    option.textContent = member.name;
                    select.appendChild(option);
                });
                
                // Refresh Select2 if available
                if (typeof jQuery !== 'undefined' && jQuery(select).data('select2')) {
                    jQuery(select).trigger('change');
                }
            }
        } catch (error) {
            console.error('Error loading members:', error);
        }
    },

    async loadMemberTransactions(memberId) {
        try {
            const member = await Storage.getMemberById(memberId);
            const loans = await Storage.getLoans();
            const savings = await Storage.getSavings();
            const payments = await Storage.getPayments();
            const withdrawals = await Storage.getWithdrawals();

            // Build transaction list
            this.allTransactions = [];

            // Add loan records
            const memberLoans = loans.filter(l => l.memberId === memberId);
            memberLoans.forEach(loan => {
                this.allTransactions.push({
                    date: new Date(loan.loanDate),
                    type: 'Loan',
                    amount: loan.amount,
                    direction: 'in', // member received money
                    status: loan.status,
                    id: loan.id,
                    details: `Loan of UGX ${UI.formatNumber(loan.amount)} (${loan.term} months at ${loan.interestRate}%)`
                });
            });

            // Add payment records
            payments.filter(p => {
                const loan = memberLoans.find(l => l.id === p.loanId);
                return !!loan;
            }).forEach(payment => {
                this.allTransactions.push({
                    date: new Date(payment.paymentDate),
                    type: 'Payment',
                    amount: payment.amount,
                    direction: 'out', // member paid money
                    status: 'completed',
                    id: payment.id,
                    details: `Payment of UGX ${UI.formatNumber(payment.amount)} towards loan`
                });
            });

            // Add savings records
            const memberSavings = savings.filter(s => s.memberId === memberId);
            memberSavings.forEach(saving => {
                this.allTransactions.push({
                    date: new Date(saving.savingDate),
                    type: 'Saving',
                    amount: saving.amount,
                    direction: 'out', // member deposited money
                    status: 'completed',
                    id: saving.id,
                    details: `Savings deposit of UGX ${UI.formatNumber(saving.amount)}`
                });
            });

            // Add withdrawal records
            const memberWithdrawals = withdrawals.filter(w => w.memberId === memberId);
            memberWithdrawals.forEach(withdrawal => {
                this.allTransactions.push({
                    date: new Date(withdrawal.withdrawalDate),
                    type: 'Withdrawal',
                    amount: withdrawal.amount,
                    direction: 'in', // member received money
                    status: 'completed',
                    id: withdrawal.id,
                    details: `Withdrawal of UGX ${UI.formatNumber(withdrawal.amount)}`
                });
            });

            // Sort by date (newest first)
            this.allTransactions.sort((a, b) => b.date - a.date);

            // Update summary
            this.updateTransactionSummary();

            // Render transactions
            this.resetTransactionsPagination();
            this.renderTransactions();

            // Load loans details
            this.renderLoansDetails(member, memberLoans, payments);

            // Load savings details
            this.renderSavingsDetails(member, memberSavings, memberWithdrawals);

        } catch (error) {
            console.error('Error loading transactions:', error);
            UI.showAlert('Error loading transactions: ' + error.message, 'error');
        }
    },

    updateTransactionSummary() {
        const totalCount = this.allTransactions.length;
        let totalIn = 0;
        let totalOut = 0;

        this.allTransactions.forEach(txn => {
            if (txn.direction === 'in') {
                totalIn += txn.amount;
            } else {
                totalOut += txn.amount;
            }
        });

        document.getElementById('totalTransactionCount').textContent = totalCount;
        document.getElementById('totalInAmount').textContent = `UGX ${UI.formatNumber(totalIn)}`;
        document.getElementById('totalOutAmount').textContent = `UGX ${UI.formatNumber(totalOut)}`;
    },

    renderTransactions() {
        const tbody = document.getElementById('transactionsTableBody');
        const end = this.currentPage * this.pageSize;
        const displayTransactions = this.allTransactions.slice(0, end);

        if (displayTransactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No transactions found</td></tr>';
            this.renderTransactionPagination();
            return;
        }

        tbody.innerHTML = displayTransactions.map(txn => `
            <tr>
                <td>${txn.date.toLocaleDateString()}</td>
                <td><span class="badge ${this.getTypeBadgeClass(txn.type)}">${txn.type}</span></td>
                <td><strong>UGX ${UI.formatNumber(txn.amount)}</strong></td>
                <td><span class="status-badge status-completed">${txn.status.toUpperCase()}</span></td>
                <td>
                    <small>${txn.details}</small>
                </td>
            </tr>
        `).join('');

        // Render load more button
        this.renderTransactionPagination();
    },

    loadMoreTransactions() {
        const btn = document.getElementById('loadMoreTransactions');
        if (btn) {
             btn.classList.add('loading');
             btn.innerHTML = '<i class="ri-time-line"></i><span>Loading...</span>';
         }
         
         setTimeout(() => {
             this.currentPage += 1;
             this.renderTransactions();
         }, 800);
    },

    renderTransactionPagination() {
        const container = document.getElementById('transactionsPagination');
        const itemsShown = this.currentPage * this.pageSize;
        const totalItems = this.allTransactions.length;

        if (itemsShown >= totalItems) {
            container.innerHTML = '';
            return;
        }

        const html = `<div class="load-more-container">
            <button class="btn-load-more btn-sm" onclick="TransactionManager.loadMoreTransactions()" id="loadMoreTransactions">
                <i class="ri-time-line"></i>
                <span>More</span>
                <span class="load-more-progress">${itemsShown}/${totalItems}</span>
            </button>
        </div>`;

        container.innerHTML = html;
    },

    getTypeBadgeClass(type) {
        const classes = {
            'Loan': 'bg-primary',
            'Payment': 'bg-success',
            'Saving': 'bg-warning',
            'Withdrawal': 'bg-info'
        };
        return classes[type] || 'bg-secondary';
    },

    async renderLoansDetails(member, loans, payments) {
        const container = document.getElementById('memberLoansDetailsBody');
        const paginationContainer = document.getElementById('loanDetailsPagination');

        if (loans.length === 0) {
            document.getElementById('memberLoansDetails').innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No loans recorded for this member</td></tr>';
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        // Store all loans
        this.allLoansDetails = loans;
        this.resetLoansPagination();

        // Display loans with pagination
        this.displayLoansDetails();
    },

    displayLoansDetails() {
        const container = document.getElementById('memberLoansDetailsBody');
        const paginationContainer = document.getElementById('loanDetailsPagination');
        
        const end = this.currentLoansPage * this.pageSize;
        const displayLoans = this.allLoansDetails.slice(0, end);

        if (displayLoans.length === 0) {
            container.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No loans recorded for this member</td></tr>';
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        let html = displayLoans.map(loan => {
            const remaining = loan.amount - loan.paid;
            const percentagePaid = loan.amount > 0 ? (loan.paid / loan.amount) * 100 : 0;
            const percentageRemaining = 100 - percentagePaid;
            
            // Determine color based on payment percentage
            let paidColor = '#ef4444';  // Red (0-59%)
            if (percentagePaid >= 60 && percentagePaid < 90) {
                paidColor = '#f59e0b';  // Amber/Warning (60-89%)
            } else if (percentagePaid >= 90) {
                paidColor = '#10b981';  // Green (90-100%)
            }
            
            // Create segmented pill graph
            const pillGraph = `
                <div style="display: flex; gap: 2px; align-items: center; min-width: 160px;">
                    <div style="flex: ${Math.max(percentagePaid, 5)}; height: 20px; background: ${paidColor}; border-radius: 4px 0 0 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold; ${percentagePaid < 10 ? 'overflow: visible; margin-right: -25px;' : ''}">${percentagePaid > 5 ? Math.round(percentagePaid) + '%' : ''}</div>
                    <div style="flex: ${Math.max(percentageRemaining, 5)}; height: 20px; background: #e5e7eb; border-radius: 0 4px 4px 0; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 11px; font-weight: bold;">${percentageRemaining > 5 ? Math.round(percentageRemaining) + '%' : ''}</div>
                </div>
            `;
            
            return `
                <tr>
                    <td><strong>${loan.id.substring(0, 8).toUpperCase()}</strong></td>
                    <td>UGX ${UI.formatNumber(loan.amount)}</td>
                    <td>${loan.term}m</td>
                    <td>${loan.interestRate}%</td>
                    <td>${new Date(loan.loanDate).toLocaleDateString()}</td>
                    <td>${new Date(loan.dueDate).toLocaleDateString()}</td>
                    <td><span class="badge bg-${loan.status === 'active' ? 'danger' : 'success'}">${loan.status.toUpperCase()}</span></td>
                    <td>${pillGraph}</td>
                    <td>UGX ${UI.formatNumber(remaining)}</td>
                </tr>
            `;
        }).join('');

        container.innerHTML = html;

        // Render load more button
        this.renderLoanDetailsPagination();
    },

    loadMoreLoans() {
        const btn = document.getElementById('loadMoreLoanDetails');
        if (btn) {
            btn.classList.add('loading');
            btn.innerHTML = '<i class="ri-time-line"></i><span>Loading...</span>';
        }
        
        setTimeout(() => {
            this.currentLoansPage += 1;
            this.displayLoansDetails();
        }, 800);
    },

    renderLoanDetailsPagination() {
        const container = document.getElementById('loanDetailsPagination');
        const itemsShown = this.currentLoansPage * this.pageSize;
        const totalItems = this.allLoansDetails.length;

        if (itemsShown >= totalItems) {
            container.innerHTML = '';
            return;
        }

        const html = `<div class="load-more-container">
            <button class="btn-load-more btn-sm" onclick="TransactionManager.loadMoreLoans()" id="loadMoreLoanDetails">
                <i class="ri-file-pdf-line"></i>
                <span>More</span>
                <span class="load-more-progress">${itemsShown}/${totalItems}</span>
            </button>
        </div>`;

        container.innerHTML = html;
    },

    async renderSavingsDetails(member, savings, withdrawals) {
        const container = document.getElementById('memberSavingsDetails');
        const paginationContainer = document.getElementById('savingsDetailsPagination');

        if (savings.length === 0 && withdrawals.length === 0) {
            container.innerHTML = '<p class="text-muted text-center py-4">No savings or withdrawals recorded for this member</p>';
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        let totalSavings = savings.reduce((sum, s) => sum + s.amount, 0);
        let totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);
        let netSavings = totalSavings - totalWithdrawals;

        // Combine and sort savings and withdrawals
        const allTransactions = [];
        savings.forEach(s => allTransactions.push({
            date: new Date(s.savingDate),
            type: 'Deposit',
            amount: s.amount
        }));
        withdrawals.forEach(w => allTransactions.push({
            date: new Date(w.withdrawalDate),
            type: 'Withdrawal',
            amount: w.amount
        }));
        allTransactions.sort((a, b) => b.date - a.date);

        // Store for pagination
        this.savingsSummary = {
            totalSavings,
            totalWithdrawals,
            netSavings,
            savingsCount: savings.length
        };
        this.allSavingsDetails = allTransactions;
        this.resetSavingsPagination();

        // Display savings
        this.displaySavingsDetails();
    },

    displaySavingsDetails() {
        const container = document.getElementById('memberSavingsDetails');
        const paginationContainer = document.getElementById('savingsDetailsPagination');
        
        const end = this.currentSavingsPage * this.pageSize;
        const displayTransactions = this.allSavingsDetails.slice(0, end);
        const summary = this.savingsSummary;

        let html = `
            <div class="row mb-4 g-3 p-3 pb-2">
                <div class="col-md-3">
                    <p class="text-muted small mb-1">Total Saved</p>
                    <p class="h5 mb-0" style="color: var(--success);">UGX ${UI.formatNumber(summary.totalSavings)}</p>
                </div>
                <div class="col-md-3">
                    <p class="text-muted small mb-1">Total Withdrawn</p>
                    <p class="h5 mb-0" style="color: var(--warning);">UGX ${UI.formatNumber(summary.totalWithdrawals)}</p>
                </div>
                <div class="col-md-3">
                    <p class="text-muted small mb-1">Net Savings</p>
                    <p class="h5 mb-0" style="color: var(--primary);">UGX ${UI.formatNumber(summary.netSavings)}</p>
                </div>
                <div class="col-md-3">
                    <p class="text-muted small mb-1">No. of Deposits</p>
                    <p class="h5 mb-0">${summary.savingsCount}</p>
                </div>
            </div>
        `;

        // Add transactions table
        html += '<div class="table-responsive"><table class="table table-sm mb-0">';
        html += '<thead class="table-light"><tr><th>Date</th><th>Type</th><th>Amount</th></tr></thead><tbody>';

        if (displayTransactions.length === 0) {
            html += '<tr><td colspan="3" class="text-center text-muted py-4">No savings or withdrawals recorded</td></tr>';
        } else {
            html += displayTransactions.map(txn => {
                const badgeClass = txn.type === 'Deposit' ? 'bg-success' : 'bg-warning';
                return `
                    <tr>
                        <td>${txn.date.toLocaleDateString()}</td>
                        <td><span class="badge ${badgeClass}">${txn.type}</span></td>
                        <td>UGX ${UI.formatNumber(txn.amount)}</td>
                    </tr>
                `;
            }).join('');
        }

        html += '</tbody></table></div>';
        container.innerHTML = html;

        // Render load more button
        this.renderSavingsDetailsPagination();
    },

    loadMoreSavings() {
        const btn = document.getElementById('loadMoreSavingsDetails');
        if (btn) {
            btn.classList.add('loading');
            btn.innerHTML = '<i class="ri-time-line"></i><span>Loading...</span>';
        }
        
        setTimeout(() => {
            this.currentSavingsPage += 1;
            this.displaySavingsDetails();
        }, 300);
    },

    renderSavingsDetailsPagination() {
        const container = document.getElementById('savingsDetailsPagination');
        const itemsShown = this.currentSavingsPage * this.pageSize;
        const totalItems = this.allSavingsDetails.length;

        if (itemsShown >= totalItems) {
            container.innerHTML = '';
            return;
        }

        const html = `<div class="load-more-container">
            <button class="btn-load-more btn-sm" onclick="TransactionManager.loadMoreSavings()" id="loadMoreSavingsDetails">
                <i class="ri-bank-card-line"></i>
                <span>More</span>
                <span class="load-more-progress">${itemsShown}/${totalItems}</span>
            </button>
        </div>`;

        container.innerHTML = html;
    },

    async exportTransactions() {
        if (this.allTransactions.length === 0) {
            UI.showAlert('No transactions to export', 'warning');
            return;
        }

        try {
            const member = await Storage.getMemberById(this.currentMemberId);
            const data = this.allTransactions.map(txn => ({
                'Date': txn.date.toLocaleDateString(),
                'Type': txn.type,
                'Amount': `UGX ${UI.formatNumber(txn.amount)}`,
                'Direction': txn.direction === 'in' ? 'Received' : 'Paid',
                'Status': txn.status,
                'Details': txn.details
            }));

            // Create CSV
            const headers = Object.keys(data[0]);
            const csv = [
                headers.join(','),
                ...data.map(row => headers.map(h => `"${row[h]}"`).join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions_${member.name}_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);

            UI.showAlert('Transactions exported successfully', 'success');
        } catch (error) {
            UI.showAlert('Error exporting transactions: ' + error.message, 'error');
        }
    },

    clearTransactionView() {
        document.getElementById('transactionsTableBody').innerHTML = 
            '<tr><td colspan="5" class="text-center text-muted py-4">Select a member to view transactions</td></tr>';
        document.getElementById('transactionsPagination').innerHTML = '';
        document.getElementById('totalTransactionCount').textContent = '0';
        document.getElementById('totalInAmount').textContent = 'UGX 0';
        document.getElementById('totalOutAmount').textContent = 'UGX 0';
        const memberLoansDetailsBody = document.getElementById('memberLoansDetailsBody');
        if (memberLoansDetailsBody) {
            memberLoansDetailsBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No loans to display</td></tr>';
        }
        const loanDetailsPagination = document.getElementById('loanDetailsPagination');
        if (loanDetailsPagination) {
            loanDetailsPagination.innerHTML = '';
        }
        document.getElementById('memberSavingsDetails').innerHTML = '<p class="text-muted text-center py-4">No savings to display</p>';
        const savingsDetailsPagination = document.getElementById('savingsDetailsPagination');
        if (savingsDetailsPagination) {
            savingsDetailsPagination.innerHTML = '';
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Select2 to be initialized first
    const checkSelect2 = setInterval(() => {
        const select = document.getElementById('transactionMemberSelect');
        if (select && typeof jQuery !== 'undefined' && jQuery(select).data('select2')) {
            clearInterval(checkSelect2);
            TransactionManager.init();
        }
    }, 100);
    
    // Fallback timeout
    setTimeout(() => {
        clearInterval(checkSelect2);
        TransactionManager.init();
    }, 2000);
});

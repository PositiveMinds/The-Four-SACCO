/**
 * Loan Member Dropdown Fix
 * Ensures members are properly loaded when navigating to the Loans page
 */

class LoanMemberFix {
    constructor() {
        this.init();
    }

    async init() {
        // Add enhanced event listener for loans tab
        const loansTab = document.getElementById('loans-tab');
        if (loansTab) {
            loansTab.addEventListener('click', async (e) => {
                console.log('[LoanMemberFix] Loans tab clicked');
                await this.ensureMembersLoaded();
            });
        }

        // Also listen for page change events
        document.addEventListener('pagechange', async (e) => {
            if (e.detail === 'loans') {
                console.log('[LoanMemberFix] Page changed to loans');
                await this.ensureMembersLoaded();
            }
        });

        // Listen for member additions to refresh the loan member dropdown
        document.addEventListener('memberadded', async (e) => {
            console.log('[LoanMemberFix] Member added, refreshing dropdowns');
            await this.refreshMemberSelects();
        });
    }

    /**
     * Ensure members are loaded into loan member dropdown
     */
    async ensureMembersLoaded() {
        try {
            const members = await Storage.getMembers();
            console.log(`[LoanMemberFix] Found ${members.length} members`);

            const loanMemberSelect = document.getElementById('loanMember');
            
            if (!loanMemberSelect) {
                console.error('[LoanMemberFix] loanMember select not found in DOM');
                return false;
            }

            if (members.length === 0) {
                console.warn('[LoanMemberFix] No members available');
                loanMemberSelect.innerHTML = '<option value="">No members registered</option>';
                return false;
            }

            // Populate the dropdown
            const currentValue = loanMemberSelect.value;
            loanMemberSelect.innerHTML = '<option value="">Select Member</option>' +
                members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
            loanMemberSelect.value = currentValue;

            console.log('[LoanMemberFix] Successfully loaded members into dropdown');
            return true;
        } catch (error) {
            console.error('[LoanMemberFix] Error loading members:', error);
            return false;
        }
    }

    /**
     * Refresh all member selects (loan, payment, saving, withdrawal, reports)
     */
    async refreshMemberSelects() {
        try {
            const members = await Storage.getMembers();
            const selects = ['loanMember', 'paymentLoan', 'reportMember', 'savingMember', 'withdrawalMember'];

            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    const currentValue = select.value;
                    select.innerHTML = '<option value="">Select Member</option>' +
                        members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
                    select.value = currentValue;
                    console.log(`[LoanMemberFix] Refreshed ${selectId}`);
                }
            });
        } catch (error) {
            console.error('[LoanMemberFix] Error refreshing member selects:', error);
        }
    }

    /**
     * Manually trigger member load (useful for debugging)
     */
    async reload() {
        console.log('[LoanMemberFix] Manual reload triggered');
        return await this.ensureMembersLoaded();
    }
}

// Initialize the fix when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.loanMemberFix = new LoanMemberFix();
    });
} else {
    window.loanMemberFix = new LoanMemberFix();
}

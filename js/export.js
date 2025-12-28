/**
 * Export functionality for SACCO Management System
 * Supports PDF and Excel exports for critical data
 */

const ExportManager = {
    /**
     * Get jsPDF instance
     */
    getjsPDF() {
        // Try multiple locations where jsPDF might be
        if (typeof window.jsPDF === 'function') {
            return window.jsPDF;
        }
        if (window.jspdf && typeof window.jspdf.jsPDF === 'function') {
            return window.jspdf.jsPDF;
        }
        throw new Error('jsPDF library not loaded. PDF export not available. Please refresh the page and check your internet connection.');
    },

    /**
     * Format number with commas
     */
    formatNumber(num) {
        try {
            // Handle null, undefined, or non-numeric values
            if (num === null || num === undefined || num === '') {
                return '0';
            }
            
            // Convert to number if string
            const numValue = typeof num === 'string' ? parseFloat(num) : num;
            
            // Check if it's a valid number
            if (isNaN(numValue) || !isFinite(numValue)) {
                console.warn('Invalid number value:', num);
                return '0';
            }
            
            // Format the number
            return new Intl.NumberFormat('en-US').format(Math.round(numValue));
        } catch (error) {
            console.error('Number format error:', error, num);
            return '0';
        }
    },

    /**
     * Format date properly
     */
    formatDate(dateInput) {
        try {
            if (!dateInput) return 'N/A';
            
            let date;
            
            // Handle ISO string format (2024-01-01)
            if (typeof dateInput === 'string') {
                // If it's already a date string like "2024-01-01", parse it
                if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const parts = dateInput.split('-');
                    date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                } else {
                    // ISO format string with time
                    date = new Date(dateInput);
                }
            } else if (typeof dateInput === 'number') {
                // Timestamp
                date = new Date(dateInput);
            } else {
                date = dateInput;
            }
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return dateInput; // Return original if can't parse
            }
            
            // Format as DD/MM/YYYY
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            
            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error('Date format error:', error, dateInput);
            return dateInput;
        }
    },

    /**
     * Export Members to PDF
     */
    async exportMembersToPDF() {
        try {
            const members = await Storage.getMembers();
            
            if (!members || members.length === 0) {
                Swal.fire('No Data', 'No members to export', 'info');
                return;
            }

            // Try jsPDF first, fallback to offline generator
            try {
                const jsPDF = this.getjsPDF();
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();
                let yPosition = 20;

                // Header
                doc.setFillColor(255, 204, 0);
                doc.rect(0, 0, pageWidth, 30, 'F');
                doc.setTextColor(15, 15, 15);
                doc.setFontSize(20);
                doc.text('SACCO Management System', pageWidth / 2, 15, { align: 'center' });
                doc.setFontSize(10);
                doc.text('Members Report', pageWidth / 2, 25, { align: 'center' });

                yPosition = 40;
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(12);
                doc.text(`Report Generated: ${this.formatDate(new Date().toISOString())}`, 15, yPosition);

                yPosition = 50;

                // Table data
                const tableData = members.map(member => [
                    member.name || 'N/A',
                    member.email || 'N/A',
                    member.phone || 'N/A',
                    member.idNo || 'N/A',
                    this.formatDate(member.createdAt)
                ]);

                doc.autoTable({
                    head: [['Name', 'Email', 'Phone', 'ID Number', 'Join Date']],
                    body: tableData,
                    startY: yPosition,
                    theme: 'grid',
                    headerStyles: {
                        fillColor: [255, 204, 0],
                        textColor: [15, 15, 15],
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        textColor: [0, 0, 0]
                    },
                    alternateRowStyles: {
                        fillColor: [255, 230, 179]
                    },
                    margin: { left: 15, right: 15 }
                });

                doc.save(`SACCO_Members_${new Date().getTime()}.pdf`);
                Swal.success('Success', 'Members exported to PDF');
            } catch (jsPDFError) {
                console.warn('jsPDF unavailable, using offline generator:', jsPDFError.message);
                // Fallback to offline PDF generator
                const htmlContent = offlinePDF.createMembersReportHTML(members);
                offlinePDF.generateTextPDF('Members Report', htmlContent, 'SACCO_Members.pdf');
                Swal.success('Success', 'Members exported (print-ready format)');
            }
        } catch (error) {
            console.error('Export error:', error);
            Swal.error('Export failed', error.message);
        }
    },

    /**
     * Export Loans to PDF
     */
    async exportLoansToPDF() {
        try {
            const loans = await Storage.getLoans();
            const members = await Storage.getMembers();

            if (!loans || loans.length === 0) {
                Swal.fire('No Data', 'No loans to export', 'info');
                return;
            }

            // Try jsPDF first, fallback to offline generator
            try {
                const jsPDF = this.getjsPDF();
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();
                let yPosition = 20;

                // Header
                doc.setFillColor(255, 204, 0);
                doc.rect(0, 0, pageWidth, 30, 'F');
                doc.setTextColor(15, 15, 15);
                doc.setFontSize(20);
                doc.text('SACCO Management System', pageWidth / 2, 15, { align: 'center' });
                doc.setFontSize(10);
                doc.text('Loans Report', pageWidth / 2, 25, { align: 'center' });

                yPosition = 40;
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(12);
                doc.text(`Report Generated: ${this.formatDate(new Date().toISOString())}`, 15, yPosition);

                yPosition = 50;

                // Table data
                const tableData = loans.map(loan => {
                    const member = members.find(m => m.id === loan.memberId);
                    
                    // Calculate monthly payment if not stored
                    const totalInterest = (loan.amount * (loan.interestRate || 0) * (loan.term || 1)) / (12 * 100);
                    const totalAmount = loan.amount + totalInterest;
                    const monthlyPayment = loan.term ? totalAmount / loan.term : 0;
                    const remaining = loan.amount - (loan.paid || 0);
                    
                    return [
                        member?.name || 'Unknown',
                        `UGX ${this.formatNumber(loan.amount)}`,
                        `UGX ${this.formatNumber(monthlyPayment)}`,
                        this.formatDate(loan.dueDate),
                        loan.status || 'Active',
                        `UGX ${this.formatNumber(remaining)}`
                    ];
                });

                doc.autoTable({
                    head: [['Member', 'Amount', 'Monthly', 'Due Date', 'Status', 'Remaining']],
                    body: tableData,
                    startY: yPosition,
                    theme: 'grid',
                    headerStyles: {
                        fillColor: [255, 204, 0],
                        textColor: [15, 15, 15],
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        textColor: [0, 0, 0]
                    },
                    alternateRowStyles: {
                        fillColor: [255, 230, 179]
                    },
                    margin: { left: 15, right: 15 }
                });

                doc.save(`SACCO_Loans_${new Date().getTime()}.pdf`);
                Swal.success('Success', 'Loans exported to PDF');
            } catch (jsPDFError) {
                console.warn('jsPDF unavailable, using offline generator:', jsPDFError.message);
                // Fallback to offline PDF generator
                const htmlContent = offlinePDF.createLoansReportHTML(loans, members);
                offlinePDF.generateTextPDF('Loans Report', htmlContent, 'SACCO_Loans.pdf');
                Swal.success('Success', 'Loans exported (print-ready format)');
            }
        } catch (error) {
            console.error('Export error:', error);
            Swal.error('Export failed', error.message);
        }
    },

    /**
     * Export Payments to PDF
     */
    async exportPaymentsToPDF() {
        try {
            const payments = await Storage.getPayments();
            const members = await Storage.getMembers();
            const loans = await Storage.getLoans();

            if (!payments || payments.length === 0) {
                Swal.fire('No Data', 'No payments to export', 'info');
                return;
            }

            // Try jsPDF first, fallback to offline generator
            try {
                const jsPDF = this.getjsPDF();
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();
                let yPosition = 20;

                // Header
                doc.setFillColor(255, 204, 0);
                doc.rect(0, 0, pageWidth, 30, 'F');
                doc.setTextColor(15, 15, 15);
                doc.setFontSize(20);
                doc.text('SACCO Management System', pageWidth / 2, 15, { align: 'center' });
                doc.setFontSize(10);
                doc.text('Payments Report', pageWidth / 2, 25, { align: 'center' });

                yPosition = 40;
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(12);
                doc.text(`Report Generated: ${this.formatDate(new Date().toISOString())}`, 15, yPosition);

                yPosition = 50;

                // Table data
                const tableData = payments.map(payment => {
                    const loan = loans.find(l => l.id === payment.loanId);
                    const member = members.find(m => m.id === loan?.memberId);
                    return [
                        member?.name || 'Unknown',
                        `UGX ${this.formatNumber(payment.amount)}`,
                        this.formatDate(payment.date),
                        loan ? `UGX ${this.formatNumber(loan.amount)}` : 'N/A'
                    ];
                });

                doc.autoTable({
                    head: [['Member', 'Amount', 'Date', 'Loan Amount']],
                    body: tableData,
                    startY: yPosition,
                    theme: 'grid',
                    headerStyles: {
                        fillColor: [255, 204, 0],
                        textColor: [15, 15, 15],
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        textColor: [0, 0, 0]
                    },
                    alternateRowStyles: {
                        fillColor: [255, 230, 179]
                    },
                    margin: { left: 15, right: 15 }
                });

                doc.save(`SACCO_Payments_${new Date().getTime()}.pdf`);
                Swal.success('Success', 'Payments exported to PDF');
            } catch (jsPDFError) {
                console.warn('jsPDF unavailable, using offline generator:', jsPDFError.message);
                // Fallback to offline PDF generator
                const htmlContent = offlinePDF.createPaymentsReportHTML(payments, members);
                offlinePDF.generateTextPDF('Payments Report', htmlContent, 'SACCO_Payments.pdf');
                Swal.success('Success', 'Payments exported (print-ready format)');
            }
        } catch (error) {
            console.error('Export error:', error);
            Swal.error('Export failed', error.message);
        }
    },

    /**
     * Export Savings to PDF
     */
    async exportSavingsToPDF() {
        try {
            const savings = await Storage.getSavings();
            const members = await Storage.getMembers();

            if (!savings || savings.length === 0) {
                Swal.fire('No Data', 'No savings data to export', 'info');
                return;
            }

            // Try jsPDF first, fallback to offline generator
            try {
                const jsPDF = this.getjsPDF();
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();
                let yPosition = 20;

                // Header
                doc.setFillColor(255, 204, 0);
                doc.rect(0, 0, pageWidth, 30, 'F');
                doc.setTextColor(15, 15, 15);
                doc.setFontSize(20);
                doc.text('SACCO Management System', pageWidth / 2, 15, { align: 'center' });
                doc.setFontSize(10);
                doc.text('Savings Report', pageWidth / 2, 25, { align: 'center' });

                yPosition = 40;
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(12);
                doc.text(`Report Generated: ${this.formatDate(new Date().toISOString())}`, 15, yPosition);

                // Summary
                const totalSavings = savings.reduce((sum, s) => sum + (s.amount || 0), 0);
                yPosition = 50;
                doc.setFontSize(11);
                doc.text(`Total Collective Savings: UGX ${this.formatNumber(totalSavings)}`, 15, yPosition);
                doc.text(`Total Records: ${savings.length}`, 15, yPosition + 8);

                yPosition = 65;

                // Table data
                const tableData = savings.map(saving => {
                    const member = members.find(m => m.id === saving.memberId);
                    return [
                        member?.name || 'Unknown',
                        `UGX ${this.formatNumber(saving.amount)}`,
                        this.formatDate(saving.date)
                    ];
                });

                doc.autoTable({
                    head: [['Member', 'Amount', 'Date']],
                    body: tableData,
                    startY: yPosition,
                    theme: 'grid',
                    headerStyles: {
                        fillColor: [255, 204, 0],
                        textColor: [15, 15, 15],
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        textColor: [0, 0, 0]
                    },
                    alternateRowStyles: {
                        fillColor: [255, 230, 179]
                    },
                    margin: { left: 15, right: 15 }
                });

                doc.save(`SACCO_Savings_${new Date().getTime()}.pdf`);
                Swal.success('Success', 'Savings exported to PDF');
            } catch (jsPDFError) {
                console.warn('jsPDF unavailable, using offline generator:', jsPDFError.message);
                // Fallback to offline PDF generator
                const htmlContent = offlinePDF.createSavingsReportHTML(savings, members);
                offlinePDF.generateTextPDF('Savings Report', htmlContent, 'SACCO_Savings.pdf');
                Swal.success('Success', 'Savings exported (print-ready format)');
            }
        } catch (error) {
            console.error('Export error:', error);
            Swal.error('Export failed', error.message);
        }
    },

    /**
     * Export All Critical Data to PDF (Comprehensive Report)
     */
    async exportComprehensiveReportPDF() {
        try {
            const members = await Storage.getMembers();
            const loans = await Storage.getLoans();
            const payments = await Storage.getPayments();
            const savings = await Storage.getSavings();

            if (!members || members.length === 0) {
                Swal.fire('No Data', 'No data to export', 'info');
                return;
            }

            const jsPDF = this.getjsPDF();
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Cover Page
            doc.setFillColor(255, 204, 0);
            doc.rect(0, 0, pageWidth, 60, 'F');
            doc.setTextColor(15, 15, 15);
            doc.setFontSize(28);
            doc.text('SACCO Management System', pageWidth / 2, 30, { align: 'center' });
            doc.setFontSize(14);
            doc.text('Comprehensive Report', pageWidth / 2, 50, { align: 'center' });

            let yPosition = 80;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`, pageWidth / 2, yPosition, { align: 'center' });

            // Summary Statistics
            yPosition = 110;
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Summary Statistics', 15, yPosition);

            yPosition += 15;
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            const totalLoaned = loans.reduce((sum, l) => sum + (l.amount || 0), 0);
            const totalRepaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const totalSavings = savings.reduce((sum, s) => sum + (s.amount || 0), 0);
            const outstanding = totalLoaned - totalRepaid;

            doc.text(`Total Members: ${members.length}`, 15, yPosition);
            doc.text(`Total Loaned: UGX ${this.formatNumber(totalLoaned)}`, 15, yPosition + 7);
            doc.text(`Total Repaid: UGX ${this.formatNumber(totalRepaid)}`, 15, yPosition + 14);
            doc.text(`Outstanding Balance: UGX ${this.formatNumber(outstanding)}`, 15, yPosition + 21);
            doc.text(`Total Collective Savings: UGX ${this.formatNumber(totalSavings)}`, 15, yPosition + 28);

            // Page break
            doc.addPage();

            // Members Table
            yPosition = 20;
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Members Report', 15, yPosition);

            yPosition = 30;
            const membersData = members.map(member => [
                member.name || 'N/A',
                member.email || 'N/A',
                member.phone || 'N/A',
                this.formatDate(member.createdAt)
            ]);

            doc.autoTable({
                head: [['Name', 'Email', 'Phone', 'Join Date']],
                body: membersData,
                startY: yPosition,
                theme: 'grid',
                headerStyles: {
                    fillColor: [255, 204, 0],
                    textColor: [15, 15, 15],
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    textColor: [0, 0, 0]
                },
                alternateRowStyles: {
                    fillColor: [255, 230, 179]
                },
                margin: { left: 15, right: 15 }
            });

            // Page break
            doc.addPage();

            // Loans Table
            yPosition = 20;
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Loans Report', 15, yPosition);

            if (loans && loans.length > 0) {
                yPosition = 30;
                const loansData = loans.map(loan => {
                    const member = members.find(m => m.id === loan.memberId);
                    
                    // Calculate monthly payment if not stored
                    const totalInterest = (loan.amount * (loan.interestRate || 0) * (loan.term || 1)) / (12 * 100);
                    const totalAmount = loan.amount + totalInterest;
                    const monthlyPayment = loan.term ? totalAmount / loan.term : 0;
                    const remaining = loan.amount - (loan.paid || 0);
                    
                    return [
                        member?.name || 'Unknown',
                        `UGX ${this.formatNumber(loan.amount)}`,
                        `UGX ${this.formatNumber(monthlyPayment)}`,
                        this.formatDate(loan.dueDate),
                        loan.status || 'Active',
                        `UGX ${this.formatNumber(remaining)}`
                    ];
                });

                doc.autoTable({
                    head: [['Member', 'Amount', 'Monthly', 'Due Date', 'Status', 'Remaining']],
                    body: loansData,
                    startY: yPosition,
                    theme: 'grid',
                    headerStyles: {
                        fillColor: [255, 204, 0],
                        textColor: [15, 15, 15],
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        textColor: [0, 0, 0]
                    },
                    alternateRowStyles: {
                        fillColor: [255, 230, 179]
                    },
                    margin: { left: 15, right: 15 }
                });
            } else {
                yPosition += 10;
                doc.setFontSize(11);
                doc.text('No loans recorded yet', 15, yPosition);
            }

            doc.save(`SACCO_Comprehensive_Report_${new Date().getTime()}.pdf`);
            Swal.fire('Success', 'Comprehensive report exported to PDF', 'success');
        } catch (error) {
            console.error('Export error:', error);
            Swal.fire('Error', 'Export failed: ' + error.message, 'error');
        }
    },

    /**
     * Export Members to Excel
     */
    async exportMembersToExcel() {
        try {
            const members = await Storage.getMembers();

            if (!members || members.length === 0) {
                Swal.fire('No Data', 'No members to export', 'info');
                return;
            }

            const data = members.map(member => ({
                'Name': member.name,
                'Email': member.email,
                'Phone': member.phone,
                'ID Number': member.idNo,
                'Join Date': this.formatDate(member.createdAt)
            }));

            this.downloadExcel(data, `SACCO_Members_${new Date().getTime()}.xlsx`);
            Swal.fire('Success', 'Members exported to Excel', 'success');
        } catch (error) {
            console.error('Export error:', error);
            Swal.fire('Error', 'Export failed: ' + error.message, 'error');
        }
    },

    /**
     * Export Loans to Excel
     */
    async exportLoansToExcel() {
        try {
            const loans = await Storage.getLoans();
            const members = await Storage.getMembers();

            if (!loans || loans.length === 0) {
                Swal.fire('No Data', 'No loans to export', 'info');
                return;
            }

            const data = loans.map(loan => {
                const member = members.find(m => m.id === loan.memberId);
                
                // Calculate monthly payment if not stored
                const totalInterest = (loan.amount * (loan.interestRate || 0) * (loan.term || 1)) / (12 * 100);
                const totalAmount = loan.amount + totalInterest;
                const monthlyPayment = loan.term ? totalAmount / loan.term : 0;
                const remaining = loan.amount - (loan.paid || 0);
                
                return {
                    'Member': member?.name || 'Unknown',
                    'Loan Amount': `UGX ${this.formatNumber(loan.amount)}`,
                    'Monthly Payment': `UGX ${this.formatNumber(monthlyPayment)}`,
                    'Due Date': this.formatDate(loan.dueDate),
                    'Status': loan.status || 'Active',
                    'Remaining Balance': `UGX ${this.formatNumber(remaining)}`,
                    'Interest Rate': `${loan.interestRate || 0}%`,
                    'Loan Date': this.formatDate(loan.loanDate)
                };
            });

            this.downloadExcel(data, `SACCO_Loans_${new Date().getTime()}.xlsx`);
            Swal.fire('Success', 'Loans exported to Excel', 'success');
        } catch (error) {
            console.error('Export error:', error);
            Swal.fire('Error', 'Export failed: ' + error.message, 'error');
        }
    },

    /**
     * Export Payments to Excel
     */
    async exportPaymentsToExcel() {
        try {
            const payments = await Storage.getPayments();
            const members = await Storage.getMembers();
            const loans = await Storage.getLoans();

            if (!payments || payments.length === 0) {
                Swal.fire('No Data', 'No payments to export', 'info');
                return;
            }

            const data = payments.map(payment => {
                const loan = loans.find(l => l.id === payment.loanId);
                const member = members.find(m => m.id === loan?.memberId);
                return {
                    'Member': member?.name || 'Unknown',
                    'Amount': `UGX ${this.formatNumber(payment.amount)}`,
                    'Date': this.formatDate(payment.date),
                    'Loan Amount': loan ? `UGX ${this.formatNumber(loan.amount)}` : 'N/A',
                    'Loan Status': loan?.status || 'N/A'
                };
            });

            this.downloadExcel(data, `SACCO_Payments_${new Date().getTime()}.xlsx`);
            Swal.fire('Success', 'Payments exported to Excel', 'success');
        } catch (error) {
            console.error('Export error:', error);
            Swal.fire('Error', 'Export failed: ' + error.message, 'error');
        }
    },

    /**
     * Export Savings to Excel
     */
    async exportSavingsToExcel() {
        try {
            const savings = await Storage.getSavings();
            const members = await Storage.getMembers();

            if (!savings || savings.length === 0) {
                Swal.fire('No Data', 'No savings data to export', 'info');
                return;
            }

            // Calculate member summary
            const memberSavings = {};
            savings.forEach(saving => {
                const memberId = saving.memberId;
                if (!memberSavings[memberId]) {
                    const member = members.find(m => m.id === memberId);
                    memberSavings[memberId] = {
                        'Member Name': member?.name || 'Unknown',
                        'Total Savings': 0,
                        'Contributions Count': 0,
                        'Last Contribution': '',
                        'Average Contribution': 0
                    };
                }
                memberSavings[memberId]['Total Savings'] += saving.amount || 0;
                memberSavings[memberId]['Contributions Count'] += 1;
                memberSavings[memberId]['Last Contribution'] = this.formatDate(saving.date);
            });

            const data = Object.values(memberSavings).map(item => ({
                'Member Name': item['Member Name'],
                'Total Savings': `UGX ${this.formatNumber(item['Total Savings'])}`,
                'Contributions Count': item['Contributions Count'],
                'Last Contribution': item['Last Contribution'],
                'Average Contribution': `UGX ${this.formatNumber(item['Total Savings'] / item['Contributions Count'])}`
            }));

            this.downloadExcel(data, `SACCO_Savings_${new Date().getTime()}.xlsx`);
            Swal.fire('Success', 'Savings exported to Excel', 'success');
        } catch (error) {
            console.error('Export error:', error);
            Swal.fire('Error', 'Export failed: ' + error.message, 'error');
        }
    },

    /**
     * Get theme colors from CSS variables
     */
    getThemeColors() {
        const root = document.documentElement;
        const styles = getComputedStyle(root);
        
        return {
            primary: styles.getPropertyValue('--primary').trim(),
            primaryLight: styles.getPropertyValue('--primary-light').trim(),
            primaryDark: styles.getPropertyValue('--primary-dark').trim(),
            dark: styles.getPropertyValue('--dark').trim(),
            text: styles.getPropertyValue('--text').trim()
        };
    },

    /**
     * Helper function to download Excel file with formatting using SheetJS
     */
    downloadExcel(data, filename) {
        // Try SheetJS first (if online)
        if (window.XLSX && typeof XLSX !== 'undefined') {
            return this.downloadExcelWithSheetJS(data, filename);
        }
        
        // Fallback to CSV/TSV when SheetJS unavailable (offline)
        console.warn('SheetJS not available, using offline CSV export');
        return this.downloadExcelOffline(data, filename);
    },

    downloadExcelWithSheetJS(data, filename) {
        try {
            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);

            if (data.length > 0) {
                const headers = Object.keys(data[0]);
                const range = XLSX.utils.decode_range(ws['!ref']);
                
                // Set column widths
                const colWidths = [];
                headers.forEach(header => {
                    let maxLength = header.length;
                    data.forEach(row => {
                        maxLength = Math.max(maxLength, String(row[header]).length);
                    });
                    colWidths.push({ wch: Math.min(maxLength + 3, 50) });
                });
                ws['!cols'] = colWidths;

                // Apply styling using cell properties (free version compatibility)
                // Format header row with app's default theme color (#FFCC00)
                for (let col = range.s.c; col <= range.e.c; col++) {
                    const cellRef = XLSX.utils.encode_col(col) + '1';
                    const cell = ws[cellRef];
                    if (cell) {
                        // Apply styles - XLSX free version
                        cell.s = {
                            font: { bold: true, sz: 12, color: { rgb: '0F0F0F' } },
                            fill: { patternType: 'solid', fgColor: { rgb: 'FFCC00' }, bgColor: { rgb: 'FFCC00' } },
                            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                            border: {
                                left: { style: 'thin', color: { rgb: 'FFB700' } },
                                right: { style: 'thin', color: { rgb: 'FFB700' } },
                                top: { style: 'thin', color: { rgb: 'FFB700' } },
                                bottom: { style: 'thin', color: { rgb: 'FFB700' } }
                            }
                        };
                    }
                }

                // Freeze header row
                ws['!freeze'] = { xSplit: 0, ySplit: 1 };

                // Add autofilter
                ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
            }

            XLSX.utils.book_append_sheet(wb, ws, 'Data');
            XLSX.writeFile(wb, filename);
        } catch (error) {
            console.error('Export error:', error);
            Swal.fire('Error', 'Export failed: ' + error.message, 'error');
        }
    },

    /**
     * Offline Excel export fallback
     * Uses CSV, TSV, or HTML table format
     */
    downloadExcelOffline(data, filename) {
        try {
            console.log('Using offline Excel export (CSV format)');
            
            if (!data || data.length === 0) {
                Swal.fire('No Data', 'No data to export', 'info');
                return;
            }

            // Check if OfflineExcelGenerator is available
            if (typeof OfflineExcelGenerator !== 'undefined') {
                OfflineExcelGenerator.downloadAllFormats(data, filename);
            } else {
                // Fallback: simple CSV download
                const csv = this.dataToCSV(data);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename.replace('.xlsx', '.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                Swal.fire('Success', 'Exported as CSV (Excel-compatible)', 'success');
            }
        } catch (error) {
            console.error('Offline export error:', error);
            Swal.fire('Error', 'Offline export failed: ' + error.message, 'error');
        }
    },

    /**
     * Simple CSV conversion helper
     */
    dataToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvHeaders = headers.map(h => this.escapeCSV(h)).join(',');
        
        const csvRows = data.map(row => {
            return headers.map(header => {
                const value = row[header] !== undefined ? row[header] : '';
                return this.escapeCSV(value);
            }).join(',');
        });

        return [csvHeaders, ...csvRows].join('\n');
    },

    /**
     * Escape CSV values with special characters
     */
    escapeCSV(value) {
        const strValue = String(value);
        if (strValue.includes(',') || strValue.includes('\n') || strValue.includes('"')) {
            return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
    },

    /**
     * Convert color hex to RGB hex format for XLSX
     */
    colorToRgbHex(color) {
        // If already in hex format
        if (color.startsWith('#')) {
            return color.substring(1).toUpperCase();
        }
        // If in rgb format like "rgb(255, 204, 0)"
        const match = color.match(/\d+/g);
        if (match && match.length >= 3) {
            const r = parseInt(match[0]).toString(16).padStart(2, '0').toUpperCase();
            const g = parseInt(match[1]).toString(16).padStart(2, '0').toUpperCase();
            const b = parseInt(match[2]).toString(16).padStart(2, '0').toUpperCase();
            return r + g + b;
        }
        return 'FFCC00';
    },

    /**
     * Show export menu
     */
    showExportMenu() {
        // Check if jsPDF is available for PDF options
        const pdfAvailable = typeof window.jsPDF === 'function' || (window.jspdf && typeof window.jspdf.jsPDF === 'function');
        
        const inputOptions = {
            '': '-- Select what to export --',
            'members_excel': '📊 Members to Excel',
            'loans_excel': '📊 Loans to Excel',
            'payments_excel': '📊 Payments to Excel',
            'savings_excel': '📊 Savings to Excel'
        };
        
        // Only add PDF options if jsPDF is available
        if (pdfAvailable) {
            Object.assign(inputOptions, {
                'members_pdf': '📄 Members to PDF',
                'loans_pdf': '📄 Loans to PDF',
                'payments_pdf': '📄 Payments to PDF',
                'savings_pdf': '📄 Savings to PDF',
                'comprehensive_pdf': '📄 Comprehensive Report (PDF)'
            });
        }
        
        Swal.fire({
            title: 'Choose Export Type',
            input: 'select',
            inputOptions: inputOptions,
            inputPlaceholder: 'Select export option',
            showCancelButton: true,
            confirmButtonText: 'Export',
            confirmButtonColor: '#FFCC00',
            cancelButtonColor: '#d33',
            footer: pdfAvailable ? '' : '<small style="color: #ff9800;">⚠️ PDF export unavailable (CDN connection issue). Excel export is available.</small>'
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                switch (result.value) {
                    case 'members_pdf':
                        await this.exportMembersToPDF();
                        break;
                    case 'loans_pdf':
                        await this.exportLoansToPDF();
                        break;
                    case 'payments_pdf':
                        await this.exportPaymentsToPDF();
                        break;
                    case 'savings_pdf':
                        await this.exportSavingsToPDF();
                        break;
                    case 'comprehensive_pdf':
                        await this.exportComprehensiveReportPDF();
                        break;
                    case 'members_excel':
                        await this.exportMembersToExcel();
                        break;
                    case 'loans_excel':
                        await this.exportLoansToExcel();
                        break;
                    case 'payments_excel':
                        await this.exportPaymentsToExcel();
                        break;
                    case 'savings_excel':
                        await this.exportSavingsToExcel();
                        break;
                }
            }
        });
    }
};

/**
 * Offline PDF Generator
 * Generates simple PDF files without external CDN dependencies
 * Uses HTML to Canvas to PDF conversion as fallback
 */

class OfflinePDFGenerator {
    constructor() {
        this.pageWidth = 210;  // A4 width in mm
        this.pageHeight = 297; // A4 height in mm
        this.margins = { top: 15, right: 15, bottom: 15, left: 15 };
    }

    /**
     * Generate simple text-based PDF
     * This creates a more robust fallback when jsPDF is unavailable
     */
    generateTextPDF(title, content, filename = 'document.pdf') {
        try {
            // Create HTML content
            const htmlContent = this.generateHTMLContent(title, content);
            
            // Try to use html2canvas + jsPDF if available
            if (typeof html2canvas !== 'undefined' && typeof window.jsPDF !== 'undefined') {
                return this.generateHTMLtoPDF(htmlContent, filename);
            }
            
            // Fallback: Generate downloadable text file that can be printed as PDF
            return this.generatePrintableHTML(htmlContent, filename);
        } catch (error) {
            console.error('PDF generation error:', error);
            throw error;
        }
    }

    /**
     * Generate HTML to PDF using html2canvas
     */
    async generateHTMLtoPDF(htmlContent, filename) {
        try {
            // Create temporary container
            const container = document.createElement('div');
            container.style.cssText = `
                position: fixed;
                left: -9999px;
                top: -9999px;
                width: 800px;
                background: white;
                padding: 20px;
            `;
            container.innerHTML = htmlContent;
            document.body.appendChild(container);

            // Convert to canvas
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            // Create PDF
            const jsPDF = window.jsPDF;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(filename);

            // Clean up
            document.body.removeChild(container);
            return true;
        } catch (error) {
            console.error('HTML to PDF conversion error:', error);
            throw error;
        }
    }

    /**
     * Generate printable HTML as fallback
     * Users can print to PDF from browser
     */
    generatePrintableHTML(htmlContent, filename) {
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${filename}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        color: #333;
                    }
                    h1 { 
                        text-align: center; 
                        color: #1f2937;
                        border-bottom: 2px solid #FFCC00;
                        padding-bottom: 10px;
                    }
                    h2 {
                        color: #374151;
                        margin-top: 20px;
                        border-bottom: 1px solid #d1d5db;
                        padding-bottom: 5px;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 20px;
                    }
                    .section {
                        margin: 20px 0;
                        page-break-inside: avoid;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 10px 0;
                    }
                    th {
                        background-color: #3b82f6;
                        color: white;
                        padding: 10px;
                        text-align: left;
                        border: 1px solid #d1d5db;
                    }
                    td {
                        padding: 10px;
                        border: 1px solid #d1d5db;
                    }
                    tr:nth-child(even) {
                        background-color: #f9fafb;
                    }
                    .footer {
                        margin-top: 30px;
                        padding-top: 10px;
                        border-top: 1px solid #d1d5db;
                        text-align: center;
                        font-size: 12px;
                        color: #6b7280;
                    }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                ${htmlContent}
                <div class="footer">
                    <p>Generated from SACCO Management System | Together AS One</p>
                    <p>Date: ${new Date().toLocaleString()}</p>
                </div>
                <div class="no-print" style="margin-top: 20px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #FFCC00; color: #0f0f0f; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                        Print or Save as PDF
                    </button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #d1d5db; color: #333; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                        Close
                    </button>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        
        // Auto-open print dialog after a short delay
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    }

    /**
     * Generate HTML content template
     */
    generateHTMLContent(title, content) {
        return `
            <div class="header">
                <h1>${this.escapeHtml(title)}</h1>
                <p style="color: #6b7280; margin: 5px 0;">SACCO Management System - Together AS One</p>
            </div>
            <div class="content">
                ${content}
            </div>
        `;
    }

    /**
     * Create members report HTML
     */
    createMembersReportHTML(members) {
        if (!members || members.length === 0) {
            return '<p style="text-align: center; color: #d1d5db;">No members to display</p>';
        }

        const rows = members.map(m => `
            <tr>
                <td>${this.escapeHtml(m.name)}</td>
                <td>${this.escapeHtml(m.email)}</td>
                <td>${this.escapeHtml(m.phone)}</td>
                <td>${this.escapeHtml(m.id)}</td>
            </tr>
        `).join('');

        return `
            <div class="section">
                <h2>Members List</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Member ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <p style="font-size: 12px; color: #6b7280;">Total Members: ${members.length}</p>
            </div>
        `;
    }

    /**
     * Create loans report HTML
     */
    createLoansReportHTML(loans, members = []) {
        if (!loans || loans.length === 0) {
            return '<p style="text-align: center; color: #d1d5db;">No loans to display</p>';
        }

        const memberMap = {};
        members.forEach(m => memberMap[m.id] = m.name);

        const rows = loans.map(l => {
            const totalInterest = (l.amount * (l.interestRate || 0) * l.term) / (12 * 100);
            const monthlyPayment = (l.amount + totalInterest) / l.term;
            
            return `
            <tr>
                <td>${this.escapeHtml(memberMap[l.memberId] || 'Unknown')}</td>
                <td>UGX ${this.formatNumber(l.amount)}</td>
                <td>UGX ${this.formatNumber(Math.round(monthlyPayment))}</td>
                <td>${l.term} months</td>
                <td>${l.interestRate || 0}%</td>
                <td>${l.status || 'Active'}</td>
            </tr>
        `;
        }).join('');

        return `
            <div class="section">
                <h2>Loans Report</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>Amount</th>
                            <th>Monthly Payment</th>
                            <th>Term</th>
                            <th>Interest</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <p style="font-size: 12px; color: #6b7280;">Total Loans: ${loans.length}</p>
            </div>
        `;
    }

    /**
     * Create payments report HTML
     */
    createPaymentsReportHTML(payments, members = []) {
        if (!payments || payments.length === 0) {
            return '<p style="text-align: center; color: #d1d5db;">No payments to display</p>';
        }

        const memberMap = {};
        members.forEach(m => memberMap[m.id] = m.name);

        const rows = payments.map(p => `
            <tr>
                <td>${this.escapeHtml(memberMap[p.memberId] || 'Unknown')}</td>
                <td>UGX ${this.formatNumber(p.amount)}</td>
                <td>${this.formatDate(p.paymentDate)}</td>
                <td>${this.escapeHtml(p.loanId)}</td>
            </tr>
        `).join('');

        return `
            <div class="section">
                <h2>Payments Report</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Loan ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <p style="font-size: 12px; color: #6b7280;">Total Payments: ${payments.length}</p>
            </div>
        `;
    }

    /**
     * Create savings report HTML
     */
    createSavingsReportHTML(savings, members = []) {
        if (!savings || savings.length === 0) {
            return '<p style="text-align: center; color: #d1d5db;">No savings data to display</p>';
        }

        const memberMap = {};
        members.forEach(m => memberMap[m.id] = m.name);

        const totalSavings = savings.reduce((sum, s) => sum + (s.amount || 0), 0);

        const rows = savings.map(s => `
            <tr>
                <td>${this.escapeHtml(memberMap[s.memberId] || 'Unknown')}</td>
                <td>UGX ${this.formatNumber(s.amount)}</td>
                <td>${this.formatDate(s.savingDate)}</td>
            </tr>
        `).join('');

        return `
            <div class="section">
                <h2>Savings Report</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>Amount</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <p style="font-size: 12px; color: #6b7280;">
                    Total Savings: <strong>UGX ${this.formatNumber(totalSavings)}</strong>
                </p>
            </div>
        `;
    }

    /**
     * Format number with commas
     */
    formatNumber(num) {
        if (!num) return '0';
        const numValue = typeof num === 'string' ? parseFloat(num) : num;
        if (isNaN(numValue)) return '0';
        return new Intl.NumberFormat('en-US').format(Math.round(numValue));
    }

    /**
     * Format date
     */
    formatDate(dateInput) {
        if (!dateInput) return 'N/A';
        
        let date;
        if (typeof dateInput === 'string') {
            if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const parts = dateInput.split('-');
                date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else {
                date = new Date(dateInput);
            }
        } else {
            date = new Date(dateInput);
        }
        
        if (isNaN(date.getTime())) return dateInput;
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
const offlinePDF = new OfflinePDFGenerator();

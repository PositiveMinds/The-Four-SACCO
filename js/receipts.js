// Receipt Generation Module with Enhanced Features
// Generates professional PDF receipts with QR codes, digital signatures, and member records

// QR Code library (using qrcode.js from local vendor)
let QRCodeLibraryLoaded = false;
const QRCodeScript = document.createElement('script');
QRCodeScript.src = 'vendor/qrcodejs/qrcodejs.min.js';
QRCodeScript.onload = function() {
    QRCodeLibraryLoaded = true;
    console.log('QRCode library loaded successfully from local vendor');
};
QRCodeScript.onerror = function() {
    console.warn('Failed to load QRCode library from local vendor, attempting fallback CDN...');
    const fallbackScript = document.createElement('script');
    fallbackScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    fallbackScript.onload = function() {
        QRCodeLibraryLoaded = true;
        console.log('QRCode library loaded from CDN fallback');
    };
    fallbackScript.onerror = function() {
        console.error('All QRCode sources failed');
    };
    document.head.appendChild(fallbackScript);
};
document.head.appendChild(QRCodeScript);

const ReceiptGenerator = {

    // Initialize and ensure QRCode library is loaded
    async initQRCodeLibrary() {
        if (typeof QRCode !== 'undefined' && QRCodeLibraryLoaded) {
            return true; // Already loaded
        }
        
        return await this.waitForQRCodeLibrary();
    },

    // Wait for QRCode library to load
    async waitForQRCodeLibrary(maxWait = 8000) {
        const startTime = Date.now();
        let lastCheck = 0;
        
        while (Date.now() - startTime < maxWait) {
            if (typeof QRCode !== 'undefined' && QRCodeLibraryLoaded) {
                console.log('QRCode library ready');
                return true;
            }
            
            // Log progress every 2 seconds
            if (Date.now() - lastCheck > 2000) {
                console.log(`Waiting for QRCode library... (${Date.now() - startTime}ms elapsed)`);
                lastCheck = Date.now();
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        console.error(`QRCode library not available after ${maxWait}ms. QRCode defined: ${typeof QRCode !== 'undefined'}, Loaded flag: ${QRCodeLibraryLoaded}`);
        return false;
    },

    // Generate QR Code data URL
    async generateQRCode(text, size = 200) {
        return new Promise(async (resolve) => {
            try {
                // Limit text length to avoid QR code overflow
                const maxLength = 200;
                if (text.length > maxLength) {
                    console.warn(`QR text too long (${text.length} chars), truncating to ${maxLength}`);
                    text = text.substring(0, maxLength);
                }
                
                // Wait for QRCode library to load
                const loaded = await this.waitForQRCodeLibrary();
                
                if (!loaded) {
                    console.error('QRCode library failed to load after 5 seconds');
                    resolve(null);
                    return;
                }
                
                const qrContainer = document.createElement('div');
                qrContainer.style.display = 'none';
                qrContainer.style.position = 'absolute';
                qrContainer.style.top = '-9999px';
                document.body.appendChild(qrContainer);
                
                if (typeof QRCode !== 'undefined') {
                    try {
                        new QRCode(qrContainer, {
                            text: text,
                            width: size,
                            height: size,
                            colorDark: '#000000',
                            colorLight: '#ffffff',
                            correctLevel: QRCode.CorrectLevel.M // Changed from H to M for larger data capacity
                        });

                        setTimeout(() => {
                            try {
                                const canvas = qrContainer.querySelector('canvas');
                                if (canvas) {
                                    const dataUrl = canvas.toDataURL('image/png');
                                    if (document.body.contains(qrContainer)) {
                                        document.body.removeChild(qrContainer);
                                    }
                                    resolve(dataUrl);
                                } else {
                                    if (document.body.contains(qrContainer)) {
                                        document.body.removeChild(qrContainer);
                                    }
                                    resolve(null);
                                }
                            } catch (err) {
                                console.error('Error extracting canvas:', err);
                                if (document.body.contains(qrContainer)) {
                                    document.body.removeChild(qrContainer);
                                }
                                resolve(null);
                            }
                        }, 150);
                    } catch (err) {
                        console.error('QRCode generation error:', err);
                        if (document.body.contains(qrContainer)) {
                            document.body.removeChild(qrContainer);
                        }
                        resolve(null);
                    }
                } else {
                    console.error('QRCode library still not available');
                    if (document.body.contains(qrContainer)) {
                        document.body.removeChild(qrContainer);
                    }
                    resolve(null);
                }
            } catch (error) {
                console.error('QR Code generation failed:', error);
                resolve(null);
            }
        });
    },

    // Generate digital signature
    generateSignature() {
        const timestamp = new Date().getTime();
        const random = Math.random().toString(36).substring(2, 15);
        return btoa(`SACCO_${timestamp}_${random}`).substring(0, 16).toUpperCase();
    },

    // Draw digital signature on PDF
    drawDigitalSignature(doc, yPosition, margin, pageWidth) {
        const signature = this.generateSignature();
        
        // System theme colors (gold)
        const bgColor = [255, 220, 179];
        const textColor = [100, 100, 100];
        const sigColor = [50, 50, 50];
        
        // Signature box
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(margin, yPosition, pageWidth - (2 * margin), 12, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text('Digital Signature:', margin + 5, yPosition + 4);
        
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(sigColor[0], sigColor[1], sigColor[2]);
        doc.text(signature, margin + 40, yPosition + 4);
        
        return signature;
    },

    // Convert hex color to RGB array
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [255, 204, 0];
    },
    // Wait for jsPDF to be loaded (with timeout)
    async waitForJsPDF(maxWait = 5000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            if (typeof window.jsPDF !== 'undefined') {
                console.log('jsPDF found in window.jsPDF');
                return window.jsPDF;
            }
            if (typeof jsPDF !== 'undefined') {
                console.log('jsPDF found in global scope');
                return jsPDF;
            }
            if (window.jsPDF && typeof window.jsPDF === 'function') {
                console.log('jsPDF constructor available');
                return window.jsPDF;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        throw new Error('jsPDF library failed to load within ' + maxWait + 'ms. Check if CDN is accessible.');
    },

    // Get jsPDF constructor with proper fallback
    getJsPDF() {
        if (typeof window.jsPDF !== 'undefined' && typeof window.jsPDF === 'function') {
            console.log('✓ jsPDF is available');
            return window.jsPDF;
        }
        if (typeof jsPDF !== 'undefined' && typeof jsPDF === 'function') {
            console.log('✓ jsPDF is available (global)');
            return jsPDF;
        }
        
        console.error('✗ jsPDF not found. Available globals:', Object.keys(window).filter(k => k.includes('PDF') || k.includes('pdf')));
        throw new Error('jsPDF library is not loaded. Please ensure the CDN is accessible.');
    },

    // Format number with thousands separator
    formatNumber(num) {
        return new Intl.NumberFormat('en-US').format(Math.round(num));
    },

    // Generate comprehensive member data for QR code
    async generateMemberQRData(member, transactionType, transactionData = {}) {
        // Human-readable QR code with essential transaction details
        let qrText = `${member.name}\n`;
        qrText += `ID: ${member.idNo}\n`;
        qrText += `Transaction: ${transactionType}\n\n`;
        
        // Add transaction-specific essential data
        if (transactionType === 'PAYMENT') {
            // For loan payments, include comprehensive loan details
            const totalLoans = await Storage.getLoans();
            const memberLoans = totalLoans.filter(l => l.memberId === member.id);
            const totalLoanAmount = memberLoans.reduce((sum, l) => sum + l.amount, 0);
            
            qrText += `--- PAYMENT DETAILS ---\n`;
            qrText += `Amount Paid: UGX ${this.formatNumber(transactionData.paymentAmount)}\n`;
            qrText += `Payment Date: ${transactionData.paymentDate}\n`;
            qrText += `Total Loans: UGX ${this.formatNumber(totalLoanAmount)}\n`;
            qrText += `Amount Remaining: UGX ${this.formatNumber(transactionData.remaining)}\n`;
            qrText += `Due Date: ${transactionData.dueDate || 'N/A'}`;
        } else if (transactionType === 'SAVINGS') {
            // For savings, show total savings and latest deposit
            qrText += `--- SAVINGS DETAILS ---\n`;
            qrText += `Amount Deposited: UGX ${this.formatNumber(transactionData.savingAmount)}\n`;
            qrText += `Deposit Date: ${transactionData.savingDate}\n`;
            qrText += `Total in Savings: UGX ${this.formatNumber(transactionData.totalSavings)}\n`;
            qrText += `Last Deposit: UGX ${this.formatNumber(transactionData.savingAmount)}\n`;
            qrText += `Available: UGX ${this.formatNumber(transactionData.availableSavings)}`;
        } else if (transactionType === 'WITHDRAWAL') {
            // For withdrawals, show amount withdrawn and balance remaining
            qrText += `--- WITHDRAWAL DETAILS ---\n`;
            qrText += `Amount Withdrawn: UGX ${this.formatNumber(transactionData.withdrawalAmount)}\n`;
            qrText += `Withdrawal Date: ${transactionData.withdrawalDate}\n`;
            qrText += `Balance Remaining: UGX ${this.formatNumber(transactionData.remainingSavings)}\n`;
            qrText += `Total Savings: UGX ${this.formatNumber(transactionData.totalSavings)}\n`;
            qrText += `Total Withdrawn: UGX ${this.formatNumber(transactionData.totalWithdrawals)}`;
        }
        
        return qrText;
    },

    // Draw professional header
    drawHeader(doc, pageWidth, title) {
        const margin = 20;
        
        // Gradient-like effect with two rectangles
        doc.setFillColor(15, 23, 42); // Dark blue
        doc.rect(0, 0, pageWidth, 50, 'F');
        
        doc.setFillColor(255, 204, 0); // Gold accent
        doc.rect(0, 45, pageWidth, 8, 'F');
        
        // Organization name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(255, 204, 0);
        doc.text('THE FOUR', margin, 22);
        
        // Tagline
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(200, 200, 200);
        doc.text('Savings and Credit Cooperative Society', margin, 32);
        
        // Receipt type (right aligned)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(255, 204, 0);
        doc.text(title, pageWidth - margin, 22, { align: 'right' });
        
        return 60;
    },

    // Draw section header with underline
    drawSectionHeader(doc, text, yPosition, margin, pageWidth) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(text, margin, yPosition);
        
        // Decorative line
        doc.setDrawColor(255, 204, 0);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
        
        return yPosition + 10;
    },

    // Draw info row (label: value)
    drawInfoRow(doc, label, value, yPosition, margin, labelWidth = 60, fontSize = 9) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontSize);
        doc.setTextColor(60, 60, 60);
        doc.text(label, margin, yPosition);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 30, 30);
        doc.text(value, margin + labelWidth, yPosition);
        
        return yPosition + 6;
    },

    // Draw amount highlight box
    drawAmountBox(doc, label, amount, yPosition, margin, pageWidth) {
        const boxHeight = 18;
        const boxY = yPosition - 5;
        
        // Background
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, boxY, pageWidth - (2 * margin), boxHeight, 'F');
        
        // Border
        doc.setDrawColor(255, 204, 0);
        doc.setLineWidth(1);
        doc.rect(margin, boxY, pageWidth - (2 * margin), boxHeight);
        
        // Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(label, margin + 5, yPosition + 2);
        
        // Amount
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(255, 204, 0);
        doc.text(amount, pageWidth - margin - 5, yPosition + 2, { align: 'right' });
        
        return yPosition + boxHeight + 8;
    },

    // Draw footer with QR placeholder and thank you message
    drawFooter(doc, pageWidth, pageHeight, message) {
        const margin = 20;
        const footerY = pageHeight - 30;
        
        // Top border line
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
        
        // Message
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(message, pageWidth / 2, footerY, { align: 'center' });
        
        // Date and time
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        const now = new Date().toLocaleString();
        doc.text(`Generated: ${now}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    },

    // Generate payment receipt with QR code, digital signature, and member history
    async generatePaymentReceipt(payment, loan, member, memberTransactions = null) {
        const jsPDFConstructor = await this.waitForJsPDF();
        const doc = new jsPDFConstructor();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;

        // Header
        let yPosition = this.drawHeader(doc, pageWidth, 'PAYMENT RECEIPT');
        yPosition += 8;

        // Receipt info section
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        
        const receiptNum = `RCP-${new Date().getTime().toString().slice(-8).toUpperCase()}`;
        const receiptDate = new Date(payment.createdAt);
        
        yPosition = this.drawInfoRow(doc, 'Receipt #:', receiptNum, yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Date:', receiptDate.toLocaleDateString(), yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Time:', receiptDate.toLocaleTimeString(), yPosition, margin);
        yPosition += 8;

        // Member Information Section with Contact
        yPosition = this.drawSectionHeader(doc, 'MEMBER INFORMATION', yPosition, margin, pageWidth);
        
        yPosition = this.drawInfoRow(doc, 'Name:', member.name, yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Member ID:', member.idNo, yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Email:', member.email, yPosition, margin, 70);
        yPosition = this.drawInfoRow(doc, 'Phone:', member.phone, yPosition, margin);
        yPosition += 8;

        // Loan Information Section
        yPosition = this.drawSectionHeader(doc, 'LOAN DETAILS', yPosition, margin, pageWidth);
        
        yPosition = this.drawInfoRow(doc, 'Loan ID:', loan.id.substring(0, 8).toUpperCase(), yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Original Amount:', `UGX ${this.formatNumber(loan.amount)}`, yPosition, margin, 70);
        yPosition = this.drawInfoRow(doc, 'Interest Rate:', `${loan.interestRate}% per annum`, yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Loan Date:', new Date(loan.loanDate).toLocaleDateString(), yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Due Date:', new Date(loan.dueDate).toLocaleDateString(), yPosition, margin);
        yPosition += 8;

        // Payment Information Section
        yPosition = this.drawSectionHeader(doc, 'PAYMENT INFORMATION', yPosition, margin, pageWidth);
        
        const paidAmount = `UGX ${this.formatNumber(payment.amount)}`;
        yPosition = this.drawAmountBox(doc, 'AMOUNT PAID:', paidAmount, yPosition, margin, pageWidth);
        
        yPosition = this.drawInfoRow(doc, 'Payment Date:', new Date(payment.paymentDate).toLocaleDateString(), yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Total Paid So Far:', `UGX ${this.formatNumber(loan.paid)}`, yPosition, margin, 70);
        
        const remaining = loan.amount - loan.paid;
        yPosition = this.drawInfoRow(doc, 'Remaining Balance:', `UGX ${this.formatNumber(remaining)}`, yPosition, margin, 70);
        
        const progress = ((loan.paid / loan.amount) * 100).toFixed(1);
        yPosition = this.drawInfoRow(doc, 'Repayment Progress:', `${progress}%`, yPosition, margin);
        
        // Progress bar
        const barY = yPosition + 3;
        const barWidth = pageWidth - (2 * margin);
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, barY, barWidth, 5);
        
        const progressWidth = (barWidth * parseFloat(progress)) / 100;
        doc.setFillColor(0, 180, 130);
        doc.rect(margin, barY, progressWidth, 5, 'F');
        yPosition += 15;

        // Add QR Code with comprehensive member data
        const qrData = await this.generateMemberQRData(member, 'PAYMENT', {
            receiptNumber: receiptNum,
            loanId: loan.id.substring(0, 8),
            paymentAmount: payment.amount,
            paymentDate: new Date(payment.paymentDate).toLocaleDateString(),
            totalPaid: loan.paid,
            remaining: loan.amount - loan.paid,
            repaymentProgress: ((loan.paid / loan.amount) * 100).toFixed(1),
            dueDate: new Date(loan.dueDate).toLocaleDateString()
        });
        const qrCode = await this.generateQRCode(qrData);
        
        if (qrCode) {
            doc.addImage(qrCode, 'PNG', margin, yPosition, 30, 30);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('Scan for verification', margin + 35, yPosition + 12);
            yPosition += 35;
        }

        // Digital Signature
        yPosition += 5;
        const signature = this.drawDigitalSignature(doc, yPosition, margin, pageWidth);
        yPosition += 18;

        // Check if we're at bottom of page, if so create a new page for transaction history
        if (yPosition > pageHeight - 50 && memberTransactions && memberTransactions.length > 0) {
            doc.addPage();
            yPosition = 20;
            
            // Transaction History Header
             yPosition = this.drawSectionHeader(doc, `MEMBER TRANSACTION HISTORY - ${member.name}`, yPosition, margin, pageWidth);
             yPosition += 8;

            // Create table data
            const tableData = memberTransactions.slice(0, 10).map(txn => [
                new Date(txn.date).toLocaleDateString(),
                txn.type,
                `UGX ${this.formatNumber(txn.amount)}`,
                txn.status || 'Completed'
            ]);

            if (tableData.length > 0) {
                doc.autoTable({
                    startY: yPosition,
                    head: [['Date', 'Type', 'Amount', 'Status']],
                    body: tableData,
                    margin: { left: margin, right: margin },
                    headStyles: {
                        fillColor: [255, 204, 0],
                        textColor: [0, 0, 0],
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        textColor: [50, 50, 50]
                    },
                    alternateRowStyles: {
                        fillColor: [245, 245, 245]
                    }
                });
            }
        } else if (memberTransactions && memberTransactions.length > 0) {
             // Add transaction history if space available
             yPosition += 5;
             yPosition = this.drawSectionHeader(doc, 'RECENT TRANSACTIONS', yPosition, margin, pageWidth);
            
            const tableData = memberTransactions.slice(0, 5).map(txn => [
                new Date(txn.date).toLocaleDateString(),
                txn.type,
                `UGX ${this.formatNumber(txn.amount)}`
            ]);

            if (tableData.length > 0) {
                doc.autoTable({
                    startY: yPosition,
                    head: [['Date', 'Type', 'Amount']],
                    body: tableData,
                    margin: { left: margin, right: margin },
                    headStyles: {
                        fillColor: [255, 204, 0],
                        textColor: [0, 0, 0],
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        textColor: [50, 50, 50]
                    }
                });
            }
        }

        // Footer
        this.drawFooter(doc, pageWidth, pageHeight, 'Thank you for your payment. Please keep this receipt for your records.');

        return doc;
    },



    // Generate saving receipt with QR code and digital signature
    async generateSavingReceipt(saving, member, memberSavingsHistory = null) {
        const jsPDFConstructor = await this.waitForJsPDF();
        const doc = new jsPDFConstructor();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;

        // Header
        let yPosition = this.drawHeader(doc, pageWidth, 'SAVINGS RECEIPT');
        yPosition += 8;

        // Receipt info
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        
        const receiptNum = `RCP-${new Date().getTime().toString().slice(-8).toUpperCase()}`;
        const receiptDate = new Date(saving.createdAt);
        
        yPosition = this.drawInfoRow(doc, 'Receipt #:', receiptNum, yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Date:', receiptDate.toLocaleDateString(), yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Time:', receiptDate.toLocaleTimeString(), yPosition, margin);
        yPosition += 8;

        // Member Information Section with Contact
        yPosition = this.drawSectionHeader(doc, 'MEMBER INFORMATION', yPosition, margin, pageWidth);
        
        yPosition = this.drawInfoRow(doc, 'Name:', member.name, yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Member ID:', member.idNo, yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Email:', member.email, yPosition, margin, 70);
        yPosition = this.drawInfoRow(doc, 'Phone:', member.phone, yPosition, margin);
        yPosition += 8;

        // Savings Information Section
        yPosition = this.drawSectionHeader(doc, 'SAVINGS DEPOSIT', yPosition, margin, pageWidth);
        
        const savingAmount = `UGX ${this.formatNumber(saving.amount)}`;
        yPosition = this.drawAmountBox(doc, 'AMOUNT DEPOSITED:', savingAmount, yPosition, margin, pageWidth);
        
        yPosition = this.drawInfoRow(doc, 'Saving Date:', new Date(saving.savingDate).toLocaleDateString(), yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Transaction Type:', 'Savings Deposit', yPosition, margin);
        yPosition += 8;

        // Additional info box
        const boxHeight = 25;
        const boxY = yPosition - 5;
        
        doc.setFillColor(240, 248, 255);
        doc.rect(margin, boxY, pageWidth - (2 * margin), boxHeight, 'F');
        
        doc.setDrawColor(100, 149, 237);
        doc.setLineWidth(0.5);
        doc.rect(margin, boxY, pageWidth - (2 * margin), boxHeight);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(50, 100, 150);
        doc.text('Your savings are secure and will help you build financial stability.', margin + 5, yPosition + 4);
        doc.text('Keep this receipt as proof of your transaction.', margin + 5, yPosition + 11);
        yPosition += 30;

        // Add QR Code with comprehensive member data
        const qrData = await this.generateMemberQRData(member, 'SAVINGS', {
            receiptNumber: receiptNum,
            savingAmount: saving.amount,
            savingDate: saving.savingDate,
            totalSavings: Storage.getTotalSavingsByMemberId(member.id),
            totalWithdrawals: Storage.getTotalWithdrawalsByMemberId(member.id),
            availableSavings: Storage.getTotalSavingsByMemberId(member.id) - Storage.getTotalWithdrawalsByMemberId(member.id)
        });
        const qrCode = await this.generateQRCode(qrData);
        
        if (qrCode) {
            doc.addImage(qrCode, 'PNG', margin, yPosition, 30, 30);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('Scan for verification', margin + 35, yPosition + 12);
            yPosition += 35;
        }

        // Digital Signature
        yPosition += 5;
        this.drawDigitalSignature(doc, yPosition, margin, pageWidth);
        yPosition += 18;

        // Savings history if available
        if (memberSavingsHistory && memberSavingsHistory.length > 0) {
            yPosition += 5;
            yPosition = this.drawSectionHeader(doc, 'YOUR SAVINGS HISTORY', yPosition, margin, pageWidth);
            
            const tableData = memberSavingsHistory.slice(0, 5).map(sav => [
                new Date(sav.date).toLocaleDateString(),
                `UGX ${this.formatNumber(sav.amount)}`
            ]);

            if (tableData.length > 0) {
                doc.autoTable({
                    startY: yPosition,
                    head: [['Date', 'Amount']],
                    body: tableData,
                    margin: { left: margin, right: margin },
                    headStyles: {
                        fillColor: [255, 204, 0],
                        textColor: [0, 0, 0],
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        textColor: [50, 50, 50]
                    }
                });
            }
        }

        // Footer
        this.drawFooter(doc, pageWidth, pageHeight, 'Thank you for saving with us. Your financial growth is our mission.');

        return doc;
    },

    // Generate withdrawal receipt with QR code and digital signature
    async generateWithdrawalReceipt(withdrawal, member, memberWithdrawalHistory = null) {
        const jsPDFConstructor = await this.waitForJsPDF();
        const doc = new jsPDFConstructor();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;

        // Header
        let yPosition = this.drawHeader(doc, pageWidth, 'WITHDRAWAL RECEIPT');
        yPosition += 8;

        // Receipt info
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        
        const receiptNum = `RCP-${new Date().getTime().toString().slice(-8).toUpperCase()}`;
        const receiptDate = new Date(withdrawal.createdAt);
        
        yPosition = this.drawInfoRow(doc, 'Receipt #:', receiptNum, yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Date:', receiptDate.toLocaleDateString(), yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Time:', receiptDate.toLocaleTimeString(), yPosition, margin);
        yPosition += 8;

        // Member Information Section with Contact
        yPosition = this.drawSectionHeader(doc, 'MEMBER INFORMATION', yPosition, margin, pageWidth);
        
        yPosition = this.drawInfoRow(doc, 'Name:', member.name, yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Member ID:', member.idNo, yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Email:', member.email, yPosition, margin, 70);
        yPosition = this.drawInfoRow(doc, 'Phone:', member.phone, yPosition, margin);
        yPosition += 8;

        // Withdrawal Information Section
        yPosition = this.drawSectionHeader(doc, 'WITHDRAWAL DETAILS', yPosition, margin, pageWidth);
        
        const withdrawalAmount = `UGX ${this.formatNumber(withdrawal.amount)}`;
        yPosition = this.drawAmountBox(doc, 'AMOUNT WITHDRAWN:', withdrawalAmount, yPosition, margin, pageWidth);
        
        yPosition = this.drawInfoRow(doc, 'Withdrawal Date:', new Date(withdrawal.withdrawalDate).toLocaleDateString(), yPosition, margin);
        yPosition = this.drawInfoRow(doc, 'Status:', 'Completed', yPosition, margin);
        yPosition += 8;

        // Warning/Info box
        const boxHeight = 20;
        const boxY = yPosition - 5;
        
        doc.setFillColor(255, 250, 230);
        doc.rect(margin, boxY, pageWidth - (2 * margin), boxHeight, 'F');
        
        doc.setDrawColor(255, 152, 0);
        doc.setLineWidth(0.5);
        doc.rect(margin, boxY, pageWidth - (2 * margin), boxHeight);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(150, 100, 0);
        doc.text('Please verify the amount received. Report any discrepancies immediately.', margin + 5, yPosition + 4);
        yPosition += 25;

        // Add QR Code with comprehensive member data
        const qrData = await this.generateMemberQRData(member, 'WITHDRAWAL', {
            receiptNumber: receiptNum,
            withdrawalAmount: withdrawal.amount,
            withdrawalDate: withdrawal.withdrawalDate,
            totalSavings: Storage.getTotalSavingsByMemberId(member.id),
            totalWithdrawals: Storage.getTotalWithdrawalsByMemberId(member.id),
            remainingSavings: Storage.getTotalSavingsByMemberId(member.id) - Storage.getTotalWithdrawalsByMemberId(member.id) - withdrawal.amount
        });
        const qrCode = await this.generateQRCode(qrData);
        
        if (qrCode) {
            doc.addImage(qrCode, 'PNG', margin, yPosition, 30, 30);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('Scan for verification', margin + 35, yPosition + 12);
            yPosition += 35;
        }

        // Digital Signature
        yPosition += 5;
        this.drawDigitalSignature(doc, yPosition, margin, pageWidth);
        yPosition += 18;

        // Withdrawal history if available
        if (memberWithdrawalHistory && memberWithdrawalHistory.length > 0) {
            yPosition += 5;
            yPosition = this.drawSectionHeader(doc, 'YOUR WITHDRAWAL HISTORY', yPosition, margin, pageWidth);
            
            const tableData = memberWithdrawalHistory.slice(0, 5).map(wtx => [
                new Date(wtx.date).toLocaleDateString(),
                `UGX ${this.formatNumber(wtx.amount)}`
            ]);

            if (tableData.length > 0) {
                doc.autoTable({
                    startY: yPosition,
                    head: [['Date', 'Amount']],
                    body: tableData,
                    margin: { left: margin, right: margin },
                    headStyles: {
                        fillColor: [255, 204, 0],
                        textColor: [0, 0, 0],
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        textColor: [50, 50, 50]
                    }
                });
            }
        }

        // Footer
        this.drawFooter(doc, pageWidth, pageHeight, 'Thank you for your trust. This withdrawal completes your transaction.');

        return doc;
    },

    // Auto-generate payment receipt with transaction history
    async autoGeneratePaymentReceipt(payment, loan, member) {
        // Get member transactions if enabled
        let memberTransactions = null;
        if (typeof SettingsManager !== 'undefined' && SettingsManager.isTransactionHistoryEnabled()) {
            const payments = await Storage.getPayments();
            memberTransactions = payments
                .filter(p => {
                    const paymentLoan = Storage.getLoanById(p.loanId);
                    return paymentLoan && paymentLoan.memberId === member.id;
                })
                .map(p => ({
                    date: p.paymentDate,
                    type: 'Payment',
                    amount: p.amount,
                    status: 'Completed'
                }))
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        const doc = await this.generatePaymentReceipt(payment, loan, member, memberTransactions);
        this.downloadReceipt(doc, `Payment_Receipt_${payment.id.substring(0, 8)}.pdf`);
    },

    // Auto-generate saving receipt with transaction history
    async autoGenerateSavingReceipt(saving, member) {
        // Get member savings history if enabled
        let memberSavingsHistory = null;
        if (typeof SettingsManager !== 'undefined' && SettingsManager.isTransactionHistoryEnabled()) {
            const savings = await Storage.getSavings();
            memberSavingsHistory = savings
                .filter(s => s.memberId === member.id)
                .map(s => ({
                    date: s.savingDate,
                    amount: s.amount
                }))
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        const doc = await this.generateSavingReceipt(saving, member, memberSavingsHistory);
        this.downloadReceipt(doc, `Savings_Receipt_${saving.id.substring(0, 8)}.pdf`);
    },

    // Auto-generate withdrawal receipt with transaction history
    async autoGenerateWithdrawalReceipt(withdrawal, member) {
        // Get member withdrawal history if enabled
        let memberWithdrawalHistory = null;
        if (typeof SettingsManager !== 'undefined' && SettingsManager.isTransactionHistoryEnabled()) {
            const withdrawals = await Storage.getWithdrawals();
            memberWithdrawalHistory = withdrawals
                .filter(w => w.memberId === member.id)
                .map(w => ({
                    date: w.withdrawalDate,
                    amount: w.amount
                }))
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        const doc = await this.generateWithdrawalReceipt(withdrawal, member, memberWithdrawalHistory);
        this.downloadReceipt(doc, `Withdrawal_Receipt_${withdrawal.id.substring(0, 8)}.pdf`);
    },

    // Trigger download
    downloadReceipt(doc, filename) {
        doc.save(filename);
    }
};

// Receipt button handlers
document.addEventListener('DOMContentLoaded', () => {
    // Listen for custom events from the app
    document.addEventListener('generatePaymentReceipt', async (e) => {
        try {
            const { payment, loan, member } = e.detail;
            const doc = await ReceiptGenerator.generatePaymentReceipt(payment, loan, member);
            ReceiptGenerator.downloadReceipt(doc, `Payment_Receipt_${payment.id.substring(0, 8)}.pdf`);
        } catch (error) {
            console.error('Error generating receipt:', error);
            Swal.fire('Error', 'Failed to generate receipt: ' + error.message, 'error');
        }
    });

    document.addEventListener('generateSavingReceipt', async (e) => {
        try {
            const { saving, member } = e.detail;
            const doc = await ReceiptGenerator.generateSavingReceipt(saving, member);
            ReceiptGenerator.downloadReceipt(doc, `Savings_Receipt_${saving.id.substring(0, 8)}.pdf`);
        } catch (error) {
            console.error('Error generating receipt:', error);
            Swal.fire('Error', 'Failed to generate receipt: ' + error.message, 'error');
        }
    });

    document.addEventListener('generateWithdrawalReceipt', async (e) => {
        try {
            const { withdrawal, member } = e.detail;
            const doc = await ReceiptGenerator.generateWithdrawalReceipt(withdrawal, member);
            ReceiptGenerator.downloadReceipt(doc, `Withdrawal_Receipt_${withdrawal.id.substring(0, 8)}.pdf`);
        } catch (error) {
            console.error('Error generating receipt:', error);
            Swal.fire('Error', 'Failed to generate receipt: ' + error.message, 'error');
        }
    });
});

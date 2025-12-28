/**
 * Excel Styling Helper
 * Applies theme colors to Excel exports using XLSX
 */

const ExcelStyling = {
    /**
     * Apply theme color formatting to Excel file
     * Since SheetJS free doesn't support full styling, we'll use a workaround
     */
    applyThemeFormatting(ws, dataLength) {
        if (!ws || dataLength === 0) return;

        try {
            const range = XLSX.utils.decode_range(ws['!ref']);
            
            // Get headers
            const headers = [];
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellRef = XLSX.utils.encode_col(col) + '1';
                if (ws[cellRef]) {
                    headers.push(cellRef);
                }
            }

            // Apply header styling - store metadata
            headers.forEach(cellRef => {
                const cell = ws[cellRef];
                if (cell) {
                    // Mark as header for conditional formatting
                    cell._theme = {
                        type: 'header',
                        backgroundColor: 'FFCC00',
                        fontColor: '0F0F0F',
                        bold: true
                    };
                }
            });

            // Mark data rows for alternating colors
            for (let row = 2; row <= dataLength + 1; row++) {
                for (let col = range.s.c; col <= range.e.c; col++) {
                    const cellRef = XLSX.utils.encode_col(col) + row;
                    if (ws[cellRef]) {
                        const cell = ws[cellRef];
                        const isAlternate = row % 2 === 0;
                        cell._theme = {
                            type: 'data',
                            backgroundColor: isAlternate ? 'FFF9E6' : 'FFFFFF',
                            fontColor: '000000'
                        };
                    }
                }
            }

        } catch (error) {
            console.warn('Styling metadata application failed:', error);
        }
    },

    /**
     * Create styled Excel workbook
     * Uses basic formatting that works in free XLSX
     */
    createStyledWorkbook(data, filename) {
        if (!window.XLSX) {
            console.error('SheetJS not available');
            return false;
        }

        try {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);

            if (data.length > 0) {
                const headers = Object.keys(data[0]);
                
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

                // Freeze header row
                ws['!freeze'] = { xSplit: 0, ySplit: 1 };

                // Apply theme formatting metadata
                this.applyThemeFormatting(ws, data.length);

                // Add sheet with autofilter
                const range = XLSX.utils.decode_range(ws['!ref']);
                ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
            }

            XLSX.utils.book_append_sheet(wb, ws, 'Data');
            
            // Write file with proper encoding
            const wopts = { 
                bookType: 'xlsx',
                bookSST: true,
                sheet: 'Data'
            };
            
            XLSX.writeFile(wb, filename, wopts);
            return true;

        } catch (error) {
            console.error('Styled workbook creation failed:', error);
            return false;
        }
    }
};

/**
 * Offline Excel Generator
 * Provides fallback CSV/TSV export when SheetJS CDN is unavailable
 * CSV files can be opened in Excel and Google Sheets
 */

class OfflineExcelGenerator {
    /**
     * Generate CSV from data array
     * CSV can be imported into Excel, Google Sheets, etc.
     */
    static generateCSV(data, headers = null) {
        if (!data || data.length === 0) {
            return '';
        }

        // Get headers from first object if not provided
        if (!headers) {
            headers = Object.keys(data[0]);
        }

        // Create CSV header row
        const csvHeaders = headers.map(h => this.escapeCSV(h)).join(',');
        
        // Create CSV data rows
        const csvRows = data.map(row => {
            return headers.map(header => {
                const value = row[header] !== undefined ? row[header] : '';
                return this.escapeCSV(value);
            }).join(',');
        });

        return [csvHeaders, ...csvRows].join('\n');
    }

    /**
     * Generate TSV (Tab-Separated Values) from data
     * TSV is sometimes better for Excel imports
     */
    static generateTSV(data, headers = null) {
        if (!data || data.length === 0) {
            return '';
        }

        // Get headers from first object if not provided
        if (!headers) {
            headers = Object.keys(data[0]);
        }

        // Create TSV header row
        const tsvHeaders = headers.join('\t');
        
        // Create TSV data rows
        const tsvRows = data.map(row => {
            return headers.map(header => {
                const value = row[header] !== undefined ? row[header] : '';
                return String(value).replace(/\t/g, ' '); // Remove tabs in data
            }).join('\t');
        });

        return [tsvHeaders, ...tsvRows].join('\n');
    }

    /**
     * Escape special characters in CSV values
     */
    static escapeCSV(value) {
        const strValue = String(value);
        
        // If value contains comma, newline, or quotes, wrap in quotes
        if (strValue.includes(',') || strValue.includes('\n') || strValue.includes('"')) {
            return `"${strValue.replace(/"/g, '""')}"`;
        }
        
        return strValue;
    }

    /**
     * Download CSV file
     */
    static downloadCSV(data, filename, headers = null) {
        const csv = this.generateCSV(data, headers);
        this.downloadFile(csv, filename.replace('.xlsx', '.csv'), 'text/csv');
    }

    /**
     * Download TSV file
     */
    static downloadTSV(data, filename, headers = null) {
        const tsv = this.generateTSV(data, headers);
        this.downloadFile(tsv, filename.replace('.xlsx', '.tsv'), 'text/tab-separated-values');
    }

    /**
     * Download HTML table that can be opened in Excel
     * Better formatting than CSV
     */
    static downloadHTMLTable(data, filename, headers = null) {
        if (!data || data.length === 0) {
            return;
        }

        if (!headers) {
            headers = Object.keys(data[0]);
        }

        // Create HTML table
        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${filename}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 10px; }
        table { border-collapse: collapse; width: 100%; }
        th {
            background-color: #FFCC00;
            color: #0F0F0F;
            font-weight: bold;
            border: 1px solid #FFB700;
            padding: 8px;
            text-align: left;
        }
        td {
            border: 1px solid #ddd;
            padding: 8px;
        }
        tr:nth-child(even) { background-color: #f9f9f9; }
        tr:hover { background-color: #f0f0f0; }
    </style>
</head>
<body>
    <h2>${filename.replace(/\.[^.]+$/, '')}</h2>
    <table>
        <thead>
            <tr>
                ${headers.map(h => `<th>${this.escapeHTML(h)}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${data.map(row => `
                <tr>
                    ${headers.map(h => `<td>${this.escapeHTML(row[h])}</td>`).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>
`;

        this.downloadFile(html, filename.replace('.xlsx', '.html'), 'text/html');
    }

    /**
     * Escape HTML special characters
     */
    static escapeHTML(text) {
        if (text === null || text === undefined) return '';
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Download file helper
     */
    static downloadFile(content, filename, mimeType = 'text/plain') {
        try {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log(`✅ Downloaded: ${filename}`);
        } catch (error) {
            console.error('Download error:', error);
            throw error;
        }
    }

    /**
     * Generate all formats for data (CSV, TSV, HTML)
     * User can choose which format to download
     */
    static async downloadAllFormats(data, baseFilename) {
        const formats = [
            { name: 'CSV (Excel)', ext: '.csv', fn: () => this.downloadCSV(data, baseFilename) },
            { name: 'TSV (Tab-Separated)', ext: '.tsv', fn: () => this.downloadTSV(data, baseFilename) },
            { name: 'HTML Table (Excel Import)', ext: '.html', fn: () => this.downloadHTMLTable(data, baseFilename) }
        ];

        const inputOptions = {};
        formats.forEach((f, i) => {
            inputOptions[i] = `📊 ${f.name}`;
        });

        if (typeof Swal !== 'undefined') {
            const result = await Swal.fire({
                title: 'Select Export Format',
                input: 'select',
                inputOptions: inputOptions,
                inputPlaceholder: 'Choose format',
                showCancelButton: true,
                confirmButtonText: 'Download',
                confirmButtonColor: '#FFCC00'
            });

            if (result.isConfirmed && result.value !== null) {
                formats[parseInt(result.value)].fn();
                Swal.fire('Success', `Exported as ${formats[parseInt(result.value)].name}`, 'success');
            }
        } else {
            // Fallback: download as CSV
            this.downloadCSV(data, baseFilename);
        }
    }
}

console.log('✅ Offline Excel Generator loaded');

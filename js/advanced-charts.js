/**
 * Advanced Charts Module
 * Line Chart, Bar Chart, Waterfall Chart with professional styling
 * Includes filters, export, comparisons, and real-time streaming
 */

class AdvancedCharts {
    constructor() {
        console.log('Creating AdvancedCharts instance...');
        
        if (!window.echarts) {
            console.error('ECharts library is not loaded!');
            throw new Error('ECharts library required');
        }
        
        this.savingsTrendChart = null;
        this.topMembersBarChart = null;
        this.financialWaterfallChart = null;
        this.comparisonChart = null;
        this.repaymentMetricsChart = null;
        
        // Filter state
        this.filters = {
            savingsTrendStart: null,
            savingsTrendEnd: null,
            topMembersStart: null,
            topMembersEnd: null,
            comparisonPeriod: 'monthly'
        };
        
        this.colorPalette = {
            primary: '#3B82F6',
            secondary: '#8B5CF6',
            success: '#10B981',
            warning: '#F59E0B',
            danger: '#EF4444',
            gradient1: ['#3B82F6', '#8B5CF6', '#EC4899'],
            gradient2: ['#06B6D4', '#10B981', '#FBBF24'],
            vibrant: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#EF4444'],
            light: '#F3F4F6'
        };
        
        // Real-time update interval
        this.updateInterval = 5000; // 5 seconds
        this.lastUpdateTime = 0;
        
        this.init();
    }

    init() {
        console.log('AdvancedCharts initialized');
        this.setupResizeListener();
        this.attachDataChangeListeners();
        this.setupFilterControls();
        this.setupExportButtons();
        this.startRealtimeUpdates();
    }

    setupResizeListener() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.redrawAllCharts();
            }, 250);
        });
    }

    attachDataChangeListeners() {
        // Listen for data updates
        document.addEventListener('savingsUpdated', () => this.updateAllCharts());
        document.addEventListener('loansUpdated', () => this.updateAllCharts());
        document.addEventListener('paymentsUpdated', () => this.updateAllCharts());
    }

    /**
     * LINE CHART - Savings Growth Trend
     */
    async initSavingsTrendChart() {
        const container = document.getElementById('savingsTrendChart');
        if (!container) {
            console.error('❌ Savings trend container NOT found in DOM');
            return;
        }
        console.log('✓ Savings trend container found:', container);
        
        if (!window.echarts) {
            console.error('❌ ECharts library not available');
            return;
        }
        console.log('✓ ECharts library available');

        this.savingsTrendChart = window.echarts.init(container);
        console.log('✓ Savings trend chart initialized');

        const data = await this.generateSavingsTrendData();
        const option = {
            backgroundColor: 'transparent',
            textStyle: { fontFamily: 'inherit' },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#3B82F6',
                borderWidth: 1,
                textStyle: { color: '#fff', fontSize: 12 },
                padding: [10, 15],
                formatter: (params) => {
                    if (!params.length) return '';
                    let result = `<strong>${params[0].axisValueLabel}</strong><br/>`;
                    params.forEach(param => {
                        result += `<span style="color: ${param.color}">● ${param.seriesName}: <strong>UGX ${this.formatNumber(param.value)}</strong></span><br/>`;
                    });
                    return result;
                }
            },
            legend: {
                top: 20,
                left: 'center',
                textStyle: { color: '#374151', fontSize: 12, fontWeight: 500 },
                itemGap: 15
            },
            grid: {
                top: 80,
                left: 60,
                right: 30,
                bottom: 50,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: data.dates,
                axisLine: { lineStyle: { color: '#E5E7EB', width: 1.5 } },
                axisLabel: { color: '#6B7280', fontSize: 11 },
                axisTick: { lineStyle: { color: '#E5E7EB' } },
                splitLine: { show: false }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                axisLabel: { color: '#6B7280', fontSize: 11, formatter: 'UGX {value/1000}K' },
                splitLine: { lineStyle: { color: '#E5E7EB', type: 'dashed' } },
                axisTick: { show: false }
            },
            series: [
                {
                    name: 'Total Savings',
                    type: 'line',
                    data: data.totalSavings,
                    smooth: true,
                    lineStyle: { width: 3, color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#3B82F6' },
                        { offset: 1, color: '#1E40AF' }
                    ]) },
                    areaStyle: { color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
                        { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
                    ]) },
                    itemStyle: { color: '#3B82F6', borderWidth: 2, borderColor: '#fff' },
                    symbolSize: 6,
                    emphasis: { itemStyle: { borderWidth: 3, shadowBlur: 10, shadowColor: 'rgba(59, 130, 246, 0.5)' } }
                },
                {
                    name: 'Active Members Saving',
                    type: 'line',
                    data: data.memberCount,
                    smooth: true,
                    yAxisIndex: 1,
                    lineStyle: { width: 2.5, color: '#8B5CF6' },
                    areaStyle: { color: 'rgba(139, 92, 246, 0.15)' },
                    itemStyle: { color: '#8B5CF6', borderWidth: 2, borderColor: '#fff' },
                    symbolSize: 5,
                    emphasis: { itemStyle: { borderWidth: 3, shadowBlur: 10, shadowColor: 'rgba(139, 92, 246, 0.5)' } }
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    position: 'left',
                    axisLine: { show: false },
                    axisLabel: { color: '#6B7280', fontSize: 11, formatter: 'UGX {value/1000}K' },
                    splitLine: { lineStyle: { color: '#E5E7EB', type: 'dashed' } },
                    axisTick: { show: false }
                },
                {
                    type: 'value',
                    position: 'right',
                    axisLine: { show: false },
                    axisLabel: { color: '#6B7280', fontSize: 11 },
                    splitLine: { show: false },
                    axisTick: { show: false }
                }
            ]
        };

        this.savingsTrendChart.setOption(option);
    }

    /**
     * BAR CHART - Top Members by Savings
     */
    async initTopMembersBarChart() {
        const container = document.getElementById('topMembersBarChart');
        if (!container) {
            console.error('❌ Top members container NOT found');
            return;
        }
        if (!window.echarts) {
            console.error('❌ ECharts not available');
            return;
        }

        this.topMembersBarChart = window.echarts.init(container);
        console.log('✓ Top members chart initialized');

        const data = await this.generateTopMembersData();
        const option = {
            backgroundColor: 'transparent',
            textStyle: { fontFamily: 'inherit' },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#8B5CF6',
                borderWidth: 1,
                textStyle: { color: '#fff', fontSize: 12 },
                padding: [10, 15],
                formatter: (params) => {
                    if (!params.length) return '';
                    const param = params[0];
                    return `<strong>${param.name}</strong><br/><span style="color: ${param.color}">● Savings: <strong>UGX ${this.formatNumber(param.value)}</strong></span>`;
                }
            },
            legend: {
                show: false
            },
            grid: {
                top: 30,
                left: 60,
                right: 30,
                bottom: 50,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: data.members,
                axisLine: { show: false },
                axisLabel: { color: '#6B7280', fontSize: 11, rotate: 45 },
                axisTick: { show: false }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                axisLabel: { color: '#6B7280', fontSize: 11, formatter: 'UGX {value/1000}K' },
                splitLine: { lineStyle: { color: '#E5E7EB', type: 'dashed' } },
                axisTick: { show: false }
            },
            series: [
                {
                    name: 'Savings',
                    type: 'bar',
                    data: data.savings,
                    itemStyle: {
                        color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#EC4899' },
                            { offset: 1, color: '#8B5CF6' }
                        ]),
                        borderRadius: [8, 8, 0, 0],
                        shadowColor: 'rgba(236, 72, 153, 0.3)',
                        shadowBlur: 10,
                        shadowOffsetY: 4
                    },
                    emphasis: {
                        itemStyle: {
                            color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: '#F472B6' },
                                { offset: 1, color: '#A78BFA' }
                            ]),
                            shadowColor: 'rgba(236, 72, 153, 0.5)',
                            shadowBlur: 20,
                            shadowOffsetY: 8
                        }
                    },
                    barWidth: '60%',
                    label: {
                        show: true,
                        position: 'top',
                        color: '#1F2937',
                        fontSize: 11,
                        fontWeight: 600,
                        formatter: (params) => `UGX ${this.formatNumber(params.value)}`
                    }
                }
            ]
        };

        this.topMembersBarChart.setOption(option);
    }

    /**
     * WATERFALL CHART - Financial Summary
     */
    async initFinancialWaterfallChart() {
        const container = document.getElementById('financialWaterfallChart');
        if (!container) {
            console.error('❌ Waterfall container NOT found');
            return;
        }
        if (!window.echarts) {
            console.error('❌ ECharts not available');
            return;
        }

        this.financialWaterfallChart = window.echarts.init(container);
        console.log('✓ Waterfall chart initialized');

        const data = await this.generateWaterfallData();
        const option = {
            backgroundColor: 'transparent',
            textStyle: { fontFamily: 'inherit' },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                borderColor: '#06B6D4',
                borderWidth: 1,
                textStyle: { color: '#fff', fontSize: 12 },
                padding: [10, 15],
                formatter: (params) => {
                    if (!params.length) return '';
                    const param = params[0];
                    let label = param.name;
                    if (param.componentSubType === 'bar') {
                        label += ` <strong>UGX ${this.formatNumber(Math.abs(param.value))}</strong>`;
                    }
                    return label;
                }
            },
            legend: {
                show: false
            },
            grid: {
                top: 40,
                left: 100,
                right: 30,
                bottom: 80,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: data.categories,
                axisLine: { show: false },
                axisLabel: { color: '#374151', fontSize: 12, fontWeight: 500, rotate: 45 },
                axisTick: { show: false }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                axisLabel: { color: '#6B7280', fontSize: 11, formatter: 'UGX {value/1000000}M' },
                splitLine: { lineStyle: { color: '#E5E7EB', type: 'dashed' } },
                axisTick: { show: false }
            },
            series: [
                {
                    name: 'Financial Flow',
                    type: 'bar',
                    stack: 'Total',
                    data: data.values,
                    itemStyle: {
                        color: (params) => {
                            const colors = {
                                'Total Loaned': '#3B82F6',
                                'Total Repaid': '#10B981',
                                'Interest Earned': '#F59E0B',
                                'Outstanding': '#EF4444',
                                'Total Savings': '#8B5CF6',
                                'Net Position': '#06B6D4'
                            };
                            return colors[params.name] || '#3B82F6';
                        },
                        borderRadius: [8, 8, 0, 0],
                        shadowColor: (params) => {
                            const shadowColors = {
                                'Total Loaned': 'rgba(59, 130, 246, 0.3)',
                                'Total Repaid': 'rgba(16, 185, 129, 0.3)',
                                'Interest Earned': 'rgba(245, 158, 11, 0.3)',
                                'Outstanding': 'rgba(239, 68, 68, 0.3)',
                                'Total Savings': 'rgba(139, 92, 246, 0.3)',
                                'Net Position': 'rgba(6, 182, 212, 0.3)'
                            };
                            return shadowColors[params.name] || 'rgba(59, 130, 246, 0.3)';
                        },
                        shadowBlur: 12,
                        shadowOffsetY: 5
                    },
                    emphasis: {
                        itemStyle: {
                            opacity: 0.9,
                            shadowBlur: 20,
                            shadowOffsetY: 8
                        }
                    },
                    label: {
                        show: true,
                        position: 'top',
                        color: '#1F2937',
                        fontSize: 12,
                        fontWeight: 600,
                        formatter: (params) => {
                            if (params.value) {
                                return `UGX ${this.formatNumber(Math.abs(params.value))}`;
                            }
                            return '';
                        }
                    },
                    barWidth: '55%'
                }
            ]
        };

        this.financialWaterfallChart.setOption(option);
    }

    /**
     * Generate Savings Trend Data (from IndexDB)
     */
    async generateSavingsTrendData() {
        try {
            // Use Storage module to get savings (stored as array with key 'savings')
            const savings = await Storage.get('savings') || [];
            console.log('✓ Fetched savings from IndexDB:', savings.length, 'records');
            
            // If no real data, use sample data
            if (!Array.isArray(savings) || savings.length === 0) {
                console.warn('No savings data found, using sample data');
                return this.getSampleSavingsTrendData();
            }
            
            // Create daily aggregation
            const dailyData = {};
            savings.forEach(s => {
                const date = s.date ? new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
                if (!dailyData[date]) {
                    dailyData[date] = { total: 0, members: new Set() };
                }
                dailyData[date].total += s.amount || 0;
                dailyData[date].members.add(s.memberId);
            });

            const dates = Object.keys(dailyData).slice(-12); // Last 12 days
            
            let cumulativeTotal = 0;
            const totalSavings = dates.map(date => {
                cumulativeTotal += dailyData[date]?.total || 0;
                return cumulativeTotal;
            });
            const memberCount = dates.map(date => dailyData[date]?.members.size || 0);

            console.log('✓ Savings Trend Data (REAL):', { dates: dates.length, totalSavings: totalSavings[totalSavings.length - 1] });
            return { dates, totalSavings, memberCount };
        } catch (error) {
            console.error('Error fetching savings data:', error);
            return this.getSampleSavingsTrendData();
        }
    }

    getSampleSavingsTrendData() {
        console.log('📊 Using SAMPLE data for Savings Trend');
        const dates = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dates.push(dateStr);
        }
        
        let cumulativeTotal = 0;
        const totalSavings = dates.map(() => {
            cumulativeTotal += Math.floor(Math.random() * 50000) + 10000;
            return cumulativeTotal;
        });
        
        const memberCount = dates.map(() => Math.floor(Math.random() * 5) + 1);
        console.log('✓ Sample Savings Data:', { dates: dates.length, totalSavings: totalSavings[totalSavings.length - 1] });
        return { dates, totalSavings, memberCount };
    }

    /**
     * Generate Top Members Data (from IndexDB)
     */
    async generateTopMembersData() {
        try {
            const members = await Storage.get('members') || [];
            const savings = await Storage.get('savings') || [];
            console.log('✓ Fetched members:', members.length, 'savings:', savings.length);

            const memberSavings = {};
            savings.forEach(s => {
                if (!memberSavings[s.memberId]) memberSavings[s.memberId] = 0;
                memberSavings[s.memberId] += s.amount || 0;
            });

            let topMembers = Object.entries(memberSavings)
                .map(([memberId, total]) => {
                    const member = members.find(m => m.id === memberId);
                    return { name: member?.name || 'Unknown', savings: total };
                })
                .sort((a, b) => b.savings - a.savings)
                .slice(0, 8);

            // If no data, create sample members
            if (topMembers.length === 0 && members.length > 0) {
                console.warn('No savings data, creating sample data from members');
                topMembers = members.slice(0, 8).map((m, idx) => ({
                    name: m.name || `Member ${idx + 1}`,
                    savings: Math.floor(Math.random() * 500000) + 100000
                }));
            }

            console.log('Top Members Data:', topMembers);
            return {
                members: topMembers.map(m => m.name),
                savings: topMembers.map(m => m.savings)
            };
        } catch (error) {
            console.error('Error fetching top members data:', error);
            return this.getSampleTopMembersData();
        }
    }

    getSampleTopMembersData() {
        const sampleMembers = ['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Eve Wilson', 'Frank Miller', 'Grace Lee', 'Henry Davis'];
        return {
            members: sampleMembers,
            savings: sampleMembers.map(() => Math.floor(Math.random() * 500000) + 100000)
        };
    }

    /**
     * Generate Waterfall Data (from IndexDB)
     */
    async generateWaterfallData() {
        try {
            const loans = await Storage.get('loans') || [];
            const payments = await Storage.get('payments') || [];
            const savings = await Storage.get('savings') || [];
            const withdrawals = await Storage.get('withdrawals') || [];
            console.log('✓ Waterfall data - loans:', loans.length, 'payments:', payments.length, 'savings:', savings.length);

            const totalLoaned = loans.reduce((sum, l) => sum + (l.amount || 0), 0);
            const totalRepaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const interestEarned = loans.reduce((sum, l) => {
                const monthlyPayment = l.monthlyInstallment || 0;
                const expectedPayments = l.term || 0;
                const totalPayable = monthlyPayment * expectedPayments;
                return sum + Math.max(0, totalPayable - l.amount);
            }, 0);
            const outstanding = totalLoaned - totalRepaid;
            const totalSavings = savings.reduce((sum, s) => sum + (s.amount || 0), 0) 
                               - withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
            const netPosition = totalRepaid + interestEarned + totalSavings - outstanding;

            // If all zeros, use sample data
            if (totalLoaned === 0 && totalRepaid === 0 && totalSavings === 0) {
                console.warn('No financial data found, using sample data');
                return {
                    categories: ['Total Loaned', 'Total Repaid', 'Interest Earned', 'Outstanding', 'Total Savings', 'Net Position'],
                    values: [1000000, 450000, 50000, 550000, 300000, 250000]
                };
            }

            console.log('Waterfall Data:', { totalLoaned, totalRepaid, interestEarned, outstanding, totalSavings, netPosition });
            return {
                categories: ['Total Loaned', 'Total Repaid', 'Interest Earned', 'Outstanding', 'Total Savings', 'Net Position'],
                values: [totalLoaned, totalRepaid, interestEarned, -outstanding, totalSavings, netPosition]
            };
        } catch (error) {
            console.error('Error fetching waterfall data:', error);
            return {
                categories: ['Total Loaned', 'Total Repaid', 'Interest Earned', 'Outstanding', 'Total Savings', 'Net Position'],
                values: [1000000, 450000, 50000, 550000, 300000, 250000]
            };
        }
    }

    /**
     * Update all charts with fresh data
     */
    async updateAllCharts() {
        console.log('Updating all charts...');
        await Promise.all([
            this.initSavingsTrendChart(),
            this.initTopMembersBarChart(),
            this.initFinancialWaterfallChart(),
            this.initComparisonChart(),
            this.initRepaymentMetricsChart()
        ]);
        console.log('Charts updated successfully');
    }

    /**
     * Redraw all charts (for responsive resize)
     */
    redrawAllCharts() {
        if (this.savingsTrendChart) this.savingsTrendChart.resize();
        if (this.topMembersBarChart) this.topMembersBarChart.resize();
        if (this.financialWaterfallChart) this.financialWaterfallChart.resize();
        if (this.comparisonChart) this.comparisonChart.resize();
        if (this.repaymentMetricsChart) this.repaymentMetricsChart.resize();
    }

    /**
     * FILTER CONTROLS - Setup date range filters
     */
    setupFilterControls() {
        // Savings Trend filters
        const savingsStartInput = document.getElementById('savingsTrendStartDate');
        const savingsEndInput = document.getElementById('savingsTrendEndDate');
        if (savingsStartInput && savingsEndInput) {
            savingsStartInput.addEventListener('change', () => {
                this.filters.savingsTrendStart = savingsStartInput.value;
                this.initSavingsTrendChart();
            });
            savingsEndInput.addEventListener('change', () => {
                this.filters.savingsTrendEnd = savingsEndInput.value;
                this.initSavingsTrendChart();
            });
        }

        // Top Members filters
        const topMembersStartInput = document.getElementById('topMembersStartDate');
        const topMembersEndInput = document.getElementById('topMembersEndDate');
        if (topMembersStartInput && topMembersEndInput) {
            topMembersStartInput.addEventListener('change', () => {
                this.filters.topMembersStart = topMembersStartInput.value;
                this.initTopMembersBarChart();
            });
            topMembersEndInput.addEventListener('change', () => {
                this.filters.topMembersEnd = topMembersEndInput.value;
                this.initTopMembersBarChart();
            });
        }

        // Comparison period selector
        const comparisonPeriodSelect = document.getElementById('comparisonPeriodSelect');
        if (comparisonPeriodSelect) {
            comparisonPeriodSelect.addEventListener('change', (e) => {
                this.filters.comparisonPeriod = e.target.value;
                this.initComparisonChart();
            });
        }
    }

    /**
     * EXPORT FUNCTIONALITY - Export charts as images/PDF
     */
    setupExportButtons() {
        // Export Savings Trend Chart
        const exportSavingsBtn = document.getElementById('exportSavingsTrendBtn');
        if (exportSavingsBtn) {
            exportSavingsBtn.addEventListener('click', () => {
                this.exportChartAsImage(this.savingsTrendChart, 'Savings_Trend_Chart.png');
            });
        }

        // Export Top Members Chart
        const exportMembersBtn = document.getElementById('exportTopMembersBtn');
        if (exportMembersBtn) {
            exportMembersBtn.addEventListener('click', () => {
                this.exportChartAsImage(this.topMembersBarChart, 'Top_Members_Chart.png');
            });
        }

        // Export Waterfall Chart
        const exportWaterfallBtn = document.getElementById('exportWaterfallBtn');
        if (exportWaterfallBtn) {
            exportWaterfallBtn.addEventListener('click', () => {
                this.exportChartAsImage(this.financialWaterfallChart, 'Financial_Summary_Chart.png');
            });
        }

        // Export Comparison Chart
        const exportComparisonBtn = document.getElementById('exportComparisonBtn');
        if (exportComparisonBtn) {
            exportComparisonBtn.addEventListener('click', () => {
                this.exportChartAsImage(this.comparisonChart, 'Comparison_Chart.png');
            });
        }

        // Export Repayment Metrics Chart
        const exportRepaymentBtn = document.getElementById('exportRepaymentBtn');
        if (exportRepaymentBtn) {
            exportRepaymentBtn.addEventListener('click', () => {
                this.exportChartAsImage(this.repaymentMetricsChart, 'Repayment_Metrics_Chart.png');
            });
        }

        // Export All Charts as PDF
        const exportAllPdfBtn = document.getElementById('exportAllPdfBtn');
        if (exportAllPdfBtn) {
            exportAllPdfBtn.addEventListener('click', () => {
                this.exportAllChartsAsPDF();
            });
        }
    }

    /**
     * Export single chart as PNG image
     */
    exportChartAsImage(chart, filename) {
        if (!chart) {
            alert('Chart not initialized');
            return;
        }

        try {
            const url = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export chart: ' + error.message);
        }
    }

    /**
     * Export all charts as PDF
     */
    exportAllChartsAsPDF() {
        try {
            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                alert('PDF export not available. Please check if jsPDF is loaded.');
                return;
            }

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let yPosition = 10;

            // Add title
            pdf.setFontSize(18);
            pdf.text('SACCO Analytics Report', 10, yPosition);
            yPosition += 15;

            // Add date
            pdf.setFontSize(10);
            pdf.setTextColor(120, 120, 120);
            pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, yPosition);
            yPosition += 10;

            // Export each chart
            const charts = [
                { chart: this.savingsTrendChart, title: 'Savings Growth Trend' },
                { chart: this.topMembersBarChart, title: 'Top Members by Savings' },
                { chart: this.financialWaterfallChart, title: 'Financial Summary' },
                { chart: this.comparisonChart, title: 'Comparison Analysis' }
            ];

            charts.forEach((item, index) => {
                if (!item.chart) return;

                // Add section title
                if (yPosition > pageHeight - 80) {
                    pdf.addPage();
                    yPosition = 10;
                }

                pdf.setFontSize(12);
                pdf.setTextColor(0, 0, 0);
                pdf.text(item.title, 10, yPosition);
                yPosition += 8;

                try {
                    const imageUrl = item.chart.getDataURL({ type: 'png', pixelRatio: 1.5, backgroundColor: '#fff' });
                    const imgWidth = pageWidth - 20;
                    const imgHeight = 60;
                    pdf.addImage(imageUrl, 'PNG', 10, yPosition, imgWidth, imgHeight);
                    yPosition += imgHeight + 10;
                } catch (e) {
                    console.warn(`Failed to export ${item.title}:`, e);
                }
            });

            pdf.save('SACCO_Analytics_Report.pdf');
        } catch (error) {
            console.error('PDF export failed:', error);
            alert('PDF export not available. Ensure jsPDF is loaded.');
        }
    }

    /**
     * COMPARISON CHART - Year-over-Year / Month-over-Month
     */
    async initComparisonChart() {
        const container = document.getElementById('comparisonChart');
        if (!container) {
            console.error('❌ Comparison container NOT found');
            return;
        }
        if (!window.echarts) {
            console.error('❌ ECharts not available');
            return;
        }

        this.comparisonChart = window.echarts.init(container);
        console.log('✓ Comparison chart initialized');

        const data = await this.generateComparisonData();
        const isPeriodMonthly = this.filters.comparisonPeriod === 'monthly';

        const option = {
            backgroundColor: 'transparent',
            textStyle: { fontFamily: 'inherit' },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#06B6D4',
                textStyle: { color: '#fff', fontSize: 12 },
                padding: [10, 15]
            },
            legend: {
                top: 20,
                left: 'center',
                textStyle: { color: '#374151', fontSize: 12 }
            },
            grid: {
                top: 80,
                left: 60,
                right: 30,
                bottom: 50,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: data.periods,
                axisLine: { lineStyle: { color: '#E5E7EB' } },
                axisLabel: { color: '#6B7280', fontSize: 11 }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                axisLabel: { color: '#6B7280', fontSize: 11, formatter: 'UGX {value/1000}K' },
                splitLine: { lineStyle: { color: '#E5E7EB', type: 'dashed' } }
            },
            series: [
                {
                    name: isPeriodMonthly ? 'Current Month' : 'Current Year',
                    type: 'bar',
                    data: data.current,
                    itemStyle: { color: '#3B82F6', borderRadius: [8, 8, 0, 0] }
                },
                {
                    name: isPeriodMonthly ? 'Previous Month' : 'Previous Year',
                    type: 'bar',
                    data: data.previous,
                    itemStyle: { color: '#8B5CF6', borderRadius: [8, 8, 0, 0], opacity: 0.6 }
                }
            ]
        };

        this.comparisonChart.setOption(option);
    }

    /**
     * REPAYMENT METRICS CHART - Interest vs Principal
     */
    async initRepaymentMetricsChart() {
        const container = document.getElementById('repaymentMetricsChart');
        if (!container) {
            console.error('❌ Repayment metrics container NOT found');
            return;
        }
        if (!window.echarts) {
            console.error('❌ ECharts not available');
            return;
        }

        this.repaymentMetricsChart = window.echarts.init(container);
        console.log('✓ Repayment metrics chart initialized');

        const data = await this.generateRepaymentMetricsData();

        const option = {
            backgroundColor: 'transparent',
            textStyle: { fontFamily: 'inherit' },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#10B981',
                textStyle: { color: '#fff', fontSize: 12 },
                formatter: (params) => {
                    let result = `<strong>${params[0].axisValueLabel}</strong><br/>`;
                    params.forEach(param => {
                        result += `<span style="color: ${param.color}">● ${param.seriesName}: <strong>UGX ${this.formatNumber(param.value)}</strong></span><br/>`;
                    });
                    return result;
                }
            },
            legend: {
                top: 20,
                left: 'center',
                textStyle: { color: '#374151', fontSize: 12 }
            },
            grid: {
                top: 80,
                left: 60,
                right: 30,
                bottom: 50,
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: data.members,
                axisLine: { lineStyle: { color: '#E5E7EB' } },
                axisLabel: { color: '#6B7280', fontSize: 10, rotate: 45 }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                axisLabel: { color: '#6B7280', fontSize: 11, formatter: 'UGX {value/1000}K' },
                splitLine: { lineStyle: { color: '#E5E7EB', type: 'dashed' } }
            },
            series: [
                {
                    name: 'Principal Paid',
                    type: 'bar',
                    stack: 'total',
                    data: data.principal,
                    itemStyle: { color: '#10B981', borderRadius: [8, 8, 0, 0] }
                },
                {
                    name: 'Interest Paid',
                    type: 'bar',
                    stack: 'total',
                    data: data.interest,
                    itemStyle: { color: '#F59E0B', borderRadius: [8, 8, 0, 0] }
                }
            ]
        };

        this.repaymentMetricsChart.setOption(option);
    }

    /**
     * Generate comparison data (YoY/MoM) (from IndexDB)
     */
    async generateComparisonData() {
        try {
            const savings = await Storage.get('savings') || [];
            console.log('✓ Comparison data - savings:', savings.length);
        const isPeriodMonthly = this.filters.comparisonPeriod === 'monthly';

        if (isPeriodMonthly) {
            // Month-over-Month comparison
            const today = new Date();
            const thisMonth = today.getMonth();
            const thisYear = today.getFullYear();
            const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
            const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

            const currentMonthData = {};
            const previousMonthData = {};

            savings.forEach(s => {
                const date = new Date(s.date || new Date());
                const week = Math.ceil(date.getDate() / 7);

                if (date.getMonth() === thisMonth && date.getFullYear() === thisYear) {
                    currentMonthData[`Week ${week}`] = (currentMonthData[`Week ${week}`] || 0) + s.amount;
                } else if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
                    previousMonthData[`Week ${week}`] = (previousMonthData[`Week ${week}`] || 0) + s.amount;
                }
            });

            let periods = [...new Set([...Object.keys(currentMonthData), ...Object.keys(previousMonthData)])].sort();
            
            // If no data, create sample weeks
            if (periods.length === 0) {
                periods = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            }

            return {
                periods,
                current: periods.map(p => currentMonthData[p] || Math.floor(Math.random() * 200000)),
                previous: periods.map(p => previousMonthData[p] || Math.floor(Math.random() * 180000))
            };
        } else {
            // Year-over-Year comparison
            const today = new Date();
            const thisYear = today.getFullYear();
            const lastYear = thisYear - 1;

            const currentYearData = {};
            const previousYearData = {};
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            savings.forEach(s => {
                const date = new Date(s.date || new Date());
                const monthName = months[date.getMonth()];

                if (date.getFullYear() === thisYear) {
                    currentYearData[monthName] = (currentYearData[monthName] || 0) + s.amount;
                } else if (date.getFullYear() === lastYear) {
                    previousYearData[monthName] = (previousYearData[monthName] || 0) + s.amount;
                }
            });

            // If no data, create sample month data
            const hasData = Object.keys(currentYearData).length > 0 || Object.keys(previousYearData).length > 0;
            
            return {
                periods: months,
                current: months.map(m => currentYearData[m] || (hasData ? 0 : Math.floor(Math.random() * 300000))),
                previous: months.map(m => previousYearData[m] || (hasData ? 0 : Math.floor(Math.random() * 280000)))
            };
        }
        } catch (error) {
            console.error('Error fetching comparison data:', error);
            return {
                periods: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                current: [100000, 150000, 120000, 200000],
                previous: [90000, 140000, 110000, 180000]
            };
        }
    }

    /**
     * Generate repayment metrics data (Principal vs Interest) (from IndexDB)
     */
    async generateRepaymentMetricsData() {
        try {
            const members = await Storage.get('members') || [];
            const loans = await Storage.get('loans') || [];
            const payments = await Storage.get('payments') || [];
            console.log('✓ Repayment data - members:', members.length, 'loans:', loans.length, 'payments:', payments.length);

        const memberMetrics = {};

        loans.forEach(loan => {
            if (!memberMetrics[loan.memberId]) {
                memberMetrics[loan.memberId] = { principal: 0, interest: 0, totalAmount: 0 };
            }

            const totalInterest = (loan.amount * loan.interestRate * loan.term) / (12 * 100);
            const totalAmount = loan.amount + totalInterest;
            memberMetrics[loan.memberId].totalAmount += totalAmount;
        });

        payments.forEach(payment => {
            const loan = loans.find(l => l.id === payment.loanId);
            if (!loan) return;

            const totalInterest = (loan.amount * loan.interestRate * loan.term) / (12 * 100);
            const totalAmount = loan.amount + totalInterest;
            const principalRatio = loan.amount / totalAmount;

            memberMetrics[loan.memberId].principal += payment.amount * principalRatio;
            memberMetrics[loan.memberId].interest += payment.amount * (1 - principalRatio);
        });

        let topMembers = Object.entries(memberMetrics)
            .map(([memberId, metrics]) => {
                const member = members.find(m => m.id === memberId);
                return { name: member?.name || 'Unknown', ...metrics };
            })
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, 8);

        // If no data, create sample from members
        if (topMembers.length === 0 && members.length > 0) {
            console.warn('No repayment data, creating sample data');
            topMembers = members.slice(0, 8).map((m, idx) => ({
                name: m.name || `Member ${idx + 1}`,
                principal: Math.floor(Math.random() * 400000) + 50000,
                interest: Math.floor(Math.random() * 50000) + 5000,
                totalAmount: 0
            }));
        }

            console.log('Repayment Metrics Data:', topMembers);
            return {
                members: topMembers.map(m => m.name),
                principal: topMembers.map(m => Math.round(m.principal)),
                interest: topMembers.map(m => Math.round(m.interest))
            };
        } catch (error) {
            console.error('Error fetching repayment data:', error);
            return this.getSampleRepaymentMetricsData();
        }
    }

    getSampleRepaymentMetricsData() {
        const sampleMembers = ['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Eve Wilson', 'Frank Miller', 'Grace Lee', 'Henry Davis'];
        return {
            members: sampleMembers,
            principal: sampleMembers.map(() => Math.floor(Math.random() * 400000) + 50000),
            interest: sampleMembers.map(() => Math.floor(Math.random() * 50000) + 5000)
        };
    }

    /**
     * REAL-TIME UPDATES - Continuous data streaming
     */
    startRealtimeUpdates() {
        setInterval(() => {
            const now = Date.now();
            if (now - this.lastUpdateTime > this.updateInterval) {
                this.lastUpdateTime = now;
                this.updateAllCharts();
            }
        }, 1000);
    }

    /**
     * Utility: Format large numbers
     */
    formatNumber(num) {
        return Math.abs(num).toLocaleString('en-US');
    }
}

// Initialize on page load
let initRetries = 0;
const MAX_INIT_RETRIES = 50; // Max 5 seconds of retries

async function initializeCharts() {
    const echartsReady = !!window.echarts;
    const indexeddbReady = window.IndexedDBReady === true;
    
    console.log('Attempting to initialize charts...', { echarts: echartsReady, readyState: document.readyState, indexeddbReady });
    
    if (echartsReady && indexeddbReady) {
        console.log('ECharts and IndexedDB available, creating AdvancedCharts instance');
        window.advancedCharts = new AdvancedCharts();
        await window.advancedCharts.updateAllCharts();
    } else if (initRetries < MAX_INIT_RETRIES) {
        initRetries++;
        if (!echartsReady) {
            console.warn('ECharts not loaded yet, retrying...', { attempt: initRetries, max: MAX_INIT_RETRIES });
        } else if (!indexeddbReady) {
            console.warn('IndexedDB not ready yet, retrying...', { attempt: initRetries, max: MAX_INIT_RETRIES });
        }
        setTimeout(initializeCharts, 100);
    } else {
        console.error('Chart initialization failed: Max retries reached. ECharts ready:', echartsReady, 'IndexedDB ready:', indexeddbReady);
    }
}

// Wait for both DOM and script to be ready
function waitForInitialization() {
    console.log('waitForInitialization called, readyState:', document.readyState);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOMContentLoaded event fired');
            setTimeout(initializeCharts, 500);
        });
    } else {
        console.log('DOM already loaded, initializing immediately');
        setTimeout(initializeCharts, 500);
    }
}

waitForInitialization();

// Re-initialize when reports section is shown
document.addEventListener('pageChanged', (e) => {
    console.log('pageChanged event fired:', e.detail);
    if (e.detail?.page === 'reports') {
        setTimeout(() => {
            if (window.advancedCharts) {
                console.log('Redrawing charts for reports page');
                window.advancedCharts.redrawAllCharts();
            } else {
                console.log('AdvancedCharts not yet initialized, initializing now');
                initializeCharts();
            }
        }, 100);
    }
});

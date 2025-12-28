/**
 * AI Dashboard UI - Display AI insights and recommendations
 */

class AIDashboard {
    constructor() {
        this.aiEngine = window.aiEngine;
        this.init();
    }

    init() {
        this.createAIDashboardPanel();
        this.attachEventListeners();
    }

    /**
     * Create AI Dashboard Panel in Sidebar
     */
    createAIDashboardPanel() {
        const sidebar = document.querySelector('.features-sidebar');
        if (!sidebar) return;

        // Check if AI section already exists
        if (document.getElementById('aiSection')) return;

        // Create AI section
        const aiSection = document.createElement('div');
        aiSection.className = 'feature-section';
        aiSection.id = 'aiSection';
        aiSection.innerHTML = `
            <h6 class="feature-title">🤖 AI Insights</h6>
            <p class="feature-desc">Smart analysis and recommendations</p>
            <div class="row g-2">
                <div class="col-6">
                    <button class="btn btn-sm btn-primary w-100" id="aiRiskBtn">
                        <i class="ri-error-warning-line"></i> Risk Analysis
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-sm btn-success w-100" id="aiRecommendBtn">
                        <i class="ri-lightbulb-line"></i> Recommendations
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-sm btn-warning w-100" id="aiAlertsBtn">
                        <i class="ri-notification-2-line"></i> Alerts
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-sm btn-info w-100" id="aiReportsBtn">
                        <i class="ri-line-chart-line"></i> Reports
                    </button>
                </div>
            </div>
            <div id="aiAlertsBadge" class="badge bg-danger mt-2" style="display:none;">
                <span id="aiAlertCount">0</span> Active Alerts
            </div>
        `;

        // Insert after first feature section or at the start
        const firstSection = sidebar.querySelector('.feature-section');
        if (firstSection) {
            firstSection.parentNode.insertBefore(aiSection, firstSection);
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        document.addEventListener('click', async (e) => {
            if (e.target.id === 'aiRiskBtn') await this.showRiskAnalysis();
            if (e.target.id === 'aiRecommendBtn') await this.showRecommendations();
            if (e.target.id === 'aiAlertsBtn') await this.showAlerts();
            if (e.target.id === 'aiReportsBtn') await this.showPredictiveReports();
        });
    }

    /**
     * Show Risk Analysis Modal
     */
    async showRiskAnalysis() {
        const members = await Storage.getMembers();
        
        if (!members || members.length === 0) {
            Swal.fire({
                title: 'No Members',
                text: 'Please add members first',
                icon: 'info'
            });
            return;
        }

        // Create modal for member selection
        const memberOptions = members.map(m => 
            `<option value="${m.id}">${m.name}</option>`
        ).join('');

        Swal.fire({
            title: '🔍 Risk Analysis',
            html: `
                <div class="text-start">
                    <label class="form-label">Select Member:</label>
                    <select id="riskMemberSelect" class="form-select">
                        <option value="">Choose a member...</option>
                        ${memberOptions}
                    </select>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Analyze',
            didOpen: () => {
                document.getElementById('riskMemberSelect').focus();
            }
        }).then(result => {
            if (result.isConfirmed) {
                const memberId = document.getElementById('riskMemberSelect').value;
                if (memberId) this.displayRiskAssessment(memberId);
            }
        });
    }

    /**
     * Display Risk Assessment Results
     */
    async displayRiskAssessment(memberId) {
        const risk = await this.aiEngine.assessMemberRisk(memberId);
        if (!risk) {
            Swal.fire('Error', 'Could not assess member risk', 'error');
            return;
        }

        const member = await this.aiEngine.getMemberData(memberId);
        const riskColor = {
            'LOW': '#28a745',
            'MEDIUM': '#ffc107',
            'HIGH': '#dc3545'
        }[risk.riskLevel];

        const html = `
            <div class="text-start">
                <h5 style="margin-bottom: 20px;">${member.name}</h5>
                
                <!-- Risk Score -->
                <div class="mb-4">
                    <p class="mb-2"><strong>Risk Score: ${risk.riskScore}/10</strong></p>
                    <div class="progress" style="height: 25px;">
                        <div class="progress-bar" style="width: ${risk.riskScore * 10}%; background-color: ${riskColor};">
                            <strong style="color: white;">${risk.riskLevel}</strong>
                        </div>
                    </div>
                </div>

                <!-- Detailed Scores -->
                <div class="mb-4">
                    <h6>Score Breakdown:</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <tr>
                                <td>Payment History</td>
                                <td class="text-end"><strong>${risk.scores.paymentHistory.toFixed(1)}/10</strong></td>
                            </tr>
                            <tr>
                                <td>Savings Pattern</td>
                                <td class="text-end"><strong>${risk.scores.savingsPattern.toFixed(1)}/10</strong></td>
                            </tr>
                            <tr>
                                <td>Loan History</td>
                                <td class="text-end"><strong>${risk.scores.loanHistory.toFixed(1)}/10</strong></td>
                            </tr>
                            <tr>
                                <td>Activity Level</td>
                                <td class="text-end"><strong>${risk.scores.activityLevel.toFixed(1)}/10</strong></td>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- Factors -->
                <div class="mb-4">
                    <h6>Risk Factors:</h6>
                    ${risk.factors.positive.length > 0 ? `
                        <div class="alert alert-success py-2">
                            <strong>Positive:</strong>
                            <ul class="mb-0 mt-1">
                                ${risk.factors.positive.map(f => `<li>${f}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${risk.factors.negative.length > 0 ? `
                        <div class="alert alert-warning py-2">
                            <strong>Areas of Concern:</strong>
                            <ul class="mb-0 mt-1">
                                ${risk.factors.negative.map(f => `<li>${f}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>

                <!-- Recommendation -->
                <div class="alert alert-info">
                    <strong>Recommendation:</strong>
                    <p class="mb-0 mt-2">${risk.recommendation.text}</p>
                    <p class="mb-0 small mt-2">
                        <strong>Loan Amount Multiplier:</strong> ${(risk.recommendation.loanAmountMultiplier * 100).toFixed(0)}%<br>
                        <strong>Interest Rate Adjustment:</strong> ${risk.recommendation.interestRateAdjustment > 0 ? '+' : ''}${risk.recommendation.interestRateAdjustment.toFixed(1)}%
                    </p>
                </div>
            </div>
        `;

        Swal.fire({
            title: '📊 Risk Assessment Results',
            html: html,
            width: '600px',
            confirmButtonText: 'Close'
        });
    }

    /**
     * Show Recommendations Modal
     */
    async showRecommendations() {
        const members = await Storage.getMembers();
        
        if (!members || members.length === 0) {
            Swal.fire({
                title: 'No Members',
                text: 'Please add members first',
                icon: 'info'
            });
            return;
        }

        const memberOptions = members.map(m => 
            `<option value="${m.id}">${m.name}</option>`
        ).join('');

        Swal.fire({
            title: '💡 Loan Recommendations',
            html: `
                <div class="text-start">
                    <label class="form-label">Select Member:</label>
                    <select id="recommendMemberSelect" class="form-select mb-3">
                        <option value="">Choose a member...</option>
                        ${memberOptions}
                    </select>
                    <label class="form-label">Optional - Requested Amount (UGX):</label>
                    <input type="number" id="requestedAmount" class="form-control" placeholder="Leave empty for default">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Get Recommendation',
            didOpen: () => {
                document.getElementById('recommendMemberSelect').focus();
            }
        }).then(result => {
            if (result.isConfirmed) {
                const memberId = document.getElementById('recommendMemberSelect').value;
                const requestedAmount = document.getElementById('requestedAmount').value || null;
                if (memberId) this.displayLoanRecommendation(memberId, parseInt(requestedAmount));
            }
        });
    }

    /**
     * Display Loan Recommendation
     */
    async displayLoanRecommendation(memberId, requestedAmount = null) {
        const recommendation = await this.aiEngine.generateLoanRecommendation(memberId, requestedAmount);
        if (!recommendation) {
            Swal.fire('Error', 'Could not generate recommendation', 'error');
            return;
        }

        const member = await this.aiEngine.getMemberData(memberId);
        const confidencePercent = Math.round(recommendation.confidence * 100);
        const confidenceColor = confidencePercent >= 80 ? '#28a745' : confidencePercent >= 60 ? '#ffc107' : '#dc3545';

        let alternativesHtml = '<h6 class="mt-4">Alternative Terms:</h6><table class="table table-sm"><thead><tr><th>Term</th><th>Monthly Payment</th><th>Total Repayment</th></tr></thead><tbody>';
        
        recommendation.alternatives.forEach(alt => {
            alternativesHtml += `
                <tr>
                    <td>${alt.term} months</td>
                    <td>${this.formatCurrency(alt.monthlyPayment)}</td>
                    <td>${this.formatCurrency(alt.totalRepayment)}</td>
                </tr>
            `;
        });
        alternativesHtml += '</tbody></table>';

        const html = `
            <div class="text-start">
                <h5 style="margin-bottom: 20px;">${member.name}</h5>
                
                <!-- Main Recommendation -->
                <div class="alert alert-info mb-4">
                    <h6>Recommended Loan Terms:</h6>
                    <table class="table table-sm mb-0">
                        <tr>
                            <td><strong>Loan Amount:</strong></td>
                            <td class="text-end">${this.formatCurrency(recommendation.recommendedAmount)}</td>
                        </tr>
                        <tr>
                            <td><strong>Max Capacity:</strong></td>
                            <td class="text-end">${this.formatCurrency(recommendation.maxLoanAmount)}</td>
                        </tr>
                        <tr>
                            <td><strong>Term:</strong></td>
                            <td class="text-end">${recommendation.recommendedTerm} months</td>
                        </tr>
                        <tr>
                            <td><strong>Interest Rate:</strong></td>
                            <td class="text-end">${recommendation.recommendedRate.toFixed(2)}%</td>
                        </tr>
                        <tr>
                            <td><strong>Monthly Payment:</strong></td>
                            <td class="text-end"><strong style="color: #2563eb;">${this.formatCurrency(recommendation.monthlyPayment)}</strong></td>
                        </tr>
                    </table>
                </div>

                <!-- Confidence -->
                <div class="mb-4">
                    <p class="mb-2"><strong>Recommendation Confidence: ${confidencePercent}%</strong></p>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar" style="width: ${confidencePercent}%; background-color: ${confidenceColor};">
                        </div>
                    </div>
                </div>

                <!-- Rationale -->
                <div class="alert alert-success py-2 mb-4">
                    <strong>Why this recommendation:</strong>
                    <ul class="mb-0 mt-2">
                        ${recommendation.rationale.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>

                <!-- Alternatives -->
                ${alternativesHtml}
            </div>
        `;

        Swal.fire({
            title: '🎯 Loan Recommendation',
            html: html,
            width: '700px',
            confirmButtonText: 'Close'
        });
    }

    /**
     * Show Alerts Modal
     */
    async showAlerts() {
        const alerts = await this.aiEngine.generatePredictiveAlerts();
        
        if (alerts.length === 0) {
            Swal.fire({
                title: '✅ No Alerts',
                text: 'All loans are in good standing',
                icon: 'success'
            });
            return;
        }

        let alertsHtml = '<div class="text-start"><div class="alert-list">';
        
        for (const alert of alerts) {
            const severityColor = {
                'HIGH': '#dc3545',
                'MEDIUM': '#ffc107',
                'LOW': '#28a745'
            }[alert.severity];

            const member = await this.aiEngine.getMemberData(alert.memberId);
            
            alertsHtml += `
                <div class="alert mb-3" style="border-left: 4px solid ${severityColor};">
                    <h6 style="color: ${severityColor};">⚠️ ${alert.severity} Risk - Loan #${alert.loanId}</h6>
                    <p class="mb-1"><strong>${member.name}</strong></p>
                    <p class="mb-2">${alert.message}</p>
                    <p class="small text-muted mb-0"><strong>Action:</strong> ${alert.action}</p>
                </div>
                `;
                }
                
                alertsHtml += '</div></div>';

        Swal.fire({
            title: `⚠️ AI Alerts (${alerts.length})`,
            html: alertsHtml,
            width: '600px',
            confirmButtonText: 'Close'
        });

        // Update alert badge
        const badge = document.getElementById('aiAlertsBadge');
        const count = document.getElementById('aiAlertCount');
        if (badge && count) {
            count.textContent = alerts.length;
            badge.style.display = alerts.length > 0 ? 'block' : 'none';
        }
    }

    /**
     * Show Predictive Reports
     */
    async showPredictiveReports() {
        const members = await Storage.getMembers();
        const loans = await Storage.getLoans();

        let stats = {
            totalMembers: members.length,
            totalLoans: loans.length,
            highRiskLoans: 0,
            avgDefaultProbability: 0
        };

        let defaultProbabilities = [];

        for (const loan of loans) {
            const prediction = await this.aiEngine.predictDefaultProbability(loan.id);
            if (prediction && typeof prediction.defaultProbability === 'number') {
                defaultProbabilities.push(prediction.defaultProbability);
                if (prediction.riskLevel === 'HIGH') {
                    stats.highRiskLoans++;
                }
            }
        }

        if (defaultProbabilities.length > 0) {
            stats.avgDefaultProbability = defaultProbabilities.reduce((a, b) => a + b, 0) / defaultProbabilities.length;
        } else {
            stats.avgDefaultProbability = 0; // Default to 0 if no loans
        }

        const html = `
            <div class="text-start">
                <h5 class="mb-4">Portfolio Predictions</h5>
                
                <div class="row g-3 mb-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <p class="text-muted small mb-1">Total Members</p>
                                <p class="h5 mb-0">${stats.totalMembers}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <p class="text-muted small mb-1">Active Loans</p>
                                <p class="h5 mb-0">${stats.totalLoans}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <p class="text-muted small mb-1">High Risk Loans</p>
                                <p class="h5 text-danger mb-0">${stats.highRiskLoans}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <p class="text-muted small mb-1">Avg Default Probability</p>
                                <p class="h5 mb-0">${isNaN(stats.avgDefaultProbability) ? '0.0' : (stats.avgDefaultProbability * 100).toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="alert alert-info">
                    <strong>Insights:</strong>
                    <ul class="mb-0 mt-2">
                         <li>${stats.highRiskLoans} loan(s) require immediate attention</li>
                         <li>Average portfolio default risk is ${isNaN(stats.avgDefaultProbability) ? '0.0' : (stats.avgDefaultProbability * 100).toFixed(1)}%</li>
                         <li>Recommended action: Focus on high-risk loans for early intervention</li>
                     </ul>
                </div>
            </div>
        `;

        Swal.fire({
            title: '📊 Predictive Analytics',
            html: html,
            width: '600px',
            confirmButtonText: 'Close'
        });
    }

    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX'
        }).format(amount);
    }

    /**
     * Update alerts periodically
     */
    startAlertUpdates() {
        setInterval(async () => {
            const alerts = await this.aiEngine.generatePredictiveAlerts();
            const badge = document.getElementById('aiAlertsBadge');
            const count = document.getElementById('aiAlertCount');
            
            if (badge && count) {
                count.textContent = alerts.length;
                badge.style.display = alerts.length > 0 ? 'block' : 'none';
            }
        }, 60000); // Update every minute
    }
}

// Initialize AI Dashboard when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.aiDashboard = new AIDashboard();
        window.aiDashboard.startAlertUpdates();
    });
} else {
    window.aiDashboard = new AIDashboard();
    window.aiDashboard.startAlertUpdates();
}

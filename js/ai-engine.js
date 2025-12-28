/**
 * AI Engine - Core AI/ML functionality for SACCO System
 * Provides risk assessment, recommendations, and predictive analytics
 */

class SACCOAIEngine {
    constructor() {
        this.memberRiskCache = new Map();
        this.loanRecommendationCache = new Map();
        this.predictionModels = new Map();
        this.alerts = [];
        this.config = {
            riskWeights: {
                paymentHistory: 0.40,
                savingsPattern: 0.30,
                loanHistory: 0.20,
                activityLevel: 0.10
            },
            riskThresholds: {
                low: { min: 0, max: 3 },
                medium: { min: 3, max: 7 },
                high: { min: 7, max: 10 }
            },
            defaultProbabilityThreshold: 0.5,
            enablePredictiveAlerts: true
        };
    }

    /**
     * Assess member risk based on historical data
     * Returns risk score 0-10 (0=safe, 10=high risk)
     */
    async assessMemberRisk(memberId) {
        // Check cache
        if (this.memberRiskCache.has(memberId)) {
            const cached = this.memberRiskCache.get(memberId);
            if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
                return cached.data;
            }
        }

        const member = await this.getMemberData(memberId);
        if (!member) return null;

        const scores = {
            paymentHistory: await this.calculatePaymentHistoryScore(memberId),
            savingsPattern: await this.calculateSavingsScore(memberId),
            loanHistory: await this.calculateLoanHistoryScore(memberId),
            activityLevel: await this.calculateActivityScore(memberId)
        };

        // Calculate weighted risk score
        let riskScore = 0;
        for (const [key, weight] of Object.entries(this.config.riskWeights)) {
            riskScore += (scores[key] || 0) * weight;
        }

        const assessment = {
            memberId,
            riskScore: Math.round(riskScore * 10) / 10,
            riskLevel: this.getRiskLevel(riskScore),
            scores,
            factors: this.identifyRiskFactors(memberId, scores),
            recommendation: this.generateRiskRecommendation(riskScore, scores),
            timestamp: Date.now()
        };

        // Cache result
        this.memberRiskCache.set(memberId, {
            data: assessment,
            timestamp: Date.now()
        });

        return assessment;
    }

    /**
     * Calculate payment history score (0-10, lower is better)
     */
    async calculatePaymentHistoryScore(memberId) {
        const loans = await this.getMemberLoans(memberId);
        if (loans.length === 0) return 5; // Neutral for no history

        let onTimePayments = 0;
        let latePayments = 0;
        let missedPayments = 0;

        for (const loan of loans) {
            const payments = await this.getLoanPayments(loan.id);
            payments.forEach(payment => {
                const daysLate = this.calculateDaysLate(payment);
                if (daysLate === 0) onTimePayments++;
                else if (daysLate <= 7) latePayments++;
                else missedPayments++;
            });
        }

        const totalPayments = onTimePayments + latePayments + missedPayments;
        if (totalPayments === 0) return 5;

        const onTimeRate = onTimePayments / totalPayments;
        const lateRate = latePayments / totalPayments;
        const missedRate = missedPayments / totalPayments;

        // Score calculation
        let score = 10;
        score -= (onTimeRate * 8); // Good payments reduce risk
        score += (lateRate * 2);   // Late payments increase risk
        score += (missedRate * 4); // Missed payments increase risk more

        return Math.max(0, Math.min(10, score));
    }

    /**
     * Calculate savings pattern score (0-10, lower is better)
     */
    async calculateSavingsScore(memberId) {
        const savings = await this.getMemberSavings(memberId);
        if (savings.length === 0) return 7; // Higher risk for no savings

        const totalSavings = savings.reduce((sum, s) => sum + (s.amount || 0), 0);
        const savingConsistency = this.calculateConsistency(savings);
        const savingsGrowth = this.calculateGrowthTrend(savings);

        // Score based on multiple factors
        let score = 10;
        
        // Penalize low savings
        if (totalSavings < 100000) score -= 1; // Low savings = low score
        if (totalSavings < 500000) score -= 2;
        if (totalSavings >= 1000000) score -= 3;
        
        // Reward consistency
        score -= (savingConsistency * 3); // 0-3 points
        
        // Reward growth
        if (savingsGrowth > 0.1) score -= 2; // Positive growth
        
        return Math.max(0, Math.min(10, score));
    }

    /**
     * Calculate loan history score (0-10, lower is better)
     */
    async calculateLoanHistoryScore(memberId) {
        const loans = await this.getMemberLoans(memberId);
        if (loans.length === 0) return 7; // No history = moderate risk

        const completedLoans = loans.filter(l => l.status === 'repaid').length;
        const activeLoans = loans.filter(l => l.status === 'active').length;
        const defaultedLoans = loans.filter(l => l.status === 'defaulted').length;
        const overdueLoans = loans.filter(l => l.status === 'overdue').length;

        const completionRate = loans.length > 0 ? completedLoans / loans.length : 0;

        let score = 10;
        score -= (completionRate * 4); // Good completion reduces risk
        score += (defaultedLoans * 2);  // Defaults increase risk
        score += (overdueLoans * 1.5);  // Overdue loans increase risk
        
        // Loan frequency penalty
        if (loans.length > 5) score -= 1; // Many loans = slightly lower risk
        
        return Math.max(0, Math.min(10, score));
    }

    /**
     * Calculate activity level score (0-10, lower is better)
     */
    async calculateActivityScore(memberId) {
        const member = await this.getMemberData(memberId);
        if (!member) return 5;

        const accountAge = this.calculateAccountAgeDays(member);
        const recentActivity = await this.getRecentActivityCount(memberId, 90); // Last 90 days

        let score = 10;
        
        // Reward account age
        if (accountAge > 365) score -= 2; // 1+ year = lower risk
        if (accountAge > 730) score -= 1; // 2+ years = even lower
        
        // Reward activity
        const activityPerMonth = recentActivity / 3; // Average per month
        if (activityPerMonth > 2) score -= 2;
        if (activityPerMonth > 5) score -= 1;
        
        return Math.max(0, Math.min(10, score));
    }

    /**
     * Get risk level based on score
     */
    getRiskLevel(riskScore) {
        if (riskScore <= this.config.riskThresholds.low.max) return 'LOW';
        if (riskScore <= this.config.riskThresholds.medium.max) return 'MEDIUM';
        return 'HIGH';
    }

    /**
     * Identify specific risk factors
     */
    identifyRiskFactors(memberId, scores) {
        const factors = {
            positive: [],
            negative: []
        };

        // Payment history
        if (scores.paymentHistory < 3) factors.positive.push('Strong payment history');
        if (scores.paymentHistory > 7) factors.negative.push('Poor payment history');

        // Savings
        if (scores.savingsPattern < 4) factors.positive.push('Consistent savings');
        if (scores.savingsPattern > 7) factors.negative.push('Low/no savings');

        // Loan history
        if (scores.loanHistory < 3) factors.positive.push('Good loan completion');
        if (scores.loanHistory > 7) factors.negative.push('History of defaults');

        // Activity
        if (scores.activityLevel < 4) factors.positive.push('Long account history');
        if (scores.activityLevel > 7) factors.negative.push('New/inactive account');

        return factors;
    }

    /**
     * Generate recommendation based on risk assessment
     */
    generateRiskRecommendation(riskScore, scores) {
        const riskLevel = this.getRiskLevel(riskScore);
        
        let recommendation = '';
        let loanAdjustment = 1.0; // Loan amount multiplier
        let interestAdjustment = 0; // Interest rate adjustment

        if (riskLevel === 'LOW') {
            recommendation = 'Approve with standard terms';
            loanAdjustment = 1.0;
            interestAdjustment = 0;
        } else if (riskLevel === 'MEDIUM') {
            recommendation = 'Approve with reduced amount or higher interest rate';
            loanAdjustment = 0.75;
            interestAdjustment = 1; // +1% interest
        } else {
            recommendation = 'Approve with significant restrictions or require co-signer';
            loanAdjustment = 0.5;
            interestAdjustment = 2; // +2% interest
        }

        return {
            text: recommendation,
            loanAmountMultiplier: loanAdjustment,
            interestRateAdjustment: interestAdjustment,
            riskLevel
        };
    }

    /**
     * Generate loan recommendations
     */
    async generateLoanRecommendation(memberId, requestedAmount = null) {
        const member = await this.getMemberData(memberId);
        if (!member) return null;

        const risk = await this.assessMemberRisk(memberId);
        const savings = await this.getMemberSavings(memberId);
        const loans = await this.getMemberLoans(memberId);

        const totalSavings = savings.reduce((sum, s) => sum + (s.amount || 0), 0);
        const activeDebt = this.calculateActiveDebt(memberId);

        // Calculate lending capacity
        let maxLoanAmount = totalSavings * 3; // Can borrow 3x savings
        if (activeDebt > 0) {
            maxLoanAmount = Math.max(0, maxLoanAmount - activeDebt);
        }

        // Apply risk adjustment
        maxLoanAmount *= risk.recommendation.loanAmountMultiplier;

        // Calculate recommended terms
        const recommendedAmount = requestedAmount ? 
            Math.min(requestedAmount, maxLoanAmount) : 
            maxLoanAmount * 0.7; // 70% of capacity as recommendation

        const recommendedTerm = await this.calculateOptimalTerm(memberId, recommendedAmount);
        const recommendedRate = this.calculateOptimalRate(risk);

        // Calculate monthly payment
        const monthlyPayment = this.calculateMonthlyPayment(
            recommendedAmount,
            recommendedRate,
            recommendedTerm
        );

        const recommendation = {
            memberId,
            recommendedAmount: Math.round(recommendedAmount),
            maxLoanAmount: Math.round(maxLoanAmount),
            recommendedTerm, // months
            recommendedRate, // percentage
            monthlyPayment: Math.round(monthlyPayment),
            confidence: this.calculateRecommendationConfidence(memberId),
            rationale: this.generateLoanRationale(member, risk, totalSavings),
            alternatives: this.generateAlternativeTerms(recommendedAmount, recommendedRate),
            timestamp: Date.now()
        };

        this.loanRecommendationCache.set(memberId, recommendation);
        return recommendation;
    }

    /**
     * Calculate optimal interest rate
     */
    calculateOptimalRate(riskAssessment) {
        const baseRate = 2.0; // Base rate 2%
        return baseRate + riskAssessment.recommendation.interestRateAdjustment;
    }

    /**
     * Calculate optimal loan term
     */
    async calculateOptimalTerm(memberId, loanAmount) {
        const income = await this.estimateMemberIncome(memberId);
        const savingsPattern = await this.getMemberSavings(memberId);

        // Monthly payment should not exceed 20% of income
        const maxMonthlyPayment = income * 0.2;

        // Based on monthly payment capacity, determine term
        if (maxMonthlyPayment === 0) return 12; // Default 12 months

        const rateAsDecimal = 0.02; // Using 2% base rate
        const monthlyRate = rateAsDecimal / 12;

        // Formula: Term = -log(1 - (Principal * Rate) / Payment) / log(1 + Rate)
        // Simplified: Higher savings = shorter term, lower savings = longer term
        const avgSavings = savingsPattern.length > 0 ? 
            savingsPattern.reduce((sum, s) => sum + (s.amount || 0), 0) / savingsPattern.length : 
            0;

        let term = 12;
        if (avgSavings > 500000) term = 6;
        else if (avgSavings > 100000) term = 9;
        else if (avgSavings > 50000) term = 12;
        else term = 24;

        return Math.min(60, Math.max(3, term)); // Between 3-60 months
    }

    /**
     * Calculate monthly payment
     */
    calculateMonthlyPayment(principal, annualRate, termMonths) {
        const monthlyRate = annualRate / 100 / 12;
        
        if (monthlyRate === 0) {
            return principal / termMonths;
        }

        const numerator = monthlyRate * Math.pow(1 + monthlyRate, termMonths);
        const denominator = Math.pow(1 + monthlyRate, termMonths) - 1;
        
        return principal * (numerator / denominator);
    }

    /**
     * Calculate recommendation confidence (0-1)
     */
    calculateRecommendationConfidence(memberId) {
        const member = this.getMemberData(memberId);
        const loans = this.getMemberLoans(memberId);
        const savings = this.getMemberSavings(memberId);

        let confidence = 0.5; // Start at 50%

        // Add confidence based on data availability
        if (loans.length > 3) confidence += 0.2;
        if (savings.length > 6) confidence += 0.15;
        if (this.getRecentActivityCount(memberId, 30) > 0) confidence += 0.15;

        return Math.min(0.99, confidence);
    }

    /**
     * Generate loan rationale
     */
    generateLoanRationale(member, risk, totalSavings) {
        const reasons = [];

        if (totalSavings > 500000) {
            reasons.push(`Strong savings base of ${this.formatCurrency(totalSavings)}`);
        }
        
        if (risk.riskLevel === 'LOW') {
            reasons.push('Excellent repayment history');
        }

        if (risk.factors.positive.length > 0) {
            reasons.push(risk.factors.positive[0]);
        }

        if (risk.factors.negative.length > 0) {
            reasons.push(`Caution: ${risk.factors.negative[0]}`);
        }

        return reasons;
    }

    /**
     * Generate alternative term options
     */
    generateAlternativeTerms(amount, rate) {
        const alternatives = [];
        const terms = [3, 6, 9, 12, 18, 24];

        terms.forEach(term => {
            alternatives.push({
                term,
                monthlyPayment: Math.round(this.calculateMonthlyPayment(amount, rate, term)),
                totalRepayment: Math.round(this.calculateMonthlyPayment(amount, rate, term) * term)
            });
        });

        return alternatives;
    }

    /**
     * Predict default probability
     */
    async predictDefaultProbability(loanId) {
        const loan = await this.getLoanData(loanId);
        if (!loan) return null;

        const member = await this.getMemberData(loan.memberId);
        const risk = await this.assessMemberRisk(loan.memberId);

        // Factors affecting default probability
        const factors = {
            riskScore: risk.riskScore / 10, // 0-1
            loanAmountRatio: loan.amount / (member.totalSavings || 1000), // Higher ratio = higher risk
            loanAge: (Date.now() - new Date(loan.loanDate).getTime()) / (30 * 24 * 60 * 60 * 1000), // Days
            paymentsMissed: await this.countMissedPayments(loanId),
            daysOverdue: await this.calculateMaxDaysOverdue(loanId)
        };

        // Calculate weighted probability
        let probability = 0;
        probability += factors.riskScore * 0.3;
        probability += Math.min(1, factors.loanAmountRatio / 5) * 0.2;
        probability += Math.min(1, factors.paymentsMissed / 3) * 0.3;
        probability += Math.min(1, factors.daysOverdue / 90) * 0.2;

        return {
            loanId,
            defaultProbability: Math.min(1, probability),
            riskLevel: probability > 0.7 ? 'HIGH' : probability > 0.4 ? 'MEDIUM' : 'LOW',
            factors,
            alert: probability > this.config.defaultProbabilityThreshold
        };
    }

    /**
     * Generate predictive alerts
     */
    async generatePredictiveAlerts() {
        this.alerts = [];
        const loans = await this.getAllLoans();

        for (const loan of loans) {
            const prediction = await this.predictDefaultProbability(loan.id);
            
            if (prediction && prediction.alert) {
                this.alerts.push({
                    loanId: loan.id,
                    memberId: loan.memberId,
                    type: 'default-risk',
                    severity: prediction.riskLevel,
                    probability: prediction.defaultProbability,
                    message: this.generateAlertMessage(loan, prediction),
                    timestamp: Date.now(),
                    action: this.generateAlertAction(loan, prediction)
                });
            }
        }

        return this.alerts;
    }

    /**
     * Generate alert message
     */
    generateAlertMessage(loan, prediction) {
        const member = this.getMemberData(loan.memberId);
        const probability = Math.round(prediction.defaultProbability * 100);

        return `${member.name}'s Loan #${loan.id} has ${probability}% default risk. ` +
               `Recent payment delays detected.`;
    }

    /**
     * Generate recommended action
     */
    generateAlertAction(loan, prediction) {
        if (prediction.defaultProbability > 0.8) {
            return 'Contact member immediately - Propose restructuring';
        } else if (prediction.defaultProbability > 0.6) {
            return 'Schedule follow-up call - Discuss payment plan';
        } else {
            return 'Monitor closely - Flag for next review';
        }
    }

    // ===== HELPER METHODS =====

    calculateDaysLate(payment) {
        // Returns days late (0 if on time)
        const dueDate = new Date(payment.dueDate);
        const paymentDate = new Date(payment.paymentDate);
        const daysLate = (paymentDate - dueDate) / (1000 * 60 * 60 * 24);
        return Math.max(0, daysLate);
    }

    calculateConsistency(items) {
        // Returns 0-1, higher = more consistent
        if (items.length < 2) return 0.5;
        
        const amounts = items.map(i => i.amount || 0);
        const mean = amounts.reduce((a, b) => a + b) / amounts.length;
        const variance = amounts.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        
        // Lower std dev = higher consistency
        return Math.max(0, 1 - (stdDev / (mean || 1)));
    }

    calculateGrowthTrend(items) {
        // Returns growth rate
        if (items.length < 2) return 0;
        
        const sorted = [...items].sort((a, b) => new Date(a.date) - new Date(b.date));
        const first = sorted[0].amount || 0;
        const last = sorted[sorted.length - 1].amount || 0;
        
        return (last - first) / (first || 1);
    }

    calculateAccountAgeDays(member) {
        const joinDate = new Date(member.joinDate || member.dateAdded);
        return (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24);
    }

    async getRecentActivityCount(memberId, days) {
        const loans = await this.getMemberLoans(memberId);
        const now = Date.now();
        
        return loans.filter(loan => {
            const loanDate = new Date(loan.loanDate).getTime();
            return (now - loanDate) < (days * 24 * 60 * 60 * 1000);
        }).length;
    }

    async calculateActiveDebt(memberId) {
        const loans = await this.getMemberLoans(memberId);
        return loans
            .filter(l => l.status === 'active' || l.status === 'overdue')
            .reduce((sum, l) => sum + (l.remainingBalance || 0), 0);
    }

    async estimateMemberIncome(memberId) {
        // Estimate based on savings pattern
        const savings = await this.getMemberSavings(memberId);
        if (savings.length === 0) return 100000; // Default estimate
        
        const avgMonthly = savings.reduce((sum, s) => sum + (s.amount || 0), 0) / 
                          (Math.max(1, savings.length));
        
        return avgMonthly * 12; // Assume savings = 10% of income (rough)
    }

    async countMissedPayments(loanId) {
        const payments = await this.getLoanPayments(loanId);
        return payments.filter(p => {
            const daysLate = this.calculateDaysLate(p);
            return daysLate > 7;
        }).length;
    }

    async calculateMaxDaysOverdue(loanId) {
        const payments = await this.getLoanPayments(loanId);
        let maxDaysOverdue = 0;
        
        payments.forEach(p => {
            const daysLate = this.calculateDaysLate(p);
            maxDaysOverdue = Math.max(maxDaysOverdue, daysLate);
        });
        
        return maxDaysOverdue;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX'
        }).format(amount);
    }

    // ===== DATA RETRIEVAL METHODS (Using Storage API) =====

    async getMemberData(memberId) {
        // Sync version using cache
        return Storage.getMemberByIdSync(memberId);
    }

    async getMemberLoans(memberId) {
        const loans = await Storage.getLoans();
        return loans.filter(l => l.memberId === memberId);
    }

    async getMemberSavings(memberId) {
        const savings = await Storage.getSavings();
        return savings.filter(s => s.memberId === memberId);
    }

    async getLoanData(loanId) {
        return Storage.getLoanByIdSync(loanId);
    }

    async getLoanPayments(loanId) {
        const payments = await Storage.getPayments();
        return payments.filter(p => p.loanId === loanId);
    }

    async getAllLoans() {
        return await Storage.getLoans();
    }

    async getAllMembers() {
        return await Storage.getMembers();
    }
}

// Initialize global AI engine
const aiEngine = new SACCOAIEngine();
window.aiEngine = aiEngine;

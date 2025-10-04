import React, { useState, useEffect } from "react";

const FinancialIntelligence = ({ expenses }) => {
  const [financialTips, setFinancialTips] = useState([]);
  const [investmentSuggestions, setInvestmentSuggestions] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [financialHealth, setFinancialHealth] = useState({});

  // Calculate financial health metrics
  const calculateFinancialHealth = () => {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthlySpending = totalSpent; // Assuming current month data

    // Mock monthly income for calculations
    const estimatedIncome = 5000; // This would come from user input in real app
    const savingsRate =
      ((estimatedIncome - monthlySpending) / estimatedIncome) * 100;

    const categorySpending = {};
    expenses.forEach((exp) => {
      categorySpending[exp.category] =
        (categorySpending[exp.category] || 0) + exp.amount;
    });

    // Calculate financial ratios
    const housingRatio =
      ((categorySpending["Housing"] || 0) / estimatedIncome) * 100;
    const transportRatio =
      ((categorySpending["Transportation"] || 0) / estimatedIncome) * 100;
    const foodRatio = ((categorySpending["Food"] || 0) / estimatedIncome) * 100;

    // Generate health score
    let healthScore = 100;
    if (savingsRate < 20) healthScore -= 20;
    if (housingRatio > 30) healthScore -= 15;
    if (transportRatio > 15) healthScore -= 10;
    if (foodRatio > 15) healthScore -= 10;

    return {
      savingsRate: Math.max(0, savingsRate),
      housingRatio,
      transportRatio,
      foodRatio,
      healthScore: Math.max(0, healthScore),
      monthlySpending,
      estimatedIncome,
    };
  };

  // Generate personalized financial tips
  const generateFinancialTips = () => {
    const health = calculateFinancialHealth();
    const tips = [];

    // Savings tips
    if (health.savingsRate < 20) {
      tips.push({
        category: "Savings",
        icon: "💰",
        priority: "high",
        title: "Boost Your Savings Rate",
        tip: "Aim to save at least 20% of your income. Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
        action: "Create a savings plan",
      });
    }

    // Category-specific tips
    const categoryTips = {
      Food: {
        icon: "🍽️",
        tips: [
          "Meal prep on Sundays to reduce restaurant visits",
          "Use grocery store apps for coupons and deals",
          "Try cooking at home 5 days per week",
        ],
      },
      Transportation: {
        icon: "🚗",
        tips: [
          "Consider carpooling or public transportation",
          "Combine multiple errands into one trip",
          "Look into bike-sharing for short distances",
        ],
      },
      Entertainment: {
        icon: "🎬",
        tips: [
          "Look for free community events and activities",
          "Share streaming subscriptions with family",
          "Take advantage of happy hour deals",
        ],
      },
      Shopping: {
        icon: "🛍️",
        tips: [
          "Wait 24 hours before making non-essential purchases",
          "Use the envelope method for discretionary spending",
          "Shop with a list to avoid impulse buys",
        ],
      },
    };

    // Add category-specific tips based on highest spending
    const categoryTotals = {};
    expenses.forEach((exp) => {
      categoryTotals[exp.category] =
        (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    topCategories.forEach(([category, amount]) => {
      if (categoryTips[category]) {
        const randomTip =
          categoryTips[category].tips[
            Math.floor(Math.random() * categoryTips[category].tips.length)
          ];
        tips.push({
          category,
          icon: categoryTips[category].icon,
          priority: "medium",
          title: `${category} Optimization`,
          tip: randomTip,
          action: "Set category budget",
        });
      }
    });

    // General financial wellness tips
    tips.push({
      category: "General",
      icon: "📊",
      priority: "low",
      title: "Track Your Progress",
      tip: "Review your expenses weekly to stay on track with your financial goals.",
      action: "Set up weekly review",
    });

    return tips;
  };

  // Generate investment suggestions
  const generateInvestmentSuggestions = () => {
    const health = calculateFinancialHealth();
    const suggestions = [];

    if (health.savingsRate > 15) {
      suggestions.push({
        type: "Emergency Fund",
        icon: "🏦",
        priority: "high",
        title: "Build Emergency Fund",
        description:
          "Start with $1,000, then work towards 3-6 months of expenses",
        amount: Math.min(1000, health.monthlySpending * 3),
        risk: "Low",
        timeframe: "3-6 months",
      });

      suggestions.push({
        type: "Index Funds",
        icon: "📈",
        priority: "medium",
        title: "Low-Cost Index Funds",
        description: "Diversified portfolio with low fees for long-term growth",
        amount: health.monthlySpending * 0.1,
        risk: "Medium",
        timeframe: "5+ years",
      });

      suggestions.push({
        type: "Retirement",
        icon: "🏖️",
        priority: "high",
        title: "401(k) or IRA",
        description: "Take advantage of tax benefits and compound growth",
        amount: health.estimatedIncome * 0.15,
        risk: "Medium",
        timeframe: "20+ years",
      });
    }

    if (health.savingsRate > 25) {
      suggestions.push({
        type: "Real Estate",
        icon: "🏠",
        priority: "medium",
        title: "Real Estate Investment",
        description:
          "Consider REITs for real estate exposure without direct ownership",
        amount: health.monthlySpending * 0.2,
        risk: "Medium-High",
        timeframe: "10+ years",
      });
    }

    return suggestions;
  };

  // Generate savings goals
  const generateSavingsGoals = () => {
    const health = calculateFinancialHealth();
    const goals = [
      {
        title: "Emergency Fund",
        target: health.monthlySpending * 6,
        current: health.monthlySpending * 0.5, // Mock current savings
        priority: "high",
        timeframe: "12 months",
        icon: "🛡️",
      },
      {
        title: "Vacation Fund",
        target: 3000,
        current: 500,
        priority: "medium",
        timeframe: "8 months",
        icon: "✈️",
      },
      {
        title: "New Car",
        target: 25000,
        current: 2000,
        priority: "low",
        timeframe: "24 months",
        icon: "🚗",
      },
    ];

    return goals.map((goal) => ({
      ...goal,
      progress: (goal.current / goal.target) * 100,
      monthlyRequired: (goal.target - goal.current) / parseInt(goal.timeframe),
    }));
  };

  useEffect(() => {
    setFinancialHealth(calculateFinancialHealth());
    setFinancialTips(generateFinancialTips());
    setInvestmentSuggestions(generateInvestmentSuggestions());
    setSavingsGoals(generateSavingsGoals());
  }, [expenses]);

  return (
    <div className="financial-intelligence">
      <h2>💡 Financial Intelligence</h2>

      {/* Financial Health Overview */}
      <div className="feature-card health-overview">
        <h3>📊 Financial Health Overview</h3>
        <div className="health-metrics">
          <div className="metric">
            <span className="metric-label">Savings Rate</span>
            <span
              className={`metric-value ${
                financialHealth.savingsRate > 20 ? "good" : "warning"
              }`}
            >
              {financialHealth.savingsRate?.toFixed(1)}%
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Monthly Spending</span>
            <span className="metric-value">
              ${financialHealth.monthlySpending?.toFixed(0)}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Health Score</span>
            <span
              className={`metric-value ${
                financialHealth.healthScore > 80
                  ? "good"
                  : financialHealth.healthScore > 60
                  ? "warning"
                  : "alert"
              }`}
            >
              {financialHealth.healthScore?.toFixed(0)}/100
            </span>
          </div>
        </div>
      </div>

      {/* Personalized Financial Tips */}
      <div className="feature-card financial-tips">
        <h3>💰 Personalized Tips</h3>
        <div className="tips-list">
          {financialTips.map((tip, index) => (
            <div key={index} className={`tip ${tip.priority}`}>
              <div className="tip-header">
                <span className="tip-icon">{tip.icon}</span>
                <div className="tip-title">
                  <strong>{tip.title}</strong>
                  <span className={`priority-badge ${tip.priority}`}>
                    {tip.priority.toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="tip-content">{tip.tip}</p>
              <button className="tip-action">{tip.action}</button>
            </div>
          ))}
        </div>
      </div>

      {/* Investment Suggestions */}
      <div className="feature-card investment-suggestions">
        <h3>📈 Investment Opportunities</h3>
        <div className="investments-grid">
          {investmentSuggestions.map((investment, index) => (
            <div key={index} className="investment-card">
              <div className="investment-header">
                <span className="investment-icon">{investment.icon}</span>
                <div className="investment-info">
                  <strong>{investment.title}</strong>
                  <span
                    className={`risk-level ${investment.risk
                      .toLowerCase()
                      .replace("-", "")}`}
                  >
                    {investment.risk} Risk
                  </span>
                </div>
              </div>
              <p className="investment-description">{investment.description}</p>
              <div className="investment-details">
                <div className="detail">
                  <span>Suggested Amount:</span>
                  <span>${investment.amount.toFixed(0)}</span>
                </div>
                <div className="detail">
                  <span>Time Horizon:</span>
                  <span>{investment.timeframe}</span>
                </div>
              </div>
              <button className="investment-action">Learn More</button>
            </div>
          ))}
        </div>
      </div>

      {/* Savings Goals */}
      <div className="feature-card savings-goals">
        <h3>🎯 Savings Goals</h3>
        <div className="goals-list">
          {savingsGoals.map((goal, index) => (
            <div key={index} className="goal-item">
              <div className="goal-header">
                <span className="goal-icon">{goal.icon}</span>
                <div className="goal-info">
                  <strong>{goal.title}</strong>
                  <span className="goal-timeframe">{goal.timeframe}</span>
                </div>
                <span className={`goal-priority ${goal.priority}`}>
                  {goal.priority.toUpperCase()}
                </span>
              </div>
              <div className="goal-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(100, goal.progress)}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  ${goal.current.toFixed(0)} / ${goal.target.toFixed(0)}(
                  {goal.progress.toFixed(1)}%)
                </div>
              </div>
              <div className="goal-action">
                <span>Monthly needed: ${goal.monthlyRequired.toFixed(0)}</span>
                <button className="adjust-goal-btn">Adjust Goal</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Education */}
      <div className="feature-card financial-education">
        <h3>📚 Financial Education</h3>
        <div className="education-topics">
          <div className="topic">
            <h4>🏦 Emergency Fund Basics</h4>
            <p>
              Learn why you need 3-6 months of expenses saved for emergencies.
            </p>
            <button className="learn-btn">Read Guide</button>
          </div>
          <div className="topic">
            <h4>📊 Investment Fundamentals</h4>
            <p>Understand the basics of stocks, bonds, and diversification.</p>
            <button className="learn-btn">Watch Video</button>
          </div>
          <div className="topic">
            <h4>💳 Credit Score Improvement</h4>
            <p>Tips to build and maintain a healthy credit score.</p>
            <button className="learn-btn">Get Tips</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialIntelligence;

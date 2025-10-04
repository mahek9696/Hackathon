import React, { useState, useEffect } from "react";

const SmartFeatures = ({ expenses, onAddExpense }) => {
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [autoCategories, setAutoCategories] = useState({});
  const [receiptText, setReceiptText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Smart categorization suggestions
  const generateCategorySuggestions = (description) => {
    const keywords = {
      Food: [
        "restaurant",
        "food",
        "lunch",
        "dinner",
        "coffee",
        "pizza",
        "burger",
        "grocery",
      ],
      Transportation: [
        "uber",
        "taxi",
        "gas",
        "fuel",
        "parking",
        "metro",
        "bus",
        "train",
      ],
      Shopping: [
        "amazon",
        "store",
        "mall",
        "clothes",
        "shirt",
        "shoes",
        "electronics",
      ],
      Entertainment: [
        "movie",
        "cinema",
        "game",
        "music",
        "concert",
        "theater",
        "netflix",
      ],
      Healthcare: [
        "doctor",
        "medicine",
        "pharmacy",
        "hospital",
        "dentist",
        "clinic",
      ],
      Utilities: ["electricity", "water", "internet", "phone", "cable", "wifi"],
      Education: [
        "book",
        "course",
        "school",
        "university",
        "tuition",
        "learning",
      ],
    };

    const desc = description.toLowerCase();
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some((word) => desc.includes(word))) {
        return category;
      }
    }
    return "Other";
  };

  // Mock OCR Receipt Processing
  const processReceipt = async () => {
    setIsProcessing(true);

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock parsed receipt data
    const mockReceiptData = [
      { description: "Coffee Latte", amount: 4.5, category: "Food" },
      { description: "Blueberry Muffin", amount: 2.75, category: "Food" },
      { description: "Parking Fee", amount: 3.0, category: "Transportation" },
    ];

    setIsProcessing(false);
    return mockReceiptData;
  };

  // Detect recurring expenses
  const detectRecurringExpenses = () => {
    const recurring = [];
    const expenseGroups = {};

    expenses.forEach((expense) => {
      const key = expense.description.toLowerCase().trim();
      if (!expenseGroups[key]) {
        expenseGroups[key] = [];
      }
      expenseGroups[key].push(expense);
    });

    Object.entries(expenseGroups).forEach(([description, expenseList]) => {
      if (expenseList.length >= 2) {
        // Check if expenses are roughly regular
        const amounts = expenseList.map((e) => e.amount);
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const isConsistentAmount = amounts.every(
          (amount) => Math.abs(amount - avgAmount) / avgAmount < 0.1
        );

        if (isConsistentAmount) {
          recurring.push({
            description,
            frequency: expenseList.length,
            avgAmount: avgAmount,
            lastDate: Math.max(...expenseList.map((e) => new Date(e.date))),
          });
        }
      }
    });

    return recurring;
  };

  // Generate smart suggestions
  const generateSmartSuggestions = () => {
    const suggestions = [];
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Budget suggestions
    if (totalSpent > 0) {
      const categoryTotals = {};
      expenses.forEach((exp) => {
        categoryTotals[exp.category] =
          (categoryTotals[exp.category] || 0) + exp.amount;
      });

      const topCategory = Object.entries(categoryTotals).sort(
        ([, a], [, b]) => b - a
      )[0];

      if (topCategory && topCategory[1] > totalSpent * 0.4) {
        suggestions.push({
          type: "budget",
          icon: "💰",
          title: "Budget Recommendation",
          message: `Consider setting a monthly budget of $${Math.ceil(
            topCategory[1] * 1.1
          )} for ${topCategory[0]}`,
          action: "Set Budget",
        });
      }
    }

    // Savings suggestions
    const recentExpenses = expenses.filter(
      (exp) =>
        new Date(exp.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    if (recentExpenses.length > 0) {
      const weeklyTotal = recentExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );
      const potentialSavings = weeklyTotal * 0.15;

      suggestions.push({
        type: "savings",
        icon: "🎯",
        title: "Savings Opportunity",
        message: `You could save $${potentialSavings.toFixed(
          2
        )} per week by reducing non-essential spending by 15%`,
        action: "View Tips",
      });
    }

    // Recurring expense alerts
    const recurring = detectRecurringExpenses();
    if (recurring.length > 0) {
      suggestions.push({
        type: "recurring",
        icon: "🔄",
        title: "Recurring Expenses Detected",
        message: `Found ${recurring.length} recurring expenses. Set up automatic tracking?`,
        action: "Setup Auto-Track",
      });
    }

    return suggestions;
  };

  // Generate spending alerts
  const generateNotifications = () => {
    const notifications = [];
    const today = new Date();
    const todayExpenses = expenses.filter((exp) => {
      const expDate = new Date(exp.date);
      return expDate.toDateString() === today.toDateString();
    });

    const todayTotal = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    if (todayTotal > 100) {
      notifications.push({
        type: "warning",
        title: "High Daily Spending",
        message: `You've spent $${todayTotal.toFixed(2)} today`,
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    // Weekend spending pattern
    const isWeekend = today.getDay() === 0 || today.getDay() === 6;
    if (isWeekend && todayTotal > 50) {
      notifications.push({
        type: "info",
        title: "Weekend Spending",
        message: "Remember your weekend budget goal!",
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    return notifications;
  };

  useEffect(() => {
    setSmartSuggestions(generateSmartSuggestions());
    setNotifications(generateNotifications());
  }, [expenses]);

  const handleReceiptUpload = async () => {
    const parsedExpenses = await processReceipt();

    // Auto-add parsed expenses with smart categorization
    parsedExpenses.forEach((expense) => {
      const smartCategory = generateCategorySuggestions(expense.description);
      onAddExpense({
        ...expense,
        category: smartCategory,
        userId: "1", // Assuming current user
      });
    });

    setReceiptText("");
  };

  return (
    <div className="smart-features">
      <h2>🤖 Smart Features</h2>

      {/* Receipt OCR Simulation */}
      <div className="feature-card receipt-ocr">
        <h3>📷 Smart Receipt Scanner</h3>
        <div className="receipt-scanner">
          <textarea
            placeholder="Paste receipt text here or click 'Simulate Receipt Scan' to demo AI parsing..."
            value={receiptText}
            onChange={(e) => setReceiptText(e.target.value)}
            rows={4}
          />
          <div className="scanner-actions">
            <button
              onClick={handleReceiptUpload}
              disabled={isProcessing}
              className="scan-btn"
            >
              {isProcessing ? "🔄 Processing..." : "🎯 Simulate Receipt Scan"}
            </button>
          </div>
        </div>
      </div>

      {/* Smart Suggestions */}
      <div className="feature-card suggestions">
        <h3>💡 Smart Suggestions</h3>
        <div className="suggestions-list">
          {smartSuggestions.length > 0 ? (
            smartSuggestions.map((suggestion, index) => (
              <div key={index} className={`suggestion ${suggestion.type}`}>
                <div className="suggestion-content">
                  <span className="suggestion-icon">{suggestion.icon}</span>
                  <div className="suggestion-text">
                    <strong>{suggestion.title}</strong>
                    <p>{suggestion.message}</p>
                  </div>
                  <button className="suggestion-action">
                    {suggestion.action}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>Add more expenses to get personalized suggestions!</p>
          )}
        </div>
      </div>

      {/* Smart Notifications */}
      <div className="feature-card notifications">
        <h3>🔔 Smart Alerts</h3>
        <div className="notifications-list">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <div key={index} className={`notification ${notification.type}`}>
                <div className="notification-content">
                  <div className="notification-header">
                    <strong>{notification.title}</strong>
                    <span className="timestamp">{notification.timestamp}</span>
                  </div>
                  <p>{notification.message}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="notification success">
              <div className="notification-content">
                <div className="notification-header">
                  <strong>All Good! ✅</strong>
                  <span className="timestamp">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <p>Your spending is on track today.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auto-Categorization Display */}
      <div className="feature-card auto-categorization">
        <h3>🎯 Smart Categorization</h3>
        <div className="category-demo">
          <p>Our AI automatically categorizes your expenses:</p>
          <div className="category-examples">
            <div className="category-example">
              <span className="example-text">"Starbucks Coffee"</span>
              <span className="example-arrow">→</span>
              <span className="example-category food">Food</span>
            </div>
            <div className="category-example">
              <span className="example-text">"Uber ride downtown"</span>
              <span className="example-arrow">→</span>
              <span className="example-category transport">Transportation</span>
            </div>
            <div className="category-example">
              <span className="example-text">"Netflix subscription"</span>
              <span className="example-arrow">→</span>
              <span className="example-category entertainment">
                Entertainment
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recurring Expenses Detection */}
      <div className="feature-card recurring-detection">
        <h3>🔄 Recurring Expenses</h3>
        <div className="recurring-list">
          {detectRecurringExpenses().length > 0 ? (
            detectRecurringExpenses().map((recurring, index) => (
              <div key={index} className="recurring-item">
                <div className="recurring-info">
                  <strong>{recurring.description}</strong>
                  <span className="recurring-stats">
                    ${recurring.avgAmount.toFixed(2)} • {recurring.frequency}{" "}
                    times
                  </span>
                </div>
                <button className="setup-auto-btn">Setup Auto-Track</button>
              </div>
            ))
          ) : (
            <p>
              No recurring expenses detected yet. Add more data to see patterns!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartFeatures;

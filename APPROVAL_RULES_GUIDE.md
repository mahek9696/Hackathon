# 📋 Expense Approval Rules - Category & Role-Based System

## How the Approval System Works

### **Rule Matching Logic**

The system uses the `ApprovalRule.findApplicableRule()` method to find the best matching rule for each expense:

```javascript
// From ApprovalRule model
approvalRuleSchema.statics.findApplicableRule = function (expense, employee) {
  return this.findOne({
    company: expense.company,
    isActive: true,
    "conditions.amountRange.min": { $lte: expense.convertedAmount },
    "conditions.amountRange.max": { $gte: expense.convertedAmount },
    $or: [
      { "conditions.categories": { $size: 0 } },      // Empty = all categories
      { "conditions.categories": expense.category },   // Specific category match
    ],
    $or: [
      { "conditions.employeeRoles": { $size: 0 } },   // Empty = all roles
      { "conditions.employeeRoles": employee.role },  // Specific role match
    ],
  }).sort({ priority: -1 });  // Highest priority first
};
```

---

## **Current Default Rules** (Applied to All Categories)

### 🟢 **Rule 1: Small Expenses Auto-Approval**
- **Amount**: $0 - $50
- **Roles**: `employee`
- **Categories**: **All** (empty array)
- **Workflow**: ✅ **Auto-approved**
- **Priority**: 1

### 🟡 **Rule 2: Manager Approval Required**
- **Amount**: $50 - $500
- **Roles**: `employee`
- **Categories**: **All** (empty array)
- **Workflow**: Manager → Approved
- **Priority**: 2

### 🔴 **Rule 3: High Value Expenses**
- **Amount**: $500+
- **Roles**: `employee`, `manager`
- **Categories**: **All** (empty array)
- **Workflow**: Manager → Admin → Approved
- **Priority**: 3

---

## **Category-Specific Rules Examples**

### 🎯 **Possible Category-Based Rules**

#### **Travel & Transportation Rules**
```javascript
{
  name: "Travel Expenses Special Rule",
  conditions: {
    amountRange: { min: 200, max: Infinity },
    categories: ["Travel", "Transportation", "Accommodation"],
    employeeRoles: ["employee", "manager"]
  },
  priority: 10,  // Higher than default rules
  approvalFlow: {
    requireManagerApproval: false,  // Skip manager
    steps: [{
      name: "Admin Approval for Travel",
      approverType: "specific_user",
      approvers: [adminId]
    }]
  }
}
```

#### **Office Supplies Auto-Approval**
```javascript
{
  name: "Office Supplies Auto-Approval",
  conditions: {
    amountRange: { min: 0, max: 100 },
    categories: ["Office Supplies", "Software"],
    employeeRoles: ["employee"]
  },
  priority: 8,
  autoApprovalRules: {
    enabled: true,
    conditions: { maxAmount: 100 }
  }
}
```

#### **Entertainment Strict Control**
```javascript
{
  name: "Entertainment Strict Approval",
  conditions: {
    amountRange: { min: 0, max: Infinity },
    categories: ["Entertainment", "Meals"],
    employeeRoles: ["employee"]
  },
  priority: 9,
  approvalFlow: {
    requireManagerApproval: true,    // Manager first
    steps: [{
      name: "Admin Review for Entertainment",
      approverType: "specific_user",
      approvers: [adminId]            // Then admin
    }]
  }
}
```

---

## **Priority System**

### **How Priority Works:**
1. **Higher number = Higher priority**
2. **First matching rule wins**
3. **System sorts by priority descending**

### **Example Priority Hierarchy:**
```
Priority 10: Travel-specific rules        (Most specific)
Priority 9:  Entertainment-specific rules
Priority 8:  Office supplies rules
Priority 3:  High value general rule
Priority 2:  Manager approval general rule
Priority 1:  Auto-approval general rule   (Fallback)
```

---

## **Real-World Scenarios**

### **Scenario 1: $75 Travel Expense**
- **Matches**: Travel rule (Priority 10) vs Manager rule (Priority 2)
- **Result**: Travel rule wins → Direct admin approval

### **Scenario 2: $30 Office Supplies**
- **Matches**: Office supplies rule (Priority 8) vs Auto-approval rule (Priority 1)
- **Result**: Office supplies rule wins → Auto-approved

### **Scenario 3: $200 Entertainment**
- **Matches**: Entertainment rule (Priority 9) vs Manager rule (Priority 2)
- **Result**: Entertainment rule wins → Manager + Admin approval

### **Scenario 4: $40 Healthcare**
- **Matches**: Only Auto-approval rule (Priority 1)
- **Result**: Auto-approved (under $50)

---

## **Role-Based Restrictions**

### **Employee Role**
- Subject to all approval rules
- Cannot approve their own expenses
- Most restrictive workflow

### **Manager Role**
- Can approve employee expenses
- Subject to admin approval for high-value expenses
- Bypass some approval steps for certain categories

### **Admin Role**
- Final approval authority
- Can approve any expense
- Override capabilities

---

## **Auto-Approval Conditions**

Auto-approval happens when **ALL** conditions are met:

### **Amount Check**
```javascript
expense.convertedAmount <= rule.autoApprovalRules.conditions.maxAmount
```

### **Category Check**
```javascript
// If categories specified, expense must match
if (rule.autoApprovalRules.conditions.categories.length > 0) {
  return rule.autoApprovalRules.conditions.categories.includes(expense.category);
}
```

### **Trusted Employee Check**
```javascript
// If trusted employees specified, submitter must be in list
if (rule.autoApprovalRules.conditions.trustedEmployees.length > 0) {
  return rule.autoApprovalRules.conditions.trustedEmployees.includes(employee._id);
}
```

---

## **Advanced Features**

### **Conditional Approval Types**
- **Sequential**: One approver after another
- **Parallel**: Multiple approvers simultaneously  
- **Conditional**: Based on percentage/hybrid rules

### **Escalation System**
- **Timeout**: Auto-escalate after specified hours
- **Escalation Target**: Specific user to escalate to
- **Notifications**: Automated reminders

### **Statistics Tracking**
- Times rule used
- Average approval time
- Approval success rate

---

## **API Integration**

### **Rule Application in Expense Submission**
```javascript
// In expenseControllerV2.js
const applicableRule = await ApprovalRule.findApplicableRule(expense, employee);

if (applicableRule) {
  if (applicableRule.canAutoApprove(expense, employee)) {
    expense.status = "approved";
  } else {
    expense.approvalWorkflow = applicableRule.generateWorkflow(expense, employee);
    expense.status = "pending";
  }
}
```

### **Workflow Generation**
```javascript
// Generates step-by-step approval process
approvalRuleSchema.methods.generateWorkflow = function (expense, employee) {
  const workflow = {
    currentStep: 0,
    totalSteps: 0,
    steps: []
  };
  
  // Add manager approval if required
  if (this.approvalFlow.requireManagerApproval && employee.manager) {
    workflow.steps.push({
      approverType: "manager",
      approver: employee.manager,
      status: "pending"
    });
  }
  
  // Add additional approval steps
  this.approvalFlow.steps.forEach(step => {
    workflow.steps.push({
      approverType: step.approverType,
      approver: step.approvers[0],
      status: "pending"
    });
  });
  
  return workflow;
};
```

---

## **Testing the System**

You can test different scenarios by submitting expenses with:
1. **Different amounts** (to trigger amount-based rules)
2. **Different categories** (to trigger category-specific rules) 
3. **Different user roles** (to see role-based restrictions)

The system will automatically select the most appropriate approval rule based on priority and matching conditions.
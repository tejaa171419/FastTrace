import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({ 
  precision: 20, 
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9,
  toExpPos: 21
});

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ExpenseData {
  title: string;
  amount: number;
  category: string;
  splitType: string;
  selectedMembers: string[];
  excludedMembers?: string[];
  multiplePayers: boolean;
  payers?: Array<{ memberId: string; amount: number }>;
  splits?: Array<{
    memberId: string;
    amount: number;
    percentage?: number;
    customAmount?: number;
    shares?: number;
    weight?: number;
    adjustmentAmount?: number;
    adjustmentReason?: string;
  }>;
}

export interface Member {
  id: string;
  name: string;
  income?: number;
  weight?: number;
}

export class ExpenseValidationService {
  private static readonly MAX_AMOUNT = 10000000; // 1 crore
  private static readonly MIN_AMOUNT = 0.01;
  private static readonly MAX_TITLE_LENGTH = 100;
  private static readonly MIN_TITLE_LENGTH = 2;
  private static readonly PRECISION_TOLERANCE = 0.01;

  /**
   * Validate complete expense data
   */
  static validateExpense(data: ExpenseData, members: Member[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Basic validation
    this.validateBasicFields(data, result);
    
    // Amount validation
    this.validateAmount(data.amount, result);
    
    // Member selection validation
    this.validateMemberSelection(data, members, result);
    
    // Multiple payers validation
    if (data.multiplePayers) {
      this.validateMultiplePayers(data, result);
    }
    
    // Split validation
    this.validateSplits(data, result);
    
    // Business logic validation
    this.validateBusinessLogic(data, members, result);
    
    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate basic required fields
   */
  private static validateBasicFields(data: ExpenseData, result: ValidationResult): void {
    // Title validation
    if (!data.title || !data.title.trim()) {
      result.errors.push('Expense title is required');
    } else {
      const trimmedTitle = data.title.trim();
      if (trimmedTitle.length < this.MIN_TITLE_LENGTH) {
        result.errors.push(`Title must be at least ${this.MIN_TITLE_LENGTH} characters long`);
      }
      if (trimmedTitle.length > this.MAX_TITLE_LENGTH) {
        result.errors.push(`Title cannot exceed ${this.MAX_TITLE_LENGTH} characters`);
      }
      
      // Title quality suggestions
      if (trimmedTitle.length < 5) {
        result.suggestions.push('Consider adding more detail to the expense title for better tracking');
      }
      
      if (!/[a-zA-Z]/.test(trimmedTitle)) {
        result.warnings.push('Title should contain descriptive text');
      }
    }

    // Category validation
    if (!data.category) {
      result.errors.push('Category is required');
    }

    // Split type validation
    if (!data.splitType) {
      result.errors.push('Split type is required');
    }
  }

  /**
   * Validate expense amount
   */
  private static validateAmount(amount: number, result: ValidationResult): void {
    if (!amount || isNaN(amount)) {
      result.errors.push('Amount is required and must be a valid number');
      return;
    }

    if (amount < this.MIN_AMOUNT) {
      result.errors.push(`Amount must be at least ₹${this.MIN_AMOUNT.toFixed(2)}`);
    }

    if (amount > this.MAX_AMOUNT) {
      result.errors.push(`Amount cannot exceed ₹${this.MAX_AMOUNT.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    }

    // Amount reasonableness checks
    if (amount > 100000) {
      result.warnings.push('This is a large expense. Please verify the amount is correct.');
    }

    if (amount < 10) {
      result.suggestions.push('Consider if this small expense needs to be tracked separately or can be combined with others.');
    }

    // Precision validation
    const decimalPlaces = this.countDecimalPlaces(amount);
    if (decimalPlaces > 2) {
      result.warnings.push('Amount will be rounded to 2 decimal places for calculations');
    }
  }

  /**
   * Validate member selection
   */
  private static validateMemberSelection(data: ExpenseData, members: Member[], result: ValidationResult): void {
    if (!data.selectedMembers || data.selectedMembers.length === 0) {
      result.errors.push('At least one member must be selected to split the expense');
      return;
    }

    // Check if all selected members exist
    const memberIds = members.map(m => m.id);
    const invalidMembers = data.selectedMembers.filter(id => !memberIds.includes(id));
    if (invalidMembers.length > 0) {
      result.errors.push('Some selected members are not valid group members');
    }

    // Excluded members validation
    if (data.excludedMembers && data.excludedMembers.length > 0) {
      if (data.excludedMembers.length >= data.selectedMembers.length) {
        result.errors.push('Cannot exclude all selected members');
      }
      
      const invalidExcluded = data.excludedMembers.filter(id => !memberIds.includes(id));
      if (invalidExcluded.length > 0) {
        result.errors.push('Some excluded members are not valid group members');
      }
    }

    // Single member warning
    if (data.selectedMembers.length === 1) {
      result.warnings.push('Only one member selected. Consider if this should be a personal expense instead.');
    }

    // Large group warning
    if (data.selectedMembers.length > 20) {
      result.warnings.push('Large number of members selected. This might make expense management complex.');
    }
  }

  /**
   * Validate multiple payers
   */
  private static validateMultiplePayers(data: ExpenseData, result: ValidationResult): void {
    if (!data.payers || data.payers.length === 0) {
      result.errors.push('At least one payer is required when multiple payers option is enabled');
      return;
    }

    const totalPaid = data.payers.reduce((sum, payer) => sum + (payer.amount || 0), 0);
    const difference = Math.abs(data.amount - totalPaid);

    if (difference > this.PRECISION_TOLERANCE) {
      result.errors.push(
        `Total paid amounts (₹${totalPaid.toFixed(2)}) must equal expense amount (₹${data.amount.toFixed(2)})`
      );
    }

    // Check for duplicate payers
    const payerIds = data.payers.map(p => p.memberId);
    const uniquePayerIds = new Set(payerIds);
    if (payerIds.length !== uniquePayerIds.size) {
      result.errors.push('Each member can only be added as a payer once');
    }

    // Individual payer validation
    data.payers.forEach((payer, index) => {
      if (!payer.memberId) {
        result.errors.push(`Payer ${index + 1} must have a valid member selected`);
      }
      
      if (!payer.amount || payer.amount <= 0) {
        result.errors.push(`Payer ${index + 1} must have a valid amount greater than 0`);
      }
      
      if (payer.amount > data.amount) {
        result.warnings.push(`Payer ${index + 1} is paying more than the total expense amount`);
      }
    });
  }

  /**
   * Validate splits based on split type
   */
  private static validateSplits(data: ExpenseData, result: ValidationResult): void {
    if (!data.splits || data.splits.length === 0) {
      return; // Will be calculated automatically
    }

    const totalAmount = new Decimal(data.amount);

    switch (data.splitType) {
      case 'equal':
        this.validateEqualSplit(data, totalAmount, result);
        break;
        
      case 'percentage':
        this.validatePercentageSplit(data, result);
        break;
        
      case 'custom':
      case 'unequal':
        this.validateCustomSplit(data, totalAmount, result);
        break;
        
      case 'shares':
        this.validateSharesSplit(data, result);
        break;
        
      case 'weighted':
        this.validateWeightedSplit(data, result);
        break;
        
      case 'income-proportional':
      case 'income-progressive':
        this.validateIncomeSplit(data, result);
        break;
        
      case 'adjustment':
        this.validateAdjustmentSplit(data, totalAmount, result);
        break;
    }
  }

  private static validateEqualSplit(data: ExpenseData, totalAmount: Decimal, result: ValidationResult): void {
    const expectedAmount = totalAmount.div(data.selectedMembers.length);
    const calculatedTotal = data.splits!.reduce((sum, split) => sum + split.amount, 0);
    const difference = Math.abs(totalAmount.toNumber() - calculatedTotal);
    
    if (difference > this.PRECISION_TOLERANCE) {
      result.warnings.push('Equal split calculation may have rounding differences');
    }
  }

  private static validatePercentageSplit(data: ExpenseData, result: ValidationResult): void {
    const totalPercentage = data.splits!.reduce((sum, split) => sum + (split.percentage || 0), 0);
    const difference = Math.abs(100 - totalPercentage);
    
    if (difference > this.PRECISION_TOLERANCE) {
      result.errors.push(`Split percentages must add up to 100%. Current total: ${totalPercentage.toFixed(1)}%`);
    }
    
    // Individual percentage validation
    data.splits!.forEach((split, index) => {
      if (!split.percentage || split.percentage < 0) {
        result.errors.push(`Member ${index + 1} must have a valid percentage (0-100%)`);
      }
      if (split.percentage && split.percentage > 100) {
        result.errors.push(`Member ${index + 1} percentage cannot exceed 100%`);
      }
    });
  }

  private static validateCustomSplit(data: ExpenseData, totalAmount: Decimal, result: ValidationResult): void {
    const calculatedTotal = data.splits!.reduce((sum, split) => sum + (split.customAmount || split.amount || 0), 0);
    const difference = Math.abs(totalAmount.toNumber() - calculatedTotal);
    
    if (difference > this.PRECISION_TOLERANCE) {
      result.errors.push(
        `Custom split amounts (₹${calculatedTotal.toFixed(2)}) must equal expense total (₹${totalAmount.toFixed(2)})`
      );
    }
    
    // Individual amount validation
    data.splits!.forEach((split, index) => {
      const amount = split.customAmount || split.amount || 0;
      if (amount < 0) {
        result.errors.push(`Member ${index + 1} cannot have a negative amount`);
      }
      if (amount > totalAmount.toNumber()) {
        result.warnings.push(`Member ${index + 1} is assigned more than the total expense amount`);
      }
    });
  }

  private static validateSharesSplit(data: ExpenseData, result: ValidationResult): void {
    data.splits!.forEach((split, index) => {
      if (!split.shares || split.shares <= 0) {
        result.errors.push(`Member ${index + 1} must have valid shares greater than 0`);
      }
      if (split.shares && split.shares > 1000) {
        result.warnings.push(`Member ${index + 1} has unusually high number of shares`);
      }
    });
  }

  private static validateWeightedSplit(data: ExpenseData, result: ValidationResult): void {
    data.splits!.forEach((split, index) => {
      if (!split.weight || split.weight <= 0) {
        result.errors.push(`Member ${index + 1} must have valid weight greater than 0`);
      }
      if (split.weight && split.weight > 100) {
        result.warnings.push(`Member ${index + 1} has unusually high weight value`);
      }
    });
  }

  private static validateIncomeSplit(data: ExpenseData, result: ValidationResult): void {
    const membersWithoutIncome = data.splits!.filter(split => !split.amount || split.amount <= 0);
    if (membersWithoutIncome.length > 0) {
      result.errors.push('All members must have valid income data for income-based splitting');
    }
  }

  private static validateAdjustmentSplit(data: ExpenseData, totalAmount: Decimal, result: ValidationResult): void {
    const baseAmount = totalAmount.div(data.selectedMembers.length);
    let adjustedTotal = new Decimal(0);
    
    data.splits!.forEach((split, index) => {
      const adjustment = new Decimal(split.adjustmentAmount || 0);
      const finalAmount = baseAmount.plus(adjustment);
      adjustedTotal = adjustedTotal.plus(finalAmount);
      
      if (finalAmount.lessThan(0)) {
        result.errors.push(`Member ${index + 1} adjustment results in negative amount`);
      }
    });
    
    const difference = Math.abs(totalAmount.toNumber() - adjustedTotal.toNumber());
    if (difference > this.PRECISION_TOLERANCE) {
      result.errors.push(`Adjusted amounts must equal expense total. Difference: ₹${difference.toFixed(2)}`);
    }
  }

  /**
   * Validate business logic and provide suggestions
   */
  private static validateBusinessLogic(data: ExpenseData, members: Member[], result: ValidationResult): void {
    // Check for potential edge cases
    if (data.amount > 50000 && data.selectedMembers.length === 1) {
      result.warnings.push('Large expense for single person. Consider verifying this is correct.');
    }
    
    // Split method suggestions
    if (data.splitType === 'equal' && data.selectedMembers.length > 10) {
      result.suggestions.push('For large groups, consider using percentage or weighted splits for more fairness.');
    }
    
    if (data.splitType === 'income-proportional') {
      const membersWithIncome = members.filter(m => data.selectedMembers.includes(m.id) && m.income && m.income > 0);
      if (membersWithIncome.length < data.selectedMembers.length) {
        result.warnings.push('Some members lack income data. They will use equal split as fallback.');
      }
    }
    
    // Category-based suggestions
    if (data.category === 'food' && data.amount > 5000) {
      result.suggestions.push('High food expense. Consider if this includes multiple meals or special occasion.');
    }
    
    if (data.category === 'transportation' && data.selectedMembers.length > 8) {
      result.suggestions.push('Large group for transportation. Verify all members actually used this transport.');
    }
  }

  /**
   * Utility function to count decimal places
   */
  private static countDecimalPlaces(value: number): number {
    if (Math.floor(value) === value) return 0;
    const str = value.toString();
    if (str.indexOf('.') !== -1 && str.indexOf('e-') === -1) {
      return str.split('.')[1].length;
    } else if (str.indexOf('e-') !== -1) {
      const parts = str.split('e-');
      return parseInt(parts[1], 10);
    }
    return 0;
  }

  /**
   * Quick validation for real-time feedback
   */
  static quickValidate(field: string, value: any, context?: any): { isValid: boolean; message?: string } {
    switch (field) {
      case 'title':
        if (!value || !value.trim()) return { isValid: false, message: 'Title is required' };
        if (value.trim().length < this.MIN_TITLE_LENGTH) return { isValid: false, message: 'Title too short' };
        if (value.trim().length > this.MAX_TITLE_LENGTH) return { isValid: false, message: 'Title too long' };
        break;
        
      case 'amount':
        const amount = parseFloat(value);
        if (isNaN(amount)) return { isValid: false, message: 'Invalid amount' };
        if (amount <= 0) return { isValid: false, message: 'Amount must be positive' };
        if (amount > this.MAX_AMOUNT) return { isValid: false, message: 'Amount too large' };
        break;
        
      case 'percentage':
        const percentage = parseFloat(value);
        if (isNaN(percentage)) return { isValid: false, message: 'Invalid percentage' };
        if (percentage < 0 || percentage > 100) return { isValid: false, message: 'Percentage must be 0-100%' };
        break;
    }
    
    return { isValid: true };
  }

  /**
   * Suggest optimal split method based on expense data and members
   */
  static suggestSplitMethod(data: Partial<ExpenseData>, members: Member[]): string[] {
    const suggestions: string[] = [];
    
    if (!data.amount || !data.selectedMembers || data.selectedMembers.length === 0) {
      return ['equal']; // Default fallback
    }
    
    const selectedMembers = members.filter(m => data.selectedMembers!.includes(m.id));
    const membersWithIncome = selectedMembers.filter(m => m.income && m.income > 0);
    const hasIncomeVariation = membersWithIncome.length > 1 && 
      Math.max(...membersWithIncome.map(m => m.income!)) / Math.min(...membersWithIncome.map(m => m.income!)) > 2;
    
    // Equal split - always available
    suggestions.push('equal');
    
    // Income-based suggestions
    if (membersWithIncome.length === selectedMembers.length) {
      suggestions.push('income-proportional');
      if (hasIncomeVariation) {
        suggestions.push('income-progressive');
      }
    }
    
    // Amount-based suggestions
    if (data.amount && data.amount > 1000 && selectedMembers.length <= 5) {
      suggestions.push('custom');
      suggestions.push('percentage');
    }
    
    // Category-based suggestions
    if (data.category === 'food' && selectedMembers.length > 3) {
      suggestions.push('shares'); // Different people might eat different amounts
    }
    
    return suggestions;
  }
}

export default ExpenseValidationService
import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Calculator,
  IndianRupee,
  Users,
  TrendingUp,
  Percent,
  Scale,
  Edit2,
  AlertCircle,
  Check,
  Zap,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({ 
  precision: 20, 
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9,
  toExpPos: 21
});

interface Member {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  income?: number;
  weight?: number;
}

interface SplitResult {
  memberId: string;
  memberName: string;
  amount: number;
  percentage: number;
  shares?: number;
  weight?: number;
  adjustmentAmount?: number;
  adjustmentReason?: string;
}

interface CalculationAudit {
  method: string;
  totalAmount: number;
  memberCount: number;
  calculatedTotal: number;
  difference: number;
  timestamp: Date;
  splits: SplitResult[];
}

interface EnhancedExpenseCalculatorProps {
  amount: number;
  members: Member[];
  onSplitCalculated: (splits: SplitResult[], audit: CalculationAudit) => void;
  defaultMethod?: string;
  currency?: string;
}

const SPLIT_METHODS = [
  { 
    value: 'equal', 
    label: 'Equal Split', 
    icon: Calculator, 
    description: 'Divide equally among all members',
    color: 'text-blue-400'
  },
  { 
    value: 'percentage', 
    label: 'Percentage Split', 
    icon: Percent, 
    description: 'Set custom percentages (must total 100%)',
    color: 'text-purple-400'
  },
  { 
    value: 'custom', 
    label: 'Custom Amounts', 
    icon: Edit2, 
    description: 'Specify exact amounts for each member',
    color: 'text-green-400'
  },
  { 
    value: 'income-proportional', 
    label: 'Income Proportional', 
    icon: TrendingUp, 
    description: 'Split based on income ratios',
    color: 'text-orange-400'
  },
  { 
    value: 'income-progressive', 
    label: 'Income Progressive', 
    icon: TrendingUp, 
    description: 'Progressive split - higher earners pay more',
    color: 'text-red-400'
  },
  { 
    value: 'weighted', 
    label: 'Weighted Split', 
    icon: Scale, 
    description: 'Split based on custom weights',
    color: 'text-cyan-400'
  },
  { 
    value: 'shares', 
    label: 'By Shares', 
    icon: Scale, 
    description: 'Split based on share allocation',
    color: 'text-indigo-400'
  },
  { 
    value: 'adjustment', 
    label: 'With Adjustments', 
    icon: Edit2, 
    description: 'Equal split with custom adjustments',
    color: 'text-yellow-400'
  }
];

const EnhancedExpenseCalculator: React.FC<EnhancedExpenseCalculatorProps> = ({
  amount,
  members,
  onSplitCalculated,
  defaultMethod = 'equal',
  currency = '₹'
}) => {
  const [selectedMethod, setSelectedMethod] = useState(defaultMethod);
  const [splits, setSplits] = useState<SplitResult[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, number>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationHistory, setCalculationHistory] = useState<CalculationAudit[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize splits when members or amount change
  useEffect(() => {
    if (members.length > 0 && amount > 0) {
      calculateSplits();
    }
  }, [members, amount, selectedMethod]);

  // Enhanced split calculation with decimal precision
  const calculateSplits = useCallback(async () => {
    if (members.length === 0 || amount <= 0) {
      setSplits([]);
      return;
    }

    setIsCalculating(true);
    setValidationError(null);

    try {
      const total = new Decimal(amount);
      let newSplits: SplitResult[] = [];
      let auditData: Partial<CalculationAudit> = {
        method: selectedMethod,
        totalAmount: amount,
        memberCount: members.length,
        timestamp: new Date()
      };

      switch (selectedMethod) {
        case 'equal':
          newSplits = await calculateEqualSplit(total, members);
          break;

        case 'percentage':
          newSplits = await calculatePercentageSplit(total, members, customValues);
          break;

        case 'custom':
          newSplits = await calculateCustomSplit(total, members, customValues);
          break;

        case 'income-proportional':
          newSplits = await calculateIncomeProportionalSplit(total, members);
          break;

        case 'income-progressive':
          newSplits = await calculateIncomeProgressiveSplit(total, members);
          break;

        case 'weighted':
          newSplits = await calculateWeightedSplit(total, members, customValues);
          break;

        case 'shares':
          newSplits = await calculateSharesSplit(total, members, customValues);
          break;

        case 'adjustment':
          newSplits = await calculateAdjustmentSplit(total, members, customValues);
          break;

        default:
          newSplits = await calculateEqualSplit(total, members);
      }

      // Validate calculation
      const calculatedTotal = newSplits.reduce((sum, split) => sum + split.amount, 0);
      const difference = Math.abs(amount - calculatedTotal);

      if (difference > 0.01) {
        // Adjust first member's amount to ensure exact total
        if (newSplits.length > 0) {
          const adjustment = amount - calculatedTotal;
          newSplits[0].amount += adjustment;
          newSplits[0].percentage = (newSplits[0].amount / amount) * 100;
        }
      }

      // Create audit record
      const audit: CalculationAudit = {
        ...auditData,
        calculatedTotal: newSplits.reduce((sum, split) => sum + split.amount, 0),
        difference,
        splits: newSplits
      } as CalculationAudit;

      setSplits(newSplits);
      setCalculationHistory(prev => [audit, ...prev.slice(0, 4)]); // Keep last 5 calculations
      onSplitCalculated(newSplits, audit);

      toast.success(`${SPLIT_METHODS.find(m => m.value === selectedMethod)?.label} calculated successfully!`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Calculation failed';
      setValidationError(errorMessage);
      toast.error(`Calculation failed: ${errorMessage}`);
    } finally {
      setIsCalculating(false);
    }
  }, [amount, members, selectedMethod, customValues, onSplitCalculated]);

  // Individual calculation methods
  const calculateEqualSplit = async (total: Decimal, members: Member[]): Promise<SplitResult[]> => {
    const memberCount = members.length;
    const equalAmount = total.div(memberCount);
    
    return members.map((member, index) => {
      let amount = equalAmount;
      
      // Add remainder to first member for exact total
      if (index === 0) {
        const remainder = total.minus(equalAmount.times(memberCount));
        amount = amount.plus(remainder);
      }
      
      return {
        memberId: member.id,
        memberName: member.name,
        amount: amount.toNumber(),
        percentage: amount.div(total).times(100).toNumber()
      };
    });
  };

  const calculatePercentageSplit = async (total: Decimal, members: Member[], percentages: Record<string, number>): Promise<SplitResult[]> => {
    const totalPercentage = members.reduce((sum, member) => 
      sum + (percentages[member.id] || 0), 0
    );

    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(`Percentages must add up to 100%. Current total: ${totalPercentage.toFixed(1)}%`);
    }

    return members.map(member => {
      const percentage = new Decimal(percentages[member.id] || 0);
      const amount = total.times(percentage).div(100);
      
      return {
        memberId: member.id,
        memberName: member.name,
        amount: amount.toNumber(),
        percentage: percentage.toNumber()
      };
    });
  };

  const calculateCustomSplit = async (total: Decimal, members: Member[], customAmounts: Record<string, number>): Promise<SplitResult[]> => {
    const splits = members.map(member => {
      const amount = new Decimal(customAmounts[member.id] || 0);
      return {
        memberId: member.id,
        memberName: member.name,
        amount: amount.toNumber(),
        percentage: amount.div(total).times(100).toNumber()
      };
    });

    const calculatedTotal = splits.reduce((sum, split) => sum + split.amount, 0);
    const difference = Math.abs(total.toNumber() - calculatedTotal);

    if (difference > 0.01) {
      throw new Error(`Custom amounts (${currency}${calculatedTotal.toFixed(2)}) must equal expense total (${currency}${total.toFixed(2)})`);
    }

    return splits;
  };

  const calculateIncomeProportionalSplit = async (total: Decimal, members: Member[]): Promise<SplitResult[]> => {
    const membersWithIncome = members.filter(m => m.income && m.income > 0);
    
    if (membersWithIncome.length === 0) {
      throw new Error('All members must have valid income data for income-based splitting');
    }

    const totalIncome = membersWithIncome.reduce((sum, m) => sum + (m.income || 0), 0);

    return members.map(member => {
      if (!member.income || member.income <= 0) {
        // Fallback to equal split for members without income
        const equalAmount = total.div(members.length);
        return {
          memberId: member.id,
          memberName: member.name,
          amount: equalAmount.toNumber(),
          percentage: equalAmount.div(total).times(100).toNumber()
        };
      }

      const incomeRatio = new Decimal(member.income).div(totalIncome);
      const amount = total.times(incomeRatio);
      
      return {
        memberId: member.id,
        memberName: member.name,
        amount: amount.toNumber(),
        percentage: incomeRatio.times(100).toNumber()
      };
    });
  };

  const calculateIncomeProgressiveSplit = async (total: Decimal, members: Member[]): Promise<SplitResult[]> => {
    const membersWithIncome = members.filter(m => m.income && m.income > 0);
    
    if (membersWithIncome.length === 0) {
      throw new Error('All members must have valid income data for progressive income splitting');
    }

    const sortedMembers = [...membersWithIncome].sort((a, b) => (a.income || 0) - (b.income || 0));
    const avgIncome = sortedMembers.reduce((sum, m) => sum + (m.income || 0), 0) / sortedMembers.length;

    // Calculate progressive multipliers
    const multipliers = sortedMembers.map(member => {
      const incomeRatio = (member.income || 0) / avgIncome;
      return { 
        memberId: member.id, 
        multiplier: Math.pow(incomeRatio, 1.3) // Progressive curve
      };
    });

    const totalMultipliers = multipliers.reduce((sum, m) => sum + m.multiplier, 0);

    return members.map(member => {
      const memberMultiplier = multipliers.find(m => m.memberId === member.id);
      
      if (!memberMultiplier) {
        // Fallback for members without income
        const equalAmount = total.div(members.length);
        return {
          memberId: member.id,
          memberName: member.name,
          amount: equalAmount.toNumber(),
          percentage: equalAmount.div(total).times(100).toNumber()
        };
      }

      const proportion = new Decimal(memberMultiplier.multiplier).div(totalMultipliers);
      const amount = total.times(proportion);

      return {
        memberId: member.id,
        memberName: member.name,
        amount: amount.toNumber(),
        percentage: proportion.times(100).toNumber()
      };
    });
  };

  const calculateWeightedSplit = async (total: Decimal, members: Member[], weights: Record<string, number>): Promise<SplitResult[]> => {
    const totalWeight = members.reduce((sum, member) => 
      sum + (weights[member.id] || member.weight || 1), 0
    );

    return members.map(member => {
      const weight = new Decimal(weights[member.id] || member.weight || 1);
      const proportion = weight.div(totalWeight);
      const amount = total.times(proportion);

      return {
        memberId: member.id,
        memberName: member.name,
        amount: amount.toNumber(),
        percentage: proportion.times(100).toNumber(),
        weight: weight.toNumber()
      };
    });
  };

  const calculateSharesSplit = async (total: Decimal, members: Member[], shares: Record<string, number>): Promise<SplitResult[]> => {
    const totalShares = members.reduce((sum, member) => 
      sum + (shares[member.id] || 1), 0
    );

    return members.map(member => {
      const memberShares = new Decimal(shares[member.id] || 1);
      const proportion = memberShares.div(totalShares);
      const amount = total.times(proportion);

      return {
        memberId: member.id,
        memberName: member.name,
        amount: amount.toNumber(),
        percentage: proportion.times(100).toNumber(),
        shares: memberShares.toNumber()
      };
    });
  };

  const calculateAdjustmentSplit = async (total: Decimal, members: Member[], adjustments: Record<string, number>): Promise<SplitResult[]> => {
    const baseSplit = total.div(members.length);

    return members.map(member => {
      const adjustment = new Decimal(adjustments[member.id] || 0);
      const amount = baseSplit.plus(adjustment);

      return {
        memberId: member.id,
        memberName: member.name,
        amount: amount.toNumber(),
        percentage: amount.div(total).times(100).toNumber(),
        adjustmentAmount: adjustment.toNumber()
      };
    });
  };

  // Update custom value for a member
  const updateCustomValue = (memberId: string, value: number) => {
    setCustomValues(prev => ({
      ...prev,
      [memberId]: value
    }));
  };

  const selectedMethodInfo = SPLIT_METHODS.find(m => m.value === selectedMethod);
  const totalCalculated = splits.reduce((sum, split) => sum + split.amount, 0);
  const calculationDifference = Math.abs(amount - totalCalculated);

  return (
    <Card className="glass-card border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Enhanced Expense Calculator
        </CardTitle>
        <p className="text-white/60">
          Advanced splitting algorithms with financial precision
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Method Selection */}
        <div className="space-y-4">
          <Label className="text-white font-medium">Split Method</Label>
          <Select value={selectedMethod} onValueChange={setSelectedMethod}>
            <SelectTrigger className="bg-white/10 border-white/30 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black/95 border-white/20">
              {SPLIT_METHODS.map(method => {
                const IconComponent = method.icon;
                return (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center gap-2">
                      <IconComponent className={`w-4 h-4 ${method.color}`} />
                      <span>{method.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          {selectedMethodInfo && (
            <div className="bg-white/5 border border-white/20 rounded-lg p-3">
              <p className="text-white/80 text-sm">{selectedMethodInfo.description}</p>
            </div>
          )}
        </div>

        {/* Validation Error */}
        {validationError && (
          <Alert className="border-red-500 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-400">
              {validationError}
            </AlertDescription>
          </Alert>
        )}

        {/* Custom Input Fields */}
        {['percentage', 'custom', 'weighted', 'shares', 'adjustment'].includes(selectedMethod) && (
          <div className="space-y-4">
            <Label className="text-white font-medium">
              {selectedMethod === 'percentage' && 'Percentages (must total 100%)'}
              {selectedMethod === 'custom' && 'Custom Amounts'}
              {selectedMethod === 'weighted' && 'Weights'}
              {selectedMethod === 'shares' && 'Shares'}
              {selectedMethod === 'adjustment' && 'Adjustments'}
            </Label>
            <div className="grid gap-3">
              {members.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="text-xs">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white flex-1">{member.name}</span>
                  <div className="relative">
                    {selectedMethod === 'percentage' && (
                      <div className="flex items-center">
                        <Input
                          type="number"
                          placeholder="0"
                          value={customValues[member.id] || ''}
                          onChange={(e) => updateCustomValue(member.id, parseFloat(e.target.value) || 0)}
                          className="w-20 bg-white/10 border-white/30 text-white text-right"
                          step="0.1"
                          min="0"
                          max="100"
                        />
                        <span className="ml-1 text-white/60">%</span>
                      </div>
                    )}
                    {selectedMethod === 'custom' && (
                      <div className="flex items-center">
                        <span className="text-white/60 mr-1">{currency}</span>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={customValues[member.id] || ''}
                          onChange={(e) => updateCustomValue(member.id, parseFloat(e.target.value) || 0)}
                          className="w-24 bg-white/10 border-white/30 text-white"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    )}
                    {(selectedMethod === 'weighted' || selectedMethod === 'shares') && (
                      <Input
                        type="number"
                        placeholder="1"
                        value={customValues[member.id] || ''}
                        onChange={(e) => updateCustomValue(member.id, parseFloat(e.target.value) || 1)}
                        className="w-20 bg-white/10 border-white/30 text-white text-center"
                        step="1"
                        min="1"
                      />
                    )}
                    {selectedMethod === 'adjustment' && (
                      <div className="flex items-center">
                        <span className="text-white/60 mr-1">{currency}</span>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={customValues[member.id] || ''}
                          onChange={(e) => updateCustomValue(member.id, parseFloat(e.target.value) || 0)}
                          className="w-24 bg-white/10 border-white/30 text-white"
                          step="0.01"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calculate Button */}
        <Button 
          onClick={calculateSplits}
          disabled={isCalculating}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
        >
          {isCalculating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Calculator className="w-4 h-4 mr-2" />
          )}
          {isCalculating ? 'Calculating...' : 'Calculate Split'}
        </Button>

        {/* Results */}
        {splits.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white font-medium">Split Results</Label>
              <Badge 
                variant={calculationDifference <= 0.01 ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                {calculationDifference <= 0.01 ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                {calculationDifference <= 0.01 ? 'Accurate' : `±${currency}${calculationDifference.toFixed(2)}`}
              </Badge>
            </div>

            <div className="space-y-2">
              {splits.map(split => (
                <div key={split.memberId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {split.memberName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white">{split.memberName}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">
                      {currency}{split.amount.toFixed(2)}
                    </div>
                    <div className="text-white/60 text-sm">
                      {split.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-white/10 border border-white/20 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Total Amount:</span>
                  <span className="text-white font-medium">{currency}{amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Calculated Total:</span>
                  <span className="text-white font-medium">{currency}{totalCalculated.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Members:</span>
                  <span className="text-white font-medium">{splits.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Method:</span>
                  <span className="text-white font-medium">{selectedMethodInfo?.label}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedExpenseCalculator;
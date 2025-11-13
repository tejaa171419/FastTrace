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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  RefreshCw,
  Eye,
  Settings,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Target
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

import ExpenseValidationService, { ValidationResult } from '@/lib/services/expenseValidationService';
import EnhancedExpenseCalculator from './EnhancedExpenseCalculator';
import ExpenseCalculationTester from './ExpenseCalculationTester';

interface Member {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  income?: number;
  weight?: number;
  isActive: boolean;
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

interface ExpensePreview {
  totalAmount: number;
  currency: string;
  splitMethod: string;
  splits: SplitResult[];
  validation: ValidationResult;
  audit: CalculationAudit | null;
}

interface ExpenseCalculationDashboardProps {
  members: Member[];
  defaultAmount?: number;
  currency?: string;
  onExpenseCreated?: (expenseData: any) => void;
}

const ExpenseCalculationDashboard: React.FC<ExpenseCalculationDashboardProps> = ({
  members = [],
  defaultAmount = 1000,
  currency = '₹',
  onExpenseCreated
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<string>('calculator');
  const [expenseData, setExpenseData] = useState({
    title: '',
    amount: defaultAmount,
    category: 'food',
    description: '',
    splitType: 'equal',
    selectedMembers: members.filter(m => m.isActive).map(m => m.id),
    excludedMembers: [] as string[],
    multiplePayers: false,
    payers: [] as Array<{ memberId: string; amount: number }>
  });
  
  const [preview, setPreview] = useState<ExpensePreview | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [realTimeValidation, setRealTimeValidation] = useState(true);
  const [calculationHistory, setCalculationHistory] = useState<CalculationAudit[]>([]);

  // Real-time validation
  useEffect(() => {
    if (realTimeValidation && expenseData.amount > 0 && expenseData.selectedMembers.length > 0) {
      validateExpenseData();
    }
  }, [expenseData, realTimeValidation]);

  const validateExpenseData = useCallback(() => {
    try {
      const validationData = {
        title: expenseData.title,
        amount: expenseData.amount,
        category: expenseData.category,
        splitType: expenseData.splitType,
        selectedMembers: expenseData.selectedMembers,
        excludedMembers: expenseData.excludedMembers,
        multiplePayers: expenseData.multiplePayers,
        payers: expenseData.payers
      };

      const validation = ExpenseValidationService.validateExpense(validationData, members);
      
      if (preview) {
        setPreview(prev => prev ? { ...prev, validation } : null);
      } else {
        // Create a basic preview with validation
        setPreview({
          totalAmount: expenseData.amount,
          currency,
          splitMethod: expenseData.splitType,
          splits: [],
          validation,
          audit: null
        });
      }
    } catch (error) {
      // Validation error handled silently
    }
  }, [expenseData, members, preview, currency]);

  // Handle split calculation results
  const handleSplitCalculated = useCallback((splits: SplitResult[], audit: CalculationAudit) => {
    setIsCalculating(false);
    
    const validation = ExpenseValidationService.validateExpense({
      title: expenseData.title,
      amount: expenseData.amount,
      category: expenseData.category,
      splitType: expenseData.splitType,
      selectedMembers: expenseData.selectedMembers,
      excludedMembers: expenseData.excludedMembers,
      multiplePayers: expenseData.multiplePayers,
      payers: expenseData.payers,
      splits: splits.map(split => ({
        memberId: split.memberId,
        amount: split.amount,
        percentage: split.percentage,
        shares: split.shares,
        weight: split.weight,
        adjustmentAmount: split.adjustmentAmount,
        adjustmentReason: split.adjustmentReason
      }))
    }, members);

    const newPreview: ExpensePreview = {
      totalAmount: expenseData.amount,
      currency,
      splitMethod: expenseData.splitType,
      splits,
      validation,
      audit
    };

    setPreview(newPreview);
    setCalculationHistory(prev => [audit, ...prev.slice(0, 9)]); // Keep last 10 calculations
    
    toast.success(`Split calculated successfully using ${audit.method} method`);
  }, [expenseData, members, currency]);

  // Create expense
  const createExpense = useCallback(() => {
    if (!preview || !preview.validation.isValid) {
      toast.error('Please fix validation errors before creating expense');
      return;
    }

    const finalExpenseData = {
      title: expenseData.title,
      description: expenseData.description,
      amount: expenseData.amount,
      currency,
      category: expenseData.category,
      splitType: 'group',
      splitMethod: expenseData.splitType,
      selectedMembers: expenseData.selectedMembers,
      excludedMembers: expenseData.excludedMembers,
      multiplePayers: expenseData.multiplePayers,
      payers: expenseData.payers,
      splits: preview.splits,
      audit: preview.audit,
      timestamp: new Date()
    };

    onExpenseCreated?.(finalExpenseData);
    
    // Reset form
    setExpenseData(prev => ({
      ...prev,
      title: '',
      description: '',
      amount: defaultAmount
    }));
    setPreview(null);
    
    toast.success('Expense created successfully!');
  }, [preview, expenseData, currency, defaultAmount, onExpenseCreated]);

  // Update expense field
  const updateExpenseData = useCallback((field: string, value: any) => {
    setExpenseData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Toggle member selection
  const toggleMember = useCallback((memberId: string) => {
    setExpenseData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(memberId)
        ? prev.selectedMembers.filter(id => id !== memberId)
        : [...prev.selectedMembers, memberId]
    }));
  }, []);

  const selectedMembers = members.filter(m => expenseData.selectedMembers.includes(m.id));
  const totalCalculated = preview?.splits.reduce((sum, split) => sum + split.amount, 0) || 0;
  const calculationDifference = Math.abs(expenseData.amount - totalCalculated);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
          <Zap className="w-10 h-10 text-primary" />
          Enhanced Expense Calculator Dashboard
        </h1>
        <p className="text-white/60 text-lg">
          Advanced expense splitting with real-time validation and comprehensive testing
        </p>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Calculator
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="lg:col-span-2">
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Expense Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Title *</Label>
                      <Input
                        placeholder="Enter expense title"
                        value={expenseData.title}
                        onChange={(e) => updateExpenseData('title', e.target.value)}
                        className="bg-white/10 border-white/30 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-white">Amount *</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={expenseData.amount}
                          onChange={(e) => updateExpenseData('amount', parseFloat(e.target.value) || 0)}
                          className="bg-white/10 border-white/30 text-white pl-10"
                          step="0.01"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-white">Category</Label>
                      <Select value={expenseData.category} onValueChange={(value) => updateExpenseData('category', value)}>
                        <SelectTrigger className="bg-white/10 border-white/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">🍽️ Food & Drinks</SelectItem>
                          <SelectItem value="transportation">🚗 Transportation</SelectItem>
                          <SelectItem value="accommodation">🏠 Accommodation</SelectItem>
                          <SelectItem value="entertainment">🎬 Entertainment</SelectItem>
                          <SelectItem value="shopping">🛍️ Shopping</SelectItem>
                          <SelectItem value="utilities">📄 Utilities</SelectItem>
                          <SelectItem value="health">🏥 Health</SelectItem>
                          <SelectItem value="other">📦 Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-white">Split Method</Label>
                      <Select value={expenseData.splitType} onValueChange={(value) => updateExpenseData('splitType', value)}>
                        <SelectTrigger className="bg-white/10 border-white/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equal">Equal Split</SelectItem>
                          <SelectItem value="percentage">Percentage Split</SelectItem>
                          <SelectItem value="custom">Custom Amounts</SelectItem>
                          <SelectItem value="income-proportional">Income Proportional</SelectItem>
                          <SelectItem value="income-progressive">Income Progressive</SelectItem>
                          <SelectItem value="weighted">Weighted Split</SelectItem>
                          <SelectItem value="shares">By Shares</SelectItem>
                          <SelectItem value="adjustment">With Adjustments</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Description (Optional)</Label>
                    <Input
                      placeholder="Add details about this expense"
                      value={expenseData.description}
                      onChange={(e) => updateExpenseData('description', e.target.value)}
                      className="bg-white/10 border-white/30 text-white"
                    />
                  </div>

                  {/* Member Selection */}
                  <div className="space-y-3">
                    <Label className="text-white">Split Between ({selectedMembers.length} selected)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {members.filter(m => m.isActive).map(member => (
                        <div key={member.id} className="flex items-center space-x-2 p-2 bg-white/5 rounded-lg">
                          <input
                            type="checkbox"
                            checked={expenseData.selectedMembers.includes(member.id)}
                            onChange={() => toggleMember(member.id)}
                            className="w-4 h-4"
                          />
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback className="text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white text-sm">{member.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Options Toggle */}
                  <Button 
                    variant="outline"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="border-white/30 text-white"
                  >
                    {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
                  </Button>

                  {showAdvancedOptions && (
                    <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/20">
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Real-time Validation</Label>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setRealTimeValidation(!realTimeValidation)}
                          className={`border-white/30 ${realTimeValidation ? 'bg-green-500/20 text-green-400' : 'text-white'}`}
                        >
                          {realTimeValidation ? 'ON' : 'OFF'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Live Calculator */}
            <div>
              <EnhancedExpenseCalculator
                amount={expenseData.amount}
                members={selectedMembers}
                onSplitCalculated={handleSplitCalculated}
                defaultMethod={expenseData.splitType}
                currency={currency}
              />
            </div>
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          {preview ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Validation Status */}
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    {preview.validation.isValid ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    Validation Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={preview.validation.isValid ? "default" : "destructive"}>
                      {preview.validation.isValid ? 'VALID' : 'INVALID'}
                    </Badge>
                    <span className="text-white/60 text-sm">
                      {preview.validation.errors.length} errors, {preview.validation.warnings.length} warnings
                    </span>
                  </div>

                  {/* Errors */}
                  {preview.validation.errors.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-red-400">Errors</Label>
                      {preview.validation.errors.map((error, index) => (
                        <Alert key={index} className="border-red-500 bg-red-500/10">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-red-400">
                            {error}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {preview.validation.warnings.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-yellow-400">Warnings</Label>
                      {preview.validation.warnings.map((warning, index) => (
                        <Alert key={index} className="border-yellow-500 bg-yellow-500/10">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-yellow-400">
                            {warning}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {preview.validation.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-blue-400">Suggestions</Label>
                      {preview.validation.suggestions.map((suggestion, index) => (
                        <Alert key={index} className="border-blue-500 bg-blue-500/10">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-blue-400">
                            {suggestion}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Split Preview */}
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Split Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Summary */}
                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/70">Total Amount:</span>
                        <span className="text-white font-medium">{currency}{preview.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Calculated:</span>
                        <span className="text-white font-medium">{currency}{totalCalculated.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Method:</span>
                        <span className="text-white font-medium">{preview.splitMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Difference:</span>
                        <span className={`font-medium ${calculationDifference <= 0.01 ? 'text-green-400' : 'text-red-400'}`}>
                          ±{currency}{calculationDifference.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Individual Splits */}
                  <div className="space-y-2">
                    <Label className="text-white">Individual Splits</Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {preview.splits.map(split => (
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
                  </div>

                  {/* Create Expense Button */}
                  <Button 
                    onClick={createExpense}
                    disabled={!preview.validation.isValid}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white disabled:opacity-50"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Create Expense
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="glass-card border-white/20">
              <CardContent className="p-12 text-center">
                <Calculator className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-white text-xl font-medium mb-2">No Preview Available</h3>
                <p className="text-white/60">
                  Calculate splits in the Calculator tab to see preview here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing">
          <ExpenseCalculationTester />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white/5 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-white/60 text-sm">Total Calculations</p>
                    <p className="text-white font-bold text-xl">{calculationHistory.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white/60 text-sm">Active Members</p>
                    <p className="text-white font-bold text-xl">{members.filter(m => m.isActive).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-white/60 text-sm">Current Amount</p>
                    <p className="text-white font-bold text-xl">{currency}{expenseData.amount.toFixed(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-white/60 text-sm">Avg Per Person</p>
                    <p className="text-white font-bold text-xl">
                      {currency}{selectedMembers.length > 0 ? (expenseData.amount / selectedMembers.length).toFixed(0) : '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calculation History */}
          {calculationHistory.length > 0 && (
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Calculations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {calculationHistory.slice(0, 5).map((audit, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/20">
                      <div>
                        <span className="text-white font-medium">{audit.method}</span>
                        <p className="text-white/60 text-sm">
                          {currency}{audit.totalAmount.toFixed(2)} • {audit.memberCount} members
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={audit.difference <= 0.01 ? "default" : "destructive"}>
                          ±{currency}{audit.difference.toFixed(4)}
                        </Badge>
                        <p className="text-white/60 text-xs">
                          {audit.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpenseCalculationDashboard;
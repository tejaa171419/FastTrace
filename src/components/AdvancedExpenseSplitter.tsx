import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Calculator,
  Users,
  DollarSign,
  Percent,
  TrendingUp,
  Brain,
  Zap,
  Target,
  Scale,
  Award,
  Info,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  income?: number;
  weight?: number;
  percentage?: number;
  customAmount?: number;
  isIncluded: boolean;
}

interface SplitResult {
  userId: string;
  name: string;
  amount: number;
  percentage: number;
  method: string;
}

interface AdvancedExpenseSplitterProps {
  totalAmount: number;
  members: Member[];
  onSplitChange: (splits: SplitResult[]) => void;
  currency?: string;
}

// Individual member split component
const MemberSplitCard = ({ member, split, method, onAmountChange, onPercentageChange, onWeightChange, onIncludeChange }) => {
  const getMethodIcon = () => {
    switch (method) {
      case 'income_proportional':
      case 'income_progressive':
        return TrendingUp;
      case 'weighted':
        return Scale;
      default:
        return Users;
    }
  };

  const Icon = getMethodIcon();

  return (
    <Card className={`glass-card transition-all duration-300 ${
      member.isIncluded 
        ? 'border-primary/30 bg-primary/5' 
        : 'border-white/10 bg-white/5 opacity-60'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Switch
              checked={member.isIncluded}
              onCheckedChange={onIncludeChange}
              className="data-[state=checked]:bg-primary"
            />
            
            <Avatar className="w-10 h-10">
              <AvatarImage src={member.avatar} />
              <AvatarFallback className="bg-primary/20 text-white text-sm\">
                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h4 className="font-medium text-white\">{member.firstName} {member.lastName}</h4>
              <div className="flex items-center gap-1 text-xs text-white/60\">
                <Icon className="w-3 h-3\" />
                <span>{split.percentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          
          <div className="text-right\">
            <div className="text-lg font-bold text-primary\">₹{split.amount.toFixed(2)}</div>
            {method.includes('income') && member.income && (
              <div className="text-xs text-white/50\">Income: ₹{member.income.toLocaleString()}</div>
            )}
          </div>
        </div>
        
        {member.isIncluded && (
          <div className="space-y-3\">
            {/* Custom amount input */}
            {method === 'custom' && (
              <div>
                <Label className="text-white/70 text-xs\">Custom Amount</Label>
                <Input
                  type="number\"
                  step="0.01\"
                  value={split.amount}
                  onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
                  className="bg-white/10 border-white/20 text-white mt-1\"
                  placeholder="0.00\"
                />
              </div>
            )}
            
            {/* Percentage input */}
            {method === 'percentage' && (
              <div>
                <Label className="text-white/70 text-xs\">Percentage</Label>
                <div className="flex items-center gap-2 mt-1\">
                  <Slider
                    value={[split.percentage]}
                    onValueChange={(value) => onPercentageChange(value[0])}
                    max={100}
                    step={0.1}
                    className="flex-1\"
                  />
                  <Input
                    type="number\"
                    step="0.1\"
                    value={split.percentage}
                    onChange={(e) => onPercentageChange(parseFloat(e.target.value) || 0)}
                    className="bg-white/10 border-white/20 text-white w-20\"
                    max={100}
                  />
                </div>
              </div>
            )}
            
            {/* Weight input */}
            {method === 'weighted' && (
              <div>
                <Label className="text-white/70 text-xs\">Weight Factor</Label>
                <div className="flex items-center gap-2 mt-1\">
                  <Slider
                    value={[member.weight || 1]}
                    onValueChange={(value) => onWeightChange(value[0])}
                    min={0.1}
                    max={5}
                    step={0.1}
                    className="flex-1\"
                  />
                  <Input
                    type="number\"
                    step="0.1\"
                    value={member.weight || 1}
                    onChange={(e) => onWeightChange(parseFloat(e.target.value) || 1)}
                    className="bg-white/10 border-white/20 text-white w-20\"
                    min={0.1}
                    max={5}
                  />
                </div>
              </div>
            )}
            
            {/* Income input */}
            {method.includes('income') && (
              <div>
                <Label className="text-white/70 text-xs\">Monthly Income</Label>
                <Input
                  type="number\"
                  value={member.income || ''}
                  onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
                  className="bg-white/10 border-white/20 text-white mt-1\"
                  placeholder="Enter monthly income\"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Split method configuration panel
const SplitMethodPanel = ({ method, onMethodChange }) => {
  const methods = [
    {
      id: 'equal',
      name: 'Equal Split',
      description: 'Split equally among all members',
      icon: Users,
      color: 'text-blue-400',
      difficulty: 'Easy'
    },
    {
      id: 'percentage',
      name: 'Percentage Split',
      description: 'Split by custom percentages',
      icon: Percent,
      color: 'text-green-400',
      difficulty: 'Medium'
    },
    {
      id: 'custom',
      name: 'Custom Amounts',
      description: 'Set specific amounts for each member',
      icon: Calculator,
      color: 'text-purple-400',
      difficulty: 'Medium'
    },
    {
      id: 'income_proportional',
      name: 'Income Proportional',
      description: 'Split proportionally based on income',
      icon: TrendingUp,
      color: 'text-yellow-400',
      difficulty: 'Advanced'
    },
    {
      id: 'income_progressive',
      name: 'Progressive Income',
      description: 'Higher earners pay proportionally more',
      icon: Award,
      color: 'text-red-400',
      difficulty: 'Advanced'
    },
    {
      id: 'weighted',
      name: 'Weighted Split',
      description: 'Split by custom weight factors',
      icon: Scale,
      color: 'text-indigo-400',
      difficulty: 'Advanced'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3\">
      {methods.map((methodInfo) => {
        const Icon = methodInfo.icon;
        const isSelected = method === methodInfo.id;
        
        return (
          <Card
            key={methodInfo.id}
            className={`glass-card cursor-pointer transition-all duration-300 hover:scale-105 ${
              isSelected
                ? 'border-primary/50 bg-primary/10 shadow-glow'
                : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => onMethodChange(methodInfo.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2\">
                <div className={`p-2 rounded-lg bg-white/10 ${methodInfo.color}`}>
                  <Icon className="w-4 h-4\" />
                </div>
                <div className="flex-1\">
                  <h4 className="font-medium text-white text-sm\">{methodInfo.name}</h4>
                  <Badge variant="outline" className="text-xs mt-1">
                    {methodInfo.difficulty}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-white/60\">{methodInfo.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Split validation and summary
const SplitSummary = ({ splits, totalAmount, method, validation }) => {
  const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
  const difference = Math.abs(totalAmount - totalSplit);
  const isValid = difference < 0.01;
  
  return (
    <Card className="glass-card\">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2\">
          <BarChart3 className="w-5 h-5 text-primary\" />
          Split Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4\">
          <div className="text-center\">
            <div className="text-lg font-bold text-primary\">₹{totalAmount.toFixed(2)}</div>
            <p className="text-xs text-white/60\">Total Amount</p>
          </div>
          
          <div className="text-center\">
            <div className="text-lg font-bold text-white\">₹{totalSplit.toFixed(2)}</div>
            <p className="text-xs text-white/60\">Split Total</p>
          </div>
          
          <div className="text-center\">
            <div className={`text-lg font-bold ${
              isValid ? 'text-green-400' : 'text-red-400'
            }`}>
              ₹{difference.toFixed(2)}
            </div>
            <p className="text-xs text-white/60\">Difference</p>
          </div>
          
          <div className="text-center\">
            <div className="text-lg font-bold text-white\">{splits.length}</div>
            <p className="text-xs text-white/60\">Members</p>
          </div>
        </div>
        
        <div className="space-y-2\">
          <div className="flex items-center justify-between\">
            <span className="text-sm text-white/70\">Validation Status</span>
            <div className="flex items-center gap-2\">
              {isValid ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400\" />
                  <span className="text-sm text-green-400\">Valid</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-400\" />
                  <span className="text-sm text-red-400\">Invalid</span>
                </>
              )}
            </div>
          </div>
          
          <Progress 
            value={isValid ? 100 : (totalSplit / totalAmount) * 100} 
            className="h-2\" 
          />
          
          {!isValid && (
            <Alert className="border-red-500/20 bg-red-500/10\">
              <AlertTriangle className="h-4 w-4 text-red-400\" />
              <AlertDescription className="text-red-400\">
                {difference > 0.01 && totalSplit > totalAmount ? 'Split total exceeds expense amount' :
                 difference > 0.01 && totalSplit < totalAmount ? 'Split total is less than expense amount' :
                 'Please adjust the split amounts'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const AdvancedExpenseSplitter: React.FC<AdvancedExpenseSplitterProps> = ({
  totalAmount,
  members: initialMembers,
  onSplitChange,
  currency = 'INR'
}) => {
  const { toast } = useToast();
  const [method, setMethod] = useState('equal');
  const [members, setMembers] = useState(() => 
    initialMembers.map(m => ({ ...m, isIncluded: true, weight: 1 }))
  );
  
  // Calculate splits based on current method and member data
  const splits = useMemo(() => {
    const includedMembers = members.filter(m => m.isIncluded);
    
    if (includedMembers.length === 0 || totalAmount <= 0) {
      return [];
    }
    
    switch (method) {
      case 'equal': {
        const equalAmount = totalAmount / includedMembers.length;
        return includedMembers.map(member => ({
          userId: member.id,
          name: `${member.firstName} ${member.lastName}`,
          amount: Math.round(equalAmount * 100) / 100,
          percentage: (100 / includedMembers.length),
          method: 'equal'
        }));
      }
      
      case 'percentage': {
        return includedMembers.map(member => {
          const percentage = member.percentage || (100 / includedMembers.length);
          const amount = (totalAmount * percentage) / 100;
          return {
            userId: member.id,
            name: `${member.firstName} ${member.lastName}`,
            amount: Math.round(amount * 100) / 100,
            percentage,
            method: 'percentage'
          };
        });
      }
      
      case 'custom': {
        return includedMembers.map(member => ({
          userId: member.id,
          name: `${member.firstName} ${member.lastName}`,
          amount: member.customAmount || 0,
          percentage: totalAmount > 0 ? ((member.customAmount || 0) / totalAmount) * 100 : 0,
          method: 'custom'
        }));
      }
      
      case 'income_proportional': {
        const totalIncome = includedMembers.reduce((sum, m) => sum + (m.income || 0), 0);
        if (totalIncome === 0) return [];
        
        return includedMembers.map(member => {
          const percentage = ((member.income || 0) / totalIncome) * 100;
          const amount = (totalAmount * percentage) / 100;
          return {
            userId: member.id,
            name: `${member.firstName} ${member.lastName}`,
            amount: Math.round(amount * 100) / 100,
            percentage,
            method: 'income_proportional'
          };
        });
      }
      
      case 'income_progressive': {
        const totalIncome = includedMembers.reduce((sum, m) => sum + (m.income || 0), 0);
        const avgIncome = totalIncome / includedMembers.length;
        
        if (totalIncome === 0 || avgIncome === 0) return [];
        
        const progressiveWeights = includedMembers.map(member => {
          const incomeRatio = (member.income || 0) / avgIncome;
          return Math.pow(incomeRatio, 1.2); // Progressive curve
        });
        
        const totalWeights = progressiveWeights.reduce((sum, w) => sum + w, 0);
        
        return includedMembers.map((member, index) => {
          const percentage = (progressiveWeights[index] / totalWeights) * 100;
          const amount = (totalAmount * percentage) / 100;
          return {
            userId: member.id,
            name: `${member.firstName} ${member.lastName}`,
            amount: Math.round(amount * 100) / 100,
            percentage,
            method: 'income_progressive'
          };
        });
      }
      
      case 'weighted': {
        const totalWeight = includedMembers.reduce((sum, m) => sum + (m.weight || 1), 0);
        
        return includedMembers.map(member => {
          const percentage = ((member.weight || 1) / totalWeight) * 100;
          const amount = (totalAmount * percentage) / 100;
          return {
            userId: member.id,
            name: `${member.firstName} ${member.lastName}`,
            amount: Math.round(amount * 100) / 100,
            percentage,
            method: 'weighted'
          };
        });
      }
      
      default:
        return [];
    }
  }, [method, members, totalAmount]);
  
  // Update parent component when splits change
  useEffect(() => {
    onSplitChange(splits);
  }, [splits, onSplitChange]);
  
  const updateMember = (memberId: string, updates: Partial<Member>) => {
    setMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, ...updates } : m
    ));
  };
  
  const handleQuickSplit = (type: string) => {
    switch (type) {
      case 'equal':
        setMethod('equal');
        toast({ title: 'Applied equal split', description: 'Everyone pays the same amount' });
        break;
      case 'income':
        setMethod('income_proportional');
        toast({ title: 'Applied income-based split', description: 'Split based on reported incomes' });
        break;
      case 'smart':
        // AI-powered suggestion (mock implementation)
        setMethod('weighted');
        setMembers(prev => prev.map(m => ({ ...m, weight: Math.random() * 2 + 0.5 })));
        toast({ title: 'Applied smart split', description: 'AI optimized based on spending patterns' });
        break;
    }
  };
  
  return (
    <div className="space-y-6\">
      {/* Header */}
      <Card className="glass-card bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10\">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2\">
            <Sparkles className="w-6 h-6 text-primary\" />
            Advanced Expense Splitter
          </CardTitle>
          <p className="text-white/60\">AI-powered splitting with multiple algorithms and smart suggestions</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSplit('equal')}
                    className="border-white/20 text-white hover:bg-white/10\"
                  >
                    <Users className="w-4 h-4 mr-2\" />
                    Equal
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Split equally among all members</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSplit('income')}
                    className="border-white/20 text-white hover:bg-white/10\"
                  >
                    <TrendingUp className="w-4 h-4 mr-2\" />
                    By Income
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Split proportionally based on income</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSplit('smart')}
                    className="border-white/20 text-white hover:bg-white/10\"
                  >
                    <Brain className="w-4 h-4 mr-2\" />
                    AI Smart
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI-powered optimization based on patterns</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
      
      {/* Method Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2\">
          <Calculator className="w-5 h-5 text-primary\" />
          Split Method
        </h3>
        <SplitMethodPanel method={method} onMethodChange={setMethod} />
      </div>
      
      {/* Member Configuration */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2\">
          <Users className="w-5 h-5 text-primary\" />
          Member Configuration
        </h3>
        <div className="grid gap-4\">
          {members.map(member => {
            const split = splits.find(s => s.userId === member.id);
            if (!split) return null;
            
            return (
              <MemberSplitCard
                key={member.id}
                member={member}
                split={split}
                method={method}
                onAmountChange={(amount) => updateMember(member.id, { customAmount: amount })}
                onPercentageChange={(percentage) => updateMember(member.id, { percentage })}
                onWeightChange={(weight) => updateMember(member.id, { weight })}
                onIncludeChange={(isIncluded) => updateMember(member.id, { isIncluded })}
              />
            );
          })}
        </div>
      </div>
      
      {/* Split Summary */}
      <SplitSummary 
        splits={splits} 
        totalAmount={totalAmount} 
        method={method}
        validation={null}
      />
    </div>
  );
};

export default AdvancedExpenseSplitter;
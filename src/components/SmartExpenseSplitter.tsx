import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, Calculator, Percent, DollarSign, PieChart, 
  UserCheck, UserX, RotateCcw, Save, Share2, 
  AlertTriangle, CheckCircle, TrendingUp, Crown,
  Wallet, Receipt, Target, Zap
} from "lucide-react";
import { toast } from "sonner";

// Schemas for form validation
const expenseSchema = z.object({
  title: z.string().min(1, "Expense title is required").max(100, "Title too long"),
  amount: z.number().min(0.01, "Amount must be greater than 0").max(1000000, "Amount too large"),
  description: z.string().max(200, "Description too long").optional(),
  category: z.string().min(1, "Category is required"),
});

interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  joinedDate: Date;
  totalExpenses: number;
  totalOwed: number;
  paymentPreference: 'equal' | 'custom' | 'percentage';
  reliability: 'high' | 'medium' | 'low';
}

interface SplitOption {
  memberId: string;
  amount: number;
  percentage: number;
  isIncluded: boolean;
  customRatio?: number;
}

interface ExpenseSplit {
  id: string;
  title: string;
  amount: number;
  description?: string;
  category: string;
  splitType: 'equal' | 'percentage' | 'custom' | 'shares' | 'adjustment';
  splits: SplitOption[];
  createdBy: string;
  createdAt: Date;
  tags: string[];
}

type SplitType = 'equal' | 'percentage' | 'custom' | 'shares' | 'adjustment';

const SmartExpenseSplitter = () => {
  // Mock group members data (removed John Doe demo user)
  const [members] = useState<Member[]>([
    {
      id: "2", 
      name: "Sarah Smith",
      email: "sarah@example.com",
      avatar: "SS",
      isActive: true,
      joinedDate: new Date('2024-02-01'),
      totalExpenses: 1875.25,
      totalOwed: 0,
      paymentPreference: 'percentage',
      reliability: 'high'
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike@example.com", 
      avatar: "MJ",
      isActive: true,
      joinedDate: new Date('2024-01-20'),
      totalExpenses: 1632.75,
      totalOwed: 245.00,
      paymentPreference: 'custom',
      reliability: 'medium'
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily@example.com",
      avatar: "ED", 
      isActive: false,
      joinedDate: new Date('2024-03-10'),
      totalExpenses: 890.50,
      totalOwed: 67.25,
      paymentPreference: 'equal',
      reliability: 'low'
    }
  ]);

  const [currentUser] = useState("2"); // Current user ID (Sarah Smith)
  const [activeTab, setActiveTab] = useState<SplitType>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['2', '3', '4']);
  const [splits, setSplits] = useState<SplitOption[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isValid, setIsValid] = useState(false);
  const [savedSplits, setSavedSplits] = useState<ExpenseSplit[]>([]);

  const categories = [
    { value: 'food', label: 'Food & Dining', icon: '🍽️' },
    { value: 'transport', label: 'Transportation', icon: '🚗' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️' },
    { value: 'utilities', label: 'Utilities', icon: '⚡' },
    { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { value: 'travel', label: 'Travel', icon: '✈️' },
    { value: 'other', label: 'Other', icon: '📝' }
  ];

  const form = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: "",
      amount: 0,
      description: "",
      category: ""
    }
  });

  // Initialize splits when members or amount changes
  useEffect(() => {
    if (totalAmount > 0 && selectedMembers.length > 0) {
      initializeSplits();
    }
  }, [totalAmount, selectedMembers, activeTab]);

  // Validate splits whenever they change
  useEffect(() => {
    validateSplits();
  }, [splits]);

  const initializeSplits = () => {
    const newSplits: SplitOption[] = members
      .filter(member => selectedMembers.includes(member.id))
      .map(member => {
        let amount = 0;
        let percentage = 0;

        switch (activeTab) {
          case 'equal':
            amount = totalAmount / selectedMembers.length;
            percentage = 100 / selectedMembers.length;
            break;
          case 'percentage':
            percentage = 100 / selectedMembers.length;
            amount = (totalAmount * percentage) / 100;
            break;
          case 'shares':
            amount = totalAmount / selectedMembers.length;
            percentage = 100 / selectedMembers.length;
            break;
          default:
            amount = 0;
            percentage = 0;
        }

        return {
          memberId: member.id,
          amount: Number(amount.toFixed(2)),
          percentage: Number(percentage.toFixed(2)),
          isIncluded: true,
          customRatio: 1
        };
      });

    setSplits(newSplits);
  };

  const validateSplits = () => {
    if (splits.length === 0) {
      setIsValid(false);
      return;
    }

    const totalSplitAmount = splits
      .filter(split => split.isIncluded)
      .reduce((sum, split) => sum + split.amount, 0);
    
    const totalPercentage = splits
      .filter(split => split.isIncluded)
      .reduce((sum, split) => sum + split.percentage, 0);

    // Allow small rounding differences
    const amountValid = Math.abs(totalSplitAmount - totalAmount) < 0.01;
    const percentageValid = Math.abs(totalPercentage - 100) < 0.01;

    setIsValid(amountValid && percentageValid);
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const updateSplitAmount = (memberId: string, newAmount: number) => {
    setSplits(prev => prev.map(split => {
      if (split.memberId === memberId) {
        const percentage = totalAmount > 0 ? (newAmount / totalAmount) * 100 : 0;
        return {
          ...split,
          amount: Number(newAmount.toFixed(2)),
          percentage: Number(percentage.toFixed(2))
        };
      }
      return split;
    }));
  };

  const updateSplitPercentage = (memberId: string, newPercentage: number) => {
    setSplits(prev => prev.map(split => {
      if (split.memberId === memberId) {
        const amount = (totalAmount * newPercentage) / 100;
        return {
          ...split,
          percentage: Number(newPercentage.toFixed(2)),
          amount: Number(amount.toFixed(2))
        };
      }
      return split;
    }));
  };

  const applyEqualSplit = () => {
    const includedMembers = splits.filter(split => split.isIncluded);
    const equalAmount = totalAmount / includedMembers.length;
    const equalPercentage = 100 / includedMembers.length;

    setSplits(prev => prev.map(split => {
      if (split.isIncluded) {
        return {
          ...split,
          amount: Number(equalAmount.toFixed(2)),
          percentage: Number(equalPercentage.toFixed(2))
        };
      }
      return split;
    }));
  };

  const applySuggestedSplit = () => {
    // Smart split based on member history and preferences
    const includedMembers = splits.filter(split => split.isIncluded);
    const totalHistoricalExpenses = includedMembers.reduce((sum, split) => {
      const member = members.find(m => m.id === split.memberId);
      return sum + (member?.totalExpenses || 0);
    }, 0);

    setSplits(prev => prev.map(split => {
      if (split.isIncluded) {
        const member = members.find(m => m.id === split.memberId);
        if (member && totalHistoricalExpenses > 0) {
          const suggestedPercentage = (member.totalExpenses / totalHistoricalExpenses) * 100;
          const suggestedAmount = (totalAmount * suggestedPercentage) / 100;
          
          return {
            ...split,
            percentage: Number(suggestedPercentage.toFixed(2)),
            amount: Number(suggestedAmount.toFixed(2))
          };
        }
      }
      return split;
    }));

    toast.success("Applied smart split based on spending history!");
  };

  const onSubmit = (data: any) => {
    if (!isValid) {
      toast.error("Please fix the split amounts before saving");
      return;
    }

    const newExpenseSplit: ExpenseSplit = {
      id: Date.now().toString(),
      title: data.title,
      amount: totalAmount,
      description: data.description,
      category: data.category,
      splitType: activeTab,
      splits: splits.filter(split => split.isIncluded),
      createdBy: currentUser,
      createdAt: new Date(),
      tags: []
    };

    setSavedSplits(prev => [newExpenseSplit, ...prev]);
    toast.success(`Expense "${data.title}" split successfully!`);
    
    // Reset form
    form.reset();
    setTotalAmount(0);
    setSplits([]);
  };

  const getSplitSummary = () => {
    const includedSplits = splits.filter(split => split.isIncluded);
    const totalSplitAmount = includedSplits.reduce((sum, split) => sum + split.amount, 0);
    const difference = totalAmount - totalSplitAmount;
    
    return {
      totalSplitAmount: Number(totalSplitAmount.toFixed(2)),
      difference: Number(difference.toFixed(2)),
      memberCount: includedSplits.length
    };
  };

  const summary = getSplitSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader className="bg-card/90 backdrop-blur-lg">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Calculator className="w-5 h-5" />
            Smart Expense Splitter
          </CardTitle>
          <CardDescription>
            Split expenses intelligently with custom ratios, percentages, or equal amounts
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Expense Details Form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Expense Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expense Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Dinner at restaurant" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value) || 0);
                            setTotalAmount(parseFloat(e.target.value) || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center gap-2">
                              <span>{category.icon}</span>
                              <span>{category.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Additional details..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Member Selection */}
      {totalAmount > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Select Members
            </CardTitle>
            <CardDescription>
              Choose who should be included in this expense split
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedMembers.includes(member.id)
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card/50 border-border hover:bg-card/70'
                  }`}
                  onClick={() => handleMemberToggle(member.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-primary">
                          {member.avatar}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.name}</p>
                          {member.id === currentUser && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                          {!member.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            ₹{member.totalExpenses.toFixed(0)} spent
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              member.reliability === 'high' ? 'text-green-600' :
                              member.reliability === 'medium' ? 'text-yellow-600' : 'text-red-600'
                            }`}
                          >
                            {member.reliability} reliability
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => handleMemberToggle(member.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Split Configuration */}
      {totalAmount > 0 && selectedMembers.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Configure Split
                </CardTitle>
                <CardDescription>
                  Choose how to split ₹{totalAmount.toFixed(2)} among {selectedMembers.length} members
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={applyEqualSplit} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Equal Split
                </Button>
                <Button onClick={applySuggestedSplit} variant="outline" size="sm">
                  <Zap className="w-4 h-4 mr-2" />
                  Smart Split
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SplitType)}>
              <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm">
                <TabsTrigger value="equal">Equal</TabsTrigger>
                <TabsTrigger value="percentage">Percentage</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
                <TabsTrigger value="shares">Shares</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                {/* Split Summary */}
                <div className="mb-6 p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Split Summary</span>
                    <div className="flex items-center gap-2">
                      {isValid ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Amount:</span>
                      <p className="font-semibold">₹{totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Split Amount:</span>
                      <p className="font-semibold">₹{summary.totalSplitAmount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Difference:</span>
                      <p className={`font-semibold ${Math.abs(summary.difference) > 0.01 ? 'text-orange-500' : 'text-green-500'}`}>
                        ₹{summary.difference.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Member Splits */}
                <div className="space-y-4">
                  {splits.map((split) => {
                    const member = members.find(m => m.id === split.memberId);
                    if (!member) return null;

                    return (
                      <div key={split.memberId} className="p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {member.avatar}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Preference: {member.paymentPreference}
                              </p>
                            </div>
                          </div>
                          <Checkbox
                            checked={split.isIncluded}
                            onCheckedChange={(checked) => {
                              setSplits(prev => prev.map(s => 
                                s.memberId === split.memberId 
                                  ? { ...s, isIncluded: !!checked }
                                  : s
                              ));
                            }}
                          />
                        </div>

                        {split.isIncluded && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">Amount (₹)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={split.amount}
                                onChange={(e) => updateSplitAmount(split.memberId, parseFloat(e.target.value) || 0)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Percentage (%)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={split.percentage}
                                onChange={(e) => updateSplitPercentage(split.memberId, parseFloat(e.target.value) || 0)}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Validation Alert */}
                {!isValid && splits.length > 0 && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Split amounts don't match the total expense. Please adjust the amounts or percentages.
                      {Math.abs(summary.difference) > 0.01 && (
                        <span className="block mt-1">
                          Difference: ₹{summary.difference.toFixed(2)}
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Save Button */}
                <div className="mt-6 flex gap-3">
                  <Button 
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={!isValid || !form.formState.isValid}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Expense Split
                  </Button>
                  <Button variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Recent Splits */}
      {savedSplits.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Splits
            </CardTitle>
            <CardDescription>
              Your recently created expense splits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedSplits.slice(0, 3).map((expenseSplit) => (
                <div key={expenseSplit.id} className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{expenseSplit.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        ₹{expenseSplit.amount.toFixed(2)} • {expenseSplit.splits.length} members
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {expenseSplit.splitType}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {expenseSplit.splits.map((split) => {
                      const member = members.find(m => m.id === split.memberId);
                      return (
                        <div key={split.memberId} className="text-xs bg-white/10 px-2 py-1 rounded">
                          {member?.name}: ₹{split.amount.toFixed(2)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartExpenseSplitter;
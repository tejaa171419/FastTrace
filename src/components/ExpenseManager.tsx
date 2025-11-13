import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, DollarSign, Users, Calculator, Trash2, Edit, Receipt, Calendar, Loader2, Search, Check } from 'lucide-react';
import { useCreateExpense, useExpenses } from '@/hooks/useExpenses';
import { useGroup } from '@/hooks/useGroups';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CreateExpenseRequest } from '@/lib/types';
import { apiClient } from '@/lib/api';

import { ExpenseCategory } from '@/lib/types';

interface ExpenseManagerProps {
  groupId: string;
}

interface SplitMember {
  userId: string;
  name: string;
  amount: number;
  percentage: number;
}

interface ExpenseFormData {
  title: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  splitMethod: 'equal' | 'custom' | 'percentage';
  customSplits: Record<string, number>;
}

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills & Utilities',
  'Travel',
  'Health & Fitness',
  'Education',
  'Groceries',
  'Personal Care',
  'Other'
];

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({ groupId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom' | 'percentage'>('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, number>>({});
  const [paidBy, setPaidBy] = useState<string>(user?._id || ''); // Track who paid

  // API hooks
  const { data: groupData, isLoading: groupLoading } = useGroup(groupId);
  const { data: expensesData, isLoading: expensesLoading } = useExpenses({ groupId });
  const createExpenseMutation = useCreateExpense();

  // Extract data
  const group = groupData?.group;
  const expenses = expensesData?.expenses || [];
  const members = group?.members || [];
  
  // State that depends on members should be initialized after members is declared
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Form setup
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ExpenseFormData>({
    defaultValues: {
      splitMethod: 'equal',
      customSplits: {}
    }
  });

  const watchedAmount = watch('amount', 0);

  // Initialize selected members with all members for equal split
  React.useEffect(() => {
    if (members.length > 0 && selectedMembers.length === 0) {
      setSelectedMembers(members.map(m => m.user._id));
    }
  }, [members, selectedMembers.length]);

  // Handle member selection
  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Calculate split amounts
  const calculateSplits = (): SplitMember[] => {
    const activeMembers = members.filter(m => selectedMembers.includes(m.user._id));
    const totalAmount = watchedAmount || 0;

    if (splitMethod === 'equal') {
      const equalAmount = totalAmount / activeMembers.length;
      return activeMembers.map(member => ({
        userId: member.user._id,
        name: `${member.user.firstName} ${member.user.lastName}`,
        amount: equalAmount,
        percentage: 100 / activeMembers.length
      }));
    }

    if (splitMethod === 'custom') {
      return activeMembers.map(member => ({
        userId: member.user._id,
        name: `${member.user.firstName} ${member.user.lastName}`,
        amount: customSplits[member.user._id] || 0,
        percentage: totalAmount > 0 ? (customSplits[member.user._id] || 0) / totalAmount * 100 : 0
      }));
    }

    // percentage method
    return activeMembers.map(member => ({
      userId: member.user._id,
      name: `${member.user.firstName} ${member.user.lastName}`,
      amount: totalAmount * (customSplits[member.user._id] || 0) / 100,
      percentage: customSplits[member.user._id] || 0
    }));
  };

  // Handle custom split input
  const updateCustomSplit = (memberId: string, value: number) => {
    setCustomSplits(prev => ({
      ...prev,
      [memberId]: value
    }));
  };

  // Validate splits
  const validateSplits = (): string | null => {
    const splits = calculateSplits();
    const totalAmount = watchedAmount || 0;
    
    if (splitMethod === 'custom') {
      const customTotal = splits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(customTotal - totalAmount) > 0.01) {
        return `Custom split total (${customTotal.toFixed(2)}) doesn't match expense amount (${totalAmount.toFixed(2)})`;
      }
    }

    if (splitMethod === 'percentage') {
      const percentageTotal = splits.reduce((sum, split) => sum + split.percentage, 0);
      if (Math.abs(percentageTotal - 100) > 0.01) {
        return `Percentages must add up to 100% (currently ${percentageTotal.toFixed(1)}%)`;
      }
    }

    if (selectedMembers.length === 0) {
      return 'Please select at least one member to split the expense with';
    }

    return null;
  };

  // Handle form submission
  const onSubmit = async (data: ExpenseFormData) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create an expense.',
        variant: 'destructive'
      });
      return;
    }

    const validationError = validateSplits();
    if (validationError) {
      toast({
        title: 'Invalid Split',
        description: validationError,
        variant: 'destructive'
      });
      return;
    }

    const splits = calculateSplits();
    // Validate paidBy is selected
    if (!paidBy) {
      toast({
        title: 'Missing Information',
        description: 'Please select who paid for this expense',
        variant: 'destructive'
      });
      return;
    }

    // Map the frontend split method to backend-compatible values
    // The frontend uses 'custom' but the backend expects 'exact' for custom amounts
    let backendSplitMethod: 'equal' | 'percentage' | 'custom' = data.splitMethod;
    if (data.splitMethod === 'custom') {
      backendSplitMethod = 'custom'; // Keep as 'custom' for the API call
    }

    // Prepare the expense data with correct types
    const expenseData: CreateExpenseRequest = {
      title: data.title,
      description: data.description,
      amount: data.amount,
      category: data.category,
      splitType: 'group',
      groupId,
      paidBy: paidBy, // Use the selected payer
      splitMethod: backendSplitMethod,
      splitBetween: splits.map(split => ({
        user: split.userId,
        amount: split.amount,
        percentage: split.percentage
      }))
    };

    try {
      // Set authentication using the correct method
      if (user._id) {
        apiClient.setUserId(user._id);
      }
      
      await createExpenseMutation.mutateAsync(expenseData);
      toast({
        title: 'Success! 🎉',
        description: 'Expense created successfully'
      });
      reset();
      setSelectedMembers(members.map(m => m.user._id));
      setCustomSplits({});
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create expense. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (groupLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading group...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Receipt className="w-6 h-6 mr-2 text-primary" />
          Expenses
        </h2>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-white hover:shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
            <DialogHeader>
              <DialogTitle className="text-2xl text-gradient-cyber">Add New Expense</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white font-medium">Title *</Label>
                  <Input
                    id="title"
                    {...register('title', { required: 'Title is required' })}
                    placeholder="e.g., Dinner at Restaurant"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                  {errors.title && (
                    <p className="text-red-400 text-sm">{errors.title.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-white font-medium">Amount ({group?.currency || 'USD'}) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    {...register('amount', { 
                      required: 'Amount is required',
                      min: { value: 0.01, message: 'Amount must be greater than 0' }
                    })}
                    placeholder="0.00"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                  {errors.amount && (
                    <p className="text-red-400 text-sm">{errors.amount.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white font-medium">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Add details about this expense..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-white font-medium">Category</Label>
                <Select onValueChange={(value) => setValue('category', value as ExpenseCategory)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Who Paid? Section */}
              <div className="space-y-2">
                <Label className="text-white font-medium">Who Paid? *</Label>
                <Select value={paidBy} onValueChange={setPaidBy}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select who paid for this expense" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map(member => (
                      <SelectItem key={member.user._id} value={member.user._id}>
                        <div className="flex items-center gap-2">
                          {member.user.firstName} {member.user.lastName}
                          {member.user._id === (user?._id) && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-white/60">
                  Select the person who paid the full amount upfront
                </p>
              </div>

              {/* Split Configuration */}
              <div className="space-y-4">
                <Label className="text-white font-medium text-lg">Split Configuration</Label>
                
                <Tabs value={splitMethod} onValueChange={(value) => setSplitMethod(value as any)}>
                  <TabsList className="grid w-full grid-cols-3 bg-white/10">
                    <TabsTrigger value="equal" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      Equal Split
                    </TabsTrigger>
                    <TabsTrigger value="custom" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      Custom Amount
                    </TabsTrigger>
                    <TabsTrigger value="percentage" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                      Percentage
                    </TabsTrigger>
                  </TabsList>

                  {/* Member Selection */}
                  <div className="space-y-3">
                    <Label className="text-white/80 text-sm">Select members to split with:</Label>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border border-white/20 rounded-lg p-3">
                      {members.map(member => (
                        <div
                          key={member.user._id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                            selectedMembers.includes(member.user._id)
                              ? 'bg-primary/20 border-primary'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                          onClick={() => toggleMember(member.user._id)}
                        >
                          <Checkbox
                            checked={selectedMembers.includes(member.user._id)}
                            onCheckedChange={() => toggleMember(member.user._id)}
                          />
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={member.user.avatar?.url} />
                            <AvatarFallback className="bg-primary/20 text-white text-sm">
                              {member.user.firstName?.charAt(0)}{member.user.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white font-medium">
                            {member.user.firstName} {member.user.lastName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Split Details */}
                  <TabsContent value="equal" className="space-y-3">
                    <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-3">Equal Split Preview</h4>
                      <div className="space-y-2">
                        {calculateSplits().map(split => (
                          <div key={split.userId} className="flex justify-between items-center">
                            <span className="text-white/70">{split.name}</span>
                            <Badge className="bg-success/20 text-success">
                              {group?.currency === 'USD' ? '$' : '₹'}{split.amount.toFixed(2)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="custom" className="space-y-3">
                    <div className="space-y-3">
                      {members.filter(m => selectedMembers.includes(m.user._id)).map(member => (
                        <div key={member.user._id} className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={member.user.avatar?.url} />
                            <AvatarFallback className="bg-primary/20 text-white text-sm">
                              {member.user.firstName?.charAt(0)}{member.user.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white font-medium flex-1">
                            {member.user.firstName} {member.user.lastName}
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={customSplits[member.user._id] || ''}
                            onChange={(e) => updateCustomSplit(member.user._id, parseFloat(e.target.value) || 0)}
                            className="w-24 bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="percentage" className="space-y-3">
                    <div className="space-y-3">
                      {members.filter(m => selectedMembers.includes(m.user._id)).map(member => (
                        <div key={member.user._id} className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={member.user.avatar?.url} />
                            <AvatarFallback className="bg-primary/20 text-white text-sm">
                              {member.user.firstName?.charAt(0)}{member.user.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white font-medium flex-1">
                            {member.user.firstName} {member.user.lastName}
                          </span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.1"
                              max="100"
                              placeholder="0"
                              value={customSplits[member.user._id] || ''}
                              onChange={(e) => updateCustomSplit(member.user._id, parseFloat(e.target.value) || 0)}
                              className="w-20 bg-white/10 border-white/20 text-white"
                            />
                            <span className="text-white/60">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createExpenseMutation.isPending}
                  className="flex-1 bg-gradient-primary text-white hover:shadow-glow disabled:opacity-50"
                >
                  {createExpenseMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Expense'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expenses List */}
      <div className="space-y-4">
        {expensesLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-white/60">Loading expenses...</span>
          </div>
        ) : expenses.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="text-center py-12">
              <Receipt className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white/60 mb-2">No expenses yet</h3>
              <p className="text-white/40 max-w-md mx-auto">
                Start by adding your first group expense. Split bills, track shared costs, and keep everyone organized.
              </p>
            </CardContent>
          </Card>
        ) : (
          expenses.map((expense, index) => (
            <Card
              key={expense._id}
              className="glass-card hover-lift animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{expense.title}</h3>
                      <Badge className="bg-primary/20 text-primary">{expense.category}</Badge>
                    </div>
                    
                    {expense.description && (
                      <p className="text-white/60 text-sm mb-3">{expense.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-white/50">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(expense.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{expense.splitBetween?.length || 0} people</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white mb-1">
                      {group?.currency === 'USD' ? '$' : '₹'}{expense.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-white/40">
                      by {expense.paidBy?.firstName} {expense.paidBy?.lastName}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
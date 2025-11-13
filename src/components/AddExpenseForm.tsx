import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Calendar as CalendarIcon,
  Users,
  Receipt,
  Calculator,
  IndianRupee,
  ImageIcon,
  FileText,
  X,
  Plus,
  AlertCircle,
  Check,
  Edit2,
  Sparkles,
  TrendingUp,
  Percent,
  DollarSign,
  Scale,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  income?: number;
  weight?: number;
}

interface PayerDetail {
  memberId: string;
  amount: number;
}

interface SplitDetail {
  memberId: string;
  amount: number;
  percentage?: number;
  shares?: number;
  isExcluded?: boolean;
  // Additional properties for enhanced split types
  weight?: number;
  adjustmentAmount?: number;
  adjustmentReason?: string;
  customAmount?: number;
  income?: number;
}

interface ExpenseFormData {
  title: string;
  amount: string;
  category: string;
  date: Date;
  payerId: string;
  splitType: 'equal' | 'percentage' | 'custom' | 'income-proportional' | 'income-progressive' | 'weighted' | 'unequal' | 'shares' | 'adjustment' | 'exclude';
  selectedMembers: string[];
  excludedMembers: string[];
  notes: string;
  receipt?: File;
  splits: SplitDetail[];
  multiplePayers: boolean;
  payers: PayerDetail[];
  // Additional fields for backend integration
  groupId?: string;
  paymentMethod?: string;
  tags?: string[];
  location?: {
    name?: string;
    address?: string;
    coordinates?: [number, number];
  };
}

interface AddExpenseFormProps {
  groupId?: string;
  members: Member[];
  onSubmit: (expense: ExpenseFormData) => void;
  onCancel: () => void;
  defaultPayer?: string;
}

// Categories matching backend Expense model enum
const categories = [
  { id: 'Food & Dining', name: 'Food & Dining', icon: '🍽️', color: 'bg-orange-500' },
  { id: 'Transportation', name: 'Transportation', icon: '🚗', color: 'bg-blue-500' },
  { id: 'Shopping', name: 'Shopping', icon: '🛍️', color: 'bg-pink-500' },
  { id: 'Entertainment', name: 'Entertainment', icon: '🎬', color: 'bg-purple-500' },
  { id: 'Bills & Utilities', name: 'Bills & Utilities', icon: '📄', color: 'bg-yellow-500' },
  { id: 'Healthcare', name: 'Healthcare', icon: '🏥', color: 'bg-red-500' },
  { id: 'Travel', name: 'Travel', icon: '✈️', color: 'bg-blue-400' },
  { id: 'Education', name: 'Education', icon: '📚', color: 'bg-indigo-500' },
  { id: 'Groceries', name: 'Groceries', icon: '🛒', color: 'bg-green-500' },
  { id: 'Personal Care', name: 'Personal Care', icon: '💅', color: 'bg-pink-400' },
  { id: 'Home & Garden', name: 'Home & Garden', icon: '🏡', color: 'bg-green-600' },
  { id: 'Gifts & Donations', name: 'Gifts & Donations', icon: '🎁', color: 'bg-rose-500' },
  { id: 'Business', name: 'Business', icon: '💼', color: 'bg-gray-600' },
  { id: 'Other', name: 'Other', icon: '📦', color: 'bg-gray-500' }
];

const AddExpenseForm = ({ 
  groupId, 
  members, 
  onSubmit, 
  onCancel, 
  defaultPayer 
}: AddExpenseFormProps) => {
  // Enhanced state management
  const [formData, setFormData] = useState<ExpenseFormData>({
    title: '',
    amount: '',
    category: 'Food & Dining', // Default to first backend enum value
    date: new Date(),
    payerId: defaultPayer || members[0]?.id || '',
    splitType: 'equal',
    selectedMembers: members.filter(m => m.isActive).map(m => m.id),
    excludedMembers: [],
    notes: '',
    splits: [],
    multiplePayers: false,
    payers: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showCustomSplit, setShowCustomSplit] = useState(false);
  const [showExcludedMembers, setShowExcludedMembers] = useState(false);

  // Validation with user-friendly terminology
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.title.trim()) {
      newErrors.title = 'Expense title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (amount > 1000000) {
      newErrors.amount = 'Amount cannot exceed ₹10,00,000';
    }

    if (!formData.multiplePayers && !formData.payerId) {
      newErrors.payerId = 'Please select who paid for this expense';
    }

    if (formData.selectedMembers.length === 0) {
      newErrors.selectedMembers = 'Please select at least one member to split with';
    }

    // Multiple payers validation
    if (formData.multiplePayers) {
      if (formData.payers.length === 0) {
        newErrors.payers = 'Please add at least one payer';
      } else {
        const totalPayerAmount = formData.payers.reduce((sum, payer) => sum + (payer.amount || 0), 0);
        if (Math.abs(totalPayerAmount - amount) > 0.01) {
          newErrors.payers = `Total payer amounts (₹${totalPayerAmount.toFixed(2)}) must equal expense amount (₹${amount.toFixed(2)})`;
        }
        
        // Check for duplicate payers
        const payerIds = formData.payers.map(p => p.memberId);
        const uniquePayerIds = new Set(payerIds);
        if (payerIds.length !== uniquePayerIds.size) {
          newErrors.payers = 'Each member can only be added as a payer once';
        }
      }
    }

    // Split-specific validation with enhanced support for all 10 algorithms
    if (formData.selectedMembers.length > 0) {
      const totalAmount = parseFloat(formData.amount) || 0;
      
      switch (formData.splitType) {
        case 'percentage':
          const totalPercentage = formData.splits.reduce((sum, split) => sum + (split.percentage || 0), 0);
          if (Math.abs(totalPercentage - 100) > 0.01) {
            newErrors.splits = `Split percentages (${totalPercentage.toFixed(1)}%) must equal 100%`;
          }
          break;
          
        case 'custom':
        case 'unequal':
          const totalSplit = formData.splits.reduce((sum, split) => sum + (split.amount || 0), 0);
          if (Math.abs(totalSplit - totalAmount) > 0.01) {
            newErrors.splits = `Split amounts (₹${totalSplit.toFixed(2)}) must equal the total expense amount (₹${totalAmount.toFixed(2)})`;
          }
          break;
          
        case 'shares':
          const hasValidShares = formData.splits.every(split => split.shares && split.shares > 0);
          if (!hasValidShares) {
            newErrors.splits = 'All selected members must have valid share values greater than 0';
          }
          break;
          
        case 'weighted':
          const hasValidWeights = formData.splits.every(split => split.weight && split.weight > 0);
          if (!hasValidWeights) {
            newErrors.splits = 'All selected members must have valid weight values greater than 0';
          }
          break;
          
        case 'income-proportional':
        case 'income-progressive':
          const hasValidIncome = formData.selectedMembers.every(memberId => {
            const member = getMemberById(memberId);
            return member && member.income && member.income > 0;
          });
          if (!hasValidIncome) {
            newErrors.splits = 'All selected members must have valid income data for income-based splitting';
          }
          break;
          
        case 'adjustment':
          const adjustedTotal = formData.splits.reduce((sum, split) => {
            const baseAmount = totalAmount / formData.selectedMembers.length;
            const adjustedAmount = baseAmount + (split.adjustmentAmount || 0);
            return sum + adjustedAmount;
          }, 0);
          if (Math.abs(adjustedTotal - totalAmount) > 0.01) {
            newErrors.splits = `Adjusted amounts (₹${adjustedTotal.toFixed(2)}) must equal expense amount (₹${totalAmount.toFixed(2)})`;
          }
          break;
          
        case 'exclude':
          if (formData.excludedMembers && formData.excludedMembers.length >= formData.selectedMembers.length) {
            newErrors.excludedMembers = 'Cannot exclude all selected members';
          }
          break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Enhanced splitting algorithms using decimal.js for financial precision
  const calculateSplits = useCallback(() => {
    const amount = new Decimal(formData.amount || '0');
    const selectedMemberCount = formData.selectedMembers.length;

    if (selectedMemberCount === 0 || amount.isZero()) {
      setFormData(prev => ({ ...prev, splits: [] }));
      return;
    }

    let newSplits: SplitDetail[] = [];
    
    try {
      switch (formData.splitType) {
        case 'equal': {
          const equalAmount = amount.div(selectedMemberCount);
          newSplits = formData.selectedMembers.map(memberId => ({
            memberId,
            amount: equalAmount.toNumber(),
            percentage: new Decimal(100).div(selectedMemberCount).toNumber()
          }));
          break;
        }

        case 'percentage': {
          newSplits = formData.selectedMembers.map(memberId => {
            const existingSplit = formData.splits.find(s => s.memberId === memberId);
            const percentage = new Decimal(existingSplit?.percentage || (100 / selectedMemberCount));
            return {
              memberId,
              amount: amount.mul(percentage).div(100).toNumber(),
              percentage: percentage.toNumber()
            };
          });
          break;
        }

        case 'custom': {
          newSplits = formData.selectedMembers.map(memberId => {
            const existingSplit = formData.splits.find(s => s.memberId === memberId);
            const splitAmount = new Decimal(existingSplit?.amount || amount.div(selectedMemberCount).toNumber());
            return {
              memberId,
              amount: splitAmount.toNumber(),
              percentage: splitAmount.div(amount).mul(100).toNumber()
            };
          });
          break;
        }

        case 'income-proportional': {
          const membersWithIncome = formData.selectedMembers
            .map(id => ({ id, member: members.find(m => m.id === id) }))
            .filter(item => item.member?.income && item.member.income > 0);
          
          if (membersWithIncome.length === 0) {
            const equalAmount = amount.div(selectedMemberCount);
            newSplits = formData.selectedMembers.map(memberId => ({
              memberId,
              amount: equalAmount.toNumber(),
              percentage: new Decimal(100).div(selectedMemberCount).toNumber()
            }));
          } else {
            const totalIncome = membersWithIncome.reduce((sum, item) => 
              sum.add(item.member!.income!), new Decimal(0));
            
            newSplits = formData.selectedMembers.map(memberId => {
              const member = members.find(m => m.id === memberId);
              if (!member?.income || member.income <= 0) {
                const equalAmount = amount.div(selectedMemberCount);
                return {
                  memberId,
                  amount: equalAmount.toNumber(),
                  percentage: new Decimal(100).div(selectedMemberCount).toNumber()
                };
              }
              
              const memberIncome = new Decimal(member.income);
              const proportion = memberIncome.div(totalIncome);
              return {
                memberId,
                amount: amount.mul(proportion).toNumber(),
                percentage: proportion.mul(100).toNumber()
              };
            });
          }
          break;
        }

        case 'income-progressive': {
          const membersWithIncome = formData.selectedMembers
            .map(id => ({ id, member: members.find(m => m.id === id) }))
            .filter(item => item.member?.income && item.member.income > 0)
            .sort((a, b) => (a.member!.income! - b.member!.income!));
          
          if (membersWithIncome.length === 0) {
            const equalAmount = amount.div(selectedMemberCount);
            newSplits = formData.selectedMembers.map(memberId => ({
              memberId,
              amount: equalAmount.toNumber(),
              percentage: new Decimal(100).div(selectedMemberCount).toNumber()
            }));
          } else {
            const progressiveMultipliers: { [key: string]: Decimal } = {};
            
            membersWithIncome.forEach((item, index) => {
              const progressiveRate = new Decimal(1).add(new Decimal(index).mul(0.2));
              progressiveMultipliers[item.id] = progressiveRate;
            });
            
            const totalMultiplied = Object.values(progressiveMultipliers)
              .reduce((sum, multiplier) => sum.add(multiplier), new Decimal(0));
            
            newSplits = formData.selectedMembers.map(memberId => {
              const multiplier = progressiveMultipliers[memberId] || new Decimal(1);
              const proportion = multiplier.div(totalMultiplied);
              return {
                memberId,
                amount: amount.mul(proportion).toNumber(),
                percentage: proportion.mul(100).toNumber()
              };
            });
          }
          break;
        }

        case 'weighted': {
          const totalWeight = formData.selectedMembers.reduce((sum, memberId) => {
            const member = members.find(m => m.id === memberId);
            return sum.add(member?.weight || 1);
          }, new Decimal(0));
          
          newSplits = formData.selectedMembers.map(memberId => {
            const member = members.find(m => m.id === memberId);
            const weight = new Decimal(member?.weight || 1);
            const proportion = weight.div(totalWeight);
            return {
              memberId,
              amount: amount.mul(proportion).toNumber(),
              percentage: proportion.mul(100).toNumber()
            };
          });
          break;
        }
      }
      
      // Validate calculated splits
      const totalCalculated = newSplits.reduce((sum, split) => sum + (split.amount || 0), 0);
      const difference = Math.abs(amount.toNumber() - totalCalculated);
      
      if (difference > 0.01) {
        // Adjust the first split to ensure exact total
        if (newSplits.length > 0) {
          newSplits[0].amount += (amount.toNumber() - totalCalculated);
          newSplits[0].percentage = newSplits[0].amount / amount.toNumber() * 100;
        }
      }
      
      setFormData(prev => ({ ...prev, splits: newSplits }));
      
    } catch (error: any) {
      toast.error(`Split calculation failed: ${error.message}`);
      
      // Fallback to equal split
      const equalAmount = amount.div(selectedMemberCount);
      const fallbackSplits = formData.selectedMembers.map(memberId => ({
        memberId,
        amount: equalAmount.toNumber(),
        percentage: new Decimal(100).div(selectedMemberCount).toNumber()
      }));
      setFormData(prev => ({ ...prev, splits: fallbackSplits }));
    }
  }, [formData.amount, formData.selectedMembers, formData.splitType, members]);

  // Update splits when relevant fields change
  useEffect(() => {
    if (formData.amount && formData.selectedMembers.length > 0) {
      calculateSplits();
    }
  }, [formData.amount, formData.selectedMembers.length, formData.splitType]);

  // Handle file upload
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024;
      
      if (!isValidType) {
        toast.error('Please upload only images or PDF files');
        return false;
      }
      if (!isValidSize) {
        toast.error('File size must be less than 10MB');
        return false;
      }
      return true;
    });
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    // Pass the current form data directly to onSubmit
    onSubmit(formData);
    toast.success('Expense added successfully!');
  };

  // Get member by ID
  const getMemberById = (id: string) => members.find(m => m.id === id);

  // Update split amount/percentage
  const updateSplit = (memberId: string, field: 'amount' | 'percentage', value: number) => {
    setFormData(prev => ({
      ...prev,
      splits: prev.splits.map(split => 
        split.memberId === memberId 
          ? { 
              ...split, 
              [field]: value,
              ...(field === 'percentage' 
                ? { amount: parseFloat(((parseFloat(prev.amount) * value) / 100).toFixed(2)) }
                : { percentage: parseFloat(((value / parseFloat(prev.amount)) * 100).toFixed(2)) }
              )
            }
          : split
      )
    }));
  };

  const totalSplitAmount = formData.splits.reduce((sum, split) => sum + (split.amount || 0), 0);
  const totalSplitPercentage = formData.splits.reduce((sum, split) => sum + (split.percentage || 0), 0);
  
  // Memoize form validation
  const isFormValid = React.useMemo(() => {
    return formData.title.trim() && 
           parseFloat(formData.amount) > 0 && 
           formData.payerId && 
           formData.selectedMembers.length > 0;
  }, [formData]);

  return (
    <div className="w-full max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
      <Card className="glass-card border-white/20">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <span className="hidden sm:inline">Enhanced Add Expense - 6 Smart Splitting Methods</span>
            <span className="sm:hidden">Add Expense</span>
          </CardTitle>
          <p className="text-white/60 text-xs sm:text-sm">
            <span className="hidden sm:inline">Experience precision with decimal.js calculations and advanced splitting algorithms</span>
            <span className="sm:hidden">Smart expense splitting</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* Basic Information - Mobile Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label className="text-white font-medium">Expense Title *</Label>
              <Input
                placeholder="e.g., Lunch at restaurant, Train tickets"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/10 border-white/30 text-white placeholder:text-white/60"
              />
              {errors.title && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-white font-medium">Amount *</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="bg-white/10 border-white/30 text-white pl-10 placeholder:text-white/60"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.amount && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.amount}
                </p>
              )}
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-white font-medium">Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="bg-white/10 border-white/30 text-white">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {categories.find(c => c.id === formData.category)?.icon || '📦'}
                    </span>
                    <span>{formData.category}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-white/20 max-h-80 overflow-y-auto">
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="text-white font-medium">Date *</Label>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-black/95 border-white/20">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => {
                    if (date) {
                      setFormData(prev => ({ ...prev, date }));
                      setShowCalendar(false);
                    }
                  }}
                  initialFocus
                  className="text-white"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Payer Selection */}
          {!formData.multiplePayers && (
            <div className="space-y-2">
              <Label className="text-white font-medium">Paid By *</Label>
              <Select 
                value={formData.payerId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, payerId: value }))}
              >
                <SelectTrigger className="bg-white/10 border-white/30 text-white">
                  <SelectValue placeholder="Select who paid" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-white/20">
                  {members.filter(m => m.isActive).map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="text-xs">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.payerId && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.payerId}
                </p>
              )}
            </div>
          )}

          {/* Enhanced Split Type - 10 comprehensive methods */}
          <div className="space-y-4">
            <Label className="text-white font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Split Type (10 Advanced Methods)
            </Label>
            <Select 
              value={formData.splitType} 
              onValueChange={(value: any) => {
                setFormData(prev => ({ ...prev, splitType: value }));
                setShowCustomSplit(['percentage', 'custom', 'unequal', 'shares', 'adjustment'].includes(value));
                setShowExcludedMembers(value === 'exclude');
              }}
            >
              <SelectTrigger className="bg-white/10 border-white/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-white/20">
                <SelectItem value="equal">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-400" />
                    <span>Equal Split</span>
                  </div>
                </SelectItem>
                <SelectItem value="unequal">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span>Unequal Split</span>
                  </div>
                </SelectItem>
                <SelectItem value="percentage">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-purple-400" />
                    <span>Percentage Split</span>
                  </div>
                </SelectItem>
                <SelectItem value="shares">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-cyan-400" />
                    <span>By Shares</span>
                  </div>
                </SelectItem>
                <SelectItem value="adjustment">
                  <div className="flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-yellow-400" />
                    <span>With Adjustments</span>
                  </div>
                </SelectItem>
                <SelectItem value="exclude">
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-400" />
                    <span>Exclude Members</span>
                  </div>
                </SelectItem>
                <SelectItem value="income-proportional">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                    <span>Income Proportional</span>
                  </div>
                </SelectItem>
                <SelectItem value="income-progressive">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-400" />
                    <span>Income Progressive</span>
                  </div>
                </SelectItem>
                <SelectItem value="weighted">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-pink-400" />
                    <span>Weighted Split</span>
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-gray-400" />
                    <span>Custom Amount</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Split Type Description */}
            <div className="bg-white/5 border border-white/20 rounded-lg p-4">
              <div className="text-white/80 text-sm">
                {formData.splitType === 'equal' && 'Expense is divided equally among all selected members.'}
                {formData.splitType === 'unequal' && 'Specify different amounts for each member manually.'}
                {formData.splitType === 'percentage' && 'Set custom percentages for each member (must total 100%).'}
                {formData.splitType === 'shares' && 'Assign shares to members based on consumption or usage.'}
                {formData.splitType === 'adjustment' && 'Make custom adjustments to individual member amounts.'}
                {formData.splitType === 'exclude' && 'Exclude specific members from sharing this expense.'}
                {formData.splitType === 'income-proportional' && 'Split based on income ratios - higher earners pay proportionally more.'}
                {formData.splitType === 'income-progressive' && 'Progressive scaling where higher earners pay disproportionately more.'}
                {formData.splitType === 'weighted' && 'Split based on custom weight factors for each member.'}
                {formData.splitType === 'custom' && 'Specify exact amounts for each member manually.'}
              </div>
            </div>
          </div>

          {/* Multiple Payers Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/20 rounded-lg">
              <div>
                <Label className="text-white font-medium">Multiple Payers?</Label>
                <p className="text-white/60 text-sm">Enable if expense was paid by multiple people</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm">
                  {formData.multiplePayers ? 'Yes' : 'No'}
                </span>
                <Checkbox
                  checked={formData.multiplePayers}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      multiplePayers: !!checked,
                      payers: checked ? [{ memberId: prev.payerId, amount: parseFloat(prev.amount) || 0 }] : []
                    }));
                  }}
                />
              </div>
            </div>

            {/* Multiple Payers Container */}
            {formData.multiplePayers && (
              <Card className="bg-white/5 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Payers and Amounts
                  </CardTitle>
                  <p className="text-white/60 text-sm">Specify who paid what amount</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {formData.payers.map((payer, index) => {
                    const member = getMemberById(payer.memberId);
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member?.avatar} alt={member?.name} />
                          <AvatarFallback className="text-xs">
                            {member?.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <Select 
                          value={payer.memberId} 
                          onValueChange={(memberId) => {
                            setFormData(prev => ({
                              ...prev,
                              payers: prev.payers.map((p, i) => 
                                i === index ? { ...p, memberId } : p
                              )
                            }));
                          }}
                        >
                          <SelectTrigger className="flex-1 bg-white/10 border-white/30 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {members.map(member => (
                              <SelectItem key={member.id} value={member.id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={member.avatar} alt={member.name} />
                                    <AvatarFallback className="text-xs">
                                      {member.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{member.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={payer.amount}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                payers: prev.payers.map((p, i) => 
                                  i === index ? { ...p, amount: parseFloat(e.target.value) || 0 } : p
                                )
                              }));
                            }}
                            className="w-32 bg-white/10 border-white/30 text-white pl-10"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        {formData.payers.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                payers: prev.payers.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-red-400 hover:bg-red-500/20"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        payers: [...prev.payers, { memberId: members[0]?.id || '', amount: 0 }]
                      }));
                    }}
                    className="w-full border-white/30 text-white hover:bg-white/10"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payer
                  </Button>
                  
                  {/* Payers Total */}
                  <div className="mt-4 p-3 bg-white/10 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Total Paid:</span>
                      <span className="text-white font-medium">
                        ₹{formData.payers.reduce((sum, payer) => sum + payer.amount, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Expense Amount:</span>
                      <span className="text-white font-medium">₹{parseFloat(formData.amount || '0').toFixed(2)}</span>
                    </div>
                    {Math.abs(formData.payers.reduce((sum, payer) => sum + payer.amount, 0) - parseFloat(formData.amount || '0')) > 0.01 && (
                      <div className="mt-2 text-red-400 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Paid amounts must equal expense amount
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Enhanced Member Selection - Mobile Responsive */}
          <div className="space-y-4">
            <Label className="text-white font-medium text-sm sm:text-base">Split Between *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {members.filter(m => m.isActive).map(member => {
                const isExcluded = formData.excludedMembers.includes(member.id);
                const isSelected = formData.selectedMembers.includes(member.id);
                
                return (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={member.id}
                      checked={isSelected && !isExcluded}
                      disabled={isExcluded}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            selectedMembers: [...prev.selectedMembers, member.id]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            selectedMembers: prev.selectedMembers.filter(id => id !== member.id)
                          }));
                        }
                      }}
                    />
                    <Label 
                      htmlFor={member.id} 
                      className={`cursor-pointer flex items-center gap-2 ${
                        isExcluded ? 'text-white/40' : 'text-white'
                      }`}
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                      {isExcluded && (
                        <Badge variant="secondary" className="text-xs">
                          Excluded
                        </Badge>
                      )}
                    </Label>
                  </div>
                );
              })}
            </div>
            {errors.selectedMembers && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.selectedMembers}
              </p>
            )}
          </div>

          {/* Excluded Members Section */}
          {showExcludedMembers && formData.splitType === 'exclude' && (
            <div className="space-y-4">
              <Label className="text-white font-medium">Exclude Members</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.filter(m => m.isActive).map(member => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`exclude-${member.id}`}
                      checked={formData.excludedMembers.includes(member.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            excludedMembers: [...prev.excludedMembers, member.id],
                            selectedMembers: prev.selectedMembers.filter(id => id !== member.id)
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            excludedMembers: prev.excludedMembers.filter(id => id !== member.id)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={`exclude-${member.id}`} className="text-white cursor-pointer flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                    </Label>
                  </div>
                ))}
              </div>
              
              {formData.excludedMembers.length > 0 && (
                <Alert className="border-yellow-500 bg-yellow-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-yellow-400">
                    {formData.excludedMembers.length} member(s) excluded from this expense
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-white font-medium">Notes (Optional)</Label>
            <Textarea
              placeholder="Add any additional details about this expense..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="bg-white/10 border-white/30 text-white placeholder:text-white/60"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-white/30 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddExpenseForm;
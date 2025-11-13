import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Calculator,
  Zap,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  History,
  Info,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuditRecord {
  _id: string;
  expenseId: string;
  calculationType: string;
  method: string;
  inputData: {
    totalAmount: number;
    currency: string;
    members: Array<{
      userId: string;
      name: string;
      amount?: number;
      percentage?: number;
      income?: number;
      weight?: number;
    }>;
  };
  results: {
    splits: Array<{
      userId: string;
      name: string;
      amount: number;
      percentage: number;
    }>;
    totalSplit: number;
    calculatedAt: string;
  };
  validation: {
    isValid: boolean;
    difference: number;
    message: string;
  };
  calculationSteps: Array<{
    step: number;
    operation: string;
    description: string;
    timestamp: string;
  }>;
  optimization?: {
    originalTransactions: number;
    optimizedTransactions: number;
    savingsPercentage: number;
  };
  isDisputed: boolean;
  disputeInfo?: {
    disputedBy: {
      firstName: string;
      lastName: string;
    };
    disputeReason: string;
    disputedAt: string;
  };
  userId: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: string;
}

interface CalculationAuditViewerProps {
  groupId: string;
  expenseId?: string;
}

// Audit Record Card Component
const AuditRecordCard = ({ record, onViewDetails }) => {
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'equal': return Users;
      case 'percentage': return PieChart;
      case 'custom': return Calculator;
      case 'income_proportional':
      case 'income_progressive': return TrendingUp;
      case 'weighted': return BarChart3;
      default: return Activity;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'equal': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'percentage': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'custom': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'income_proportional':
      case 'income_progressive': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'weighted': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const MethodIcon = getMethodIcon(record.method);
  const methodColor = getMethodColor(record.method);

  return (
    <Card className="glass-card hover:shadow-glow transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${methodColor}`}>
              <MethodIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-white">{record.calculationType.replace('_', ' ').toUpperCase()}</h4>
              <p className="text-sm text-white/60">
                {new Date(record.createdAt).toLocaleDateString()} at {new Date(record.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {record.validation.isValid ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Valid
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Invalid
              </Badge>
            )}
            
            {record.isDisputed && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Disputed
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">₹{record.inputData.totalAmount.toFixed(2)}</div>
            <p className="text-xs text-white/60">Total Amount</p>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-white">₹{record.results.totalSplit.toFixed(2)}</div>
            <p className="text-xs text-white/60">Calculated</p>
          </div>
          
          <div className="text-center">
            <div className={`text-lg font-bold ${
              Math.abs(record.validation.difference) < 0.01 ? 'text-green-400' : 'text-red-400'
            }`}>
              ₹{Math.abs(record.validation.difference).toFixed(2)}
            </div>
            <p className="text-xs text-white/60">Difference</p>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-white">{record.inputData.members.length}</div>
            <p className="text-xs text-white/60">Members</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={record.userId.avatar} />
              <AvatarFallback className="bg-primary/20 text-white text-xs">
                {record.userId.firstName.charAt(0)}{record.userId.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-white/70">
              by {record.userId.firstName} {record.userId.lastName}
            </span>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(record)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Eye className="w-4 h-4 mr-2" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Audit Statistics Component
const AuditStatistics = ({ stats }) => {
  if (!stats) return null;

  const successRate = parseFloat(stats.successRate);
  const disputeRate = parseFloat(stats.disputeRate);

  return (
    <Card className="glass-card bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Audit Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalCalculations}</div>
            <p className="text-sm text-white/60">Total Calculations</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.successfulCalculations}</div>
            <p className="text-sm text-white/60">Successful</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{stats.failedCalculations}</div>
            <p className="text-sm text-white/60">Failed</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.disputedCalculations}</div>
            <p className="text-sm text-white/60">Disputed</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/70">Success Rate</span>
              <span className="text-green-400">{successRate.toFixed(1)}%</span>
            </div>
            <Progress value={successRate} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/70">Dispute Rate</span>
              <span className="text-yellow-400">{disputeRate.toFixed(1)}%</span>
            </div>
            <Progress value={disputeRate} className="h-2" />
          </div>
        </div>
        
        {stats.methodDistribution && Object.keys(stats.methodDistribution).length > 0 && (
          <div className="mt-6">
            <h4 className="text-white font-medium mb-3">Method Distribution</h4>
            <div className="space-y-2">
              {Object.entries(stats.methodDistribution).map(([method, count]) => (
                <div key={method} className="flex justify-between items-center">
                  <span className="text-white/70 capitalize">{method.replace('_', ' ')}</span>
                  <Badge variant="outline" className="text-white/70">
                    {count as number}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Detailed Audit View Modal
const AuditDetailsModal = ({ record, isOpen, onClose }) => {
  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Calculation Audit Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Header Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-white/70 text-sm">Method</Label>
              <p className="text-white font-medium capitalize">{record.method.replace('_', ' ')}</p>
            </div>
            <div>
              <Label className="text-white/70 text-sm">Total Amount</Label>
              <p className="text-white font-medium">₹{record.inputData.totalAmount.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-white/70 text-sm">Calculated Total</Label>
              <p className="text-white font-medium">₹{record.results.totalSplit.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-white/70 text-sm">Status</Label>
              <div className="flex items-center gap-2">
                {record.validation.isValid ? (
                  <Badge className="bg-green-500/20 text-green-400">Valid</Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-400">Invalid</Badge>
                )}
              </div>
            </div>
          </div>
          
          <Separator className="bg-white/10" />
          
          {/* Split Results */}
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Split Results
            </h4>
            <div className="space-y-2">
              {record.results.splits.map((split, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <span className="text-white">{split.name}</span>
                  <div className="text-right">
                    <div className="text-white font-medium">₹{split.amount.toFixed(2)}</div>
                    <div className="text-white/60 text-sm">{split.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Calculation Steps */}
          {record.calculationSteps && record.calculationSteps.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Calculation Steps
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {record.calculationSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                    <Badge variant="outline" className="text-white/70 min-w-fit">
                      {step.step}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-white font-medium">{step.operation}</p>
                      {step.description && (
                        <p className="text-white/60 text-sm mt-1">{step.description}</p>
                      )}
                      <p className="text-white/50 text-xs mt-1">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Optimization Info */}
          {record.optimization && (
            <div>
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Optimization Results
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-white/5">
                  <div className="text-lg font-bold text-red-400">{record.optimization.originalTransactions}</div>
                  <p className="text-xs text-white/60">Original</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/5">
                  <div className="text-lg font-bold text-primary">{record.optimization.optimizedTransactions}</div>
                  <p className="text-xs text-white/60">Optimized</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/5">
                  <div className="text-lg font-bold text-green-400">{record.optimization.savingsPercentage}%</div>
                  <p className="text-xs text-white/60">Savings</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Dispute Information */}
          {record.isDisputed && record.disputeInfo && (
            <div>
              <Alert className="border-yellow-500/20 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-400">
                  <strong>Disputed by:</strong> {record.disputeInfo.disputedBy.firstName} {record.disputeInfo.disputedBy.lastName}
                  <br />
                  <strong>Reason:</strong> {record.disputeInfo.disputeReason}
                  <br />
                  <strong>Date:</strong> {new Date(record.disputeInfo.disputedAt).toLocaleDateString()}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const CalculationAuditViewer: React.FC<CalculationAuditViewerProps> = ({ 
  groupId, 
  expenseId 
}) => {
  const { toast } = useToast();
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Mock data - in real app, this would come from API
  const [auditRecords] = useState<AuditRecord[]>([
    {
      _id: '1',
      expenseId: 'exp1',
      calculationType: 'expense_split',
      method: 'equal',
      inputData: {
        totalAmount: 100,
        currency: 'INR',
        members: [
          { userId: '1', name: 'Alice Johnson', amount: 33.33 },
          { userId: '2', name: 'Bob Smith', amount: 33.33 },
          { userId: '3', name: 'Charlie Brown', amount: 33.34 }
        ]
      },
      results: {
        splits: [
          { userId: '1', name: 'Alice Johnson', amount: 33.33, percentage: 33.33 },
          { userId: '2', name: 'Bob Smith', amount: 33.33, percentage: 33.33 },
          { userId: '3', name: 'Charlie Brown', amount: 33.34, percentage: 33.34 }
        ],
        totalSplit: 100,
        calculatedAt: new Date().toISOString()
      },
      validation: {
        isValid: true,
        difference: 0,
        message: 'Split calculation is accurate'
      },
      calculationSteps: [
        {
          step: 1,
          operation: 'Calculate base split',
          description: 'Divide total amount by number of members',
          timestamp: new Date().toISOString()
        },
        {
          step: 2,
          operation: 'Handle remainder',
          description: 'Distribute remainder to first member',
          timestamp: new Date().toISOString()
        }
      ],
      isDisputed: false,
      userId: {
        firstName: 'Alice',
        lastName: 'Johnson',
        avatar: null
      },
      createdAt: new Date().toISOString()
    }
  ]);

  const [stats] = useState({
    totalCalculations: 25,
    successfulCalculations: 23,
    failedCalculations: 2,
    disputedCalculations: 1,
    successRate: '92.0',
    disputeRate: '4.0',
    methodDistribution: {
      equal: 12,
      percentage: 8,
      custom: 3,
      income_proportional: 2
    }
  });

  const filteredRecords = useMemo(() => {
    return auditRecords.filter(record => {
      const matchesSearch = record.userId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.userId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.calculationType.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMethod = filterMethod === 'all' || record.method === filterMethod;
      
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'valid' && record.validation.isValid) ||
                           (filterStatus === 'invalid' && !record.validation.isValid) ||
                           (filterStatus === 'disputed' && record.isDisputed);
      
      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [auditRecords, searchTerm, filterMethod, filterStatus]);

  const handleViewDetails = (record: AuditRecord) => {
    setSelectedRecord(record);
    setIsDetailsOpen(true);
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Audit data export will begin shortly.'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Calculation Audit Trail
          </h2>
          <p className="text-white/60 mt-1">
            Transparent calculation history and validation records
          </p>
        </div>
        
        <Button
          onClick={handleExport}
          className="bg-primary/20 text-primary hover:bg-primary hover:text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Statistics */}
      <AuditStatistics stats={stats} />

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
                <Input
                  placeholder="Search calculations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
            </div>
            
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Filter by method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="equal">Equal Split</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="income_proportional">Income Proportional</SelectItem>
                <SelectItem value="weighted">Weighted</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="invalid">Invalid</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Records */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="text-center py-12">
              <History className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Audit Records Found</h3>
              <p className="text-white/60">
                {auditRecords.length === 0 
                  ? 'No calculations have been performed yet.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => (
            <AuditRecordCard
              key={record._id}
              record={record}
              onViewDetails={handleViewDetails}
            />
          ))
        )}
      </div>

      {/* Audit Details Modal */}
      <AuditDetailsModal
        record={selectedRecord}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedRecord(null);
        }}
      />
    </div>
  );
};

export default CalculationAuditViewer;
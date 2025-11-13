import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Filter, Calendar as CalendarIcon, Download, SortAsc, SortDesc, ArrowUpDown, Clock, CheckCircle, AlertCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import withLayout from "@/components/withLayout";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import type { TransactionFilters } from "@/hooks/useTransactionHistory";

interface HistoryProps {
  mode?: 'group' | 'personal';
}

const History = (props: HistoryProps) => {
  // Use mode from props, default to 'group' only if not provided
  const mode = props.mode || 'group';
  
  console.log('History page - mode:', mode, 'props.mode:', props.mode);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>();
  const [selectedTab, setSelectedTab] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  
  // Use the custom hook for real data
  const historyMode = mode === 'group' ? 'group' : 'personal';
  const { 
    transactions, 
    summary, 
    pagination,
    isLoading, 
    error,
    setFilters,
    refetch,
    filters
  } = useTransactionHistory(historyMode, {
    page: 1,
    limit: 10,  // Show 10 entries per page
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  // Update filters when search term changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== filters.searchTerm) {
        setFilters({ searchTerm, page: 1 });
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);
  
  // Update filters when category changes
  useEffect(() => {
    if (filterCategory !== filters.category) {
      setFilters({ category: filterCategory === 'all' ? undefined : filterCategory, page: 1 });
    }
  }, [filterCategory]);
  
  // Update filters when status changes
  useEffect(() => {
    if (filterStatus !== filters.status) {
      setFilters({ status: filterStatus === 'all' ? undefined : filterStatus, page: 1 });
    }
  }, [filterStatus]);
  
  // Update filters when date range changes
  useEffect(() => {
    if (filterDateRange) {
      setFilters({
        startDate: filterDateRange.from?.toISOString(),
        endDate: filterDateRange.to?.toISOString(),
        page: 1
      });
    } else {
      setFilters({ startDate: undefined, endDate: undefined, page: 1 });
    }
  }, [filterDateRange]);
  
  // Update filters when tab changes
  useEffect(() => {
    const type = selectedTab === 'all' ? undefined : selectedTab as 'income' | 'expense';
    if (type !== filters.type) {
      setFilters({ type, page: 1 });
    }
  }, [selectedTab]);

  // Categories for filtering
  const categories = mode === 'group' 
    ? ['Food & Dining', 'Travel', 'Entertainment', 'Bills & Utilities', 'Transportation', 'Shopping', 'Other']
    : ['Food & Dining', 'Work', 'Entertainment', 'Transportation', 'Healthcare', 'Education', 'Shopping', 'Salary', 'Other'];
  // Handle sort toggle
  const toggleSort = (field: string) => {
    if (filters.sortBy === field) {
      const newOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
      setFilters({ sortOrder: newOrder });
    } else {
      setFilters({ sortBy: field as 'date' | 'amount' | 'title', sortOrder: 'desc' });
    }
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setFilters({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Export functionality
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setIsExporting(true);
      
      // Prepare CSV data
      const headers = [
        'Date',
        'Title',
        'Description',
        'Category',
        'Amount',
        'Type',
        ...(mode === 'group' ? ['Status', 'Paid By', 'Split Between'] : ['Method'])
      ];
      
      const csvData = transactions.map(tx => {
        const baseData = [
          format(new Date(tx.date), 'yyyy-MM-dd HH:mm:ss'),
          tx.title,
          tx.description,
          tx.category,
          tx.amount.toString(),
          tx.type
        ];
        
        if (mode === 'group') {
          return [
            ...baseData,
            tx.status || '',
            tx.paidBy || '',
            tx.splitBetween ? tx.splitBetween.join(', ') : ''
          ];
        } else {
          return [...baseData, tx.method || ''];
        }
      });
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const filename = `${mode}-transactions-${format(new Date(), 'yyyy-MM-dd')}.${format}`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Exported ${transactions.length} transactions to ${filename}`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export transactions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'settled':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-primary" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'settled':
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
      case 'initiated':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'partial':
      case 'processing':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'cancelled':
      case 'failed':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-secondary';
    }
  };
  return <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {mode === 'group' ? 'Group Transaction History' : 'Personal Transaction History'}
          </h1>
          <p className="text-muted-foreground">
            Complete history of all your {mode === 'group' ? 'group' : 'personal'} transactions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={isExporting || transactions.length === 0}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search transactions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => <SelectItem key={category} value={category}>{category}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Status Filter (Group Mode Only) */}
            {mode === 'group' && <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>}

            {/* Sort Options */}
            <Select value={`${filters.sortBy}-${filters.sortOrder}`} onValueChange={value => {
            const [field, order] = value.split('-');
            setFilters({ sortBy: field as 'date' | 'amount' | 'title', sortOrder: order as 'asc' | 'desc' });
          }}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                <SelectItem value="title-desc">Title (Z-A)</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left text-zinc-950">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDateRange?.from ? filterDateRange.to ? <>
                        {format(filterDateRange.from, "LLL dd")} -{" "}
                        {format(filterDateRange.to, "LLL dd")}
                      </> : format(filterDateRange.from, "LLL dd, y") : "Date Range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={filterDateRange?.from} selected={filterDateRange} onSelect={setFilterDateRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>

      {/* Transaction Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="text-slate-950">All Transactions</TabsTrigger>
          <TabsTrigger value="expense" className="text-slate-950">Expenses</TabsTrigger>
          <TabsTrigger value="income" className="text-slate-950">Income</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {pagination ? (
                <>Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} transactions</>
              ) : (
                <>Showing {transactions.length} transactions</>
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toggleSort('date')} className="gap-2 text-slate-950">
                Date
                {filters.sortBy === 'date' ? (filters.sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />) : <ArrowUpDown className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => toggleSort('amount')} className="gap-2 text-slate-950">
                Amount
                {filters.sortBy === 'amount' ? (filters.sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />) : <ArrowUpDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading transactions...</span>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <Card className="glass-card border-destructive/50">
              <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error Loading Transactions</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={refetch} variant="outline">
                  Try Again
                </Button>
              </div>
            </Card>
          )}
          
          {/* Transaction List */}
          {!isLoading && !error && (
            <div className="space-y-4">
              {transactions.length > 0 ? transactions.map(transaction => <Card key={transaction.id} className="glass-card hover-scale">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{transaction.title}</h4>
                            {mode === 'group' && transaction.status && <Badge className={getStatusColor(transaction.status)}>
                                {getStatusIcon(transaction.status)}
                                <span className="ml-1 capitalize">{transaction.status}</span>
                              </Badge>}
                            <Badge variant="outline">{transaction.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{transaction.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{format(new Date(transaction.date), 'PPP')}</span>
                            {mode === 'group' && transaction.paidBy && <span>Paid by {transaction.paidBy}</span>}
                            {mode === 'group' && transaction.splitBetween && <span>Split between {transaction.splitBetween.length} people</span>}
                            {transaction.method && <span className="capitalize">{transaction.method}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${transaction.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                            {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                          </p>
                          {mode === 'group' && transaction.status === 'settled' && transaction.settlement_date && <p className="text-xs text-success">
                              Settled on {format(new Date(transaction.settlement_date), 'PP')}
                            </p>}
                          {transaction.groupName && <p className="text-xs text-muted-foreground mt-1">
                              {transaction.groupName}
                            </p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>) : <Card className="glass-card">
                <div className="p-12 text-center">
                  <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search terms
                  </p>
                </div>
              </Card>}
              
              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>;
};
export default withLayout(History);

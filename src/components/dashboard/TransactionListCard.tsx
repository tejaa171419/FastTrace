import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import * as Icons from "lucide-react";
import { Transaction } from "@/lib/services/personalDashboardService";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface TransactionListCardProps {
  transactions: Transaction[];
}

// Icon mapping for transaction categories
const getCategoryIcon = (category: string, type: string): string => {
  if (type === 'income') return 'DollarSign';
  
  const iconMap: Record<string, string> = {
    'Food & Dining': 'Coffee',
    'Transportation': 'Car',
    'Shopping': 'ShoppingCart',
    'Entertainment': 'Music',
    'Bills & Utilities': 'Receipt',
    'Healthcare': 'Heart',
    'Travel': 'Plane',
    'Education': 'BookOpen',
    'Groceries': 'ShoppingBag',
    'Home & Garden': 'Home',
  };
  
  return iconMap[category] || 'Receipt';
};

// Color mapping for transaction categories
const getCategoryColor = (category: string, type: string): string => {
  if (type === 'income') return 'text-green-400';
  
  const colorMap: Record<string, string> = {
    'Food & Dining': 'text-orange-400',
    'Transportation': 'text-blue-400',
    'Shopping': 'text-purple-400',
    'Entertainment': 'text-pink-400',
    'Bills & Utilities': 'text-red-400',
    'Healthcare': 'text-rose-400',
    'Travel': 'text-cyan-400',
    'Education': 'text-indigo-400',
    'Groceries': 'text-emerald-400',
    'Home & Garden': 'text-lime-400',
  };
  
  return colorMap[category] || 'text-gray-400';
};

export const TransactionListCard = ({ transactions }: TransactionListCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="lg:col-span-2 glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-warning rounded-full animate-pulse-glow" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No transactions yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start tracking your expenses!
            </p>
            <Button 
              className="mt-4 bg-gradient-primary"
              onClick={() => navigate('/personal-expenses')}
            >
              Add First Expense
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const iconName = getCategoryIcon(transaction.category, transaction.type);
              const color = getCategoryColor(transaction.category, transaction.type);
              const Icon = (Icons as any)[iconName];
              
              return (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-4 rounded-xl glass-card border-white/10 hover:bg-white/5 transition-all duration-300 group cursor-pointer"
                  onClick={() => navigate(`/expense/${transaction._id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300`}>
                      {Icon && <Icon className={`w-5 h-5 ${color}`} />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                        {transaction.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {transaction.description || transaction.category}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(transaction.date), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      transaction.amount > 0 ? 'text-success' : 'text-foreground'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {transaction.category}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionListCard;

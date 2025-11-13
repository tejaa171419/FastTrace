import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BudgetCategory } from "@/lib/services/personalDashboardService";

interface BudgetProgressCardProps {
  budgets: BudgetCategory[];
}

export const BudgetProgressCard = ({ budgets }: BudgetProgressCardProps) => {
  return (
    <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" />
          Budget Progress
        </CardTitle>
        <CardDescription>Track your spending limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {budgets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No budgets set yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Set budgets to track your spending!
            </p>
          </div>
        ) : (
          budgets.map((item, index) => {
            const percentage = item.percentage;
            const isOverBudget = item.isOverBudget;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{item.category}</span>
                  <span className={`font-semibold ${isOverBudget ? 'text-destructive' : 'text-muted-foreground'}`}>
                    ₹{item.spent.toLocaleString()} / ₹{item.budget.toLocaleString()}
                  </span>
                </div>
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className="h-2"
                  indicatorClassName={isOverBudget ? 'bg-destructive' : 'bg-primary'}
                  style={{
                    '--indicator-color': isOverBudget ? undefined : item.color
                  } as React.CSSProperties}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{percentage.toFixed(0)}% used</span>
                  <span>
                    {isOverBudget 
                      ? 'Over budget!' 
                      : `₹${(item.budget - item.spent).toLocaleString()} left`
                    }
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetProgressCard;

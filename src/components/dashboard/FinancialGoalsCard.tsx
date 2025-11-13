import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FinancialGoal } from "@/lib/services/personalDashboardService";

interface FinancialGoalsCardProps {
  goals: FinancialGoal[];
  onAddGoal?: () => void;
}

export const FinancialGoalsCard = ({ goals, onAddGoal }: FinancialGoalsCardProps) => {
  const getProgressColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'at-risk':
        return 'bg-gradient-to-r from-orange-500 to-red-500';
      default:
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    }
  };

  return (
    <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
              Financial Goals
            </CardTitle>
            <CardDescription>Track your progress towards financial targets</CardDescription>
          </div>
          {onAddGoal && (
            <Button variant="ghost" size="sm" onClick={onAddGoal}>
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No financial goals yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Set goals to achieve your financial dreams!
            </p>
            {onAddGoal && (
              <Button 
                className="mt-4 bg-gradient-primary"
                onClick={onAddGoal}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <div key={goal._id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{goal.name}</span>
                  <span 
                    className="text-sm font-semibold"
                    style={{ color: goal.color }}
                  >
                    ₹{goal.currentAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}
                  </span>
                </div>
                <Progress 
                  value={goal.percentage} 
                  className="h-2" 
                  indicatorClassName={getProgressColor(goal.status)}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {goal.percentage.toFixed(0)}% completed
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₹{(goal.targetAmount - goal.currentAmount).toLocaleString()} to go
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialGoalsCard;

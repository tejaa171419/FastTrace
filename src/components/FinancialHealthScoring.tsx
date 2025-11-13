import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, TrendingDown, Shield, Target, AlertTriangle, 
  CheckCircle, Star, Award, Lightbulb, ArrowRight,
  PiggyBank, CreditCard, Wallet, BarChart3, Users,
  Calendar, Zap, Brain, Heart
} from "lucide-react";

interface FinancialMetrics {
  income: number;
  expenses: number;
  savings: number;
  debt: number;
  emergencyFund: number;
  investments: number;
  budgetAdherence: number;
  expenseVariability: number;
  savingsGrowth: number;
  debtToIncomeRatio: number;
}

interface ScoreComponent {
  name: string;
  score: number;
  weight: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  recommendations: string[];
}

interface FinancialGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline: Date;
  category: 'savings' | 'debt' | 'investment' | 'expense';
  priority: 'high' | 'medium' | 'low';
}

const FinancialHealthScoring = () => {
  // Mock financial data
  const [financialData] = useState<FinancialMetrics>({
    income: 75000,
    expenses: 45000,
    savings: 15000,
    debt: 25000,
    emergencyFund: 18000,
    investments: 35000,
    budgetAdherence: 78,
    expenseVariability: 15,
    savingsGrowth: 12,
    debtToIncomeRatio: 33
  });

  const [goals] = useState<FinancialGoal[]>([
    {
      id: '1',
      title: 'Emergency Fund (6 months)',
      target: 22500,
      current: 18000,
      deadline: new Date('2024-12-31'),
      category: 'savings',
      priority: 'high'
    },
    {
      id: '2', 
      title: 'Pay off Credit Card',
      target: 0,
      current: 8000,
      deadline: new Date('2024-08-31'),
      category: 'debt',
      priority: 'high'
    },
    {
      id: '3',
      title: 'Investment Portfolio',
      target: 50000,
      current: 35000,
      deadline: new Date('2025-06-30'),
      category: 'investment',
      priority: 'medium'
    }
  ]);

  const [activeTab, setActiveTab] = useState('overview');

  // Calculate financial health components
  const scoreComponents = useMemo((): ScoreComponent[] => {
    const components: ScoreComponent[] = [
      {
        name: 'Savings Rate',
        score: Math.min((financialData.savings / financialData.income) * 100, 100),
        weight: 25,
        maxScore: 100,
        status: 'good',
        description: 'Percentage of income saved monthly',
        recommendations: [
          'Aim for 20% savings rate',
          'Set up automatic transfers',
          'Review monthly expenses'
        ]
      },
      {
        name: 'Debt Management', 
        score: Math.max(100 - financialData.debtToIncomeRatio, 0),
        weight: 20,
        maxScore: 100,
        status: 'fair',
        description: 'Debt-to-income ratio assessment',
        recommendations: [
          'Keep debt below 30% of income',
          'Prioritize high-interest debt',
          'Consider debt consolidation'
        ]
      },
      {
        name: 'Emergency Fund',
        score: Math.min((financialData.emergencyFund / (financialData.expenses * 6)) * 100, 100),
        weight: 20,
        maxScore: 100,
        status: 'good',
        description: 'Emergency fund coverage in months',
        recommendations: [
          'Build 6 months of expenses',
          'Keep in high-yield savings',
          'Regular contributions'
        ]
      },
      {
        name: 'Budget Adherence',
        score: financialData.budgetAdherence,
        weight: 15,
        maxScore: 100,
        status: 'good',
        description: 'How well you stick to your budget',
        recommendations: [
          'Track expenses daily',
          'Use budgeting apps',
          'Review weekly'
        ]
      },
      {
        name: 'Investment Growth',
        score: Math.min(financialData.savingsGrowth * 8, 100),
        weight: 10,
        maxScore: 100,
        status: 'excellent',
        description: 'Investment portfolio performance',
        recommendations: [
          'Diversify portfolio',
          'Regular contributions',
          'Review asset allocation'
        ]
      },
      {
        name: 'Expense Stability',
        score: Math.max(100 - financialData.expenseVariability * 3, 0),
        weight: 10,
        maxScore: 100,
        status: 'excellent',
        description: 'Consistency in monthly expenses',
        recommendations: [
          'Track variable expenses',
          'Create spending limits',
          'Plan major purchases'
        ]
      }
    ];

    // Update status based on scores
    components.forEach(component => {
      if (component.score >= 80) component.status = 'excellent';
      else if (component.score >= 65) component.status = 'good';
      else if (component.score >= 50) component.status = 'fair';
      else component.status = 'poor';
    });

    return components;
  }, [financialData]);

  // Calculate overall health score
  const overallScore = useMemo(() => {
    const weightedSum = scoreComponents.reduce((sum, component) => {
      return sum + (component.score * component.weight / 100);
    }, 0);
    return Math.round(weightedSum);
  }, [scoreComponents]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 65) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (status: string) => {
    const variants = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800', 
      fair: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || variants.fair;
  };

  const getHealthDescription = (score: number) => {
    if (score >= 85) return { text: "Excellent Financial Health", icon: Award, color: "text-green-600" };
    if (score >= 70) return { text: "Good Financial Health", icon: CheckCircle, color: "text-blue-600" };
    if (score >= 55) return { text: "Fair Financial Health", icon: TrendingUp, color: "text-yellow-600" };
    return { text: "Needs Improvement", icon: AlertTriangle, color: "text-red-600" };
  };

  const healthStatus = getHealthDescription(overallScore);

  return (
    <div className="space-y-6">
      {/* Header with Overall Score */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Financial Health Score
              </CardTitle>
              <CardDescription>
                Comprehensive analysis of your financial wellness
              </CardDescription>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </div>
              <div className="text-sm text-muted-foreground">out of 100</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <healthStatus.icon className={`w-6 h-6 ${healthStatus.color}`} />
              <span className={`text-lg font-semibold ${healthStatus.color}`}>
                {healthStatus.text}
              </span>
            </div>
            <Button variant="outline">
              <Lightbulb className="w-4 h-4 mr-2" />
              Get Recommendations
            </Button>
          </div>
          <Progress value={overallScore} className="h-3" />
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Income:</span>
              <p className="font-semibold">₹{financialData.income.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Expenses:</span>
              <p className="font-semibold">₹{financialData.expenses.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Savings:</span>
              <p className="font-semibold">₹{financialData.savings.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Investments:</span>
              <p className="font-semibold">₹{financialData.investments.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Score Breakdown</TabsTrigger>
          <TabsTrigger value="goals">Goals Tracking</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Score Components */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scoreComponents.map((component, index) => (
              <Card key={index} className="glass-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{component.name}</CardTitle>
                    <Badge className={getScoreBadge(component.status)}>
                      {component.status}
                    </Badge>
                  </div>
                  <CardDescription>{component.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Score</span>
                      <span className={`text-2xl font-bold ${getScoreColor(component.score)}`}>
                        {Math.round(component.score)}
                      </span>
                    </div>
                    <Progress value={component.score} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      Weight: {component.weight}% of total score
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Stats */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Financial Ratios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {((financialData.savings / financialData.income) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Savings Rate</div>
                  <div className="text-xs text-green-600 mt-1">Target: 20%</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {financialData.debtToIncomeRatio}%
                  </div>
                  <div className="text-sm text-muted-foreground">Debt-to-Income</div>
                  <div className="text-xs text-yellow-600 mt-1">Target: &lt;30%</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(financialData.emergencyFund / financialData.expenses).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Emergency Fund (months)</div>
                  <div className="text-xs text-blue-600 mt-1">Target: 6 months</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          {/* Financial Goals */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Financial Goals Progress
              </CardTitle>
              <CardDescription>
                Track your progress towards key financial objectives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {goals.map((goal) => {
                  const progress = goal.category === 'debt' 
                    ? ((goal.target - goal.current) / goal.target) * 100
                    : (goal.current / goal.target) * 100;
                  
                  const daysLeft = Math.ceil((goal.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={goal.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{goal.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {goal.category === 'debt' ? 'Remaining' : 'Progress'}: 
                            ₹{goal.current.toLocaleString()} / ₹{goal.target.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={goal.priority === 'high' ? 'destructive' : goal.priority === 'medium' ? 'default' : 'secondary'}>
                            {goal.priority} priority
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                          </div>
                        </div>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                      <div className="flex items-center justify-between mt-2 text-sm">
                        <span className="text-muted-foreground">
                          {Math.round(progress)}% complete
                        </span>
                        <span className={`font-semibold ${
                          progress >= 100 ? 'text-green-600' : 
                          progress >= 50 ? 'text-blue-600' : 'text-yellow-600'
                        }`}>
                          {progress >= 100 ? 'Completed!' : 
                           progress >= 50 ? 'On Track' : 'Needs Attention'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {/* Personalized Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scoreComponents
              .filter(component => component.status !== 'excellent')
              .map((component, index) => (
                <Card key={index} className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" />
                      Improve {component.name}
                    </CardTitle>
                    <CardDescription>
                      Current score: {Math.round(component.score)} / 100
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {component.recommendations.map((rec, recIndex) => (
                        <div key={recIndex} className="flex items-start gap-3">
                          <ArrowRight className="w-4 h-4 mt-0.5 text-blue-500" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="mt-3">
                        Learn More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Quick Actions */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <PiggyBank className="w-6 h-6" />
                  <span>Increase Savings Rate</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <CreditCard className="w-6 h-6" />
                  <span>Pay Down Debt</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  <span>Review Budget</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialHealthScoring;
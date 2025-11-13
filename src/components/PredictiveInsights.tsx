import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, TrendingDown, Crystal, Brain, Target, Calendar,
  AlertTriangle, Info, CheckCircle, DollarSign, PieChart,
  BarChart3, Lightbulb, Zap, Clock, ArrowRight, Star
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, addMonths, addDays } from "date-fns";

interface PredictionData {
  month: string;
  predicted: number;
  historical: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

interface CategoryPrediction {
  category: string;
  currentSpend: number;
  predictedSpend: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  factors: string[];
  recommendations: string[];
}

interface SeasonalInsight {
  period: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  expectedChange: number;
}

interface SmartAlert {
  id: string;
  type: 'warning' | 'opportunity' | 'reminder';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  daysAhead: number;
}

const PredictiveInsights = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeHorizon, setTimeHorizon] = useState('6m');

  // Generate mock predictive data
  const predictiveData = useMemo(() => {
    // Future spending predictions
    const predictions: PredictionData[] = Array.from({ length: 6 }, (_, i) => {
      const month = format(addMonths(new Date(), i + 1), 'MMM yyyy');
      const basePrediction = 45000 + (Math.random() - 0.5) * 5000;
      const historical = i === 0 ? 44500 : 0; // Only current month has historical data
      
      return {
        month,
        predicted: Math.round(basePrediction),
        historical,
        confidence: Math.round(85 + Math.random() * 10),
        trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down'
      };
    });

    // Category-wise predictions
    const categoryPredictions: CategoryPrediction[] = [
      {
        category: 'Food & Dining',
        currentSpend: 12000,
        predictedSpend: 13500,
        trend: 'up',
        confidence: 88,
        factors: ['Holiday season approaching', 'Recent restaurant frequency increase'],
        recommendations: ['Set dining budget limit', 'Plan home meals', 'Use meal prep strategies']
      },
      {
        category: 'Transportation',
        currentSpend: 8000,
        predictedSpend: 7200,
        trend: 'down',
        confidence: 82,
        factors: ['Work from home days increased', 'Fuel price stabilization'],
        recommendations: ['Maintain current commute pattern', 'Consider carpooling for extra savings']
      },
      {
        category: 'Entertainment',
        currentSpend: 5000,
        predictedSpend: 7500,
        trend: 'up',
        confidence: 75,
        factors: ['Festival season', 'New movie releases', 'Weekend plans increase'],
        recommendations: ['Set entertainment budget', 'Look for group discounts', 'Plan free activities']
      },
      {
        category: 'Shopping',
        currentSpend: 15000,
        predictedSpend: 18000,
        trend: 'up',
        confidence: 90,
        factors: ['Sale season approaching', 'Previous year pattern', 'Wishlist items pending'],
        recommendations: ['Create shopping priority list', 'Set spending limits', 'Use cashback offers']
      }
    ];

    // Seasonal insights
    const seasonalInsights: SeasonalInsight[] = [
      {
        period: 'Next Month',
        description: 'Festival season typically increases spending by 25-35%',
        impact: 'high',
        recommendation: 'Increase budget allocation for gifts and celebrations',
        expectedChange: 30
      },
      {
        period: 'Winter Season',
        description: 'Heating and winter clothing costs usually rise',
        impact: 'medium',
        recommendation: 'Plan for utility bill increases and seasonal shopping',
        expectedChange: 15
      },
      {
        period: 'Tax Season',
        description: 'Investment and tax-saving expenses peak in Q4',
        impact: 'high',
        recommendation: 'Prepare for tax investments and professional fees',
        expectedChange: 20
      }
    ];

    // Smart alerts
    const smartAlerts: SmartAlert[] = [
      {
        id: '1',
        type: 'warning',
        title: 'Budget Overspend Risk',
        description: 'Predicted to exceed dining budget by ₹2,500 this month',
        action: 'Adjust dining plans',
        priority: 'high',
        daysAhead: 7
      },
      {
        id: '2',
        type: 'opportunity',
        title: 'Savings Opportunity',
        description: 'Transportation spending trending down - can save ₹800',
        action: 'Reallocate to savings',
        priority: 'medium',
        daysAhead: 15
      },
      {
        id: '3',
        type: 'reminder',
        title: 'Investment Due',
        description: 'SIP payment of ₹10,000 due in 3 days',
        action: 'Ensure account balance',
        priority: 'high',
        daysAhead: 3
      }
    ];

    return { predictions, categoryPredictions, seasonalInsights, smartAlerts };
  }, [timeHorizon]);

  const { predictions, categoryPredictions, seasonalInsights, smartAlerts } = predictiveData;

  // Calculate summary metrics
  const totalPredicted = predictions.reduce((sum, p) => sum + p.predicted, 0);
  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
  const upTrends = categoryPredictions.filter(c => c.trend === 'up').length;
  const highRiskAlerts = smartAlerts.filter(a => a.priority === 'high').length;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <BarChart3 className="w-4 h-4 text-blue-500" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'opportunity': return <Star className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crystal className="w-5 h-5" />
                Predictive Insights
              </CardTitle>
              <CardDescription>
                AI-powered predictions for your financial future
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={timeHorizon === '3m' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeHorizon('3m')}
              >
                3M
              </Button>
              <Button
                variant={timeHorizon === '6m' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeHorizon('6m')}
              >
                6M
              </Button>
              <Button
                variant={timeHorizon === '1y' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeHorizon('1y')}
              >
                1Y
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Predicted Total</p>
                <p className="text-2xl font-bold">₹{totalPredicted.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Next 6 months</p>
              </div>
              <Crystal className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold">{Math.round(avgConfidence)}%</p>
                <Progress value={avgConfidence} className="mt-2" />
              </div>
              <Brain className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rising Categories</p>
                <p className="text-2xl font-bold">{upTrends}</p>
                <p className="text-xs text-orange-600">Need attention</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority Alerts</p>
                <p className="text-2xl font-bold">{highRiskAlerts}</p>
                <p className="text-xs text-red-600">Action needed</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Alerts */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Smart Alerts
          </CardTitle>
          <CardDescription>
            Proactive notifications about your financial future
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {smartAlerts.map((alert) => (
              <Alert key={alert.id} className={`border-l-4 ${
                alert.type === 'warning' ? 'border-l-orange-500 bg-orange-50/50' :
                alert.type === 'opportunity' ? 'border-l-green-500 bg-green-50/50' :
                'border-l-blue-500 bg-blue-50/50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <div className="font-medium">{alert.title}</div>
                      <AlertDescription className="mt-1">
                        {alert.description}
                      </AlertDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {alert.daysAhead} days ahead
                        </Badge>
                        <Badge variant={alert.priority === 'high' ? 'destructive' : alert.priority === 'medium' ? 'default' : 'secondary'}>
                          {alert.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    {alert.action}
                  </Button>
                </div>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Spending Forecast</TabsTrigger>
          <TabsTrigger value="categories">Category Insights</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>6-Month Spending Forecast</CardTitle>
              <CardDescription>
                Predicted spending with confidence intervals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={predictions}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#8B5CF6" 
                    fill="#8B5CF6" 
                    fillOpacity={0.6} 
                    name="Predicted Spending" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="historical" 
                    stroke="#10B981" 
                    strokeWidth={2} 
                    name="Historical Data" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {categoryPredictions.map((category, index) => (
              <Card key={index} className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{category.category}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(category.trend)}
                      <Badge variant={category.trend === 'up' ? 'destructive' : category.trend === 'down' ? 'default' : 'secondary'}>
                        {category.trend}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Current</p>
                        <p className="text-lg font-semibold">₹{category.currentSpend.toLocaleString()}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Predicted</p>
                        <p className="text-lg font-semibold">₹{category.predictedSpend.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Confidence</span>
                        <span className="text-sm font-medium">{category.confidence}%</span>
                      </div>
                      <Progress value={category.confidence} />
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Key Factors:</p>
                      <ul className="text-xs space-y-1">
                        {category.factors.map((factor, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1 h-1 bg-current rounded-full mt-2" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Recommendations:</p>
                      <ul className="text-xs space-y-1">
                        {category.recommendations.slice(0, 2).map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="seasonal" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Seasonal Spending Patterns</CardTitle>
              <CardDescription>
                Anticipated changes based on historical patterns and upcoming events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {seasonalInsights.map((insight, index) => (
                  <div key={index} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{insight.period}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                      </div>
                      <Badge variant={
                        insight.impact === 'high' ? 'destructive' :
                        insight.impact === 'medium' ? 'default' : 'secondary'
                      }>
                        {insight.impact} impact
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Expected change: </span>
                        <span className={`text-sm font-semibold ${
                          insight.expectedChange > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {insight.expectedChange > 0 ? '+' : ''}{insight.expectedChange}%
                        </span>
                      </div>
                      <Button variant="outline" size="sm">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        {insight.recommendation.split(' ').slice(0, 2).join(' ')}...
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveInsights;
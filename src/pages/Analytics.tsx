import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExpenseChart from "@/components/ExpenseChart";
import StatsCard from "@/components/StatsCard";
import { TrendingUp, TrendingDown, Calendar, PieChart, BarChart3, Target, Wallet, Users, Download, Filter, ChevronRight, ArrowLeft } from "lucide-react";
import withLayout from "@/components/withLayout";
import { useAnalytics } from "@/hooks/useAnalytics";
import { TimeRange } from "@/types/analytics";
import { toast } from "sonner";
import { useQuery } from '@tanstack/react-query';
import { groupService } from '@/lib/services/groupService';
interface AnalyticsProps {
  mode?: 'group' | 'personal';
  groupId?: string;
}
const Analytics = ({
  mode = 'personal',
  groupId: propGroupId
}: AnalyticsProps) => {
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'area' | 'line'>('pie');
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(propGroupId);
  const [viewMode, setViewMode] = useState<'personal' | 'group'>(mode);
  
  // Sync viewMode with mode prop from layout when it changes
  useEffect(() => {
    if (mode) {
      setViewMode(mode);
    }
  }, [mode]);
  
  // Fetch user's groups
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['userGroups'],
    queryFn: async () => {
      const response = await groupService.getGroups();
      return response.data;
    },
    enabled: viewMode === 'group'
  });
  
  const userGroups = groupsData?.groups || [];
  
  // Use analytics hook for real data
  const {
    statCards,
    chartData: apiChartData,
    sortedCategories,
    trends,
    insights,
    timeRange,
    setTimeRange,
    sortBy,
    setSortBy,
    isLoading,
    error,
    refresh,
    exportData
  } = useAnalytics({
    mode: viewMode,
    groupId: selectedGroupId,
    enabled: viewMode === 'personal' || (viewMode === 'group' && !!selectedGroupId)
  });

  // Process real data from API
  const currentStats = statCards;
  
  // Transform chart data to match ChartDataPoint interface
  const currentChart = apiChartData.map(item => ({
    name: item.name,
    value: item.value,
    ...(item.color && { color: item.color })
  }));
  
  // Convert trends data for area chart
  const monthlyData = trends.map(trend => ({
    name: trend.period,
    value: trend.totalAmount
  }));
  
  // Transform categories for trends view (with comparison data simulation)
  const currentTrends = sortedCategories.map(cat => ({
    name: cat.category,
    current: cat.totalAmount,
    previous: cat.totalAmount * 0.9, // Simulated previous value
    change: ((cat.totalAmount - cat.totalAmount * 0.9) / (cat.totalAmount * 0.9)) * 100,
    color: cat.color || '#6b7280'
  }));
  
  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refresh();
      toast.success('Analytics refreshed successfully');
    } catch (err) {
      toast.error('Failed to refresh analytics');
    }
  };
  
  // Handle export
  const handleExport = () => {
    try {
      exportData();
      toast.success('Data exported successfully');
    } catch (err) {
      toast.error('Failed to export data');
    }
  };
  
  // Show group selector if in group mode but no group selected
  if (viewMode === 'group' && !selectedGroupId) {
    return (
      <div className="space-y-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Select a Group</h2>
            <p className="text-muted-foreground">
              Choose a group to view its analytics and spending insights
            </p>
          </div>

          {groupsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="glass-card p-6 animate-pulse">
                  <div className="h-16 bg-muted rounded" />
                </Card>
              ))}
            </div>
          ) : userGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userGroups.map((group: any) => (
                <Card
                  key={group._id}
                  className="glass-card hover-lift border-white/10 cursor-pointer transition-all duration-300 hover:border-primary/30 hover:shadow-glow"
                  onClick={() => setSelectedGroupId(group._id)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {group.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">{group.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {group.members?.length || 0} members
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    
                    {group.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {group.description}
                      </p>
                    )}
                    
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {group.category || 'General'}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-card p-12 text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Groups Found</h3>
              <p className="text-muted-foreground mb-6">
                You're not a member of any groups yet. Create or join a group to view group analytics.
              </p>
              <p className="text-sm text-muted-foreground">
                💡 Tip: Use the "Personal" button in the navbar above to view your personal analytics,
                or create a new group to get started with group analytics.
              </p>
            </Card>
          )}
        </div>
      </div>
    );
  }
  
  // Get selected group name
  const selectedGroup = userGroups.find((g: any) => g._id === selectedGroupId);
  
  return <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              {viewMode === 'group' ? 'Group Analytics' : 'Personal Analytics'}
            </h1>
            {viewMode === 'group' && selectedGroup && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{selectedGroup.name}</span>
              </div>
            )}
          </div>
          <p className="text-muted-foreground">
            {viewMode === 'group' && selectedGroup
              ? `Analytics for ${selectedGroup.name}`
              : 'Detailed insights into your financial patterns'}
          </p>
        </div>
        
        {/* Mode Switcher - Removed as it's now controlled by the top navbar */}
        <div className="text-sm text-muted-foreground">
          {viewMode === 'group' && !selectedGroupId && (
            <span>💡 Select a group below to view analytics</span>
          )}
          {viewMode === 'group' && selectedGroupId && (
            <span>📊 Viewing group analytics</span>
          )}
          {viewMode === 'personal' && (
            <span>📊 Viewing personal analytics</span>
          )}
        </div>
      </div>
      
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Group Selector (when in group mode) */}
          {viewMode === 'group' && (
            <Select 
              value={selectedGroupId} 
              onValueChange={setSelectedGroupId}
            >
              <SelectTrigger className="w-48 glass-card">
                <SelectValue placeholder="Select Group" />
              </SelectTrigger>
              <SelectContent>
                {userGroups.map((group: any) => (
                  <SelectItem key={group._id} value={group._id}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{group.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Time Range Selector */}
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-40 glass-card">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="last3Months">Last 3 Months</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
            className="glass-card border-white/20 text-foreground hover:bg-primary/10"
          >
            <Filter className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={!currentChart.length}
            className="glass-card border-white/20 text-foreground hover:bg-primary/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentStats.map((stat, index) => <StatsCard key={index} {...stat} />)}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass-card border-white/10">
          <TabsTrigger value="overview" className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
          <TabsTrigger value="trends" className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Trends</TabsTrigger>
          <TabsTrigger value="categories" className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Categories</TabsTrigger>
          <TabsTrigger value="insights" className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart Controls */}
            <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
              <div className="p-6 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-xl relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
                      Expense Distribution
                    </h3>
                    <div className="flex gap-2 p-1 bg-muted/50 rounded-lg backdrop-blur-sm">
                      <Button 
                        variant={chartType === 'pie' ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setChartType('pie')}
                        className={`${chartType === 'pie' ? 'bg-primary shadow-glow' : 'hover:bg-primary/10'} transition-all duration-300`}
                      >
                        <PieChart className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant={chartType === 'bar' ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setChartType('bar')}
                        className={`${chartType === 'bar' ? 'bg-primary shadow-glow' : 'hover:bg-primary/10'} transition-all duration-300`}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant={chartType === 'area' ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setChartType('area')}
                        className={`${chartType === 'area' ? 'bg-primary shadow-glow' : 'hover:bg-primary/10'} transition-all duration-300`}
                      >
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant={chartType === 'line' ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setChartType('line')}
                        className={`${chartType === 'line' ? 'bg-primary shadow-glow' : 'hover:bg-primary/10'} transition-all duration-300`}
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <ExpenseChart type={chartType} data={currentChart} title="" gradient={true} showGlow={true} />
                </div>
              </div>
            </Card>

            {/* Monthly Trends */}
            <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
              <div className="p-6 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-xl relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-success/5 pointer-events-none" />
                
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" />
                    Monthly Trends
                  </h3>
                  <ExpenseChart type="area" data={monthlyData} title="" gradient={true} showGlow={true} />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
              <div className="p-6 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-xl relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-warning/5 pointer-events-none" />
                
                <div className="relative z-10">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse-glow" />
                    Category Trends
                  </h3>
                  <div className="space-y-4">
                    {currentTrends.map((trend, index) => (
                      <div key={index} className="group glass-card hover-lift p-6 border-white/10 transition-all duration-500 hover:shadow-glow rounded-xl bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div 
                                className="w-5 h-5 rounded-full shadow-glow transition-all duration-500 group-hover:scale-125 group-hover:shadow-glow-lg animate-pulse-subtle" 
                                style={{
                                  backgroundColor: trend.color,
                                  boxShadow: `0 0 20px ${trend.color}60, 0 0 40px ${trend.color}30`
                                }} 
                              />
                              <div 
                                className="absolute inset-0 w-5 h-5 rounded-full opacity-30 animate-ping" 
                                style={{ backgroundColor: trend.color }}
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                                {trend.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ₹{trend.current.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-500 shadow-sm hover:shadow-glow ${
                              trend.change > 0 
                                ? 'text-destructive bg-destructive/10 border-destructive/20 group-hover:bg-destructive/20 hover:shadow-destructive/20' 
                                : 'text-success bg-success/10 border-success/20 group-hover:bg-success/20 hover:shadow-success/20'
                            }`}>
                              {trend.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              <span className="font-bold">
                                {Math.abs(trend.change)}%
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">vs last month</p>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-4 w-full bg-muted/30 h-2 rounded-full overflow-hidden backdrop-blur-sm">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 shadow-glow animate-scale-in" 
                            style={{
                              backgroundColor: trend.color,
                              width: `${(trend.current / Math.max(...currentTrends.map(t => t.current))) * 100}%`,
                              boxShadow: `0 0 10px ${trend.color}60, inset 0 1px 2px rgba(255,255,255,0.1)`
                            }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentChart.map((category, index) => <Card key={index} className="group glass-card hover-lift border-white/10 overflow-hidden">
                <div className="p-6 relative">
                  {/* Background Glow */}
                  <div className="absolute inset-0 opacity-5">
                    <div 
                      className="absolute inset-0 bg-gradient-to-br from-transparent to-current" 
                      style={{ color: category.color }}
                    />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {category.name}
                      </h4>
                      <div 
                        className="w-6 h-6 rounded-full shadow-lg transition-all duration-300 group-hover:scale-125" 
                        style={{
                          backgroundColor: category.color,
                          boxShadow: `0 0 20px ${category.color}40`
                        }} 
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-2xl font-bold text-foreground">
                        ₹{category.value.toLocaleString()}
                      </p>
                      
                      {/* Enhanced Progress Bar */}
                      <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 shadow-sm" 
                          style={{
                            backgroundColor: category.color,
                            width: `${category.value / Math.max(...currentChart.map(c => c.value)) * 100}%`,
                            boxShadow: `0 0 10px ${category.color}60`
                          }} 
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          {(category.value / currentChart.reduce((sum, c) => sum + c.value, 0) * 100).toFixed(1)}% of total
                        </p>
                        <div className="px-2 py-1 rounded-full text-xs font-medium" style={{
                          backgroundColor: `${category.color}20`,
                          color: category.color
                        }}>
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>)}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Smart Insights 🧠</h3>
                <div className="space-y-4">
                  <div className="group p-5 bg-success/10 rounded-xl border border-success/20 hover:bg-success/15 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--success)/0.3)]">
                    <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                      Best Performance 📈
                    </h4>
                    <p className="text-sm text-foreground/80">
                      {mode === 'group' ? 'Your group settles expenses 40% faster than average' : 'Transportation costs reduced by 35% this quarter'}
                    </p>
                  </div>
                  <div className="group p-5 bg-primary/10 rounded-xl border border-primary/20 hover:bg-primary/15 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                    <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                      Optimization Tip 💡
                    </h4>
                    <p className="text-sm text-foreground/80">
                      {mode === 'group' ? 'Consider using recurring payments for regular group expenses' : 'Set up automatic transfers to reach savings goal faster'}
                    </p>
                  </div>
                  <div className="group p-5 bg-warning/10 rounded-xl border border-warning/20 hover:bg-warning/15 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--warning)/0.3)]">
                    <h4 className="font-semibold text-warning mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-warning rounded-full animate-pulse"></span>
                      Watch Out ⚠️
                    </h4>
                    <p className="text-sm text-foreground/80">
                      {mode === 'group' ? 'Food expenses increased 15% - discuss budget limits' : 'Shopping expenses above average - review recent purchases'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="glass-card">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Goals & Targets 🎯</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Monthly Budget</span>
                      <span className="text-sm">₹28,680 / ₹35,000</span>
                    </div>
                    <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-success h-full rounded-full transition-all duration-1000 shadow-sm" 
                        style={{
                          width: '82%',
                          boxShadow: '0 0 10px hsl(var(--success) / 0.6)'
                        }} 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Savings Goal</span>
                      <span className="text-sm">₹31,000 / ₹40,000</span>
                    </div>
                    <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-1000 shadow-sm" 
                        style={{
                          width: '78%',
                          boxShadow: '0 0 10px hsl(var(--primary) / 0.6)'
                        }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Investment Target</span>
                      <span className="text-sm">₹18,000 / ₹25,000</span>
                    </div>
                    <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-primary to-cyan-light h-full rounded-full transition-all duration-1000 shadow-sm" 
                        style={{
                          width: '72%',
                          boxShadow: '0 0 10px hsl(var(--primary) / 0.4)'
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>;
};

export default withLayout(Analytics);

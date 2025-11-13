import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, LineChart, Line } from "recharts";

interface ExpenseChartProps {
  type: 'pie' | 'bar' | 'area' | 'line';
  data: ChartDataPoint[];
  title: string;
  gradient?: boolean;
  showGlow?: boolean;
}

interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

const ExpenseChart = ({
  type,
  data,
  title,
  gradient = true,
  showGlow = true
}: ExpenseChartProps) => {
  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))', 
    'hsl(var(--accent))',
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(var(--destructive))'
  ];

  const GRADIENTS = [
    { id: 'primary', from: 'hsl(var(--primary))', to: 'hsl(var(--primary) / 0.3)' },
    { id: 'secondary', from: 'hsl(var(--secondary))', to: 'hsl(var(--secondary) / 0.3)' },
    { id: 'accent', from: 'hsl(var(--accent))', to: 'hsl(var(--accent) / 0.3)' },
    { id: 'success', from: 'hsl(var(--success))', to: 'hsl(var(--success) / 0.3)' },
    { id: 'warning', from: 'hsl(var(--warning))', to: 'hsl(var(--warning) / 0.3)' },
    { id: 'destructive', from: 'hsl(var(--destructive))', to: 'hsl(var(--destructive) / 0.3)' }
  ];

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    if (percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="hsl(var(--background))" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central" 
        fontSize="11" 
        fontWeight="600"
        className="drop-shadow-lg"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-2xl animate-fade-in">
          <p className="font-semibold text-card-foreground mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full shadow-glow" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-muted-foreground">
                {entry.name}: 
              </span>
              <span className="font-medium text-foreground">
                ₹{entry.value?.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`glass-card animate-fade-in border-primary/20 ${showGlow ? 'shadow-glow hover:shadow-glow-lg' : ''} transition-all duration-500 hover:scale-[1.02] group`}>
      <div className="p-6 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-xl rounded-lg relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <div className="relative z-10">
          <h3 className="text-lg font-semibold mb-6 text-card-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
            {title}
          </h3>
          
          <div className="h-80 relative">
            <ResponsiveContainer width="100%" height="100%">
              {type === 'pie' ? (
                <PieChart>
                  <defs>
                    {GRADIENTS.map((grad, index) => (
                      <linearGradient key={grad.id} id={`gradient-${grad.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={grad.from} />
                        <stop offset="100%" stopColor={grad.to} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie 
                    data={data} 
                    cx="50%" 
                    cy="50%" 
                    labelLine={false} 
                    label={renderCustomizedLabel} 
                    outerRadius={100}
                    innerRadius={30}
                    fill="#8884d8" 
                    dataKey="value"
                    stroke="hsl(var(--background))"
                    strokeWidth={3}
                    className="drop-shadow-xl"
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={gradient ? `url(#gradient-${GRADIENTS[index % GRADIENTS.length].id})` : COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity duration-300 cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              ) : type === 'area' ? (
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    opacity={0.3} 
                    className="animate-fade-in"
                  />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    className="animate-slide-in-left"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={value => `₹${value}`}
                    stroke="hsl(var(--border))"
                    className="animate-slide-in-right"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    fill="url(#areaGradient)"
                    className="drop-shadow-lg animate-scale-in"
                  />
                </AreaChart>
              ) : type === 'line' ? (
                <LineChart data={data}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    opacity={0.3}
                  />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={value => `₹${value}`}
                    stroke="hsl(var(--border))"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, className: "animate-pulse-glow" }}
                    className="drop-shadow-lg"
                  />
                </LineChart>
              ) : (
                <BarChart data={data}>
                  <defs>
                    {GRADIENTS.map((grad, index) => (
                      <linearGradient key={grad.id} id={`bar-gradient-${grad.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={grad.from} />
                        <stop offset="100%" stopColor={grad.to} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    opacity={0.3}
                    className="animate-fade-in"
                  />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    className="animate-slide-in-left"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={value => `₹${value}`}
                    stroke="hsl(var(--border))"
                    className="animate-slide-in-right"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    fill={gradient ? "url(#bar-gradient-primary)" : "hsl(var(--primary))"} 
                    radius={[8, 8, 0, 0]}
                    className="drop-shadow-xl animate-scale-in"
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ExpenseChart;
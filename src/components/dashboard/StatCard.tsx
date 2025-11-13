import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  showBalance?: boolean;
}

export const StatCard = ({
  title,
  value,
  change,
  icon,
  color = "text-primary",
  bgColor = "bg-primary/10",
  borderColor = "border-primary/20",
  showBalance = true
}: StatCardProps) => {
  // Dynamically get the icon component
  const IconComponent = (Icons as any)[icon] as LucideIcon;

  return (
    <Card 
      className={`glass-card border ${borderColor} shadow-glow hover:shadow-glow-lg transition-all duration-500 hover-lift`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${bgColor} border ${borderColor}`}>
            {IconComponent && <IconComponent className={`w-6 h-6 ${color}`} />}
          </div>
          <Badge 
            variant={change > 0 ? "default" : "secondary"}
            className={`${
              change > 0 
                ? 'bg-success/20 text-success border-success/30' 
                : 'bg-destructive/20 text-destructive border-destructive/30'
            }`}
          >
            {change > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {Math.abs(change)}%
          </Badge>
        </div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">
          {title}
        </h3>
        <p className="text-2xl font-bold text-foreground">
          {showBalance ? value : '₹****'}
        </p>
      </CardContent>
    </Card>
  );
};

export default StatCard;

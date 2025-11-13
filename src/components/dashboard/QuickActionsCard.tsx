import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import * as Icons from "lucide-react";

interface QuickAction {
  label: string;
  icon: string;
  onClick: () => void;
  color: string;
}

interface QuickActionsCardProps {
  actions: QuickAction[];
}

export const QuickActionsCard = ({ actions }: QuickActionsCardProps) => {
  return (
    <Card className="glass-card border-primary/20 shadow-glow hover:shadow-glow-lg transition-all duration-500">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse-glow" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => {
          const Icon = (Icons as any)[action.icon];
          
          return (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start h-12 glass-card border-white/20 hover:bg-white/10 transition-all duration-300 group"
              onClick={action.onClick}
            >
              <div className={`p-2 rounded-lg ${action.color} mr-3 group-hover:scale-110 transition-transform duration-300`}>
                {Icon && <Icon className="w-4 h-4 text-white" />}
              </div>
              <span className="font-medium">{action.label}</span>
              <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;

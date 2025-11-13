import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Users, TrendingUp, Shield, Zap, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeHeroProps {
  onDismiss?: () => void;
  onCreateGroup?: () => void;
  onStartPersonalTracking?: () => void;
}

const WelcomeHero = ({ onDismiss, onCreateGroup, onStartPersonalTracking }: WelcomeHeroProps) => {
  const features = [
    {
      icon: Wallet,
      title: "Smart Expense Tracking",
      description: "Track personal and group expenses with AI-powered insights",
      color: "text-success"
    },
    {
      icon: Users,
      title: "Group Management",
      description: "Create groups, split bills, and settle up seamlessly",
      color: "text-primary"
    },
    {
      icon: TrendingUp,
      title: "Financial Analytics",
      description: "Get detailed reports and spending patterns analysis",
      color: "text-warning"
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Bank-grade security for all your transactions",
      color: "text-destructive"
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero Background */}
      <div className="hero-section border border-primary/20 rounded-2xl mb-8">
        <Card className="glass-card border-0 bg-transparent">
          <div className="p-8 md:p-12 text-center space-y-8">
            {/* Close Button */}
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDismiss}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            )}

            {/* Welcome Content */}
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <div className="p-4 bg-gradient-cyber rounded-full animate-pulse-glow">
                  <Zap className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <div>
                <h1 className="text-responsive-2xl font-bold text-gradient-cyber mb-4">
                  Welcome to fastTrace
                </h1>
                <p className="text-responsive-base text-white/80 max-w-2xl mx-auto">
                  Your smart expense tracking companion for intelligent spending management, 
                  group bill splitting, and comprehensive financial insights.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="btn-cyber hover-lift"
                  onClick={onCreateGroup}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Create Your First Group
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground hover-lift"
                  onClick={onStartPersonalTracking}
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  Start Personal Tracking
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card 
              key={feature.title}
              className="stats-card animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="p-6 text-center space-y-4">
                <div className={cn(
                  "w-12 h-12 rounded-full mx-auto flex items-center justify-center",
                  "bg-gradient-to-br from-primary/20 to-accent/20 animate-float"
                )}>
                  <Icon className={cn("w-6 h-6", feature.color)} />
                </div>
                
                <div>
                  <h3 className="font-semibold text-card-foreground mb-2 text-responsive-sm">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default WelcomeHero;
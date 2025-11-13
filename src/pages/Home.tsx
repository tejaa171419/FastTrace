import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  Shield, 
  Smartphone, 
  Zap,
  ArrowRight,
  Star,
  CheckCircle,
  ChevronDown
} from 'lucide-react';
import ExpensiverLogo from '@/components/ExpensiverLogo';

const Home = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleLearnMore = () => {
    if (featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      icon: <Wallet className="h-8 w-8 text-primary" />,
      title: "Smart Expense Tracking",
      description: "Automatically categorize and track all your expenses in real-time."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Group Expense Management",
      description: "Split bills and track shared expenses with friends and family."
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "Financial Insights",
      description: "Get detailed analytics and insights to improve your spending habits."
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Bank-Level Security",
      description: "Your financial data is protected with military-grade encryption."
    },
    {
      icon: <Smartphone className="h-8 w-8 text-primary" />,
      title: "Mobile First Design",
      description: "Beautiful interface that works perfectly on any device."
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Lightning Fast",
      description: "Real-time sync across all your devices with zero lag."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Freelance Designer",
      content: "This app has completely transformed how I manage my business expenses. The group features are a game-changer!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Software Engineer",
      content: "Finally, an expense tracker that actually works well for shared living expenses. The UI is stunning too.",
      rating: 5
    },
    {
      name: "Emma Rodriguez",
      role: "Marketing Manager",
      content: "The analytics helped me save over $200/month. Highly recommend to anyone serious about financial health.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="mb-6 flex justify-center">
            <ExpensiverLogo size="xl" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gradient-cyber">
            Split Expenses. Track Balances.
            <span className="block">Stay in Control.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            The ultimate expense tracking solution for individuals and groups. 
            Beautiful interface, powerful features, and military-grade security.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="btn-cyber text-lg px-8 py-6 rounded-xl animate-pulse-subtle"
              onClick={() => navigate('/signup')}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 rounded-xl border-white/20 hover:bg-white/10"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => navigate('/create-group')}
            >
              <Users className="mr-2 h-5 w-5" />
              Create Group
            </Button>
          </div>
          
          <div className="flex flex-col items-center">
            <Button 
              variant="ghost" 
              className="text-white/60 hover:text-white mb-8 animate-bounce"
              onClick={handleLearnMore}
            >
              Learn more
              <ChevronDown className="ml-2 h-5 w-5 animate-pulse" />
            </Button>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                4.9/5 Rating
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <CheckCircle className="h-4 w-4 mr-1 text-green-400" />
                100K+ Users
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Shield className="h-4 w-4 mr-1 text-blue-400" />
                Bank-Level Security
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div ref={featuresRef} className="container mx-auto px-4 py-16 bg-card/30 backdrop-blur-sm rounded-3xl mb-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">Powerful Features</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to take control of your finances
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="glass-card border border-white/20 hover:scale-105 transition-all duration-300 hover:shadow-glow animate-slide-in-left"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="mb-4 p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">Loved by Thousands</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join our community of happy users
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="glass-card border border-white/20 animate-slide-in-left"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gradient">Ready to Take Control?</h2>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Join thousands of users who have transformed their financial habits
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Button 
            size="lg" 
            className="btn-cyber text-lg px-8 py-6 rounded-xl animate-pulse-subtle"
            onClick={() => navigate('/signup')}
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 py-6 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => navigate('/create-group')}
          >
            <Users className="mr-2 h-5 w-5" />
            Try Group Splitting
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          No credit card required. 14-day free trial.
        </p>
      </div>
    </div>
  );
};

export default Home;
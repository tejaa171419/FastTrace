import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wallet, 
  Users, 
  Shield, 
  TrendingUp, 
  Smartphone,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import ExpensiverLogo from '@/components/ExpensiverLogo';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Wallet className="w-8 h-8 text-primary" />,
      title: "Smart Wallet",
      description: "Manage your money securely with built-in payment methods and instant transfers"
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Group Expenses",
      description: "Split bills with friends, track shared expenses, and settle up easily"
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Secure & Private",
      description: "Bank-level encryption with PIN protection and biometric authentication"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-primary" />,
      title: "Analytics & Insights",
      description: "Track spending patterns and get personalized financial insights"
    }
  ];

  const benefits = [
    "No hidden fees or charges",
    "Instant money transfers",
    "Real-time expense tracking",
    "QR code payments",
    "Multi-currency support",
    "24/7 customer support"
  ];

  return (
    <div className="min-h-screen bg-gradient-background overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ExpensiverLogo size="lg" />
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/login')}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/signup')}
              className="btn-cyber"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center space-y-8">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
            <Smartphone className="w-5 h-5 mr-2 text-primary" />
            <span className="text-white/80 text-sm font-medium">The Future of Digital Payments</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Manage Money,
            <br />
            <span className="text-gradient-cyber">Split Expenses</span>,
            <br />
            Stay Connected
          </h1>
          
          <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            FastTrace is the all-in-one financial platform for the modern world. 
            Send money, track expenses, and split bills with friends—all in one secure app.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg"
              onClick={() => navigate('/signup')}
              className="btn-cyber text-lg px-8 py-6 w-full sm:w-auto"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-6 w-full sm:w-auto"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-12">
            Everything You Need in One App
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="glass-card border border-white/20 hover:border-primary/50 transition-all duration-300 hover:shadow-glow"
              >
                <CardHeader>
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-white/70">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-black/20">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-white mb-12">
              Why Choose FastTrace?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-3 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10"
                >
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span className="text-white/90">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="glass-card border border-white/20 shadow-glow">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-4xl font-bold text-white">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Join thousands of users who trust FastTrace for their daily financial needs. 
                Create your free account in minutes.
              </p>
              <Button 
                size="lg"
                onClick={() => navigate('/signup')}
                className="btn-cyber text-lg px-8 py-6"
              >
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-white/50">
                Already have an account?{' '}
                <button 
                  onClick={() => navigate('/login')}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in here
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="container mx-auto text-center text-white/60 text-sm">
          <p>© 2025 fastTrace. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

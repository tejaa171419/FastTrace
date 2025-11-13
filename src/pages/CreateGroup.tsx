import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Users, Sparkles, Lock, LogIn, UserPlus } from "lucide-react";
import GroupDetailForm from "@/components/GroupDetailForm";
import { useToast } from "@/hooks/use-toast";
import { useCreateGroup } from "@/hooks/useGroups";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import withLayout from "@/components/withLayout";

// CreateGroup component for use as child component (no layout)
const CreateGroup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const createGroupMutation = useCreateGroup();
  const [isCreating, setIsCreating] = useState(false);

  // Handle authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login with a return URL
      navigate('/login?returnUrl=/create-group');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleCreateGroup = async (groupData: any) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a group.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // Extract member emails from the members array
      const memberEmails = groupData.members?.map((member: any) => member.email).filter(Boolean) || [];
      
      const createGroupRequest = {
        name: groupData.name,
        description: groupData.description,
        currency: groupData.currency || 'INR',
        privacy: 'private', // All groups are private by default
        category: 'Other',
        memberEmails: memberEmails
      };
      
      console.log('📝 Creating group with request:', createGroupRequest);
      
      const response = await createGroupMutation.mutateAsync(createGroupRequest);
      
      toast({
        title: "Group Created!",
        description: `"${groupData.name}" has been created successfully.`
      });
      
      // Navigate to the created group page
      if (response.data?.group?._id) {
        navigate(`/group/${response.data.group._id}`);
      } else {
        navigate('/groups');
      }
    } catch (error: any) {
      console.error('❌ Failed to create group:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to create group. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-background p-4">
        <Card className="glass-card border border-white/20 shadow-glow max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto bg-gradient-cyber p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-background" />
            </div>
            <CardTitle className="text-2xl font-bold text-gradient-cyber">Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged in to create a group
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert className="bg-primary/10 border-primary/20">
              <AlertTitle className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Protected Feature
              </AlertTitle>
              <AlertDescription>
                Creating groups is only available to registered users. Please log in or create an account to continue.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={() => navigate('/login?returnUrl=/create-group')}
                className="btn-cyber w-full py-6"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Log In to Continue
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/signup?returnUrl=/create-group')}
                className="w-full py-6 border-white/30 hover:bg-white/10"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Create New Account
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="w-full text-white/70 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden py-3 sm:py-6 pb-6 sm:pb-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-6 sm:pb-8">
        {/* Header - Mobile Responsive */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-start gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/')}
              className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient-cyber animate-fade-in truncate">
                Create New Group
              </h1>
              <p className="text-white/70 text-sm sm:text-base mt-1 sm:mt-2 animate-slide-in-left line-clamp-2" style={{ animationDelay: '0.1s' }}>
                Set up a new expense sharing group for your team, family, or friends
              </p>
            </div>
          </div>

          {/* Feature highlights - Mobile Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-8">
            <Card className="glass-card hover-lift animate-slide-up hover:shadow-glow border border-white/20">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary/20 mb-2 sm:mb-4">
                  <Users className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-base sm:text-lg mb-1 sm:mb-2">Advanced Invitations</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Multiple ways to invite: email, contacts, and link sharing with instant notifications
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card hover-lift animate-slide-up hover:shadow-glow border border-white/20" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary/20 mb-2 sm:mb-4">
                  <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-base sm:text-lg mb-1 sm:mb-2">Professional Workflows</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Comprehensive form validation, progress tracking, and stable components
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card hover-lift animate-slide-up hover:shadow-glow border border-white/20 sm:col-span-2 md:col-span-1" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary/20 mb-2 sm:mb-4">
                  <ArrowLeft className="w-5 h-5 sm:w-7 sm:h-7 text-primary transform rotate-180" />
                </div>
                <h3 className="font-semibold text-foreground text-base sm:text-lg mb-1 sm:mb-2">Easy Settlement</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Simple payment suggestions to settle all group balances
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Form - Mobile Responsive */}
        <div className="animate-fade-in mb-6 sm:mb-8" style={{ animationDelay: '0.3s' }}>
          <Card className="glass-card border border-white/20 shadow-glow">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gradient">Group Details</CardTitle>
              <CardDescription className="text-sm">
                Fill in the information below to create your expense sharing group
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pb-6 sm:pb-8">
              <GroupDetailForm
                onSave={handleCreateGroup}
                onCancel={handleCancel}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Standalone CreateGroup page with layout (for /create-group route)
const CreateGroupPage = withLayout(CreateGroup, { defaultMode: 'group', defaultSubNav: 'create-group' });

// Export both versions
export default CreateGroup;
export { CreateGroupPage };
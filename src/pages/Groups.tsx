import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Calendar, DollarSign, Settings, Eye, TrendingUp, UserPlus, Upload, Globe, Lock, Trash2, Search, Filter, SortAsc, Receipt, MessageSquare, Mail, Phone, Send, Copy, Share2, Check, X, Loader2, Calculator, Scan, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useGroups, useCreateGroup } from "@/hooks/useGroups";
import { useBalances } from "@/hooks/useBalances";
import { Group, User } from "@/lib/types";
import withLayout from "@/components/withLayout";
import CalculatorModal from "@/components/CalculatorModal";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isRegistered: boolean;
}

// Groups component for use as child component (no layout)
const Groups = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // API hooks - defer loading until component is mounted
  const [shouldLoadGroups, setShouldLoadGroups] = useState(false);
  const { data: groupsData, isLoading, error, refetch } = useGroups(
    shouldLoadGroups ? {
      search: searchQuery || undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined
    } : null
  );
  const createGroupMutation = useCreateGroup();
  
  // Fetch user balances for all groups
  const { data: balancesData, isLoading: isLoadingBalances, error: balancesError } = useBalances();
  
  // Debug: Log balance data when it changes
  useEffect(() => {
    if (balancesData) {
      console.log('💰 Balance Data Loaded:', {
        summary: balancesData.summary,
        balanceCount: balancesData.balances?.length || 0,
        balances: balancesData.balances
      });
    }
    if (balancesError) {
      console.error('❌ Balance Error:', balancesError);
    }
  }, [balancesData, balancesError]);

  // Extract groups from API response
  const groups = groupsData?.groups || [];
  
  // Add debugging logs for data integrity
  useEffect(() => {
    if (groups.length > 0) {
      console.log('Groups data loaded:', groups.length, 'groups');
      
      // Check for data integrity issues
      const invalidGroups = groups.filter(group => !group.owner || !group._id);
      if (invalidGroups.length > 0) {
        console.warn('Found groups with missing data:', invalidGroups);
      }
    }
  }, [groups]);
  
  // Defer loading groups until component is mounted to improve initial load time
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoadGroups(true);
    }, 100); // Small delay to allow UI to render
    
    return () => clearTimeout(timer);
  }, []);
  
  // Create Group Form State
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("USD");
  
  // Enhanced invitation state
  const [inviteTab, setInviteTab] = useState('email');
  const [emailList, setEmailList] = useState('');
  const [phoneList, setPhoneList] = useState('');
  const [inviteMessage, setInviteMessage] = useState('Hi! I\'d like to invite you to join our expense group. We can easily split and track shared expenses together.');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  
  // Simplified contacts - for now just allow manual email entry
  const contacts: Contact[] = [];
  
  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    contact.email.toLowerCase().includes(contactSearch.toLowerCase())
  );

  // Create Group Functions
  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const getInviteCount = () => {
    const emails = emailList.split(/[,\n]/).filter(email => email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())).length;
    const phones = phoneList.split(/[,\n]/).filter(phone => phone.trim() && /^[+]?[1-9]\d{1,14}$/.test(phone.replace(/[\s\-()]/g, ''))).length;
    return emails + phones + selectedContacts.length;
  };

  const handleCreateGroup = async () => {
    // Enhanced validation
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive"
      });
      return;
    }

    if (groupName.trim().length < 3) {
      toast({
        title: "Error",
        description: "Group name must be at least 3 characters long",
        variant: "destructive"
      });
      return;
    }

    if (groupName.trim().length > 50) {
      toast({
        title: "Error", 
        description: "Group name must be less than 50 characters",
        variant: "destructive"
      });
      return;
    }

    const inviteCount = getInviteCount();

    try {
      // Prepare member invites
      const memberEmails: string[] = [];
      
      // Add emails from email list
      const emails = emailList.split(/[,\n]/).filter(email => 
        email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ).map(email => email.trim());
      memberEmails.push(...emails);
      
      // Add emails from selected contacts
      const selectedContactEmails = contacts
        .filter(contact => selectedContacts.includes(contact.id))
        .map(contact => contact.email);
      memberEmails.push(...selectedContactEmails);

      // Create group using API (all groups are private for financial security)
      const result = await createGroupMutation.mutateAsync({
        name: groupName.trim(),
        description: description.trim() || undefined,
        currency,
        privacy: 'private',
        memberEmails: memberEmails.length > 0 ? memberEmails : undefined
      });

      const memberInvites = inviteCount > 0 
        ? ` and sent ${inviteCount} invitation${inviteCount > 1 ? 's' : ''}` 
        : '';

      toast({
        title: "Success! 🎉",
        description: `Group "${groupName.trim()}" created successfully${memberInvites}`
      });

      // Reset form and close dialog
      setGroupName("");
      setDescription("");
      setEmailList('');
      setPhoneList('');
      setSelectedContacts([]);
      setIsCreateDialogOpen(false);
      
      // Force refresh the groups list
      console.log('✅ Group created successfully:', result.data?.group);
      console.log('🔄 Refreshing groups list...');
      
      // Use a short delay to ensure backend data is consistent
      setTimeout(async () => {
        await refetch();
        console.log('✓ Groups list refreshed');
      }, 500);
    } catch (error) {
      console.error('❌ Failed to create group:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create group. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Helper functions for group status and appearance
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/20 text-success border-success/30';
      case 'settled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'inactive': return 'bg-muted/20 text-muted-foreground border-muted/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Travel': return 'bg-purple-500/20 text-purple-400';
      case 'Living': return 'bg-green-500/20 text-green-400';
      case 'Work': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-success';
    if (balance < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const formatBalance = (balance: number, currency: string = 'USD') => {
    const currencySymbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€', 
      'GBP': '£',
      'INR': '₹',
      'CAD': 'C$',
      'AUD': 'A$'
    };
    const symbol = currencySymbols[currency] || '$';
    return `${balance >= 0 ? '+' : ''}${symbol}${Math.abs(balance).toFixed(2)}`;
  };

  const getRecentActivityEmoji = (activity: string) => {
    if (activity.includes('created')) return '🎉';
    if (activity.includes('expense')) return '💰';
    if (activity.includes('settled')) return '✅';
    return '📊';
  };

  // Show loading state
  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-white/60">Please log in to view your groups.</p>
      </div>
    );
  }

  // Show simplified loading state
  if (isLoading || !shouldLoadGroups) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-white/60">Loading your groups...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-red-400 mb-4">Failed to load groups</p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 space-y-4 sm:space-y-6 md:space-y-8 pb-24 md:pb-6">
      {/* Enhanced Header */}
      <div className="text-center space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in">
        <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-primary" />
          <span className="text-white/80 text-xs sm:text-sm font-medium">Group Management</span>
        </div>
        
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gradient-cyber mb-2 sm:mb-4">
          Groups
        </h1>
        
        <p className="text-sm sm:text-base md:text-lg text-white/70 max-w-3xl mx-auto leading-relaxed px-4">
          Manage your group expenses and shared finances
        </p>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 w-full h-10 sm:h-11"
          />
        </div>
        
        {/* Filter Buttons with Create Button */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 justify-between items-center">
          <div className="flex gap-2">
            <Button 
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
              className={`flex-shrink-0 h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm ${filterStatus === 'all' ? 'bg-primary text-white' : 'border-white/20 text-white hover:bg-white/10'}`}
            >
              All Groups
            </Button>
            <Button 
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('active')}
              className={`flex-shrink-0 h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm ${filterStatus === 'active' ? 'bg-success text-white' : 'border-white/20 text-white hover:bg-white/10'}`}
            >
              Active
            </Button>
            <Button 
              variant={filterStatus === 'settled' ? 'default' : 'outline'}
              size="sm" 
              onClick={() => setFilterStatus('settled')}
              className={`flex-shrink-0 h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm ${filterStatus === 'settled' ? 'bg-blue-500 text-white' : 'border-white/20 text-white hover:bg-white/10'}`}
            >
              Settled
            </Button>
          </div>
          
          {/* Create Group Button */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm"
                className="btn-cyber group relative overflow-hidden px-3 py-2 text-white hover:shadow-glow transition-all duration-300 h-8 sm:h-9 flex-shrink-0"
              >
                <Plus className="w-4 h-4 mr-1.5 group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-xs sm:text-sm font-medium">Create</span>
              </Button>
            </DialogTrigger>

          <DialogContent className="glass-card border-white/25 max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide p-4 sm:p-6">
            <DialogHeader className="text-center space-y-2 sm:space-y-3 pb-4 sm:pb-6 border-b border-white/10">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full flex items-center justify-center mb-2 sm:mb-4 shadow-lg shadow-primary/20">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-pulse-subtle" />
              </div>
              <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-gradient-cyber">
                Create New Group
              </DialogTitle>
              <DialogDescription className="text-white/80 text-sm sm:text-base leading-relaxed max-w-md mx-auto px-2">
                Set up a new group to manage shared expenses with friends, family, or colleagues
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 sm:space-y-6 py-4 sm:py-6 flex-1 overflow-y-auto scrollbar-hide">
              {/* Group Avatar and Basic Info */}
              <div className="glass-card border-white/10 hover:border-white/20 transition-colors duration-300 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  <div className="relative mx-auto sm:mx-0">
                    <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 sm:border-4 border-primary/30 shadow-lg">
                      <AvatarImage className="bg-gradient-primary" />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-xl sm:text-2xl font-bold">
                        {groupName.charAt(0).toUpperCase() || "G"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-success rounded-full border-2 border-background flex items-center justify-center">
                      <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3 sm:space-y-4 w-full">
                    <div className="space-y-2 sm:space-y-3">
                      <Label htmlFor="group-name" className="text-white font-semibold text-xs sm:text-sm uppercase tracking-wide">Group Name *</Label>
                      <Input 
                        id="group-name" 
                        placeholder="e.g., Vacation Trip 2024" 
                        value={groupName} 
                        onChange={e => setGroupName(e.target.value)} 
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-10 sm:h-12 text-base sm:text-lg font-medium focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all" 
                      />
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <Label htmlFor="description" className="text-white font-semibold text-xs sm:text-sm uppercase tracking-wide">Description</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Tell members what this group is for..." 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        rows={3} 
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm sm:text-base" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Currency Settings */}
              <div className="glass-card border-white/10 hover:border-white/20 transition-colors duration-300 p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <Label className="text-white font-semibold text-sm">Group Currency</Label>
                  <Badge variant="secondary" className="text-xs bg-white/10 text-white/60 border-0">All groups are private</Badge>
                </div>
                
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-12 focus:border-primary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card/95 backdrop-blur-xl border-white/20 shadow-2xl">
                    <SelectItem value="USD" className="focus:bg-white/10 focus:text-white cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-primary">$</span>
                        <span className="text-white">USD - US Dollar</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="EUR" className="focus:bg-white/10 focus:text-white cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-primary">€</span>
                        <span className="text-white">EUR - Euro</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="GBP" className="focus:bg-white/10 focus:text-white cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-primary">£</span>
                        <span className="text-white">GBP - British Pound</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="INR" className="focus:bg-white/10 focus:text-white cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-primary">₹</span>
                        <span className="text-white">INR - Indian Rupee</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="CAD" className="focus:bg-white/10 focus:text-white cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-primary">C$</span>
                        <span className="text-white">CAD - Canadian Dollar</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="AUD" className="focus:bg-white/10 focus:text-white cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-primary">A$</span>
                        <span className="text-white">AUD - Australian Dollar</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <p className="text-xs text-white/50 mt-3 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  All groups are private and invite-only for your financial security
                </p>
              </div>

              {/* Smart Invite Members */}
              <div className="glass-card border-white/10 hover:border-white/20 transition-colors duration-300 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-primary" />
                    <Label className="text-white font-semibold text-sm">Invite Members</Label>
                    <Badge variant="secondary" className="text-xs bg-white/10 text-white/60 border-0">Optional</Badge>
                  </div>
                  {getInviteCount() > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary/20 rounded-full">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-primary text-xs font-medium">{getInviteCount()}</span>
                    </div>
                  )}
                </div>
                
                {/* Invite Action Buttons */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {/* Contacts Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-col gap-1 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-primary/50 transition-all group"
                    onClick={async () => {
                      try {
                        if ('contacts' in navigator && 'select' in navigator.contacts) {
                          const contacts = await navigator.contacts.select(['name', 'email', 'tel'], { multiple: true });
                          const emails = contacts.map(contact => contact.email).filter(Boolean).flat();
                          const phones = contacts.map(contact => contact.tel).filter(Boolean).flat().map(tel => tel.value);
                          const allContacts = [...emails, ...phones].join(', ');
                          setEmailList(prev => prev ? `${prev}, ${allContacts}` : allContacts);
                          toast({ title: "Contacts Added!", description: `Added ${contacts.length} contacts` });
                        } else {
                          toast({ title: "Feature Not Available", description: "Contact access not supported in this browser", variant: "destructive" });
                        }
                      } catch (error) {
                        toast({ title: "Access Denied", description: "Contact access was denied or cancelled", variant: "destructive" });
                      }
                    }}
                  >
                    <Phone className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">Contacts</span>
                  </Button>
                  
                  {/* Email Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-col gap-1 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-primary/50 transition-all group"
                    onClick={() => setInviteTab(inviteTab === 'email' ? '' : 'email')}
                  >
                    <Mail className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">Email</span>
                  </Button>
                  
                  {/* Share Link Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-col gap-1 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-primary/50 transition-all group"
                    onClick={() => {
                      const inviteUrl = `https://zenithwallet.app/join/${groupName?.toLowerCase().replace(/\s+/g, '-') || 'new-group'}`;
                      if (navigator.share) {
                        navigator.share({
                          title: `Join ${groupName || 'our group'}`,
                          text: `Join our expense group "${groupName || 'New Group'}"! Split and track expenses together.`,
                          url: inviteUrl
                        });
                      } else {
                        navigator.clipboard.writeText(inviteUrl);
                        toast({ title: "Link Copied!", description: "Share this link to invite members" });
                      }
                    }}
                  >
                    <Share2 className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">Share</span>
                  </Button>
                </div>
                
                {/* Conditional Email Input */}
                {inviteTab === 'email' && (
                  <div className="space-y-3 animate-slide-up">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-primary" />
                      <Textarea
                        value={emailList}
                        onChange={(e) => setEmailList(e.target.value)}
                        placeholder="Enter email addresses separated by commas...&#10;&#10;Example:&#10;john@example.com, sarah@company.com, mike@startup.io"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[80px] resize-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all pl-10 text-sm"
                        autoFocus
                      />
                    </div>
                    
                    {emailList.trim() && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-white/60 flex items-center gap-1">
                          <div className="w-1 h-1 bg-primary rounded-full"></div>
                          {emailList.split(',').filter(email => email.trim()).length} email{emailList.split(',').filter(email => email.trim()).length > 1 ? 's' : ''} added
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-white/60 hover:text-white"
                          onClick={() => setEmailList('')}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Selected Contacts Preview */}
                {emailList.trim() && inviteTab !== 'email' && (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 animate-slide-up">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span className="text-primary text-sm font-medium">
                          {emailList.split(/[,\n]/).filter(item => item.trim()).length} contact{emailList.split(/[,\n]/).filter(item => item.trim()).length > 1 ? 's' : ''} selected
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-primary hover:text-white hover:bg-primary/20"
                        onClick={() => setEmailList('')}
                      >
                        Clear all
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Custom Message Toggle */}
                {(emailList.trim() || inviteTab === 'email') && (
                  <div className="border-t border-white/10 pt-3 mt-3">
                    <details className="group">
                      <summary className="flex items-center gap-2 cursor-pointer text-xs text-white/70 hover:text-white transition-colors list-none">
                        <MessageSquare className="w-3 h-3" />
                        <span>Custom invitation message</span>
                        <div className="w-1 h-1 bg-white/40 rounded-full group-open:rotate-90 transition-transform ml-auto"></div>
                      </summary>
                      <div className="mt-3">
                        <Textarea
                          value={inviteMessage}
                          onChange={(e) => setInviteMessage(e.target.value)}
                          placeholder="Hi! I'd like to invite you to join our expense group. We can easily split and track shared expenses together."
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[60px] resize-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
                        />
                      </div>
                    </details>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="glass-card border-white/10 p-4 sm:p-6 mt-4">
                <div className="flex gap-3 sm:gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1 h-12 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 font-medium text-sm sm:text-base"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateGroup}
                    disabled={createGroupMutation.isPending || !groupName.trim()}
                    className="flex-1 h-12 btn-cyber hover:shadow-glow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base"
                  >
                  {createGroupMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 animate-spin" />
                      <span className="text-xs sm:text-sm md:text-base">Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                      <span className="text-xs sm:text-sm md:text-base">Create Group</span>
                    </>
                  )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Groups Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {groups.length === 0 ? (
          <div className="col-span-full text-center py-16 space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-4">
              <Users className="w-10 h-10 text-white/40" />
            </div>
            <h3 className="text-xl font-bold text-white/60">No groups found</h3>
            <p className="text-white/40 max-w-md mx-auto">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Create your first group to start tracking shared expenses'
              }
            </p>
          </div>
        ) : (
          groups
            .filter(group => {
              // Filter out groups with missing critical data
              if (!group._id || !group.name) {
                console.warn('Filtering out invalid group:', group);
                return false;
              }
              return true;
            })
            .map((group, index) => {
            // Calculate user's balance for this group from balances data
            const groupBalances = balancesData?.balances?.filter(
              (balance: any) => balance.group?._id === group._id
            ) || [];
            
            // Debug log for each group
            if (index === 0) { // Log only for first group to avoid spam
              console.log(`🔍 Group "${group.name}" Balance Calculation:`, {
                groupId: group._id,
                groupBalances,
                balanceCount: groupBalances.length,
                allBalances: balancesData?.balances
              });
            }
            
            // Sum up all balances for this group
            const userBalance = groupBalances.reduce((total: number, balance: any) => {
              if (balance.relationship === 'gets_back') {
                return total + (balance.amount || 0);
              } else if (balance.relationship === 'needs_to_pay') {
                return total - (balance.amount || 0);
              }
              return total;
            }, 0);
            
            // Debug log the final calculated balance
            if (index === 0) {
              console.log(`💵 Calculated Balance for "${group.name}": ${userBalance}`);
            }
            
            const isOwner = group.owner?._id === user?._id;
            
            return (
              <Card 
                key={group._id} 
                className="glass-card group cursor-pointer animate-fade-in overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => {
                  const groupId = group._id;
                  if (groupId) {
                    navigate(`/group/${groupId}`);
                  } else {
                    console.error('Cannot navigate - Group ID is missing:', group);
                    toast({
                      title: "Navigation Error",
                      description: "Unable to open group. Group ID is missing.",
                      variant: "destructive"
                    });
                  }
                }}
              >
                <CardContent className="p-4 sm:p-5 md:p-6 relative">
                  {/* Header with Avatar and Status */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-3 sm:gap-4 w-full">
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border-2 border-primary/30 group-hover:border-primary/60 transition-all duration-300 shadow-lg">
                          <AvatarImage src={group.avatar?.url} />
                          <AvatarFallback className="bg-gradient-primary text-white font-bold text-base sm:text-lg md:text-xl">
                            {(group.name || 'G').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {/* Status indicator */}
                        <div className={`absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center ${
                          (group.status || 'active') === 'active' ? 'bg-success animate-pulse-glow' : 'bg-muted'
                        }`}>
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white group-hover:text-primary transition-colors duration-300 truncate">
                            {group.name || 'Unnamed Group'}
                          </h3>
                          <Badge className={`${getStatusColor(group.status || 'active')} text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1`}>
                            {group.status || 'active'}
                          </Badge>
                        </div>
                        <p className="text-white/60 text-xs sm:text-sm leading-relaxed line-clamp-2">
                          {group.description || 'No description provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Member and Time Info */}
                  <div className="flex items-center justify-between text-xs sm:text-sm text-white/50 mb-3 sm:mb-4">
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 px-2 sm:px-3 py-1 rounded-full">
                      <div className="flex -space-x-1">
                        {[...Array(Math.min(3, group.memberCount || 0))].map((_, i) => (
                          <div key={i} className="w-4 h-4 sm:w-5 sm:h-5 bg-primary/20 border border-white/20 rounded-full" />
                        ))}
                        {(group.memberCount || 0) > 3 && (
                          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-[10px] sm:text-xs text-white/60">
                            +{(group.memberCount || 0) - 3}
                          </div>
                        )}
                      </div>
                      <span className="ml-1 sm:ml-2 text-xs sm:text-sm">{group.memberCount || 0} members</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-white/40">
                      <Calendar className="w-3 h-3" />
                      <span className="hidden sm:inline">{group.updatedAt ? new Date(group.updatedAt).toLocaleDateString() : 'Unknown'}</span>
                      <span className="sm:hidden">{group.updatedAt ? new Date(group.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}</span>
                    </div>
                  </div>

                  {/* Balance and Expenses */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="space-y-0.5 sm:space-y-1">
                      <div className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wide font-medium">Your Balance</div>
                      <div className={`text-lg sm:text-xl md:text-2xl font-bold ${getBalanceColor(userBalance)} group-hover:scale-110 transition-transform duration-300`}>
                        {formatBalance(userBalance, group.currency)}
                      </div>
                      <div className="text-[10px] sm:text-xs text-white/40">
                        {userBalance > 0 ? 'gets back' : userBalance < 0 ? 'owes' : 'settled'}
                      </div>
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <div className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wide font-medium">Total Expenses</div>
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-white group-hover:text-primary transition-colors duration-300">
                        {formatBalance(group.statistics?.totalAmount || 0, group.currency).replace(/[+-]/, '')}
                      </div>
                      <div className="text-[10px] sm:text-xs text-white/40">
                        {group.statistics?.totalExpenses || 0} expenses
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                    <div className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wide font-medium">Recent Activity</div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-white/70 bg-white/5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                      <span className="text-sm sm:text-base">
                        {getRecentActivityEmoji('recent')}
                      </span>
                      <span className="truncate">
                        {group.updatedAt && new Date(group.updatedAt).toDateString() === new Date().toDateString() 
                          ? 'Updated today' 
                          : group.updatedAt ? `Updated ${new Date(group.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No recent activity'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1 sm:gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 text-white/60 hover:text-white hover:bg-white/10 hover:bg-primary/20 hover:text-primary transition-all duration-300 h-8 sm:h-9 px-1 sm:px-2"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const groupId = group._id || group._id;
                        if (groupId) {
                          navigate(`/group/${groupId}/chat`);
                        } else {
                          console.error('Group ID is missing:', group);
                          toast({
                            title: "Navigation Error",
                            description: "Unable to navigate to group chat. Group ID is missing.",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <MessageSquare className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline text-xs">Chat</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 text-white/60 hover:text-white hover:bg-white/10 hover:bg-primary/20 hover:text-primary transition-all duration-300 h-8 sm:h-9 px-1 sm:px-2"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const groupId = group._id || group._id;
                        if (groupId) {
                          navigate(`/group/${groupId}`, { state: { activeTab: 'balances' } });
                        } else {
                          console.error('Group ID is missing:', group);
                          toast({
                            title: "Navigation Error",
                            description: "Unable to navigate to group balances. Group ID is missing.",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <DollarSign className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline text-xs">Balances</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 text-white/60 hover:text-white hover:bg-white/10 hover:bg-primary/20 hover:text-primary transition-all duration-300 h-8 sm:h-9 px-1 sm:px-2"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const groupId = group._id || group._id;
                        if (groupId) {
                          navigate(`/group/${groupId}`, { state: { activeTab: 'expenses' } });
                        } else {
                          console.error('Group ID is missing:', group);
                          toast({
                            title: "Navigation Error",
                            description: "Unable to navigate to group expenses. Group ID is missing.",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <Receipt className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline text-xs">Expenses</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-white/60 hover:text-white hover:bg-white/10 hover:bg-primary/20 hover:text-primary transition-all duration-300 h-8 sm:h-9 px-1.5 sm:px-2"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const groupId = group._id || group._id;
                        if (!groupId) {
                          console.error('Group ID is missing:', group);
                          toast({
                            title: "Navigation Error",
                            description: "Unable to navigate to group settings. Group ID is missing.",
                            variant: "destructive"
                          });
                          return;
                        }
                        if (isOwner) {
                          navigate(`/group/${groupId}`, { state: { activeTab: 'settings' } });
                        } else {
                          toast({
                            title: "Access Restricted",
                            description: "Only group owners can access settings",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

    </div>
  );
};

// Standalone Groups page with layout (for /groups route)
const GroupsPage = withLayout(Groups, { defaultMode: 'group', defaultSubNav: 'home' });

// Export both versions
export default Groups;
export { GroupsPage };
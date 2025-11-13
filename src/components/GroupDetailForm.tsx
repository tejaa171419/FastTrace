import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Save, 
  Edit3, 
  Users, 
  Mail, 
  Phone, 
  UserPlus, 
  Upload, 
  Camera, 
  Settings,
  X,
  Copy,
  Share2,
  Crown,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useGetInviteCode } from "@/hooks/useGroups";
import InviteMembersModal from "@/components/InviteMembersModal";

interface GroupMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  balance: number;
  isOwner: boolean;
  joinedAt: string;
  status: 'active' | 'pending' | 'invited';
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isRegistered: boolean;
}

interface GroupDetailFormProps {
  groupId?: string;
  initialData?: {
    name: string;
    description: string;
    currency: string;
    members: GroupMember[];
  };
  onSave: (data: any) => void;
  onCancel: () => void;
}

const GroupDetailForm = ({ groupId, initialData, onSave, onCancel }: GroupDetailFormProps) => {
  const { toast } = useToast();
  
  // Fetch the actual invite code for this group (if editing)
  const { data: inviteCodeData } = useGetInviteCode(groupId || '', !!groupId);
  const actualInviteCode = inviteCodeData?.data?.inviteCode;
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  // Form state
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    currency: initialData?.currency || 'USD',
    allowMemberInvites: true,
    autoSettlement: false,
    notificationEmails: true
  });

  // Member management state
  const [members, setMembers] = useState<GroupMember[]>(initialData?.members || []);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
  const [formProgress, setFormProgress] = useState(0);

  // Mock contact list - in real app, this would come from contacts API
  const [contacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@company.com',
      phone: '+1 234 567 8901',
      isRegistered: true
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@company.com',
      phone: '+1 234 567 8902',
      isRegistered: true
    },
    {
      id: '3',
      name: 'Carol Wilson',
      email: 'carol@gmail.com',
      phone: '+1 234 567 8903',
      isRegistered: false
    },
    {
      id: '4',
      name: 'David Brown',
      email: 'david@yahoo.com',
      phone: '+1 234 567 8904',
      isRegistered: false
    },
    {
      id: '5',
      name: 'Emma Davis',
      email: 'emma@company.com',
      phone: '+1 234 567 8905',
      isRegistered: true
    }
  ]);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' }
  ];

  // Form validation and progress tracking
  const getFormProgress = () => {
    let progress = 0;
    if (formData.name.trim().length >= 3) progress += 35;
    if (formData.description.trim().length >= 10) progress += 25;
    if (formData.currency) progress += 10;
    if (members.length > 0) progress += 30;
    return progress;
  };

  const isFormValid = () => {
    return formData.name.trim().length >= 3 && formData.description.trim().length >= 10;
  };

  // Update progress when form data changes
  useEffect(() => {
    setFormProgress(getFormProgress());
  }, [formData, members]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const groupData = {
        ...formData,
        visibility: 'private', // All groups are private by default
        members,
        avatar: groupAvatar,
        id: groupId || Math.random().toString(36).substr(2, 9)
      };
      
      await onSave(groupData);
      
      toast({
        title: "Success",
        description: groupId ? "Group updated successfully" : "Group created successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save group details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle invitations from the modal
  const handleInviteSent = (invites: any[]) => {
    const newMembers = invites.map(invite => ({
      id: Math.random().toString(36).substr(2, 9),
      name: invite.contactName || invite.recipient.split('@')[0],
      email: invite.recipient,
      phone: invite.phone,
      balance: 0,
      isOwner: false,
      joinedAt: new Date().toISOString(),
      status: (invite.isRegistered !== undefined ? 
        (invite.isRegistered ? 'invited' : 'pending') : 
        'invited') as 'active' | 'pending' | 'invited'
    }));

    setMembers(prev => [...prev, ...newMembers]);
  };

  // Remove member
  const removeMember = (memberId: string) => {
    setMembers(prev => prev.filter(member => member.id !== memberId));
    toast({
      title: "Member Removed",
      description: "Member has been removed from the group"
    });
  };

  // Generate group link
  const generateGroupLink = () => {
    if (!actualInviteCode) {
      toast({
        title: "Error",
        description: "Invite code is not available yet. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    const groupLink = `https://zenithwallet.app/join-group?code=${actualInviteCode}`;
    navigator.clipboard.writeText(groupLink);
    toast({
      title: "Link Copied! 🔗",
      description: "Group invitation link copied to clipboard"
    });
  };

  // Get member status icon and color
  const getMemberStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' };
      case 'pending':
        return { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/20', border: 'border-orange-500/30' };
      case 'invited':
        return { icon: Mail, color: 'text-blue-500', bg: 'bg-blue-500/20', border: 'border-blue-500/30' };
      default:
        return { icon: AlertCircle, color: 'text-gray-500', bg: 'bg-gray-500/20', border: 'border-gray-500/30' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent truncate">
            {groupId ? 'Edit Group' : 'Create New Group'}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mt-1 sm:mt-2">
            {groupId ? 'Update group settings and manage members' : 'Set up your expense sharing group'}
          </p>
          
          {/* Form Progress - Mobile Responsive */}
          {!groupId && (
            <div className="mt-3 sm:mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Form Progress</span>
                <span className="text-muted-foreground">{formProgress}% complete</span>
              </div>
              <Progress value={formProgress} className="h-1.5 sm:h-2" />
              {formProgress < 100 && (
                <div className="text-xs text-muted-foreground flex flex-wrap gap-1 sm:gap-2">
                  {!formData.name || formData.name.trim().length < 3 ? (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Name required
                    </Badge>
                  ) : null}
                  {(!formData.description || formData.description.trim().length < 10) ? (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Description required
                    </Badge>
                  ) : null}
                  {members.length === 0 ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Add members
                    </Badge>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Form - Mobile Responsive Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-card/60 backdrop-blur-lg border border-border/50">
          <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 sm:py-3 text-xs sm:text-sm">
            <Settings className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 sm:py-3 text-xs sm:text-sm">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden xs:inline">Members</span> ({members.length})
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 sm:py-3 text-xs sm:text-sm">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Group Details Tab - Mobile Responsive */}
        <TabsContent value="details" className="space-y-4 sm:space-y-6">
          <Card className="glass-card border border-white/20 shadow-glow">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-foreground flex items-center gap-2 text-lg sm:text-xl">
                <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Group Information
              </CardTitle>
              <CardDescription className="text-sm">
                Basic details about your expense sharing group
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              {/* Group Avatar - Mobile Responsive */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="relative group cursor-pointer shrink-0">
                  <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-3 sm:border-4 border-primary/30 group-hover:border-primary/60 transition-all duration-300 shadow-lg">
                    <AvatarImage src={groupAvatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl sm:text-3xl font-bold">
                      {formData.name.charAt(0).toUpperCase() || 'G'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity duration-300">
                    <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                </div>
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <Label className="text-base sm:text-lg font-medium">Group Photo</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">Upload an image to personalize your group</p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <Button variant="outline" size="sm" className="border-white/30 hover:bg-white/10">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <Button variant="outline" size="sm" className="border-white/30 hover:bg-white/10">
                      <Camera className="w-4 h-4 mr-2" />
                      Camera
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/20" />

              {/* Group Name - Mobile Responsive */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground text-sm sm:text-base md:text-lg">
                  Group Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Office Team, Family Trip"
                  className={cn(
                    "bg-background/50 border-border/50 backdrop-blur-sm py-3 sm:py-4 md:py-6 text-base sm:text-lg",
                    formData.name.length < 3 && formData.name.length > 0 && "border-destructive"
                  )}
                />
                {formData.name.length < 3 && formData.name.length > 0 && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Name must be at least 3 characters long
                  </p>
                )}
                <p className="text-sm text-muted-foreground">Choose a memorable name for your group</p>
              </div>

              {/* Description - Mobile Responsive */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground text-sm sm:text-base md:text-lg">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What is this group for? e.g., Sharing office lunch expenses"
                  className={cn(
                    "bg-background/50 border-border/50 backdrop-blur-sm min-h-[100px] sm:min-h-[120px] text-sm sm:text-base md:text-lg",
                    formData.description.length < 10 && formData.description.length > 0 && "border-destructive"
                  )}
                />
                <div className="flex justify-between text-sm">
                  {formData.description.length < 10 && formData.description.length > 0 ? (
                    <p className="text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Description must be at least 10 characters long
                    </p>
                  ) : (
                    <span className="text-muted-foreground">Describe the purpose of this group</span>
                  )}
                  <span className="text-muted-foreground">{formData.description.length}/500</span>
                </div>
              </div>

              {/* Currency - Mobile Responsive */}
              <div className="space-y-2">
                <Label className="text-foreground text-sm sm:text-base md:text-lg">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger className="bg-background/50 border-border/50 backdrop-blur-sm py-3 sm:py-4 md:py-6 text-sm sm:text-base md:text-lg">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code} className="hover:bg-primary/20 focus:bg-primary/20 cursor-pointer">
                        <div className="flex items-center gap-3 py-2">
                          <span className="font-mono text-lg">{currency.symbol}</span>
                          <div>
                            <div className="font-medium">{currency.name}</div>
                            <div className="text-xs text-muted-foreground">({currency.code})</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Select the default currency for this group</p>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab - Mobile Responsive */}
        <TabsContent value="members" className="space-y-4 sm:space-y-6">
          <Card className="glass-card border border-white/20 shadow-glow">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-foreground flex items-center gap-2 text-lg sm:text-xl">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Group Members
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Manage who can participate in this group
                  </CardDescription>
                </div>
                
                <Button 
                  onClick={() => setInviteModalOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-glow transition-all duration-300 py-2.5 sm:py-3 px-4 sm:px-6 w-full sm:w-auto text-sm sm:text-base"
                >
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Invite Members
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              {/* Share Link - Mobile Responsive */}
              <div className="p-4 sm:p-6 bg-card/30 rounded-xl border border-border/30 shadow-sm">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div>
                    <h4 className="font-bold text-base sm:text-lg text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      Group Invitation Link
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Share this link to invite people instantly</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={generateGroupLink} 
                      disabled={!actualInviteCode}
                      className="border-white/30 hover:bg-white/10 py-2 px-3 sm:px-4 flex-1 text-xs sm:text-sm"
                    >
                      <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      {actualInviteCode ? 'Copy Link' : 'Loading...'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={!actualInviteCode}
                      className="border-white/30 hover:bg-white/10 py-2 px-3 sm:px-4 flex-1 text-xs sm:text-sm"
                    >
                      <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>

              {/* Members List - Mobile Responsive */}
              <div className="space-y-3 sm:space-y-4">
                {members.map((member, index) => (
                  <div 
                    key={member.id}
                    className="flex flex-col gap-3 p-4 sm:p-5 bg-card/30 rounded-xl border border-border/30 animate-fade-in hover:shadow-md transition-all duration-300"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-primary/30 shrink-0">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm sm:text-base">
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          <span className="font-bold text-sm sm:text-base md:text-lg text-foreground truncate">{member.name}</span>
                          {member.isOwner && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs py-1">
                              <Crown className="w-3 h-3 mr-1" />
                              Owner
                            </Badge>
                          )}
                            <Badge 
                            variant={member.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs py-0.5 sm:py-1"
                          >
                            {member.status}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground text-xs sm:text-sm truncate">{member.email}</div>
                        {member.phone && (
                          <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {member.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-left sm:text-right flex-1 sm:flex-initial sm:min-w-[100px]">
                        <div className={`text-base sm:text-lg font-bold ${member.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {member.balance >= 0 ? '+' : ''}{Math.abs(member.balance).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.balance > 0 ? 'gets back' : member.balance < 0 ? 'needs to pay' : 'settled'}
                        </div>
                      </div>
                      
                      {!member.isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMember(member.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 sm:h-10 sm:w-10 p-0 shrink-0"
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {members.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground bg-card/20 rounded-xl border border-dashed border-white/20">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-foreground mb-2">No Members Yet</h3>
                    <p className="mb-6 max-w-md mx-auto">Start by inviting people to your group to begin sharing expenses</p>
                    <Button 
                      onClick={() => setInviteModalOpen(true)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-glow"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      Invite Members
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="glass-card border border-white/20 shadow-glow">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Group Settings
              </CardTitle>
              <CardDescription>
                Configure how your group operates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-card/30 rounded-xl border border-border/30">
                  <div className="space-y-1">
                    <Label className="text-foreground text-lg">Allow members to invite others</Label>
                    <p className="text-sm text-muted-foreground">Let group members send invitations</p>
                  </div>
                  <Switch
                    checked={formData.allowMemberInvites}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowMemberInvites: checked }))}
                    className="scale-125"
                  />
                </div>
                
                <Separator className="bg-white/20" />
                
                <div className="flex items-center justify-between p-4 bg-card/30 rounded-xl border border-border/30">
                  <div className="space-y-1">
                    <Label className="text-foreground text-lg">Auto-settlement</Label>
                    <p className="text-sm text-muted-foreground">Automatically settle small balances</p>
                  </div>
                  <Switch
                    checked={formData.autoSettlement}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoSettlement: checked }))}
                    className="scale-125"
                  />
                </div>
                
                <Separator className="bg-white/20" />
                
                <div className="flex items-center justify-between p-4 bg-card/30 rounded-xl border border-border/30">
                  <div className="space-y-1">
                    <Label className="text-foreground text-lg">Email notifications</Label>
                    <p className="text-sm text-muted-foreground">Send email updates for group activity</p>
                  </div>
                  <Switch
                    checked={formData.notificationEmails}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notificationEmails: checked }))}
                    className="scale-125"
                  />
                </div>
              </div>
              
              {groupId && (
                <div className="pt-6 border-t border-white/20">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-foreground">Danger Zone</h3>
                      <p className="text-sm text-muted-foreground">Permanently delete this group and all associated data</p>
                    </div>
                    <Button variant="destructive" className="px-6 py-3">
                      Delete Group
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons at Bottom - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-border/50">
        <Button variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1 sm:flex-none border-white/30 hover:bg-white/10 py-3 sm:py-4 md:py-6 text-sm sm:text-base">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!isFormValid() || isLoading}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white flex-1 sm:flex-none py-3 sm:py-4 md:py-6 shadow-lg hover:shadow-glow transition-all duration-300 text-sm sm:text-base"
          title={!isFormValid() ? "Please fill in group name (3+ characters) and description (10+ characters)" : ""}
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              {groupId ? 'Update Group' : 'Create Group'}
            </>
          )}
        </Button>
      </div>

      {/* Enhanced Invite Members Modal */}
      <InviteMembersModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        groupName={formData.name || 'New Group'}
        groupId={groupId || 'new'}
        onInviteSent={handleInviteSent}
      />
    </div>
  );
};

export default GroupDetailForm;
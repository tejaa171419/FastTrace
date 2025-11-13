import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Mail, 
  Phone, 
  Share2, 
  Send, 
  Copy, 
  Check, 
  X, 
  Search, 
  UserPlus,
  MessageSquare,
  Link,
  QrCode,
  Globe,
  Users,
  Filter,
  ChevronDown,
  Upload,
  FileText,
  Smartphone,
  Calendar,
  Clock,
  Star,
  MapPin,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Info,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetInviteCode } from "@/hooks/useGroups";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isRegistered: boolean;
  lastSeen?: string;
  groups?: string[];
  location?: string;
  timezone?: string;
  preferredContact: 'email' | 'phone' | 'app';
  relationship: 'friend' | 'family' | 'colleague' | 'other';
  inviteCount: number;
  lastInvited?: Date;
}

interface InvitationTemplate {
  id: string;
  name: string;
  subject: string;
  message: string;
  type: 'email' | 'sms' | 'universal';
  isDefault: boolean;
}

interface InviteStats {
  sent: number;
  delivered: number;
  opened: number;
  accepted: number;
  pending: number;
  declined: number;
}

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  groupId: string;
  onInviteSent: (invites: any[]) => void;
}

const InviteMembersModal = ({ isOpen, onClose, groupName, groupId, onInviteSent }: InviteMembersModalProps) => {
  const { toast } = useToast();
  
  // Fetch the actual invite code for this group
  const { data: inviteCodeData, isLoading: isCodeLoading, error: codeError } = useGetInviteCode(groupId, isOpen);
  const actualInviteCode = inviteCodeData?.data?.inviteCode;
  
  const [activeTab, setActiveTab] = useState('smart');
  const [isLoading, setIsLoading] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  
  // Enhanced invitation state
  const [emailList, setEmailList] = useState('');
  const [phoneList, setPhoneList] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [customMessage, setCustomMessage] = useState(`Hi! I'd like to invite you to join our expense group "${groupName}". We can easily split and track shared expenses together. 💰`);
  const [scheduleInvite, setScheduleInvite] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [enableReminders, setEnableReminders] = useState(true);
  const [reminderInterval, setReminderInterval] = useState('3');
  const [maxReminders, setMaxReminders] = useState('2');
  
  // Missing state variables
  const [inviteMethod, setInviteMethod] = useState<'email' | 'phone' | 'both'>('email');
  const [emailMessage, setEmailMessage] = useState(`Hi! I'd like to invite you to join our expense group "${groupName}". We can easily split and track shared expenses together. 💰`);
  const [linkMessage, setLinkMessage] = useState(`Hi! I'd like to invite you to join our expense group "${groupName}". We can easily split and track shared expenses together. 💰`);
  
  // Contact management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactFilter, setContactFilter] = useState<'all' | 'registered' | 'unregistered' | 'frequent'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'frequent'>('name');
  const [bulkSelect, setBulkSelect] = useState(false);
  
  // Share link options
  const [linkExpiry, setLinkExpiry] = useState('7');
  const [linkUsageLimit, setLinkUsageLimit] = useState('');
  const [requireApproval, setRequireApproval] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);
  
  // Import contacts
  const [importSource, setImportSource] = useState<'csv' | 'contacts' | 'google' | 'outlook'>('csv');
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  // Enhanced contact data with more details
  const [contacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@company.com',
      phone: '+1 234 567 8901',
      isRegistered: true,
      lastSeen: '2 hours ago',
      groups: ['Office Team', 'Lunch Group'],
      location: 'New York, NY',
      timezone: 'EST',
      preferredContact: 'email',
      relationship: 'colleague',
      inviteCount: 3,
      lastInvited: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@company.com',
      phone: '+1 234 567 8902',
      isRegistered: true,
      lastSeen: 'Online',
      groups: ['Office Team'],
      location: 'San Francisco, CA',
      timezone: 'PST',
      preferredContact: 'app',
      relationship: 'colleague',
      inviteCount: 1,
      lastInvited: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      name: 'Carol Wilson',
      email: 'carol@gmail.com',
      phone: '+1 234 567 8903',
      isRegistered: false,
      groups: [],
      location: 'Chicago, IL',
      preferredContact: 'phone',
      relationship: 'friend',
      inviteCount: 0
    },
    {
      id: '4',
      name: 'David Brown',
      email: 'david@yahoo.com',
      phone: '+1 234 567 8904',
      isRegistered: false,
      groups: [],
      location: 'Austin, TX',
      preferredContact: 'email',
      relationship: 'family',
      inviteCount: 2,
      lastInvited: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    },
    {
      id: '5',
      name: 'Emma Davis',
      email: 'emma@company.com',
      phone: '+1 234 567 8905',
      isRegistered: true,
      lastSeen: '1 day ago',
      groups: ['Family Trip', 'Weekend Plans'],
      location: 'Seattle, WA',
      timezone: 'PST',
      preferredContact: 'app',
      relationship: 'family',
      inviteCount: 5,
      lastInvited: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    }
  ]);

  // Enhanced filtering with more options
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contact.phone && contact.phone.includes(searchTerm));
    
    const matchesFilter = (() => {
      switch (contactFilter) {
        case 'registered': return contact.isRegistered;
        case 'unregistered': return !contact.isRegistered;
        case 'frequent': return contact.inviteCount >= 3;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        if (!a.lastInvited && !b.lastInvited) return 0;
        if (!a.lastInvited) return 1;
        if (!b.lastInvited) return -1;
        return b.lastInvited.getTime() - a.lastInvited.getTime();
      case 'frequent':
        return b.inviteCount - a.inviteCount;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  // Smart invitation handler with progress tracking
  const handleSmartInvite = async () => {
    if (selectedContacts.length === 0) {
      toast({
        title: "No contacts selected",
        description: "Please select contacts to invite",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setSendProgress(0);
    
    try {
      const totalContacts = selectedContacts.length;
      const invites = [];
      
      for (let i = 0; i < totalContacts; i++) {
        const contactId = selectedContacts[i];
        const contact = contacts.find(c => c.id === contactId);
        
        if (contact) {
          // Simulate sending invitation with preferred method
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const inviteMethod = contact.isRegistered ? 'app' : contact.preferredContact;
          
          invites.push({
            type: inviteMethod,
            recipient: inviteMethod === 'email' ? contact.email : contact.phone,
            recipientName: contact.name,
            message: customMessage,
            scheduled: scheduleInvite,
            scheduleTime: scheduleTime,
            timestamp: new Date().toISOString(),
            contactId: contact.id
          });
          
          setSendProgress(((i + 1) / totalContacts) * 100);
        }
      }
      
      onInviteSent(invites);
      
      toast({
        title: "Invitations sent! ✉️",
        description: `Successfully sent ${invites.length} invitation${invites.length > 1 ? 's' : ''} using preferred contact methods`
      });
      
      // Reset form
      setSelectedContacts([]);
      setCustomMessage(`Hi! I'd like to invite you to join our expense group "${groupName}". We can easily split and track shared expenses together. 💰`);
      onClose();
      
    } catch (error) {
      toast({
        title: "Invitation failed",
        description: "Some invitations could not be sent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setSendProgress(0);
    }
  };

  // Handle email invitations
  const handleEmailInvite = async () => {
    const emails = emailList.split(/[,\n\s]+/).filter(email => email.trim());
    const phones = phoneList.split(/[,\n\s]+/).filter(phone => phone.trim());
    
    if (emails.length === 0 && phones.length === 0) {
      toast({
        title: "No recipients",
        description: "Please enter at least one email address or phone number",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const invites = [];
      
      emails.forEach(email => {
        invites.push({
          type: 'email',
          recipient: email,
          message: emailMessage,
          timestamp: new Date().toISOString()
        });
      });
      
      phones.forEach(phone => {
        invites.push({
          type: 'sms',
          recipient: phone,
          message: emailMessage,
          timestamp: new Date().toISOString()
        });
      });
      
      onInviteSent(invites);
      
      toast({
        title: "Invitations Sent! ✨",
        description: `Successfully sent ${invites.length} invitation${invites.length > 1 ? 's' : ''} via ${emails.length > 0 && phones.length > 0 ? 'email and SMS' : emails.length > 0 ? 'email' : 'SMS'}`
      });
      
      setEmailList('');
      setPhoneList('');
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle contact invitations
  const handleContactInvite = async () => {
    if (selectedContacts.length === 0) {
      toast({
        title: "No Contacts Selected",
        description: "Please select contacts to invite",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const selectedContactsData = contacts.filter(c => selectedContacts.includes(c.id));
      const invites = selectedContactsData.map(contact => ({
        type: 'contact',
        recipient: contact.email,
        contactName: contact.name,
        phone: contact.phone,
        isRegistered: contact.isRegistered,
        timestamp: new Date().toISOString()
      }));
      
      onInviteSent(invites);
      
      toast({
        title: "Invitations Sent! 🎉",
        description: `Successfully invited ${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''}`
      });
      
      setSelectedContacts([]);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle share link
  const handleCopyLink = () => {
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
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    
    toast({
      title: "Link Copied! 🔗",
      description: "Group invitation link copied to clipboard"
    });
  };

  const handleShareLink = () => {
    if (!actualInviteCode) {
      toast({
        title: "Error",
        description: "Invite code is not available yet. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    const groupLink = `https://zenithwallet.app/join-group?code=${actualInviteCode}`;
    const shareText = `${linkMessage}\n\n${groupLink}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Join ${groupName}`,
        text: shareText
      });
    } else {
      // Fallback to copy
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Link Copied! 📱",
        description: "Share text copied to clipboard"
      });
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const getContactStatusColor = (contact: Contact) => {
    if (!contact.isRegistered) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (contact.lastSeen === 'Online') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  const getContactStatusText = (contact: Contact) => {
    if (!contact.isRegistered) return 'Not Registered';
    if (contact.lastSeen === 'Online') return 'Online';
    return `Last seen ${contact.lastSeen}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-white/25 max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide p-6">
        <DialogHeader>
          <DialogTitle className="text-gradient-cyber text-2xl flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            Invite Members to {groupName}
          </DialogTitle>
          <DialogDescription className="text-white/70 text-base">
            Choose how you'd like to invite people to join your expense group
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 border-white/30 rounded-lg mb-4">
            <TabsTrigger value="email" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Mail className="w-4 h-4 mr-2" />
              Email & SMS
            </TabsTrigger>
            <TabsTrigger value="contacts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Phone className="w-4 h-4 mr-2" />
              From Contacts
            </TabsTrigger>
            <TabsTrigger value="share" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </TabsTrigger>
          </TabsList>

          {/* Email & Phone Invitations Tab */}
          <TabsContent value="email" className="space-y-6 mt-6">
            <div className="space-y-4">
              {/* Invitation Method Selection */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={inviteMethod === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInviteMethod('email')}
                  className="flex-1"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Only
                </Button>
                <Button
                  variant={inviteMethod === 'phone' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInviteMethod('phone')}
                  className="flex-1"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  SMS Only
                </Button>
                <Button
                  variant={inviteMethod === 'both' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInviteMethod('both')}
                  className="flex-1"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Both
                </Button>
              </div>

              {/* Email Input */}
              {(inviteMethod === 'email' || inviteMethod === 'both') && (
                <div className="space-y-2">
                  <Label className="text-foreground text-base flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email Addresses
                  </Label>
                  <Textarea
                    value={emailList}
                    onChange={(e) => setEmailList(e.target.value)}
                    placeholder="Enter email addresses separated by commas or new lines...&#10;&#10;Example:&#10;john@example.com&#10;sarah@company.com, mike@startup.io"
                    className="min-h-[100px] bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground"
                  />
                  <p className="text-sm text-muted-foreground">
                    You can paste multiple emails separated by commas, spaces, or line breaks
                  </p>
                </div>
              )}

              {/* Phone Input */}
              {(inviteMethod === 'phone' || inviteMethod === 'both') && (
                <div className="space-y-2">
                  <Label className="text-foreground text-base flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Phone Numbers
                  </Label>
                  <Textarea
                    value={phoneList}
                    onChange={(e) => setPhoneList(e.target.value)}
                    placeholder="Enter phone numbers separated by commas or new lines...&#10;&#10;Example:&#10;+1 234 567 8900&#10;+44 20 7946 0958, +91 98765 43210"
                    className="min-h-[100px] bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground"
                  />
                  <p className="text-sm text-muted-foreground">
                    Include country codes for international numbers (e.g., +1, +44, +91)
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-foreground text-base">Invitation Message</Label>
                <Textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Add a personal message to your invitation..."
                  className="min-h-[80px] bg-background/50 border-border/50 text-foreground"
                />
                <p className="text-sm text-muted-foreground">
                  This message will be included in the {inviteMethod === 'email' ? 'email' : inviteMethod === 'phone' ? 'SMS' : 'email and SMS'} invitation
                </p>
              </div>

              <Card className="bg-card/30 border-border/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div className="space-y-1">
                      <h4 className="font-medium text-foreground">What happens next?</h4>
                      <p className="text-sm text-muted-foreground">
                        {inviteMethod === 'email' && "Recipients will receive an email with your message and a link to join the group."}
                        {inviteMethod === 'phone' && "Recipients will receive an SMS with your message and a link to join the group."}
                        {inviteMethod === 'both' && "Recipients will receive both email and SMS with your message and a link to join the group."}
                        {" They can join instantly if they have an account, or sign up first."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border/30">
              <Button variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleEmailInvite} className="flex-1 bg-gradient-primary text-white" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </div>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send {inviteMethod === 'email' ? 'Email' : inviteMethod === 'phone' ? 'SMS' : 'Email & SMS'} Invitations
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6 mt-6">
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search contacts by name or email..."
                    className="pl-10 bg-background/50 border-border/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={contactFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContactFilter('all')}
                    className="text-xs"
                  >
                    All ({contacts.length})
                  </Button>
                  <Button
                    variant={contactFilter === 'registered' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContactFilter('registered')}
                    className="text-xs"
                  >
                    Registered ({contacts.filter(c => c.isRegistered).length})
                  </Button>
                  <Button
                    variant={contactFilter === 'unregistered' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContactFilter('unregistered')}
                    className="text-xs"
                  >
                    New ({contacts.filter(c => !c.isRegistered).length})
                  </Button>
                </div>
              </div>

              {selectedContacts.length > 0 && (
                <Card className="bg-primary/10 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        <span className="font-medium text-foreground">
                          {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedContacts([])}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Clear all
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contacts List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide border border-white/20 rounded-lg p-2 bg-white/5">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors duration-200",
                      selectedContacts.includes(contact.id)
                        ? "bg-primary/20 border-primary shadow-glow"
                        : "glass-card border-white/20 hover:border-white/40 hover:bg-white/10"
                    )}
                    onClick={() => toggleContactSelection(contact.id)}
                  >
                    <div className="flex-shrink-0">
                      {selectedContacts.includes(contact.id) ? (
                        <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 border-2 border-white/30 rounded hover:border-primary transition-colors" />
                      )}
                    </div>

                    <Avatar className="w-12 h-12 border-2 border-white/20">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback className="bg-gradient-primary text-white font-bold">
                        {contact.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground truncate">{contact.name}</span>
                        <Badge className={getContactStatusColor(contact)}>
                          {getContactStatusText(contact)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">{contact.email}</div>
                      {contact.phone && (
                        <div className="text-xs text-muted-foreground">{contact.phone}</div>
                      )}
                      {contact.groups && contact.groups.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {contact.groups.length} group{contact.groups.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {filteredContacts.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No contacts found matching your search' : 'No contacts available'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/20">
              <Button variant="outline" onClick={onClose} className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20" disabled={isLoading}>
                Cancel
              </Button>
              <Button 
                onClick={handleContactInvite} 
                className="flex-1 bg-gradient-primary text-white hover:shadow-glow" 
                disabled={selectedContacts.length === 0 || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Inviting...
                  </div>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Share Link Tab */}
          <TabsContent value="share" className="space-y-6 mt-6 scrollbar-hide">
            <div className="space-y-6">
              <Card className="glass-card border-primary/30 transition-colors duration-300">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
                    <QrCode className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Group Invitation Link</h3>
                  <p className="text-white/70 mb-4">
                    Share this link with anyone you want to invite to the group
                  </p>
                  
                  <div className="bg-white/10 border border-white/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-sm font-mono text-white/80">
                      <Globe className="w-4 h-4" />
                      {actualInviteCode ? (
                        <span className="truncate">https://zenithwallet.app/join-group?code={actualInviteCode}</span>
                      ) : (
                        <span className="text-white/50">Loading invite code...</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={handleCopyLink}
                      className="flex-1 max-w-40 bg-white/10 border-white/30 text-white hover:bg-white/20"
                    >
                      {linkCopied ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleShareLink}
                      className="flex-1 max-w-40 bg-gradient-primary text-white hover:shadow-glow"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Label className="text-white text-base">Custom Share Message</Label>
                <Textarea
                  value={linkMessage}
                  onChange={(e) => setLinkMessage(e.target.value)}
                  placeholder="Add a personal message when sharing the link..."
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  rows={3}
                />
                <p className="text-sm text-white/60">
                  This message will be included when you share the link via social media or messaging apps
                </p>
              </div>

              <Card className="glass-card border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div className="space-y-2">
                      <h4 className="font-medium text-white">Share Options</h4>
                      <div className="space-y-1 text-sm text-white/70">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp, Telegram, SMS</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-3 h-3" />
                          <span>Social media platforms</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          <span>Email or any messaging app</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMembersModal;
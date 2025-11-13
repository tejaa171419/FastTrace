import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Send, 
  Smile, 
  Paperclip, 
  Phone, 
  Video, 
  MoreVertical,
  Users,
  Search,
  Image,
  Mic,
  Camera,
  Download,
  Reply,
  Forward,
  Trash2,
  Edit3,
  Info,
  Bell,
  BellOff,
  Star,
  Copy,
  Check,
  CheckCheck,
  Clock,
  X,
  File,
  PlayCircle,
  Calendar,
  DollarSign,
  MessageSquare,
  UserPlus,
  Menu,
  Hash,
  Settings,
  ThumbsUp,
  Heart,
  Laugh,
  Frown,
  Pin,
  PinOff,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMessages } from "@/hooks/useMessages";

interface Message {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'expense' | 'payment';
  isOwn?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  replyTo?: {
    id: string;
    userName: string;
    content: string;
  };
  expenseData?: {
    amount: number;
    title: string;
    category: string;
    splitDetails?: Array<{
      userId: string;
      userName: string;
      amount: number;
    }>;
  };
  fileData?: {
    name: string;
    size: number;
    url: string;
  };
  reactions?: Array<{
    userId: string;
    emoji: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
  isPinned?: boolean;
}

interface Member {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'member';
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  phoneNumber?: string;
  email?: string;
}

interface GroupChatItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: {
    content: string;
    timestamp: Date;
    sender: string;
    type: 'text' | 'expense' | 'image' | 'file';
  };
  unreadCount: number;
  isActive: boolean;
  memberCount: number;
  totalExpenses: number;
}

const EnhancedGroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showMemberInfo, setShowMemberInfo] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const [selectedMessageForReactions, setSelectedMessageForReactions] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the new messages hook
  const {
    messages,
    loading,
    error,
    typingUsers,
    sendMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    pinMessage,
    unpinMessage,
    sendTypingIndicator
  } = useMessages({ groupId: groupId || "" });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await sendMessage(message.trim(), 'text', {
        replyTo: replyingTo ? {
          messageId: replyingTo.id,
          senderName: replyingTo.userName,
          content: replyingTo.content
        } : undefined
      });
      
      setMessage("");
      setReplyingTo(null);
      
      toast({
        title: "Message sent",
        description: "Your message has been delivered to the group"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      toast({
        title: "Message deleted",
        description: "Message has been removed from the chat"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Message copied to clipboard"
    });
  };

  const handleForwardMessage = (msg: Message) => {
    toast({
      title: "Forward",
      description: "Select a chat to forward this message"
    });
  };

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
    setShowMemberInfo(true);
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId, emoji);
      setShowReactions(false);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add reaction. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    try {
      await removeReaction(messageId, emoji);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to remove reaction. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePinMessage = async (messageId: string) => {
    try {
      await pinMessage(messageId);
      toast({
        title: "Message pinned",
        description: "Message has been pinned to the top"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to pin message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUnpinMessage = async (messageId: string) => {
    try {
      await unpinMessage(messageId);
      toast({
        title: "Message unpinned",
        description: "Message has been unpinned"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to unpin message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTyping = () => {
    sendTypingIndicator();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: Member['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500'; 
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getMessageStatusIcon = (status?: Message['status'], isOwn?: boolean) => {
    if (!isOwn) return null;
    switch (status) {
      case 'sent': return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered': return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read': return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default: return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const renderMessageContent = (msg: Message) => {
    switch (msg.type) {
      case 'expense':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span>Expense Added</span>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="font-semibold text-green-600">{msg.expenseData?.title}</p>
              <p className="text-sm text-gray-600">{msg.expenseData?.category}</p>
              <p className="text-lg font-bold text-green-700">₹{msg.expenseData?.amount?.toFixed(2)}</p>
              {msg.expenseData?.splitDetails && msg.expenseData.splitDetails.length > 0 && (
                <div className="mt-2 pt-2 border-t border-green-500/20">
                  <p className="text-sm text-gray-500">Split between members:</p>
                  <ul className="mt-1 space-y-1">
                    {msg.expenseData.splitDetails.map((split, index) => (
                      <li key={index} className="text-sm flex justify-between">
                        <span>{split.userName}</span>
                        <span className="font-medium">₹{split.amount?.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {msg.content && msg.expenseData?.title && msg.content !== `Added expense: ${msg.expenseData.title} (₹${msg.expenseData.amount?.toFixed(2)})` && (
              <p className="text-sm text-gray-600 italic mt-2">{msg.content}</p>
            )}
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
            <File className="w-8 h-8 text-gray-500" />
            <div className="flex-1">
              <p className="font-medium">{msg.fileData?.name}</p>
              <p className="text-sm text-gray-500">{msg.fileData?.size ? (msg.fileData.size / 1024).toFixed(1) : '0'} KB</p>
            </div>
            <Button size="sm" variant="ghost">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        );
      default:
        return <p className="whitespace-pre-wrap">{msg.content}</p>;
    }
  };

  const renderMessageReactions = (msg: Message) => {
    if (!msg.reactions || msg.reactions.length === 0) return null;
    
    const groupedReactions: Record<string, { count: number; users: string[] }> = {};
    
    msg.reactions.forEach(reaction => {
      if (!groupedReactions[reaction.emoji]) {
        groupedReactions[reaction.emoji] = {
          count: 0,
          users: []
        };
      }
      groupedReactions[reaction.emoji].count++;
      groupedReactions[reaction.emoji].users.push(
        `${reaction.user.firstName} ${reaction.user.lastName}`
      );
    });
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {Object.entries(groupedReactions).map(([emoji, data]) => (
          <button
            key={emoji}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            onClick={() => handleAddReaction(msg.id, emoji)}
            title={data.users.join(', ')}
          >
            <span>{emoji}</span>
            <span className="text-xs">{data.count}</span>
          </button>
        ))}
      </div>
    );
  };

  // Mock data for demonstration
  const members: Member[] = [
    {
      id: "1",
      name: "Alice Johnson",
      avatar: "",
      role: 'admin',
      status: 'online',
      phoneNumber: "+1 234 567 8901",
      email: "alice@example.com"
    },
    {
      id: "2", 
      name: "You",
      avatar: "",
      role: 'admin',
      status: 'online',
      phoneNumber: "+1 234 567 8902",
      email: "you@example.com"
    },
    {
      id: "3",
      name: "Bob Smith", 
      avatar: "",
      role: 'member',
      status: 'online',
      phoneNumber: "+1 234 567 8903",
      email: "bob@example.com"
    },
    {
      id: "4",
      name: "Carol Wilson",
      avatar: "",
      role: 'member', 
      status: 'away',
      phoneNumber: "+1 234 567 8904",
      email: "carol@example.com"
    },
    {
      id: "5",
      name: "David Brown",
      avatar: "",
      role: 'member',
      status: 'offline',
      lastSeen: new Date(Date.now() - 7200000),
      phoneNumber: "+1 234 567 8905",
      email: "david@example.com"
    }
  ];

  const groups: GroupChatItem[] = [
    {
      id: "1",
      name: "Beach Trip 2024",
      avatar: "🏖️",
      lastMessage: {
        content: "Great! The split looks good to me.",
        timestamp: new Date(Date.now() - 300000),
        sender: "You",
        type: 'text'
      },
      unreadCount: 0,
      isActive: true,
      memberCount: 5,
      totalExpenses: 15750.50
    },
    {
      id: "2",
      name: "Office Lunch Club",
      avatar: "🍕",
      lastMessage: {
        content: "Pizza order for today?",
        timestamp: new Date(Date.now() - 1800000),
        sender: "Mike",
        type: 'text'
      },
      unreadCount: 3,
      isActive: false,
      memberCount: 8,
      totalExpenses: 2340.75
    },
    {
      id: "3",
      name: "Weekend Hiking",
      avatar: "⛰️",
      lastMessage: {
        content: "Added camping gear expense",
        timestamp: new Date(Date.now() - 3600000),
        sender: "Sarah",
        type: 'expense'
      },
      unreadCount: 1,
      isActive: false,
      memberCount: 4,
      totalExpenses: 890.25
    }
  ];

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(groupSearchQuery.toLowerCase())
  );

  const currentGroup = groups.find(g => g.id === groupId) || groups[0];

  const handleGroupClick = (group: GroupChatItem) => {
    navigate(`/group/${group.id}/chat`);
  };

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getLastMessagePreview = (group: GroupChatItem) => {
    const { lastMessage } = group;
    switch (lastMessage.type) {
      case 'expense':
        return `💰 ${lastMessage.content}`;
      case 'image':
        return '📷 Image';
      case 'file':
        return '📎 File';
      default:
        return lastMessage.content;
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Left Sidebar - Groups List */}
      <div className={`${showSidebar ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-white/10 bg-card/30 backdrop-blur-sm glass-card`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Groups</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="text-white/60 hover:text-white"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/60"
                value={groupSearchQuery}
                onChange={(e) => setGroupSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Groups List */}
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {filteredGroups.map((group) => (
                <div
                  key={group.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/10 ${
                    group.id === groupId ? 'bg-primary/20 border border-primary/30' : ''
                  }`}
                  onClick={() => handleGroupClick(group)}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gradient-primary text-white text-lg">
                        {group.avatar}
                      </AvatarFallback>
                    </Avatar>
                    {group.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">
                          {group.unreadCount > 9 ? '9+' : group.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white truncate">{group.name}</h3>
                      <span className="text-xs text-white/50">
                        {formatLastMessageTime(group.lastMessage.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-white/60 truncate max-w-[200px]">
                        {group.lastMessage.sender === 'You' ? 'You: ' : ''}
                        {getLastMessagePreview(group)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-white/40">
                        <Users className="w-3 h-3" />
                        <span>{group.memberCount}</span>
                      </div>
                    </div>
                    <div className="mt-1">
                      <p className="text-xs text-green-400">
                        ₹{group.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 p-4 border-b bg-card/50 backdrop-blur-sm glass-card">
          {!showSidebar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(true)}
              className="hover:bg-accent/50"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="hover:bg-accent/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Avatar 
            className="w-10 h-10 cursor-pointer" 
            onClick={() => setShowGroupInfo(true)}
          >
            <AvatarFallback className="bg-gradient-primary text-white">
              {currentGroup.avatar}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 cursor-pointer" onClick={() => setShowGroupInfo(true)}>
            <h1 className="font-semibold text-foreground">{currentGroup.name}</h1>
            <p className="text-sm text-muted-foreground">
              {members.filter(m => m.status === 'online').length} online • {members.length} members
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hover:bg-accent/50">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-accent/50">
              <Video className="w-5 h-5" />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-accent/50">
                  <Users className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-80 glass-card">
                <SheetHeader>
                  <SheetTitle className="text-white">Group Members ({members.length})</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search members..." 
                      className="flex-1 bg-white/10 border-white/30" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="space-y-3">
                      {filteredMembers.map((member) => (
                        <div 
                          key={member.id} 
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => handleMemberClick(member)}
                        >
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="bg-gradient-success text-white">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground truncate">{member.name}</p>
                              {member.role === 'admin' && (
                                <Badge variant="secondary" className="text-xs">Admin</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {member.status === 'online' ? 'Online' : 
                               member.status === 'away' ? 'Away' : 
                               member.lastSeen ? `Last seen ${formatLastSeen(member.lastSeen)}` : 'Offline'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-accent/50">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card border-white/20">
                <DropdownMenuItem onClick={() => navigate(`/group/${groupId}`)}>
                  <Info className="w-4 h-4 mr-2" />
                  View Group Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowGroupInfo(true)}>
                  <Users className="w-4 h-4 mr-2" />
                  Group Info
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowSearch(true)}>
                  <Search className="w-4 h-4 mr-2" />
                  Search Messages
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="w-4 h-4 mr-2" />
                  Mute Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export Chat
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Pinned Messages */}
            {pinnedMessages.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Pin className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">Pinned Messages</span>
                </div>
                <div className="space-y-2">
                  {pinnedMessages.map(msg => (
                    <Card key={`pinned-${msg.id}`} className="p-3 bg-yellow-500/10 border-yellow-500/20">
                      <div className="flex items-start gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {msg.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-xs font-medium">{msg.userName}</p>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => handleUnpinMessage(msg.id)}
                        >
                          <PinOff className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 p-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {typingUsers.length === 1 ? 'Someone is typing...' : `${typingUsers.length} people are typing...`}
                </p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.isOwn ? 'justify-end' : 'justify-start'} group`}
              >
                {!msg.isOwn && (
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarImage src={msg.userAvatar} />
                    <AvatarFallback className="bg-gradient-success text-white text-xs">
                      {msg.userName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-xs lg:max-w-md ${msg.isOwn ? 'order-1' : ''}`}>
                  {!msg.isOwn && (
                    <p className="text-xs text-muted-foreground mb-1 ml-1">{msg.userName}</p>
                  )}
                  
                  {/* Reply indicator */}
                  {msg.replyTo && (
                    <div className="mb-2">
                      <div className={`p-2 rounded-t-lg text-xs border-l-4 ${
                        msg.isOwn 
                          ? 'bg-primary/20 border-primary text-primary-foreground' 
                          : 'bg-muted border-muted-foreground/50'
                      }`}>
                        <p className="font-medium">{msg.replyTo.userName}</p>
                        <p className="opacity-70 truncate">{msg.replyTo.content}</p>
                      </div>
                    </div>
                  )}
                  
                  <Card className={`p-3 relative group/message ${
                    msg.isOwn 
                      ? 'bg-primary text-primary-foreground ml-auto' 
                      : 'bg-card'
                  } ${msg.isPinned ? 'border-yellow-500/50' : ''}`}>
                    <div className="text-sm">
                      {renderMessageContent(msg)}
                    </div>
                    
                    {/* Reactions */}
                    {renderMessageReactions(msg)}
                    
                    {/* Message actions */}
                    <div className={`absolute top-1 opacity-0 group-hover/message:opacity-100 transition-opacity z-10 ${
                      msg.isOwn ? '-left-16' : 'right-full mr-3'
                    }`}>
                      <div className="flex items-center gap-1 bg-background/90 border border-white/20 rounded-lg shadow-lg p-1 backdrop-blur-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-white/20"
                          onClick={() => handleReply(msg)}
                        >
                          <Reply className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-white/20"
                          onClick={() => {setShowReactions(true); setSelectedMessageForReactions(msg.id);}}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-white/20 mr-1"
                          onClick={() => handleForwardMessage(msg)}
                        >
                          <Forward className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-white/20"
                          onClick={() => handleCopyMessage(msg.content)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        {msg.isOwn && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-white/20"
                            onClick={() => handleDeleteMessage(msg.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                        {msg.isOwn && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-white/20"
                            onClick={() => msg.isPinned ? handleUnpinMessage(msg.id) : handlePinMessage(msg.id)}
                          >
                            {msg.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                  
                  <div className={`flex items-center gap-1 mt-1 ${
                    msg.isOwn ? 'justify-end' : 'ml-1'
                  }`}>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(msg.timestamp)}
                    </p>
                    {getMessageStatusIcon(msg.status, msg.isOwn)}
                  </div>
                </div>

                {msg.isOwn && (
                  <Avatar className="w-8 h-8 mt-1 order-2">
                    <AvatarFallback className="bg-gradient-primary text-white text-xs">
                      You
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t bg-card/50 backdrop-blur-sm">
          {/* Reply Preview */}
          {replyingTo && (
            <div className="p-3 border-b bg-muted/50">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                  <Reply className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{replyingTo.userName}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                      {replyingTo.content}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          <div className="p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder={replyingTo ? "Reply to message..." : "Type a message..."}
                    className="min-h-[44px] max-h-32 resize-none pr-12 bg-white/10 border-white/30"
                    rows={1}
                  />
                  <div className="absolute right-3 bottom-2 flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                        <Paperclip className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-card">
                      <DropdownMenuItem>
                        <Image className="w-4 h-4 mr-2" />
                        Photo
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <File className="w-4 h-4 mr-2" />
                        Document
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Camera className="w-4 h-4 mr-2" />
                        Camera
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate(`/group/${groupId}`)}>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Add Expense
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                    <Camera className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                    <Mic className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="h-10 w-10 p-0 bg-primary hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Reactions Dialog */}
        <Dialog open={showReactions} onOpenChange={setShowReactions}>
          <DialogContent className="glass-card border-white/20 max-w-xs p-0">
            <div className="grid grid-cols-4 gap-2 p-4">
              {['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥'].map(emoji => (
                <Button
                  key={emoji}
                  variant="ghost"
                  className="text-2xl h-12 hover:bg-white/10"
                  onClick={() => {
                    if (selectedMessageForReactions) {
                      handleAddReaction(selectedMessageForReactions, emoji);
                    }
                    setShowReactions(false);
                  }}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Search Dialog */}
        <Dialog open={showSearch} onOpenChange={setShowSearch}>
          <DialogContent className="glass-card border-white/20 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Messages
              </DialogTitle>
            </DialogHeader>
            <div className="pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages in this group..."
                  className="pl-10 bg-white/10 border-white/30"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="mt-4 text-center py-8 text-muted-foreground">
                <Filter className="w-12 h-12 mx-auto mb-3" />
                <p>Search functionality will be implemented in the next update</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Member Info Dialog */}
        <Dialog open={showMemberInfo} onOpenChange={setShowMemberInfo}>
          <DialogContent className="glass-card border-white/20 max-w-md">
            {selectedMember && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={selectedMember.avatar} />
                      <AvatarFallback className="bg-gradient-primary text-white text-lg">
                        {selectedMember.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold">{selectedMember.name}</h2>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedMember.status)}`} />
                        <p className="text-sm text-white/60 capitalize">{selectedMember.status}</p>
                        {selectedMember.role === 'admin' && (
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        )}
                      </div>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 mt-6">
                  {selectedMember.email && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-white/80">Email</p>
                      <p className="text-white/60">{selectedMember.email}</p>
                    </div>
                  )}
                  
                  {selectedMember.phoneNumber && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-white/80">Phone</p>
                      <p className="text-white/60">{selectedMember.phoneNumber}</p>
                    </div>
                  )}
                  
                  {selectedMember.lastSeen && selectedMember.status === 'offline' && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-white/80">Last Seen</p>
                      <p className="text-white/60">{formatLastSeen(selectedMember.lastSeen)}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-white/30 text-white hover:bg-white/10"
                      onClick={() => toast({ title: "Feature", description: "Direct messaging coming soon!" })}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-white/30 text-white hover:bg-white/10"
                      onClick={() => toast({ title: "Feature", description: "Voice call coming soon!" })}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Group Info Dialog */}
        <Dialog open={showGroupInfo} onOpenChange={setShowGroupInfo}>
          <DialogContent className="glass-card border-white/20 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-gradient-primary text-white text-lg">
                    {currentGroup.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{currentGroup.name}</h2>
                  <p className="text-sm text-white/60">{members.length} members</p>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="info" className="mt-6">
              <TabsList className="grid w-full grid-cols-3 bg-white/10">
                <TabsTrigger value="info" className="text-white data-[state=active]:bg-white/20">Info</TabsTrigger>
                <TabsTrigger value="members" className="text-white data-[state=active]:bg-white/20">Members</TabsTrigger>
                <TabsTrigger value="media" className="text-white data-[state=active]:bg-white/20">Media</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="font-medium text-white">Total Expenses</p>
                        <p className="text-sm text-white/60">Group spending</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-green-400">
                      ₹{currentGroup.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="font-medium text-white">Members</p>
                        <p className="text-sm text-white/60">Active participants</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-blue-400">{members.length}</p>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="font-medium text-white">Created</p>
                        <p className="text-sm text-white/60">Group creation date</p>
                      </div>
                    </div>
                    <p className="text-sm text-purple-400">Dec 1, 2024</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="members" className="mt-4">
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="bg-gradient-success text-white">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white truncate">{member.name}</p>
                          {member.role === 'admin' && (
                            <Badge variant="secondary" className="text-xs">Admin</Badge>
                          )}
                        </div>
                        <p className="text-sm text-white/60">
                          {member.status === 'online' ? 'Online' : 
                           member.status === 'away' ? 'Away' : 
                           member.lastSeen ? `Last seen ${formatLastSeen(member.lastSeen)}` : 'Offline'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="media" className="mt-4">
                <div className="text-center py-8">
                  <Image className="w-12 h-12 mx-auto text-white/40 mb-3" />
                  <p className="text-white/60">No shared media yet</p>
                  <p className="text-sm text-white/40 mt-1">Photos and files will appear here</p>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EnhancedGroupChat;
import { useState, useRef, useEffect, useCallback } from "react";
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
import { useGroups, useGroup, useGroupMembers } from "@/hooks/useGroups";
import { useAuth } from "@/contexts/AuthContext";
import type { Group, GroupMember } from "@/lib/types";

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
    id?: string;
    amount: number;
    title: string;
    category: string;
    description?: string;
    paidBy?: string;
    splitType?: string;
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

const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showMemberInfo, setShowMemberInfo] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const [selectedMessageForReactions, setSelectedMessageForReactions] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [expandedReactions, setExpandedReactions] = useState<Set<string>>(new Set());
  const reactionPanelRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  const { data: groupsData, isLoading: groupsLoading } = useGroups();
  const { data: groupData, isLoading: groupLoading } = useGroup(groupId || '');
  const { data: membersData, isLoading: membersLoading } = useGroupMembers(groupId || '');
  
  const groups = groupsData?.groups || [];
  const currentGroup = groupData?.group;
  const members = membersData || [];
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredMembers = members.filter(member => 
    member.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(groupSearchQuery.toLowerCase())
  );

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

  // Close reaction panels when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside all reaction panels
      let clickedInside = false;
      reactionPanelRefs.current.forEach((ref) => {
        if (ref && ref.contains(event.target as Node)) {
          clickedInside = true;
        }
      });
      
      if (!clickedInside && expandedReactions.size > 0) {
        setExpandedReactions(new Set());
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && expandedReactions.size > 0) {
        setExpandedReactions(new Set());
      }
    };

    // Auto-close after 10 seconds of inactivity
    let autoCloseTimer: NodeJS.Timeout;
    if (expandedReactions.size > 0) {
      autoCloseTimer = setTimeout(() => {
        setExpandedReactions(new Set());
      }, 10000); // Close after 10 seconds
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
    };
  }, [expandedReactions]);

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

  const handleMemberClick = (member: GroupMember) => {
    setSelectedMember(member);
    setShowMemberInfo(true);
  };

  const handleGroupClick = (group: Group) => {
    navigate(`/group/${group._id}/chat`);
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

  const getLastMessagePreview = (group: Group) => {
    // This is a placeholder - in a real implementation, you would get this from the last message
    return `Last message in ${group.name}`;
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
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: GroupMember['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'invited': return 'bg-yellow-500'; 
      case 'pending': return 'bg-yellow-500';
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
            <button 
              className="w-full text-left p-3 bg-green-500/10 rounded-lg border border-green-500/20 cursor-pointer transition-all hover:bg-green-500/20 hover:border-green-500/30 hover:shadow-md active:scale-[0.98] active:bg-green-500/25 focus:outline-none focus:ring-2 focus:ring-green-500/30"
              onClick={() => {
                // Navigate to expense detail page
                if (msg.expenseData?.id) {
                  navigate(`/group/${groupId}/expense/${msg.expenseData.id}`);
                } else if (currentGroup) {
                  // If no specific expense ID, go to group expenses page
                  navigate(`/group/${currentGroup._id}`);
                  toast({
                    title: "Opening expenses",
                    description: "Navigating to group expenses page"
                  });
                }
              }}
              aria-label="View expense details"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-green-600">{msg.expenseData?.title || 'Expense'}</p>
                  <p className="text-sm text-gray-600">{msg.expenseData?.category || 'General'}</p>
                  <p className="text-lg font-bold text-green-700">₹{(msg.expenseData?.amount || 0).toFixed(2)}</p>
                </div>
                <div className="flex items-center text-green-600 opacity-60">
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-green-500/10">
                <p className="text-xs text-gray-500">Tap to view details</p>
              </div>
            </button>
          </div>
        );
      case 'payment':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <span>Payment Recorded</span>
            </div>
            <button 
              className="w-full text-left p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 cursor-pointer transition-all hover:bg-blue-500/20 hover:border-blue-500/30 hover:shadow-md active:scale-[0.98] active:bg-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              onClick={() => {
                // Navigate to settlement/payment page
                if (currentGroup) {
                  navigate(`/group/${currentGroup._id}`);
                  toast({
                    title: "Opening settlements",
                    description: "Navigating to group settlements"
                  });
                }
              }}
              aria-label="View payment details"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-blue-600">Payment Settlement</p>
                  <p className="text-lg font-bold text-blue-700">₹{(msg.expenseData?.amount || 0).toFixed(2)}</p>
                </div>
                <div className="flex items-center text-blue-600 opacity-60">
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-500/10">
                <p className="text-xs text-gray-500">Tap to view details</p>
              </div>
            </button>
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
            <File className="w-8 h-8 text-gray-500" />
            <div className="flex-1">
              <p className="font-medium">{msg.fileData?.name}</p>
              <p className="text-sm text-gray-500">{(msg.fileData?.size || 0 / 1024).toFixed(1)} KB</p>
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

  const handleAddReaction = async (messageId: string, emoji: string) => {
    console.log('Adding reaction:', { messageId, emoji }); // Debug log
    
    if (!messageId || !emoji) {
      console.error('Missing messageId or emoji');
      toast({
        title: "Error",
        description: "Invalid reaction data",
        variant: "destructive"
      });
      return;
    }
    
    // Find the message
    const message = messages.find(m => m.id === messageId);
    if (!message) {
      console.error('Message not found:', messageId);
      toast({
        title: "Error",
        description: "Message not found",
        variant: "destructive"
      });
      return;
    }
    
    // Check if user already reacted with this emoji
    const existingReaction = message.reactions?.find(
      r => r.userId === user?._id && r.emoji === emoji
    );
    
    if (existingReaction) {
      // Remove reaction if already exists
      try {
        await removeReaction(messageId, emoji);
        toast({
          title: "Reaction removed",
          description: `${emoji} reaction removed`,
          duration: 2000
        });
      } catch (err) {
        console.error('Error removing reaction:', err);
        toast({
          title: "Error",
          description: "Failed to remove reaction",
          variant: "destructive"
        });
      }
    } else {
      // Add new reaction
      try {
        const result = await addReaction(messageId, emoji);
        console.log('Reaction added successfully:', result);
        
        // If the API doesn't update via WebSocket, manually update the local state
        if (!result || typeof result === 'boolean') {
          // Optimistically update the UI
          const updatedMessages = messages.map(msg => {
            if (msg.id === messageId) {
              const newReaction = {
                userId: user?._id || '',
                emoji,
                user: {
                  id: user?._id || '',
                  firstName: user?.firstName || 'Unknown',
                  lastName: user?.lastName || 'User'
                }
              };
              return {
                ...msg,
                reactions: [...(msg.reactions || []), newReaction]
              };
            }
            return msg;
          });
          // Note: We can't directly set messages here, but the WebSocket should handle it
        }
        
        toast({
          title: "Reaction added",
          description: `${emoji} reaction added`,
          duration: 2000
        });
      } catch (err) {
        console.error('Error adding reaction:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to add reaction';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
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

  const toggleReactionDetails = (messageId: string) => {
    setExpandedReactions(prev => {
      const newSet = new Set<string>();
      // Close all other panels and toggle the current one
      if (!prev.has(messageId)) {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const renderMessageReactions = (msg: Message) => {
    if (!msg.reactions || msg.reactions.length === 0) return null;
    
    const isExpanded = expandedReactions.has(msg.id);
    const totalReactions = msg.reactions.length;
    
    const groupedReactions: Record<string, { count: number; users: string[] }> = {};
    
    msg.reactions.forEach(reaction => {
      if (!groupedReactions[reaction.emoji]) {
        groupedReactions[reaction.emoji] = {
          count: 0,
          users: []
        };
      }
      groupedReactions[reaction.emoji].count++;
      
      // Add null check for reaction.user
      if (reaction.user) {
        const userName = `${reaction.user.firstName || 'Unknown'} ${reaction.user.lastName || 'User'}`;
        groupedReactions[reaction.emoji].users.push(userName);
      } else {
        groupedReactions[reaction.emoji].users.push('Unknown User');
      }
    });
    
    // Get first 3 unique emojis for preview
    const previewEmojis = Object.keys(groupedReactions).slice(0, 3);
    
    return (
      <div 
        className="relative inline-block"
        ref={(el) => {
          if (el) {
            reactionPanelRefs.current.set(msg.id, el);
          } else {
            reactionPanelRefs.current.delete(msg.id);
          }
        }}
      >
        {/* Compact reaction display */}
        <button
          className={`flex items-center gap-1 px-2 py-1 text-sm rounded-full transition-all ${
            msg.isOwn 
              ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            toggleReactionDetails(msg.id);
          }}
        >
          <span className="flex -space-x-1">
            {previewEmojis.map((emoji, index) => (
              <span key={emoji} className="text-sm" style={{ zIndex: 3 - index }}>
                {emoji}
              </span>
            ))}
          </span>
          <span className="text-xs font-semibold ml-1">{totalReactions}</span>
        </button>
        
        {/* Floating reaction details panel */}
        {isExpanded && (
          <div className={`absolute z-30 mt-1 ${msg.isOwn ? 'right-0' : 'left-0'} 
            bg-popover border rounded-lg shadow-xl p-2 min-w-[200px] max-w-[300px] animate-in fade-in-0 zoom-in-95`}
          >
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {Object.entries(groupedReactions).map(([emoji, data]) => (
                <div key={emoji} className="flex items-center justify-between p-2 rounded hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{emoji}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{data.count} {data.count === 1 ? 'reaction' : 'reactions'}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {data.users.slice(0, 2).join(', ')}
                        {data.users.length > 2 && ` +${data.users.length - 2} more`}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleAddReaction(msg.id, emoji);
                      // Close panel after adding reaction
                      setExpandedReactions(new Set());
                    }}
                  >
                    +
                  </Button>
                </div>
              ))}
            </div>
            
            {/* Add new reaction button */}
            <div className="mt-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => {
                  setShowReactions(true);
                  setSelectedMessageForReactions(msg.id);
                  // Close this panel when opening emoji picker
                  setExpandedReactions(new Set());
                }}
              >
                <Smile className="w-3 h-3 mr-2" />
                Add reaction
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (groupsLoading || groupLoading || membersLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      {/* Left Sidebar - Groups List - Hidden on mobile */}
      <div className={`${showSidebar ? 'w-80' : 'w-0'} hidden lg:block transition-all duration-300 overflow-hidden border-r border-white/10 bg-card/30 backdrop-blur-sm glass-card flex-shrink-0`}>
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
                  key={group._id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/10 ${
                    group._id === groupId ? 'bg-primary/20 border border-primary/30' : ''
                  }`}
                  onClick={() => handleGroupClick(group)}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-gradient-primary text-white text-lg">
                        {group.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Placeholder for unread count */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">
                        0
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white truncate">{group.name}</h3>
                      <span className="text-xs text-white/50">
                        {/* Placeholder for last message time */}
                        now
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-white/60 truncate max-w-[200px]">
                        {/* Placeholder for last message preview */}
                        {getLastMessagePreview(group)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-white/40">
                        <Users className="w-3 h-3" />
                        <span>{group.memberCount || group.members?.length || 0}</span>
                      </div>
                    </div>
                    <div className="mt-1">
                      <p className="text-xs text-green-400">
                        {/* Placeholder for total expenses */}
                        ₹{(group.statistics?.totalExpenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
      <div className="flex-1 flex flex-col w-full min-w-0 overflow-hidden">
        {/* Modern Mobile Header - Fixed */}
        <header className="flex items-center gap-2 sm:gap-3 px-3 py-3 mobile-lg:px-4 mobile-lg:py-4 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg z-10 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="hover:bg-white/20 text-white p-2 h-auto shrink-0"
          >
            <ArrowLeft className="w-5 h-5 mobile-lg:w-6 mobile-lg:h-6" />
          </Button>

          {currentGroup && (
            <>
              <div 
                className="flex items-center gap-2 mobile-lg:gap-3 flex-1 min-w-0 cursor-pointer" 
                onClick={() => setShowGroupInfo(true)}
              >
                <div className="relative shrink-0">
                  <Avatar className="w-10 h-10 mobile-lg:w-12 mobile-lg:h-12 md:w-14 md:h-14 border-2 border-white/30">
                    <AvatarFallback className="bg-white/20 text-white font-bold text-base mobile-lg:text-lg">
                      {currentGroup.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 mobile-lg:w-3.5 mobile-lg:h-3.5 bg-green-400 border-2 border-blue-600 rounded-full"></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h1 className="font-semibold text-white text-base mobile-lg:text-lg md:text-xl truncate">{currentGroup.name}</h1>
                  <p className="text-xs mobile-lg:text-sm text-white/80 truncate">
                    {members.filter(m => m.status === 'active').length} online
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-1 mobile-lg:gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="hover:bg-white/20 text-white p-2 h-auto hidden mobile-lg:flex">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-white/20 text-white p-2 h-auto hidden mobile-lg:flex">
              <Video className="w-5 h-5" />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-white/20 text-white p-2 h-auto">
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
                          key={member.user._id} 
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => handleMemberClick(member)}
                        >
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={member.user.avatar?.url} />
                              <AvatarFallback className="bg-gradient-success text-white">
                                {member.user.firstName.charAt(0)}{member.user.lastName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground truncate">
                                {member.user.firstName} {member.user.lastName}
                              </p>
                              {member.role === 'admin' && (
                                <Badge variant="secondary" className="text-xs">Admin</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {member.status === 'active' ? 'Online' : 'Offline'}
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
                {currentGroup && (
                  <DropdownMenuItem onClick={() => navigate(`/group/${currentGroup._id}`)}>
                    <Info className="w-4 h-4 mr-2" />
                    View Group Details
                  </DropdownMenuItem>
                )}
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

        {/* Messages Area - Mobile Optimized - Scrollable Only */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 mobile-lg:p-3 md:p-4 bg-gradient-to-b from-gray-900/50 to-black/50">
          <div className="max-w-4xl mx-auto space-y-2 mobile-lg:space-y-2.5 md:space-y-3 pb-4">
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
                className={`flex gap-1.5 mobile-lg:gap-2 mb-3 mobile-lg:mb-3.5 md:mb-4 ${msg.isOwn ? 'justify-end' : 'justify-start'} group relative`}
              >
                {!msg.isOwn && (
                  <Avatar className="w-7 h-7 mobile-lg:w-8 mobile-lg:h-8 md:w-9 md:h-9 mt-auto shrink-0">
                    <AvatarImage src={msg.userAvatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs mobile-lg:text-sm">
                      {msg.userName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[75%] mobile-lg:max-w-[70%] md:max-w-[65%] lg:max-w-md relative ${msg.isOwn ? 'order-1' : ''}`}>
                  {!msg.isOwn && (
                    <p className="text-[10px] mobile-lg:text-xs text-white/60 mb-0.5 ml-2 font-medium">{msg.userName}</p>
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
                  
                  <div className={`relative group/message rounded-2xl mobile-lg:rounded-3xl shadow-md ${
                    msg.isOwn 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-auto rounded-tr-sm' 
                      : 'bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-tl-sm'
                  } ${msg.isPinned ? 'ring-2 ring-yellow-500/50' : ''}`}>
                    {/* Message content with padding for menu button */}
                    <div className="px-3 py-2 mobile-lg:px-3.5 mobile-lg:py-2.5 md:px-4 md:py-3 pr-8 mobile-lg:pr-9 md:pr-10">
                      <div className="text-sm mobile-lg:text-[15px] md:text-base leading-relaxed">
                        {renderMessageContent(msg)}
                      </div>
                    </div>
                    
                    {/* Reactions - positioned outside message content */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="px-3 pb-1.5 sm:pb-2">
                        {renderMessageReactions(msg)}
                      </div>
                    )}
                    
                    {/* Three-dot menu button - Mobile friendly */}
                    <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-5 w-5 sm:h-6 sm:w-6 opacity-0 group-hover/message:opacity-100 active:opacity-100 transition-all duration-200 ${
                              msg.isOwn 
                                ? 'hover:bg-white/20 active:bg-white/30 text-white' 
                                : 'hover:bg-white/10 active:bg-white/20 text-white'
                            }`}
                          >
                            <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="sr-only">Message options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            onClick={() => handleReply(msg)}
                            className="cursor-pointer"
                          >
                            <Reply className="h-4 w-4 mr-2" />
                            <span>Reply</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleForwardMessage(msg)}
                            className="cursor-pointer"
                          >
                            <Forward className="h-4 w-4 mr-2" />
                            <span>Forward</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleCopyMessage(msg.content)}
                            className="cursor-pointer"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            <span>Copy</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => msg.isPinned ? handleUnpinMessage(msg.id) : handlePinMessage(msg.id)}
                            className="cursor-pointer"
                          >
                            {msg.isPinned ? (
                              <>
                                <PinOff className="h-4 w-4 mr-2" />
                                <span>Unpin</span>
                              </>
                            ) : (
                              <>
                                <Pin className="h-4 w-4 mr-2" />
                                <span>Pin</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          {msg.isOwn && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="text-destructive cursor-pointer focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                  </div>
                  
                  {/* Quick action buttons - Hidden on mobile by default, shown on long press */}
                  <div className={`absolute -bottom-7 sm:-bottom-8 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 hidden sm:flex ${
                    msg.isOwn ? 'right-0' : 'left-0'
                  }`}>
                    <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-800 border border-white/20 rounded-full shadow-xl px-1.5 py-1">
                      <button
                        className="text-sm p-1 sm:p-1.5 hover:bg-white/10 rounded-full transition-colors"
                        onClick={() => handleAddReaction(msg.id, '👍')}
                        title="Like"
                      >
                        👍
                      </button>
                      <button
                        className="text-sm p-1 sm:p-1.5 hover:bg-white/10 rounded-full transition-colors"
                        onClick={() => handleAddReaction(msg.id, '❤️')}
                        title="Love"
                      >
                        ❤️
                      </button>
                      <button
                        className="text-sm p-1 sm:p-1.5 hover:bg-white/10 rounded-full transition-colors"
                        onClick={() => handleAddReaction(msg.id, '😂')}
                        title="Laugh"
                      >
                        😂
                      </button>
                      <div className="w-px h-4 bg-white/20 mx-0.5"></div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-white/10 text-white"
                        onClick={() => handleReply(msg)}
                        title="Reply"
                      >
                        <Reply className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Timestamp and status - Compact mobile design */}
                  <div className={`flex items-center gap-1 mt-0.5 sm:mt-1 ${
                    msg.isOwn ? 'justify-end pr-1' : 'ml-1'
                  }`}>
                    <p className="text-[10px] sm:text-xs text-white/50">
                      {formatTime(msg.timestamp)}
                    </p>
                    <div className="flex items-center">
                      {getMessageStatusIcon(msg.status, msg.isOwn)}
                    </div>
                  </div>
                </div>

                {msg.isOwn && (
                  <Avatar className="w-7 h-7 sm:w-8 sm:h-8 mt-auto order-2 shrink-0 hidden sm:block">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs">
                      You
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Modern Mobile Message Input - Fixed at Bottom */}
        <div className="bg-gradient-to-t from-gray-900 to-gray-800 border-t border-white/10 shadow-2xl flex-shrink-0">
          {/* Reply Preview */}
          {replyingTo && (
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-blue-500/10 border-b border-blue-500/20">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Reply className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-blue-400 truncate">{replyingTo.userName}</p>
                    <p className="text-[10px] sm:text-xs text-white/60 truncate">
                      {replyingTo.content}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                  className="h-6 w-6 p-0 hover:bg-white/10 text-white shrink-0"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          )}
          
          <div className="px-2 py-2 mobile-lg:px-3 mobile-lg:py-2.5 md:px-3 md:py-3">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end gap-1.5 mobile-lg:gap-2">
                {/* Attachment Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 w-9 mobile-lg:h-10 mobile-lg:w-10 md:h-11 md:w-11 p-0 rounded-full hover:bg-white/10 text-white/70 hover:text-white shrink-0"
                    >
                      <Paperclip className="w-5 h-5 mobile-lg:w-5 mobile-lg:h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="glass-card border-white/20 mb-2">
                    <DropdownMenuItem className="text-white hover:bg-white/10">
                      <Image className="w-4 h-4 mr-2 text-blue-400" />
                      Photo
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-white hover:bg-white/10">
                      <File className="w-4 h-4 mr-2 text-green-400" />
                      Document
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-white hover:bg-white/10">
                      <Camera className="w-4 h-4 mr-2 text-purple-400" />
                      Camera
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    {currentGroup && (
                      <DropdownMenuItem 
                        onClick={() => navigate(`/group/${currentGroup._id}`)}
                        className="text-white hover:bg-white/10"
                      >
                        <DollarSign className="w-4 h-4 mr-2 text-yellow-400" />
                        Add Expense
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Message Input */}
                <div className="flex-1 relative">
                  <Textarea
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder={replyingTo ? "Reply..." : "Message"}
                    className="min-h-[40px] mobile-lg:min-h-[44px] md:min-h-[48px] max-h-32 resize-none rounded-3xl px-4 mobile-lg:px-5 py-2.5 mobile-lg:py-3 pr-11 mobile-lg:pr-12 bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/30 transition-all text-sm mobile-lg:text-[15px] md:text-base"
                    rows={1}
                  />
                  <div className="absolute right-2 mobile-lg:right-3 bottom-2 mobile-lg:bottom-2.5 flex items-center gap-0.5">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 mobile-lg:h-8 mobile-lg:w-8 p-0 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
                    >
                      <Smile className="w-4 h-4 mobile-lg:w-5 mobile-lg:h-5" />
                    </Button>
                  </div>
                </div>
                
                {/* Send Button */}
                <Button 
                  onClick={handleSendMessage}
                  disabled={!message.trim() || loading}
                  className={`h-9 w-9 mobile-lg:h-10 mobile-lg:w-10 md:h-11 md:w-11 p-0 rounded-full shrink-0 transition-all ${
                    message.trim() 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl scale-100 hover:scale-105' 
                      : 'bg-white/10 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <div className="w-4 h-4 mobile-lg:w-5 mobile-lg:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mobile-lg:w-5 mobile-lg:h-5 text-white" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reactions Dialog */}
      <Dialog open={showReactions} onOpenChange={setShowReactions}>
        <DialogContent className="glass-card border-white/20 max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-white">Add Reaction</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-6 gap-2">
            {['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉', '💯', '👏', '👎', '😡'].map(emoji => (
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
            <DialogTitle className="text-white">Search Messages</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="pl-10 bg-white/10 border-white/30"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Date
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Member Info Sheet */}
      <Sheet open={showMemberInfo} onOpenChange={setShowMemberInfo}>
        <SheetContent className="w-80 glass-card">
          {selectedMember && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white">Member Info</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex flex-col items-center">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={selectedMember.user.avatar?.url} />
                    <AvatarFallback className="bg-gradient-success text-white text-2xl">
                      {selectedMember.user.firstName.charAt(0)}{selectedMember.user.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="mt-4 text-xl font-semibold text-white">
                    {selectedMember.user.firstName} {selectedMember.user.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedMember.role === 'admin' ? 'Admin' : 'Member'}
                  </p>
                  <Badge className={`mt-2 ${getStatusColor(selectedMember.status)}`}>
                    {selectedMember.status}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Joined</span>
                    <span className="text-white">
                      {new Date(selectedMember.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {selectedMember.user.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="text-white">{selectedMember.user.email}</span>
                    </div>
                  )}
                  
                  {selectedMember.user.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="text-white">{selectedMember.user.phone}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline">
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      
      {/* Group Info Sheet */}
      <Sheet open={showGroupInfo} onOpenChange={setShowGroupInfo}>
        <SheetContent className="w-80 glass-card">
          {currentGroup && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white">Group Info</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex flex-col items-center">
                  <Avatar className="w-20 h-20">
                    <AvatarFallback className="bg-gradient-primary text-white text-2xl">
                      {currentGroup.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="mt-4 text-xl font-semibold text-white">{currentGroup.name}</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {currentGroup.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-white">{members.length} members</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 bg-white/5">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total Expenses</p>
                        <p className="text-lg font-semibold text-white">
                          ₹{(currentGroup.statistics?.totalExpenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4 bg-white/5">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-sm text-muted-foreground">Active Members</p>
                        <p className="text-lg font-semibold text-white">
                          {members.filter(m => m.status === 'active').length}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
                
                <div className="space-y-3">
                  <Button className="w-full">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Members
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate(`/group/${currentGroup._id}`)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Group Settings
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default GroupChat;

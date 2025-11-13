import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, ApiError } from '../lib/services';
import useWebSocket from './useWebSocket';

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

interface UseMessagesProps {
  groupId: string;
}


export const useMessages = ({ groupId }: UseMessagesProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const sentMessagesRef = useRef<Map<string, string>>(new Map()); // Track sent messages to avoid duplicates
  
  const { socket, isConnected, emit, on, off } = useWebSocket();

  // Fetch messages from API
  const fetchMessages = useCallback(async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      const data = await apiClient.get(`/api/messages/${groupId}`);
      
      console.log('Messages API response:', data);
      
      if (data.success && data.data && data.data.messages) {
        const formattedMessages = data.data.messages.map((msg: any) => {
          const senderId = msg.senderId._id || msg.senderId;
          return {
            id: msg._id,
            userId: senderId,
            userName: msg.senderName,
            userAvatar: msg.senderId?.avatar || '',
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            type: msg.type,
            status: msg.status,
            replyTo: msg.replyTo,
            expenseData: msg.expenseData,
            fileData: msg.fileData,
            reactions: msg.reactions || [],
            isPinned: msg.isPinned,
            isOwn: senderId === user?._id // Set isOwn flag based on current user
          };
        });
        
        setMessages(formattedMessages);
      } else {
        setError(data.error || data.message || 'Failed to fetch messages');
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : `Failed to fetch messages: ${err.message}`;
      setError(errorMessage);
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  // Send a new message
  const sendMessage = useCallback(async (content: string, type: Message['type'] = 'text', options?: any) => {
    if (!content.trim() || !groupId) return;
    
    // Create optimistic message
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    console.log('Sending message with temp ID:', tempId);
    const optimisticMessage: Message = {
      id: tempId,
      userId: user?._id || '',
      userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      userAvatar: user?.avatar || '',
      content: content.trim(),
      timestamp: new Date(),
      type,
      status: 'sent',
      isOwn: true,
      replyTo: options?.replyTo,
      expenseData: options?.expenseData,
      fileData: options?.fileData,
      reactions: [],
      isPinned: false
    };
    
    // Add message optimistically
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Track this message to prevent duplicates
    sentMessagesRef.current.set(tempId, content.trim());
    
    try {
      const data = await apiClient.post(`/api/messages/${groupId}`, {
        content: content.trim(),
        type,
        ...options
      });
      
      if (data.success) {
        const realMessage = data.data?.message || data.message;
        // Map temp ID to real ID to handle the replacement
        if (realMessage && realMessage._id) {
          sentMessagesRef.current.set(realMessage._id, content.trim());
        }
        return realMessage;
      } else {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        throw new Error(data.error || data.message || 'Failed to send message');
      }
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      console.error('Error sending message:', err);
      throw err;
    }
  }, [groupId, user]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const data = await apiClient.delete(`/api/messages/${messageId}`);
      
      if (data.success) {
        // Message will be removed via WebSocket
        return true;
      } else {
        throw new Error(data.error || data.message || 'Failed to delete message');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      throw err;
    }
  }, []);

  // Add reaction to a message
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      const data = await apiClient.post(`/api/messages/${messageId}/reactions`, { emoji });
      
      if (data.success) {
        // Reaction will be added via WebSocket
        return true;
      } else {
        throw new Error(data.error || data.message || 'Failed to add reaction');
      }
    } catch (err) {
      console.error('Error adding reaction:', err);
      throw err;
    }
  }, []);

  // Remove reaction from a message
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      const data = await apiClient.delete(`/api/messages/${messageId}/reactions/${emoji}`);
      
      if (data.success) {
        // Reaction will be removed via WebSocket
        return true;
      } else {
        throw new Error(data.error || data.message || 'Failed to remove reaction');
      }
    } catch (err) {
      console.error('Error removing reaction:', err);
      throw err;
    }
  }, []);

  // Pin a message
  const pinMessage = useCallback(async (messageId: string) => {
    try {
      const data = await apiClient.post(`/api/messages/${messageId}/pin`);
      
      if (data.success) {
        // Message will be pinned via WebSocket
        return true;
      } else {
        throw new Error(data.error || data.message || 'Failed to pin message');
      }
    } catch (err) {
      console.error('Error pinning message:', err);
      throw err;
    }
  }, []);

  // Unpin a message
  const unpinMessage = useCallback(async (messageId: string) => {
    try {
      const data = await apiClient.delete(`/api/messages/${messageId}/pin`);
      
      if (data.success) {
        // Message will be unpinned via WebSocket
        return true;
      } else {
        throw new Error(data.error || data.message || 'Failed to unpin message');
      }
    } catch (err) {
      console.error('Error unpinning message:', err);
      throw err;
    }
  }, []);

  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (groupId && isConnected) {
      emit('typing_start', { groupId, userId: user?._id });
      
      // Clear typing indicator after 3 seconds
      setTimeout(() => {
        emit('typing_stop', { groupId, userId: user?._id });
      }, 3000);
    }
  }, [groupId, isConnected, emit, user]);

  // WebSocket event handlers
  useEffect(() => {
    console.log('Setting up WebSocket listeners. Connected:', isConnected, 'GroupId:', groupId);
    if (!socket || !groupId) return;

    // Handle new messages
    const handleNewMessage = (data: any) => {
      console.log('Received new_message event:', data);
      const senderId = data.message.senderId._id || data.message.senderId;
      const isOwnMessage = senderId === user?._id;
      
      const newMessage = {
        id: data.message._id,
        userId: senderId,
        userName: data.message.senderName,
        userAvatar: data.message.senderId?.avatar || '',
        content: data.message.content,
        timestamp: new Date(data.message.timestamp),
        type: data.message.type,
        status: data.message.status || 'delivered',
        replyTo: data.message.replyTo,
        expenseData: data.message.expenseData,
        fileData: data.message.fileData,
        reactions: data.message.reactions || [],
        isPinned: data.message.isPinned,
        isOwn: isOwnMessage
      };
      
      setMessages(prev => {
        // If it's our own message that we just sent
        if (isOwnMessage) {
          // Check if we recently sent this message
          const sentContent = sentMessagesRef.current.get(newMessage.id);
          if (sentContent === newMessage.content) {
            // This is our message, remove the temporary version
            const filtered = prev.filter(msg => {
              // Remove temp message with same content
              if (msg.id.startsWith('temp-') && msg.content === newMessage.content) {
                // Clean up the reference
                sentMessagesRef.current.delete(msg.id);
                return false;
              }
              return true;
            });
            
            // Clean up the sent message reference after a delay
            setTimeout(() => {
              sentMessagesRef.current.delete(newMessage.id);
            }, 5000);
            
            return [...filtered, newMessage];
          }
        }
        
        // Check if this message already exists (prevent duplicates)
        const messageExists = prev.some(msg => msg.id === newMessage.id);
        if (messageExists) {
          return prev;
        }
        
        // Add the new message
        return [...prev, newMessage];
      });
    };

    // Handle message deletion
    const handleMessageDeleted = (data: any) => {
      setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
    };

    // Handle message reactions
    const handleMessageReactionAdded = (data: any) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageId) {
          const existingReaction = msg.reactions?.find(
            r => r.userId === data.userId && r.emoji === data.emoji
          );
          
          if (!existingReaction) {
            return {
              ...msg,
              reactions: [
                ...(msg.reactions || []),
                {
                  userId: data.userId,
                  emoji: data.emoji,
                  user: data.user
                }
              ]
            };
          }
        }
        return msg;
      }));
    };

    // Handle reaction removal
    const handleMessageReactionRemoved = (data: any) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageId) {
          return {
            ...msg,
            reactions: (msg.reactions || []).filter(
              r => !(r.userId === data.userId && r.emoji === data.emoji)
            )
          };
        }
        return msg;
      }));
    };

    // Handle typing indicators
    const handleTypingStart = (data: any) => {
      if (data.userId !== user?._id) {
        setTypingUsers(prev => [...new Set([...prev, data.userId])]);
      }
    };

    const handleTypingStop = (data: any) => {
      setTypingUsers(prev => prev.filter(id => id !== data.userId));
    };

    // Handle message pinning
    const handleMessagePinned = (data: any) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId ? { ...msg, isPinned: true } : msg
      ));
    };

    // Handle message unpinning
    const handleMessageUnpinned = (data: any) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId ? { ...msg, isPinned: false } : msg
      ));
    };

    // Register event listeners
    on('new_message', handleNewMessage);
    on('message_deleted', handleMessageDeleted);
    on('reaction_added', handleMessageReactionAdded);
    on('reaction_removed', handleMessageReactionRemoved);
    on('typing_start', handleTypingStart);
    on('typing_stop', handleTypingStop);
    on('message_pinned', handleMessagePinned);
    on('message_unpinned', handleMessageUnpinned);

    // Cleanup event listeners
    return () => {
      off('new_message', handleNewMessage);
      off('message_deleted', handleMessageDeleted);
      off('reaction_added', handleMessageReactionAdded);
      off('reaction_removed', handleMessageReactionRemoved);
      off('typing_start', handleTypingStart);
      off('typing_stop', handleTypingStop);
      off('message_pinned', handleMessagePinned);
      off('message_unpinned', handleMessageUnpinned);
    };
  }, [socket, groupId, user, on, off]);

  // Join/leave group room and fetch messages when group changes
  useEffect(() => {
    if (groupId && isConnected && socket) {
      // Join the group room for real-time updates
      console.log('Attempting to join group room:', groupId, 'Connected:', isConnected);
      emit('join_group', { groupId });
      
      // Fetch existing messages
      fetchMessages();
      
      // Cleanup: Leave the group room when component unmounts or group changes
      return () => {
        emit('leave_group', { groupId });
        console.log('Leaving group room:', groupId);
      };
    } else if (groupId && !isConnected) {
      console.log('WebSocket not connected yet, waiting...');
      // Still fetch messages even if WebSocket isn't connected
      fetchMessages();
    }
  }, [groupId, isConnected, socket, emit, fetchMessages]);

  return {
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
  };
};

export default useMessages;
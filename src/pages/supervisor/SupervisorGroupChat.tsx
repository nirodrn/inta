import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ref, push, get, onValue, off, remove, update } from 'firebase/database';
import { Send, MessageSquare, Users, ArrowLeft, Reply, Trash2, AtSign, Bell, BellOff } from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
  replyTo?: {
    messageId: string;
    senderName: string;
    message: string;
  };
  mentions?: string[];
}

interface GroupInfo {
  id: string;
  name: string;
  supervisorId: string;
  internIds: string[];
}

interface GroupMember {
  uid: string;
  name: string;
  nickname?: string;
  role: string;
}

const MESSAGE_CACHE_KEY = 'groupChatDraft';

export default function GroupChatPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchGroupInfo();
    }
  }, [currentUser]);

  useEffect(() => {
    // Load cached message on component mount
    const cachedMessage = localStorage.getItem(`${MESSAGE_CACHE_KEY}_${groupInfo?.id}`);
    if (cachedMessage) {
      setNewMessage(cachedMessage);
    }

    // Load notification preference
    const notifPref = localStorage.getItem(`notifications_${groupInfo?.id}`);
    if (notifPref !== null) {
      setNotifications(JSON.parse(notifPref));
    }
  }, [groupInfo?.id]);

  useEffect(() => {
    // Cache message whenever it changes
    if (groupInfo?.id) {
      if (newMessage.trim()) {
        localStorage.setItem(`${MESSAGE_CACHE_KEY}_${groupInfo.id}`, newMessage);
      } else {
        localStorage.removeItem(`${MESSAGE_CACHE_KEY}_${groupInfo.id}`);
      }
    }
  }, [newMessage, groupInfo?.id]);

  useEffect(() => {
    if (groupInfo?.id) {
      fetchMessages();
      fetchGroupMembers();
      
      // Set up real-time listener
      const messagesRef = ref(database, `groupChats/${groupInfo.id}/messages`);
      const unsubscribe = onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
          const messagesData = snapshot.val();
          const messagesList = Object.entries(messagesData).map(([id, message]: [string, any]) => ({
            id,
            ...message,
          }));
          messagesList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          setMessages(messagesList);

          // Show notification for new messages
          if (notifications && messagesList.length > 0) {
            const lastMessage = messagesList[messagesList.length - 1];
            if (lastMessage.senderId !== currentUser?.uid && 
                Date.now() - new Date(lastMessage.timestamp).getTime() < 5000) {
              showNotification(lastMessage);
            }
          }
        } else {
          setMessages([]);
        }
      });

      return () => {
        off(messagesRef, 'value', unsubscribe);
      };
    }
  }, [groupInfo?.id, notifications, currentUser?.uid]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Handle @ mentions
    if (newMessage.includes('@')) {
      const lastAtIndex = newMessage.lastIndexOf('@');
      const searchTerm = newMessage.substring(lastAtIndex + 1);
      setMentionSearch(searchTerm);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionSearch('');
    }
  }, [newMessage]);

  const fetchGroupInfo = async () => {
    try {
      const groupsRef = ref(database, 'groups');
      const snapshot = await get(groupsRef);
      
      if (snapshot.exists()) {
        const groupsData = snapshot.val();
        const userGroup = Object.entries(groupsData).find(([id, group]: [string, any]) => 
          group.internIds?.includes(currentUser?.uid) || group.supervisorId === currentUser?.uid
        );
        
        if (userGroup) {
          const [id, groupData] = userGroup;
          setGroupInfo({ id, ...groupData } as GroupInfo);
        } else {
          toast.error('You are not assigned to any group');
          navigate('/intern');
        }
      }
    } catch (error) {
      console.error('Error fetching group info:', error);
      toast.error('Failed to load group information');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMembers = async () => {
    if (!groupInfo) return;

    try {
      const [internsSnap, supervisorsSnap] = await Promise.all([
        get(ref(database, 'acceptedInterns')),
        get(ref(database, 'supervisors')),
      ]);

      const members: GroupMember[] = [];
      let unnamedCount = 1;

      // Add supervisor
      if (supervisorsSnap.exists()) {
        const supervisorsData = supervisorsSnap.val();
        const supervisor = supervisorsData[groupInfo.supervisorId];
        if (supervisor) {
          members.push({
            uid: groupInfo.supervisorId,
            name: supervisor.name,
            nickname: supervisor.name,
            role: 'supervisor'
          });
        }
      }

      // Add interns
      if (internsSnap.exists()) {
        const internsData = internsSnap.val();
        groupInfo.internIds?.forEach(internId => {
          const intern = internsData[internId];
          if (intern) {
            const displayName = intern.nickname && intern.nickname.trim() 
              ? intern.nickname 
              : `Unnamed Member ${unnamedCount++}`;
            
            members.push({
              uid: internId,
              name: intern.name,
              nickname: displayName,
              role: 'intern'
            });
          }
        });
      }

      setGroupMembers(members);
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const fetchMessages = async () => {
    if (!groupInfo?.id) return;

    try {
      const messagesRef = ref(database, `groupChats/${groupInfo.id}/messages`);
      const snapshot = await get(messagesRef);
      
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const messagesList = Object.entries(messagesData).map(([id, message]: [string, any]) => ({
          id,
          ...message,
        }));
        messagesList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMessages(messagesList);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const showNotification = (message: Message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${message.senderName} in ${groupInfo?.name}`, {
        body: message.message,
        icon: '/favicon.ico'
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Notifications enabled!');
      }
    }
  };

  const toggleNotifications = () => {
    const newState = !notifications;
    setNotifications(newState);
    localStorage.setItem(`notifications_${groupInfo?.id}`, JSON.stringify(newState));
    
    if (newState) {
      requestNotificationPermission();
      toast.success('Notifications enabled');
    } else {
      toast.success('Notifications disabled');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending || !currentUser || !groupInfo?.id) return;

    setSending(true);

    try {
      // Get current user's display name
      const currentMember = groupMembers.find(m => m.uid === currentUser.uid);
      const displayName = currentMember?.nickname || currentUser.name;

      // Extract mentions
      const mentions = extractMentions(newMessage);

      const messageData: any = {
        senderId: currentUser.uid,
        senderName: displayName,
        senderRole: currentUser.role,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
      };

      if (replyingTo) {
        messageData.replyTo = {
          messageId: replyingTo.id,
          senderName: replyingTo.senderName,
          message: replyingTo.message.substring(0, 50) + (replyingTo.message.length > 50 ? '...' : '')
        };
      }

      if (mentions.length > 0) {
        messageData.mentions = mentions;
      }

      const messagesRef = ref(database, `groupChats/${groupInfo.id}/messages`);
      await push(messagesRef, messageData);
      
      setNewMessage('');
      setReplyingTo(null);
      // Clear cached message after successful send
      localStorage.removeItem(`${MESSAGE_CACHE_KEY}_${groupInfo.id}`);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const extractMentions = (message: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(message)) !== null) {
      const mentionedName = match[1];
      const member = groupMembers.find(m => 
        m.nickname?.toLowerCase().includes(mentionedName.toLowerCase()) ||
        m.name.toLowerCase().includes(mentionedName.toLowerCase())
      );
      if (member) {
        mentions.push(member.uid);
      }
    }

    return mentions;
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!groupInfo?.id) return;

    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await remove(ref(database, `groupChats/${groupInfo.id}/messages/${messageId}`));
        toast.success('Message deleted');
      } catch (error) {
        console.error('Error deleting message:', error);
        toast.error('Failed to delete message');
      }
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const handleMentionSelect = (member: GroupMember) => {
    const lastAtIndex = newMessage.lastIndexOf('@');
    const beforeMention = newMessage.substring(0, lastAtIndex);
    const afterMention = newMessage.substring(lastAtIndex + mentionSearch.length + 1);
    setNewMessage(`${beforeMention}@${member.nickname} ${afterMention}`);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp).toDateString();
    const previousDate = new Date(previousMessage.timestamp).toDateString();
    
    return currentDate !== previousDate;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'supervisor':
        return 'text-purple-600';
      case 'intern':
        return 'text-green-600';
      case 'admin':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const isMessageMentioningUser = (message: Message) => {
    return message.mentions?.includes(currentUser?.uid || '') || false;
  };

  const filteredMembers = groupMembers.filter(member =>
    member.nickname?.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    member.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!groupInfo) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">Group Chat</h1>
          <p className="text-gray-600">You are not assigned to any group</p>
        </motion.div>

        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Group Found</h3>
          <p className="text-gray-600">Please contact your administrator to be assigned to a group.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/intern')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{groupInfo.name}</h1>
            <p className="text-gray-600">Group Chat</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleNotifications}
          >
            {notifications ? (
              <Bell className="h-4 w-4 mr-2" />
            ) : (
              <BellOff className="h-4 w-4 mr-2" />
            )}
            {notifications ? 'Notifications On' : 'Notifications Off'}
          </Button>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              {groupMembers.length} members
            </span>
          </div>
        </div>
      </motion.div>

      {/* Chat Container */}
      <Card className="h-[600px] flex flex-col relative">
        {/* Reply Banner */}
        {replyingTo && (
          <div className="p-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Replying to <strong>{replyingTo.senderName}</strong>: {replyingTo.message.substring(0, 50)}...
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : undefined;
              const isOwnMessage = message.senderId === currentUser?.uid;
              const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
              const isMentioned = isMessageMentioningUser(message);

              return (
                <div key={message.id}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatDate(message.timestamp)}
                      </div>
                    </div>
                  )}
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'} relative`}>
                      {!isOwnMessage && (
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{message.senderName}</span>
                          <span className={`text-xs ${getRoleColor(message.senderRole)} capitalize`}>
                            {message.senderRole}
                          </span>
                        </div>
                      )}

                      {/* Reply Reference */}
                      {message.replyTo && (
                        <div className="mb-2 p-2 bg-gray-100 rounded-lg border-l-4 border-blue-500">
                          <p className="text-xs text-gray-600">
                            <strong>{message.replyTo.senderName}</strong>: {message.replyTo.message}
                          </p>
                        </div>
                      )}

                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white'
                            : isMentioned
                            ? 'bg-yellow-100 text-gray-900 border-2 border-yellow-300'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>

                      {/* Message Actions */}
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg shadow-lg border p-1 flex space-x-1">
                        <button
                          onClick={() => handleReply(message)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Reply"
                        >
                          <Reply className="h-3 w-3 text-gray-600" />
                        </button>
                        {isOwnMessage && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="p-1 hover:bg-red-100 rounded"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Mention Suggestions */}
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute bottom-20 left-6 right-6 bg-white border border-gray-300 rounded-lg shadow-lg max-h-32 overflow-y-auto z-10">
            {filteredMembers.map(member => (
              <button
                key={member.uid}
                onClick={() => handleMentionSelect(member)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center space-x-2"
              >
                <AtSign className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{member.nickname}</span>
                <span className="text-xs text-gray-500">({member.role})</span>
              </button>
            ))}
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message... (use @ to mention someone)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
              maxLength={500}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {newMessage.trim() && (
            <p className="text-xs text-gray-500 mt-1">
              Draft saved automatically • Use @ to mention members
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}
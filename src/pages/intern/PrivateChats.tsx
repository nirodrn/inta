import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ref, push, get, onValue, off, remove, update } from 'firebase/database';
import { 
  MessageSquare, 
  Plus, 
  Users, 
  Send, 
  Code, 
  Copy, 
  Check, 
  X, 
  Settings,
  UserPlus,
  UserMinus,
  Search,
  Hash
} from 'lucide-react';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import CodeBlock from '../../components/UI/CodeBlock';
import toast from 'react-hot-toast';

interface PrivateChat {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  members: string[];
  createdAt: string;
  lastMessage?: {
    text: string;
    sender: string;
    timestamp: string;
  };
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  type: 'text' | 'code';
  codeLanguage?: string;
  replyTo?: {
    messageId: string;
    senderName: string;
    message: string;
  };
}

interface Intern {
  uid: string;
  name: string;
  nickname?: string;
}

export default function PrivateChats() {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<PrivateChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<PrivateChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'code'>('text');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [availableInterns, setAvailableInterns] = useState<Intern[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [createChatData, setCreateChatData] = useState({
    name: '',
    description: '',
    selectedMembers: [] as string[],
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchChats();
      fetchAvailableInterns();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedChat?.id) {
      fetchMessages();
      
      // Set up real-time listener for messages
      const messagesRef = ref(database, `privateChats/${selectedChat.id}/messages`);
      const unsubscribe = onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
          const messagesData = snapshot.val();
          const messagesList = Object.entries(messagesData).map(([id, message]: [string, any]) => ({
            id,
            ...message,
          }));
          messagesList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          setMessages(messagesList);
        } else {
          setMessages([]);
        }
      });

      return () => {
        off(messagesRef, 'value', unsubscribe);
      };
    }
  }, [selectedChat?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChats = async () => {
    try {
      const snapshot = await get(ref(database, 'privateChats'));
      if (snapshot.exists()) {
        const chatsData = snapshot.val();
        const chatsList = Object.entries(chatsData)
          .map(([id, chat]: [string, any]) => ({ id, ...chat }))
          .filter((chat: PrivateChat) => chat.members?.includes(currentUser?.uid || ''))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setChats(chatsList);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableInterns = async () => {
    try {
      const snapshot = await get(ref(database, 'acceptedInterns'));
      if (snapshot.exists()) {
        const internsData = snapshot.val();
        const internsList = Object.entries(internsData)
          .map(([uid, intern]: [string, any]) => ({ uid, ...intern }))
          .filter((intern: Intern) => intern.uid !== currentUser?.uid);
        
        setAvailableInterns(internsList);
      }
    } catch (error) {
      console.error('Error fetching interns:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat?.id) return;

    try {
      const messagesRef = ref(database, `privateChats/${selectedChat.id}/messages`);
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
    }
  };

  const createChat = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createChatData.name.trim() || createChatData.selectedMembers.length === 0) {
      toast.error('Please enter a chat name and select at least one member');
      return;
    }

    try {
      const chatData = {
        name: createChatData.name.trim(),
        description: createChatData.description.trim(),
        createdBy: currentUser?.uid,
        members: [currentUser?.uid, ...createChatData.selectedMembers],
        createdAt: new Date().toISOString(),
      };

      const newChatRef = await push(ref(database, 'privateChats'), chatData);
      
      toast.success('Private chat created successfully!');
      setShowCreateModal(false);
      setCreateChatData({ name: '', description: '', selectedMembers: [] });
      fetchChats();
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create chat');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending || !selectedChat?.id) return;

    setSending(true);

    try {
      const messageData = {
        senderId: currentUser?.uid,
        senderName: currentUser?.name,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        type: messageType,
        ...(messageType === 'code' && { codeLanguage }),
      };

      const messagesRef = ref(database, `privateChats/${selectedChat.id}/messages`);
      await push(messagesRef, messageData);
      
      // Update last message in chat
      await update(ref(database, `privateChats/${selectedChat.id}`), {
        lastMessage: {
          text: messageType === 'code' ? `[Code: ${codeLanguage}]` : newMessage.trim(),
          sender: currentUser?.name,
          timestamp: new Date().toISOString(),
        }
      });
      
      setNewMessage('');
      setMessageType('text');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getDisplayName = (intern: Intern) => {
    return intern.nickname && intern.nickname.trim() ? intern.nickname : intern.name;
  };

  const filteredInterns = availableInterns.filter(intern =>
    getDisplayName(intern).toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedChatMembers = selectedChat 
    ? availableInterns.filter(intern => selectedChat.members.includes(intern.uid))
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex">
      {/* Chat List */}
      <div className="w-1/3 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Private Chats</h2>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto h-full">
          {chats.length > 0 ? (
            chats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Hash className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{chat.name}</h3>
                    <p className="text-sm text-gray-600 truncate">
                      {chat.members.length} members
                    </p>
                    {chat.lastMessage && (
                      <p className="text-xs text-gray-500 truncate">
                        {chat.lastMessage.sender}: {chat.lastMessage.text}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No private chats yet</p>
              <p className="text-sm">Create your first chat to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedChat.name}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedChat.members.length} members
                    {selectedChat.description && ` • ${selectedChat.description}`}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowMembersModal(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length > 0 ? (
                messages.map((message) => {
                  const isOwnMessage = message.senderId === currentUser?.uid;
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'} group`}>
                        {!isOwnMessage && (
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {message.senderName}
                          </p>
                        )}
                        
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          {message.type === 'code' ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium ${
                                  isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {message.codeLanguage}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(message.message, message.id)}
                                  className={`p-1 rounded hover:bg-opacity-20 hover:bg-gray-500 ${
                                    isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                                  }`}
                                >
                                  {copiedMessageId === message.id ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                              <div className="bg-gray-900 rounded p-3 overflow-x-auto">
                                <CodeBlock code={message.message} />
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm">{message.message}</p>
                          )}
                          
                          <p className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2 mb-2">
                <button
                  onClick={() => setMessageType('text')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    messageType === 'text'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Text
                </button>
                <button
                  onClick={() => setMessageType('code')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    messageType === 'code'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Code className="h-4 w-4 mr-1" />
                  Code
                </button>
                
                {messageType === 'code' && (
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="sql">SQL</option>
                    <option value="json">JSON</option>
                  </select>
                )}
              </div>
              
              <form onSubmit={sendMessage} className="flex space-x-2">
                {messageType === 'text' ? (
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sending}
                  />
                ) : (
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Paste your code here..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    disabled={sending}
                  />
                )}
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
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a chat to start messaging</h3>
              <p>Choose a private chat from the list or create a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Chat Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateChatData({ name: '', description: '', selectedMembers: [] });
          setSearchTerm('');
        }}
        title="Create Private Chat"
        size="lg"
      >
        <form onSubmit={createChat} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chat Name *
            </label>
            <input
              type="text"
              value={createChatData.name}
              onChange={(e) => setCreateChatData({ ...createChatData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter chat name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={createChatData.description}
              onChange={(e) => setCreateChatData({ ...createChatData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the chat"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Members *
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search interns..."
              />
            </div>
            
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredInterns.map((intern) => (
                <label
                  key={intern.uid}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={createChatData.selectedMembers.includes(intern.uid)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCreateChatData({
                          ...createChatData,
                          selectedMembers: [...createChatData.selectedMembers, intern.uid]
                        });
                      } else {
                        setCreateChatData({
                          ...createChatData,
                          selectedMembers: createChatData.selectedMembers.filter(id => id !== intern.uid)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {getDisplayName(intern).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">{getDisplayName(intern)}</span>
                </label>
              ))}
            </div>
            
            {createChatData.selectedMembers.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {createChatData.selectedMembers.length} member{createChatData.selectedMembers.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setCreateChatData({ name: '', description: '', selectedMembers: [] });
                setSearchTerm('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Chat
            </Button>
          </div>
        </form>
      </Modal>

      {/* Members Modal */}
      <Modal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        title={`${selectedChat?.name} - Members`}
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            {selectedChatMembers.map((member) => (
              <div key={member.uid} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getDisplayName(member).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{getDisplayName(member)}</p>
                  {member.uid === selectedChat?.createdBy && (
                    <p className="text-xs text-blue-600">Creator</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => setShowMembersModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  Sparkles, 
  User,
  Plus,
  Settings,
  ChevronDown,
  MessageSquare,
  Zap,
  Bot,
  Menu,
  X
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AI_PROVIDERS, getProvider, type AIProvider, type ChatMessage } from "@/lib/ai/providers";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ExtendedChatMessage extends ChatMessage {
  timestamp?: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: ExtendedChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export default function AIChat() {
  const { data: session } = useSession();
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(AI_PROVIDERS[0]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages, streamingResponse]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Load chats from localStorage
  useEffect(() => {
    if (isMounted && session?.user?.email) {
      const savedChats = localStorage.getItem(`figma-chats-${session.user.email}`);
      if (savedChats) {
        try {
          const parsed = JSON.parse(savedChats);
          const chatsWithDates = parsed.map((chat: any) => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            updatedAt: new Date(chat.updatedAt),
          }));
          setChats(chatsWithDates);
          if (chatsWithDates.length > 0 && !currentChat) {
            setCurrentChat(chatsWithDates[0]);
          }
        } catch (error) {
          console.error("Failed to load chats:", error);
        }
      }
    }
  }, [isMounted, session?.user?.email, currentChat]);

  // Save chats to localStorage
  const saveChats = useCallback((updatedChats: Chat[]) => {
    if (isMounted && session?.user?.email && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`figma-chats-${session.user.email}`, JSON.stringify(updatedChats));
      } catch (error) {
        console.error("Failed to save chats:", error);
      }
    }
  }, [isMounted, session?.user?.email]);

  // Create new chat
  const createNewChat = useCallback(() => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCurrentChat(newChat);
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    saveChats(updatedChats);
    setInput("");
  }, [chats, saveChats]);

  // Update current chat
  const updateCurrentChat = useCallback((updates: Partial<Chat>) => {
    if (!currentChat) return;

    const updatedChat = {
      ...currentChat,
      ...updates,
      updatedAt: new Date(),
    };

    setCurrentChat(updatedChat);
    const updatedChats = chats.map(chat => 
      chat.id === currentChat.id ? updatedChat : chat
    );
    setChats(updatedChats);
    saveChats(updatedChats);
  }, [currentChat, chats, saveChats]);

  // Generate title from first message
  const generateTitle = (message: string): string => {
    const words = message.trim().split(" ").slice(0, 6);
    return words.join(" ") + (message.split(" ").length > 6 ? "..." : "");
  };

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isGenerating) return;

    const messageText = input.trim();
    setInput("");

    let chatToUse = currentChat;
    if (!chatToUse) {
      chatToUse = {
        id: Date.now().toString(),
        title: generateTitle(messageText),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCurrentChat(chatToUse);
    }

    // Add user message
    const userMessage: ExtendedChatMessage = {
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    const updatedMessages = [...chatToUse.messages, userMessage];
    updateCurrentChat({ 
      messages: updatedMessages,
      title: chatToUse.messages.length === 0 ? generateTitle(messageText) : chatToUse.title
    });

    setIsGenerating(true);
    setStreamingResponse("");

    try {
      const provider = getProvider(selectedProvider.id);
      
      if (provider.generateStreamResponse) {
        try {
          const stream = provider.generateStreamResponse(updatedMessages);
          setIsStreaming(true);
          let accumulatedResponse = '';
          
          for await (const chunk of stream) {
            if (chunk) {
              // For HackClub, we might get JSON objects or different formats
              let textChunk = chunk;
              
              // If it's an object or unusual format, try to extract text
              if (typeof chunk === 'object') {
                try {
                  textChunk = JSON.stringify(chunk);
                } catch (e) {
                  console.error('Error stringifying chunk:', e);
                }
              }
              
              accumulatedResponse += textChunk;
              setStreamingResponse(accumulatedResponse);
            }
          }
          
          // After streaming completes, update the chat with the final accumulated response
          if (accumulatedResponse && currentChat) {
            const assistantMessage: ExtendedChatMessage = {
              role: 'assistant' as const,
              content: accumulatedResponse,
              timestamp: new Date()
            };
            
            const updatedChatMessages = [...updatedMessages, assistantMessage];
            updateCurrentChat({ 
              messages: updatedChatMessages
            });
          }
        } catch (error) {
          console.error('Streaming error:', error);
          toast.error(`Streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setIsStreaming(false);
          setStreamingResponse('');
        }
      } else {
        // Fall back to regular response
        const response = await provider.generateResponse(updatedMessages);
        
        const assistantMessage: ExtendedChatMessage = {
          role: "assistant",
          content: response,
          timestamp: new Date(),
        };

        updateCurrentChat({ 
          messages: [...updatedMessages, assistantMessage]
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get AI response");
    } finally {
      setIsGenerating(false);
    }
  }, [input, currentChat, selectedProvider, isGenerating, updateCurrentChat]);

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!session) {
    return (
      <div className="h-full bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-neutral-900 dark:bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6 text-white dark:text-neutral-900" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Sign in to start chatting</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Get AI-powered assistance with your studies
          </p>
        </div>
      </div>
    );
  }

  // Prevent hydration mismatch
  if (!isMounted) {
    return <div className="w-full h-full bg-white dark:bg-neutral-950" />;
  }

  return (
    <div className="w-full h-full bg-white dark:bg-neutral-950 flex overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-80 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Study Chats</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={createNewChat}
              className="w-8 h-8 p-0 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Model Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between text-xs h-10 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                <div className="flex items-center gap-2">
                  {selectedProvider.id === 'gemini-2.0-flash' ? (
                    <Sparkles className="w-3 h-3" />
                  ) : (
                    <Zap className="w-3 h-3" />
                  )}
                  <span className="truncate">{selectedProvider.name}</span>
                </div>
                <ChevronDown className="w-3 h-3 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              {AI_PROVIDERS.map((provider) => (
                <DropdownMenuItem
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider)}
                  className="flex items-center gap-3 p-3"
                >
                  {provider.id === 'gemini-2.0-flash' ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {provider.id === 'gemini-2.0-flash' 
                        ? "Google's latest model with multimodal capabilities" 
                        : "Open-source model optimized for learning"
                      }
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-auto p-3">
          {chats.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-neutral-400 dark:text-neutral-500 text-sm">
                No chats yet. Start a conversation!
              </div>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setCurrentChat(chat)}
                className={cn(
                  "p-4 rounded-xl cursor-pointer transition-all mb-2 group border",
                  currentChat?.id === chat.id 
                    ? "bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700" 
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800 border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                )}
              >
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate mb-1">
                  {chat.title}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {chat.messages.length} messages
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    {chat.updatedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : "-100%",
        }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="lg:hidden fixed inset-y-0 left-0 w-80 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col flex-shrink-0 z-50"
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden flex justify-end p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(false)}
            className="w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Study Chats</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={createNewChat}
              className="w-8 h-8 p-0 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Model Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between text-xs h-10 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                <div className="flex items-center gap-2">
                  {selectedProvider.id === 'gemini-2.0-flash' ? (
                    <Sparkles className="w-3 h-3" />
                  ) : (
                    <Zap className="w-3 h-3" />
                  )}
                  <span className="truncate">{selectedProvider.name}</span>
                </div>
                <ChevronDown className="w-3 h-3 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              {AI_PROVIDERS.map((provider) => (
                <DropdownMenuItem
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider)}
                  className="flex items-center gap-3 p-3"
                >
                  {provider.id === 'gemini-2.0-flash' ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {provider.id === 'gemini-2.0-flash' 
                        ? "Google's latest model with multimodal capabilities" 
                        : "Open-source model optimized for learning"
                      }
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-auto p-3">
          {chats.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-neutral-400 dark:text-neutral-500 text-sm">
                No chats yet. Start a conversation!
              </div>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setCurrentChat(chat)}
                className={cn(
                  "p-4 rounded-xl cursor-pointer transition-all mb-2 group border",
                  currentChat?.id === chat.id 
                    ? "bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700" 
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800 border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                )}
              >
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate mb-1">
                  {chat.title}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {chat.messages.length} messages
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    {chat.updatedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden w-8 h-8 p-0"
          >
            <Menu className="w-4 h-4" />
          </Button>
          
          <div className="flex-1 lg:flex-none">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {currentChat?.title || "AI Chat"}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Powered by {selectedProvider.name}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto">
          {currentChat?.messages.length === 0 && !streamingResponse ? (
            <div className="h-full flex items-center justify-center p-4 lg:p-6">
              <div className="text-center max-w-2xl">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Bot className="w-8 h-8 text-neutral-600 dark:text-neutral-400" />
                </div>
                <h3 className="text-xl lg:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                  Your AI Study Assistant
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm lg:text-base leading-relaxed mb-8">
                  I&apos;m here to help you with your studies! Ask me about any subject, get explanations, solve problems, or practice with questions.
                </p>
                
                {/* Learning Suggestions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                  {[
                    { icon: "📚", title: "Explain concepts", desc: "Break down complex topics" },
                    { icon: "🧮", title: "Solve problems", desc: "Step-by-step solutions" },
                    { icon: "📝", title: "Quiz me", desc: "Test your knowledge" },
                    { icon: "🎯", title: "Study plans", desc: "Organize your learning" }
                  ].map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index + 0.3 }}
                      className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      onClick={() => {
                        const prompts = [
                          "Explain the concept of photosynthesis in simple terms",
                          "Help me solve this math problem step by step",
                          "Quiz me on basic chemistry concepts",
                          "Create a study plan for learning Python programming"
                        ];
                        setInput(prompts[index]);
                      }}
                    >
                      <div className="text-2xl mb-2">{suggestion.icon}</div>
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm mb-1">
                        {suggestion.title}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {suggestion.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-4xl mx-auto w-full">
              <AnimatePresence>
                {currentChat?.messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-4 lg:gap-6",
                      message.role === "user" ? "flex-row-reverse" : ""
                    )}
                  >
                    <Avatar className="w-8 h-8 lg:w-10 lg:h-10 shrink-0 mt-1">
                      {message.role === "user" ? (
                        <>
                          <AvatarImage
                            src={session.user?.image || ""}
                            alt={session.user?.name || "User"}
                          />
                          <AvatarFallback className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs lg:text-sm">
                            {session.user?.name ? getUserInitials(session.user.name) : "U"}
                          </AvatarFallback>
                        </>
                      ) : (
                        <AvatarFallback className="bg-neutral-100 dark:bg-neutral-800">
                          {selectedProvider.id === 'gemini-2.0-flash' ? (
                            <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-neutral-600 dark:text-neutral-400" />
                          ) : (
                            <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-neutral-600 dark:text-neutral-400" />
                          )}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className={cn(
                      "flex-1 max-w-[85%]",
                      message.role === "user" ? "text-right" : ""
                    )}>
                      <div
                        className={cn(
                          "inline-block rounded-2xl px-4 py-3 lg:px-5 lg:py-4 text-sm leading-relaxed",
                          message.role === "user"
                            ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                        )}
                      >
                        {message.role === "user" ? (
                          <div className="whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                        ) : (
                          <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4 relative">
                            <div className="prose prose-neutral dark:prose-invert max-w-none">
                              {/* Replace the direct usage of ReactMarkdown with a safer approach */}
                              {typeof message.content === 'string' && (
                                <div 
                                  className="markdown-content" 
                                  dangerouslySetInnerHTML={{ 
                                    __html: markdownToHtml(message.content) 
                                  }}
                                />
                              )}
                            </div>
                            <div className="absolute bottom-2 right-2 text-xs text-neutral-400">
                              {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Message timestamp */}
                      <div className={cn(
                        "text-xs text-neutral-400 dark:text-neutral-500 mt-2",
                        message.role === "user" ? "text-right" : "text-left"
                      )}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Streaming Response */}
              {streamingResponse && (
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Bot className="w-5 h-5 text-neutral-500 dark:text-neutral-300" />
                  </div>
                  <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4 relative flex-1">
                    <div className="prose prose-neutral dark:prose-invert max-w-none">
                      <div 
                        className="markdown-content" 
                        dangerouslySetInnerHTML={{ 
                          __html: markdownToHtml(streamingResponse) 
                        }}
                      />
                    </div>
                    {/* Typing indicator for streaming */}
                    {isStreaming && (
                      <div className="flex space-x-1 mt-2">
                        <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                        <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Typing Indicator */}
              {isGenerating && !streamingResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 lg:gap-6"
                >
                  <Avatar className="w-8 h-8 lg:w-10 lg:h-10 shrink-0 mt-1">
                    <AvatarFallback className="bg-neutral-100 dark:bg-neutral-800">
                      {selectedProvider.id === 'gemini-2.0-flash' ? (
                        <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-neutral-600 dark:text-neutral-400" />
                      ) : (
                        <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-neutral-600 dark:text-neutral-400" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="inline-block bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-4 py-3 lg:px-5 lg:py-4">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                        <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-neutral-950">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-4 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about your studies..."
                  rows={1}
                  className="w-full resize-none rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-6 py-4 text-sm placeholder-neutral-500 dark:placeholder-neutral-400 text-neutral-900 dark:text-neutral-100 focus:border-neutral-900 dark:focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-300 min-h-[56px] max-h-[120px] shadow-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isGenerating}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isGenerating}
                className="h-14 w-14 p-0 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                "📖 Explain a concept",
                "🧮 Solve a problem", 
                "📝 Create a quiz",
                "📋 Make study notes"
              ].map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const prompts = [
                      "Can you explain ",
                      "Help me solve this problem: ",
                      "Create a quick quiz about ",
                      "Make study notes for "
                    ];
                    setInput(prompts[index]);
                    textareaRef.current?.focus();
                  }}
                  className="text-xs border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function markdownToHtml(markdown: string) {
  try {
    // Simple markdown formatting - you can enhance this as needed
    return markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^\s*\n\* (.*)/gim, '<ul>\n<li>$1</li>\n</ul>')
      .replace(/^\s*\n\d\. (.*)/gim, '<ol>\n<li>$1</li>\n</ol>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/gim, '<br />');
  } catch (e) {
    console.error('Error parsing markdown:', e);
    return markdown; // Return raw text if parsing fails
  }
}

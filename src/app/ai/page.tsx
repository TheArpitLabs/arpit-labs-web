/**
 * AI Chat Interface
 * Route: /ai
 * Main AI Assistant chat interface with streaming responses
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SendIcon, TrashIcon, CopyIcon } from 'lucide-react';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { logger } from '@/lib/logger';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
interface SearchResult {
  id: string;
  title: string;
  sourceType: string;
  preview: string;
  similarity: number;
  url: string;
}

interface Conversation {
  id: string;
  title: string;
  topic: 'projects' | 'blog' | 'experiments' | 'general';
  messages: Message[];
}

export default function AIPage() {
  const [viewMode, setViewMode] = useState<'chat' | 'search'>('chat');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState<'projects' | 'blog' | 'experiments' | 'general'>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const LOCAL_STORAGE_CONVERSATIONS_KEY = 'arpit_ai_conversations';
  const LOCAL_STORAGE_CURRENT_KEY = 'arpit_ai_current';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedConversations = window.localStorage.getItem(LOCAL_STORAGE_CONVERSATIONS_KEY);
    const savedCurrent = window.localStorage.getItem(LOCAL_STORAGE_CURRENT_KEY);

    if (savedConversations) {
      try {
        const parsed: Conversation[] = JSON.parse(savedConversations);
        const hydrated = parsed.map((conversation) => ({
          ...conversation,
          messages: conversation.messages.map((message) => ({
            ...message,
            timestamp: new Date(message.timestamp),
          })),
        }));
        setConversations(hydrated);
      } catch (error) {
        logger.warn('Failed to parse saved conversations', error);
      }
    }

    if (savedCurrent) {
      try {
        const parsed: Conversation = JSON.parse(savedCurrent);
        setCurrentConversation({
          ...parsed,
          messages: parsed.messages.map((message) => ({
            ...message,
            timestamp: new Date(message.timestamp),
          })),
        });
      } catch (error) {
        logger.warn('Failed to parse saved current conversation', error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS_KEY, JSON.stringify(conversations));
    if (currentConversation) {
      window.localStorage.setItem(LOCAL_STORAGE_CURRENT_KEY, JSON.stringify(currentConversation));
    } else {
      window.localStorage.removeItem(LOCAL_STORAGE_CURRENT_KEY);
    }
  }, [conversations, currentConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startNewConversation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();
      if (data.success) {
        const newConversation: Conversation = {
          id: data.conversationId,
          title: `New ${topic} conversation`,
          topic,
          messages: [],
        };
        setCurrentConversation(newConversation);
        setConversations((prevConversations) => [newConversation, ...prevConversations]);
        setViewMode('chat');
      }
    } catch (error) {
      logger.error('Failed to start conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !currentConversation) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    // Update UI immediately
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
    };
    setCurrentConversation(updatedConversation);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversation.id,
          message: input,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const assistantMessage: Message = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };

        const finalConversation = {
          ...updatedConversation,
          messages: [...updatedConversation.messages, assistantMessage],
        };
        setCurrentConversation(finalConversation);

        // Update conversations list
        setConversations((prevConversations) =>
          prevConversations.map((c) => (c.id === finalConversation.id ? finalConversation : c))
        );
      }
    } catch (error) {
      logger.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setCurrentConversation(null);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const renderSearchResults = () => (
    <div className="space-y-4">
      <form className="mb-6" onSubmit={async (event) => {
        event.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchResults([]);
        setSearchMessage('Searching for relevant content...');

        try {
          const response = await fetch('/api/ai/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: searchQuery, limit: 10 }),
          });

          const data = await response.json();
          if (data.success) {
            setSearchResults(data.results || []);
          } else {
            setSearchMessage('No search results found.');
          }
        } catch (error) {
          logger.error('Search failed:', error);
          setSearchMessage('Search failed. Please try again.');
        } finally {
          setIsSearching(false);
        }
      }}>
        <div className="flex gap-2 flex-col sm:flex-row">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, blog posts, experiments, and journey entries"
            className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <Button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Search
          </Button>
        </div>
      </form>

      {isSearching ? (
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <div className="text-slate-300">{searchMessage}</div>
        </Card>
      ) : searchResults.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <div className="text-slate-300">Search results will appear here after you submit a query.</div>
        </Card>
      ) : (
        searchResults.map((result) => (
          <Card key={result.id} className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div>
                  <h3 className="text-xl font-bold text-white">{result.title}</h3>
                  <p className="text-slate-400 text-sm capitalize">{result.sourceType}</p>
                </div>
                <span className="text-slate-300 text-sm">
                  Relevance: {(result.similarity * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{result.preview}</p>
              <a
                href={result.url}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View full content
              </a>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Container className="py-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Conversations */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/50 border-slate-700 h-full">
              <div className="p-4">
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setViewMode('chat')}
                    className={clsx(
                      'flex-1 px-3 py-2 rounded text-sm font-semibold transition',
                      viewMode === 'chat'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-700'
                    )}
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('search')}
                    className={clsx(
                      'flex-1 px-3 py-2 rounded text-sm font-semibold transition',
                      viewMode === 'search'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-700'
                    )}
                  >
                    Search
                  </button>
                </div>

                <h3 className="text-lg font-bold text-white mb-4">Conversations</h3>

                {/* Topic selector */}
                <div className="mb-4 space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Topic</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white"
                  >
                    <option value="general">General</option>
                    <option value="projects">Projects</option>
                    <option value="blog">Blog</option>
                    <option value="experiments">Experiments</option>
                  </select>
                </div>

                {/* New conversation button */}
                <Button
                  onClick={startNewConversation}
                  disabled={isLoading}
                  className="w-full mb-4 bg-blue-600 hover:bg-blue-700"
                >
                  + New Chat
                </Button>

                {/* Conversations list */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setCurrentConversation(conv)}
                      className={clsx(
                        'w-full text-left px-3 py-2 rounded text-sm truncate',
                        currentConversation?.id === conv.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      )}
                    >
                      {conv.title}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Main chat area */}
          <div className="lg:col-span-3">
            {viewMode === 'search' ? (
              renderSearchResults()
            ) : !currentConversation ? (
              <Card className="bg-slate-800/50 border-slate-700 h-full flex items-center justify-center min-h-96">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-4">Welcome to AI Chat</h2>
                  <p className="text-slate-300 mb-6">Start a new conversation to begin</p>
                  <Button
                    onClick={startNewConversation}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Start New Chat
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="flex flex-col h-screen lg:h-96">
                {/* Chat header */}
                <Card className="bg-slate-800/50 border-slate-700 p-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-white">{currentConversation.title}</h2>
                    <p className="text-xs text-slate-400">
                      {currentConversation.messages.length} messages
                    </p>
                  </div>
                  <Button
                    onClick={clearConversation}
                    variant="ghost"
                    className="text-red-400 hover:text-red-300"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </Button>
                </Card>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto bg-slate-900/50 p-4 space-y-4">
                  {currentConversation.messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      Start typing to begin the conversation
                    </div>
                  ) : (
                    currentConversation.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={clsx(
                            'max-w-md lg:max-w-xl px-4 py-3 rounded-lg',
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-slate-100'
                          )}
                        >
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-invert max-w-none text-sm">
                              <ReactMarkdown
                                components={{
                                  code: ({ node, inline, className, children, ...props }: any) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                      <SyntaxHighlighter
                                        style={atomDark}
                                        language={match[1]}
                                        PreTag="div"
                                        {...props}
                                      >
                                        {String(children).replace(/\n$/, '')}
                                      </SyntaxHighlighter>
                                    ) : (
                                      <code className="bg-slate-800 px-2 py-1 rounded text-xs" {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          )}
                          <button
                            onClick={() => copyMessage(msg.content)}
                            className="mt-2 inline-flex items-center gap-1 text-xs opacity-60 hover:opacity-100"
                          >
                            <CopyIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <Card className="bg-slate-800/50 border-slate-700 p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Ask me anything... (Shift+Enter for new line)"
                      className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none max-h-32"
                      rows={1}
                    />
                    <Button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="bg-blue-600 hover:bg-blue-700 px-4"
                    >
                      <SendIcon className="w-5 h-5" />
                    </Button>
                  </form>
                </Card>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

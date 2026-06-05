/**
 * Phase 7: AI Chat Component
 * Main AI Assistant interface for users
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  defaultTopic?: 'projects' | 'blog' | 'experiments' | 'general';
  className?: string;
}

/**
 * AI Chat Component - Main chat interface
 */
export function AIChat({ defaultTopic = 'general', className = '' }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize conversation on mount
  const initializeChat = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: defaultTopic }),
      });

      const data = await response.json();
      setConversationId(data.conversationId);

      // Add welcome message
      setMessages([
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `Hi! I&apos;m your AI assistant. I can help you explore your ${defaultTopic}. What would you like to know?`,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  }, [defaultTopic]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Send message
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: input,
        }),
      });

      const data = await response.json();

      // Add assistant response
      const assistantMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);

      // Add error message
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Scroll to bottom
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Card className={`flex flex-col h-[500px] ${className}`}>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="border-t p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          disabled={isLoading}
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </Card>
  );
}

// ============================================================================
// SEMANTIC SEARCH COMPONENT
// ============================================================================

interface SearchResult {
  id: string;
  title: string;
  sourceType: string;
  similarity: number;
  preview: string;
}

interface AISearchProps {
  className?: string;
}

/**
 * AI Search Component - Semantic search interface
 */
export function AISearch({ className = '' }: AISearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  /**
   * Perform search
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by meaning... (e.g., 'IoT solutions for healthcare')"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Powered by AI semantic search - finds content by meaning, not keywords
        </p>
      </form>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center text-gray-500">Searching...</p>
          ) : results.length > 0 ? (
            <div>
              <p className="text-sm font-medium mb-3">
                Found {results.length} results for &quot;{query}&quot;
              </p>
              {results.map((result) => (
                <Card key={result.id} className="p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{result.title}</h3>
                      <p className="text-sm text-gray-600 mt-2">{result.preview}</p>
                      <div className="flex gap-2 mt-3">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {result.sourceType}
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          {(result.similarity * 100).toFixed(0)}% match
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">
              No results found. Try a different search query.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PROJECT GENERATOR COMPONENT
// ============================================================================

interface GeneratedProject {
  title: string;
  description: string;
  techStack: Record<string, string[]>;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface AIProjectGeneratorProps {
  className?: string;
}

/**
 * AI Project Generator Component
 */
export function AIProjectGenerator({ className = '' }: AIProjectGeneratorProps) {
  const [category, setCategory] = useState('');
  const [generatedProject, setGeneratedProject] = useState<GeneratedProject | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const categories = ['IoT', 'AI', 'Cybersecurity', 'Web Development'];

  /**
   * Generate project
   */
  const handleGenerate = async (selectedCategory: string) => {
    setCategory(selectedCategory);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/generate/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory }),
      });

      const data = await response.json();
      setGeneratedProject(data.project);
    } catch (error) {
      console.error('Failed to generate project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      {/* Category Selection */}
      {!generatedProject && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select a Category</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {categories.map((cat) => (
              <Button
                key={cat}
                onClick={() => handleGenerate(cat)}
                disabled={isLoading}
                variant={category === cat ? 'primary' : 'outline'}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Generated Project */}
      {generatedProject && (
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold">{generatedProject.title}</h3>
              <p className="text-gray-600 mt-2">{generatedProject.description}</p>
            </div>
            <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded">
              {generatedProject.difficulty}
            </span>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="font-semibold mb-3">Suggested Tech Stack</h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(generatedProject.techStack).map(([category, techs]) => (
                <div key={category}>
                  <p className="text-sm font-medium capitalize mb-2">{category}</p>
                  <ul className="text-sm space-y-1">
                    {techs.map((tech) => (
                      <li key={tech} className="text-gray-700">
                        • {tech}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={() => setGeneratedProject(null)} variant="outline">
            Generate Another
          </Button>
        </Card>
      )}

      {isLoading && (
        <div className="flex justify-center">
          <p className="text-gray-500">Generating project idea...</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ANALYTICS PREVIEW COMPONENT
// ============================================================================

interface AnalyticsPrediction {
  type: string;
  predictions: string[];
  confidence: number;
}

/**
 * Analytics Preview Component - Show AI predictions
 */
export function AnalyticsPreview() {
  const [predictions, setPredictions] = useState<AnalyticsPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await fetch('/api/ai/analytics/predictions');
        const data = await response.json();
        setPredictions(data.predictions || []);
      } catch (error) {
        console.error('Failed to fetch predictions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  if (isLoading) return <p className="text-gray-500">Loading predictions...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {predictions.map((pred) => (
        <Card key={pred.type} className="p-4">
          <h4 className="font-semibold capitalize mb-2">{pred.type}</h4>
          <div className="space-y-2">
            {pred.predictions.map((p, idx) => (
              <div key={idx} className="text-sm text-gray-700">
                • {p}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-full bg-gray-200 rounded h-2">
              <div
                className="bg-green-500 h-2 rounded"
                style={{ width: `${pred.confidence * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium">{(pred.confidence * 100).toFixed(0)}%</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

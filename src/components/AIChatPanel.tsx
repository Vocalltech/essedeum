import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Key, Sparkles, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { Lore, RelationshipWithDetails } from '../lib/db';
import { generateStoryContext, streamGeminiResponse, getContextSummary } from '../lib/ai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatPanelProps {
  currentContent: string;
  loreEntries: Lore[];
  relationships: RelationshipWithDetails[];
}

const API_KEY_STORAGE_KEY = 'essedeum_gemini_api_key';

export function AIChatPanel({ currentContent, loreEntries, relationships }: AIChatPanelProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [contextInfo, setContextInfo] = useState<{ lore: Lore[]; relationships: RelationshipWithDetails[] }>({
    lore: [],
    relationships: [],
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Update context info when content changes
  useEffect(() => {
    if (currentContent) {
      const { relevantLore, relevantRelationships } = generateStoryContext(
        currentContent,
        loreEntries,
        relationships
      );
      setContextInfo({ lore: relevantLore, relationships: relevantRelationships });
    } else {
      setContextInfo({ lore: [], relationships: [] });
    }
  }, [currentContent, loreEntries, relationships]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKeyInput.trim());
      setApiKey(apiKeyInput.trim());
      setApiKeyInput('');
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey('');
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Generate context
    const { contextString, relevantLore, relevantRelationships } = generateStoryContext(
      currentContent,
      loreEntries,
      relationships
    );

    // Update context info for display
    setContextInfo({ lore: relevantLore, relationships: relevantRelationships });

    // Create placeholder for assistant message
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      await streamGeminiResponse(
        apiKey,
        contextString,
        userMessage.content,
        currentContent,
        (chunk) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        }
      );
    } catch (err) {
      console.error('AI response error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get AI response');
      // Remove the empty assistant message on error
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // API Key Setup Screen
  if (!apiKey) {
    return (
      <div className="h-full bg-zinc-900 border-l border-zinc-800 flex flex-col">
        <div className="px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-zinc-100">AI Oracle</h2>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-sm w-full space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Key className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">Setup AI Oracle</h3>
              <p className="text-sm text-zinc-400">
                Enter your Google Gemini API key to enable AI-powered story assistance.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Enter your Gemini API key..."
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
              />
              <button
                onClick={handleSaveApiKey}
                disabled={!apiKeyInput.trim()}
                className="w-full px-4 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Enable AI Oracle
              </button>
            </div>

            <p className="text-xs text-zinc-500 text-center">
              Your API key is stored locally and never sent to our servers.
              <br />
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline"
              >
                Get a free API key →
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main Chat Interface
  return (
    <div className="h-full bg-zinc-900 border-l border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-zinc-100">AI Oracle</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClearChat}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearApiKey}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              title="Change API key"
            >
              <Key className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Context Indicator */}
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            contextInfo.lore.length > 0 || contextInfo.relationships.length > 0
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-zinc-800 text-zinc-500'
          }`}>
            {getContextSummary(contextInfo.lore, contextInfo.relationships)}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-zinc-500 max-w-xs">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm mb-2">Ask me anything about your story!</p>
              <p className="text-xs">
                I'll use the characters and relationships mentioned in your current scene to give context-aware answers.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                  message.role === 'user'
                    ? 'bg-amber-600 text-white'
                    : 'bg-zinc-800 text-zinc-100'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-amber-300">{children}</strong>,
                        em: ({ children }) => <em className="italic text-zinc-300">{children}</em>,
                        code: ({ children }) => (
                          <code className="bg-zinc-700 px-1 py-0.5 rounded text-amber-300 text-xs">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-zinc-900 p-3 rounded-lg overflow-x-auto my-2">
                            {children}
                          </pre>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-amber-500 pl-3 italic text-zinc-400 my-2">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {message.content || '...'}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-lg px-4 py-3">
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your story..."
            rows={2}
            className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}


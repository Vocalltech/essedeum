import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, Key, Sparkles, Loader2, Trash2, AlertCircle, 
  Bookmark, ChevronDown, Brain, User, BookOpen
} from 'lucide-react';
import { Lore, RelationshipWithDetails, ChatMemory, saveMemory, getRecentMemories, MemoryType } from '../lib/db';
import { 
  generateUnifiedContext, 
  streamGeminiResponse, 
  getContextSummary,
  PERSONAS,
  PersonaType,
  AIContext
} from '../lib/ai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  saved?: boolean; // Whether this message has been saved to memory
}

interface AIChatPanelProps {
  projectId: number;
  currentContent: string;
  loreEntries: Lore[];
  relationships: RelationshipWithDetails[];
}

const API_KEY_STORAGE_KEY = 'essedeum_gemini_api_key';

// Memory type options for saving
const MEMORY_TYPES: { value: MemoryType; label: string; icon: string }[] = [
  { value: 'plot_point', label: 'Plot Point', icon: '📍' },
  { value: 'world_rule', label: 'World Rule', icon: '🌍' },
  { value: 'character_decision', label: 'Character Decision', icon: '👤' },
  { value: 'style_note', label: 'Style Note', icon: '✍️' },
  { value: 'ai_insight', label: 'AI Insight', icon: '💡' },
];

export function AIChatPanel({ projectId, currentContent, loreEntries, relationships }: AIChatPanelProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Persona state
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('co_author');
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  
  // Character simulator state
  const [selectedCharacter, setSelectedCharacter] = useState<Lore | null>(null);
  const [showCharacterDropdown, setShowCharacterDropdown] = useState(false);
  
  // Memory state
  const [memories, setMemories] = useState<ChatMemory[]>([]);
  const [savingMemoryId, setSavingMemoryId] = useState<string | null>(null);
  const [showMemoryTypeDropdown, setShowMemoryTypeDropdown] = useState<string | null>(null);
  
  // Context state
  const [contextInfo, setContextInfo] = useState<AIContext | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const personaDropdownRef = useRef<HTMLDivElement>(null);
  const characterDropdownRef = useRef<HTMLDivElement>(null);

  // Get characters from lore entries
  const characters = loreEntries.filter(l => l.type === 'Character');

  // Load API key and memories on mount
  useEffect(() => {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
    }
    
    loadMemories();
  }, [projectId]);

  // Load memories
  const loadMemories = async () => {
    try {
      const recentMemories = await getRecentMemories(projectId, 10);
      setMemories(recentMemories);
    } catch (error) {
      console.error('Failed to load memories:', error);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (personaDropdownRef.current && !personaDropdownRef.current.contains(e.target as Node)) {
        setShowPersonaDropdown(false);
      }
      if (characterDropdownRef.current && !characterDropdownRef.current.contains(e.target as Node)) {
        setShowCharacterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleSelectPersona = (persona: PersonaType) => {
    setSelectedPersona(persona);
    setShowPersonaDropdown(false);
    
    // Reset character selection if not character simulator
    if (persona !== 'character_simulator') {
      setSelectedCharacter(null);
    }
  };

  const handleSelectCharacter = (character: Lore) => {
    setSelectedCharacter(character);
    setShowCharacterDropdown(false);
  };

  const handleSaveToMemory = async (messageId: string, content: string, type: MemoryType) => {
    setSavingMemoryId(messageId);
    setShowMemoryTypeDropdown(null);
    
    try {
      await saveMemory(projectId, content, type);
      
      // Mark message as saved
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, saved: true } : msg
      ));
      
      // Reload memories
      await loadMemories();
    } catch (error) {
      console.error('Failed to save memory:', error);
    } finally {
      setSavingMemoryId(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Validate character simulator has a character selected
    if (selectedPersona === 'character_simulator' && !selectedCharacter) {
      setError('Please select a character for the Character Simulator');
      return;
    }

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

    try {
      // Generate unified context with all layers
      const context = await generateUnifiedContext(
        projectId,
        currentContent,
        loreEntries,
        relationships,
        memories,
        selectedPersona,
        selectedCharacter || undefined
      );

      setContextInfo(context);

      // Create placeholder for assistant message
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      await streamGeminiResponse({
        apiKey,
        context,
        userPrompt: userMessage.content,
        currentText: currentContent,
        onChunk: (chunk) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        },
      });
    } catch (err) {
      console.error('AI response error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get AI response');
      // Remove the empty assistant message on error
      setMessages(prev => prev.filter(msg => msg.content !== ''));
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

  const currentPersona = PERSONAS[selectedPersona];

  // Get persona color class
  const getPersonaColorClass = (persona: PersonaType, type: 'bg' | 'text' | 'border') => {
    const colors: Record<string, Record<string, string>> = {
      amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
      red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
      blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
      emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    };
    return colors[PERSONAS[persona].color]?.[type] || colors.amber[type];
  };

  // API Key Setup Screen
  if (!apiKey) {
    return (
      <div className="h-full flex flex-col">
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
                Enter your Google Gemini API key to enable the AI writing suite.
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
              Your API key is stored locally.
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
    <div className="h-full flex flex-col">
      {/* Header with Persona Selector */}
      <div className="px-4 py-3 border-b border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentPersona.icon}</span>
            <h2 className="text-lg font-semibold text-zinc-100">{currentPersona.name}</h2>
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

        {/* Persona Dropdown */}
        <div className="relative" ref={personaDropdownRef}>
          <button
            onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border ${getPersonaColorClass(selectedPersona, 'border')} ${getPersonaColorClass(selectedPersona, 'bg')} hover:opacity-90 transition-opacity`}
          >
            <div className="flex items-center gap-2">
              <span>{currentPersona.icon}</span>
              <span className={`text-sm font-medium ${getPersonaColorClass(selectedPersona, 'text')}`}>
                {currentPersona.name}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 ${getPersonaColorClass(selectedPersona, 'text')} transition-transform ${showPersonaDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showPersonaDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
              {Object.values(PERSONAS).map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => handleSelectPersona(persona.id)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 hover:bg-zinc-700 transition-colors text-left ${
                    selectedPersona === persona.id ? 'bg-zinc-700' : ''
                  }`}
                >
                  <span className="text-lg mt-0.5">{persona.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-100">{persona.name}</div>
                    <div className="text-xs text-zinc-400 truncate">{persona.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Character Selector (for Character Simulator) */}
        {selectedPersona === 'character_simulator' && (
          <div className="relative" ref={characterDropdownRef}>
            <button
              onClick={() => setShowCharacterDropdown(!showCharacterDropdown)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-400">
                  {selectedCharacter ? selectedCharacter.title : 'Select a character...'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform ${showCharacterDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showCharacterDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                {characters.length === 0 ? (
                  <div className="px-3 py-4 text-center text-zinc-500 text-sm">
                    No characters in Wiki yet
                  </div>
                ) : (
                  characters.map((character) => (
                    <button
                      key={character.id}
                      onClick={() => handleSelectCharacter(character)}
                      className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-700 transition-colors text-left ${
                        selectedCharacter?.id === character.id ? 'bg-zinc-700' : ''
                      }`}
                    >
                      <User className="w-4 h-4 text-rose-400" />
                      <span className="text-sm text-zinc-100">{character.title}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Context Indicator */}
        <div className="flex items-center gap-2 flex-wrap">
          {contextInfo && (
            <>
              {contextInfo.relevantLore.length > 0 && (
                <div className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {contextInfo.relevantLore.length} lore
                </div>
              )}
              {contextInfo.memoriesUsed > 0 && (
                <div className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400 flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  {contextInfo.memoriesUsed} memories
                </div>
              )}
              {contextInfo.styleExcerptsUsed > 0 && (
                <div className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {contextInfo.styleExcerptsUsed} style
                </div>
              )}
            </>
          )}
          {!contextInfo && (
            <div className="px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-500">
              {getContextSummary([], [], 0, 0)}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-zinc-500 max-w-xs">
              <span className="text-5xl block mb-4">{currentPersona.icon}</span>
              <p className="text-sm mb-2 font-medium text-zinc-300">{currentPersona.name}</p>
              <p className="text-xs">{currentPersona.description}</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${message.role === 'user' ? '' : 'group'}`}>
                <div
                  className={`rounded-lg px-4 py-2.5 ${
                    message.role === 'user'
                      ? `${getPersonaColorClass(selectedPersona, 'bg')} ${getPersonaColorClass(selectedPersona, 'text')} border ${getPersonaColorClass(selectedPersona, 'border')}`
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

                {/* Save to Memory Button (only for assistant messages) */}
                {message.role === 'assistant' && message.content && (
                  <div className="relative mt-1">
                    {message.saved ? (
                      <div className="flex items-center gap-1 text-xs text-emerald-400">
                        <Bookmark className="w-3 h-3 fill-current" />
                        Saved to memory
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setShowMemoryTypeDropdown(
                            showMemoryTypeDropdown === message.id ? null : message.id
                          )}
                          disabled={savingMemoryId === message.id}
                          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          {savingMemoryId === message.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Bookmark className="w-3 h-3" />
                          )}
                          Save to memory
                        </button>

                        {showMemoryTypeDropdown === message.id && (
                          <div className="absolute bottom-full left-0 mb-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden min-w-[160px]">
                            {MEMORY_TYPES.map((type) => (
                              <button
                                key={type.value}
                                onClick={() => handleSaveToMemory(message.id, message.content, type.value)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-700 transition-colors text-left"
                              >
                                <span>{type.icon}</span>
                                <span className="text-sm text-zinc-100">{type.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedPersona === 'character_simulator' && selectedCharacter
                ? `Ask ${selectedCharacter.title} something...`
                : `Ask the ${currentPersona.name}...`
            }
            rows={2}
            className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || (selectedPersona === 'character_simulator' && !selectedCharacter)}
            className={`px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
              getPersonaColorClass(selectedPersona, 'bg')
            } ${getPersonaColorClass(selectedPersona, 'text')} border ${getPersonaColorClass(selectedPersona, 'border')} hover:opacity-90`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-zinc-500">
            Enter to send, Shift+Enter for new line
          </p>
          {memories.length > 0 && (
            <p className="text-xs text-purple-400 flex items-center gap-1">
              <Brain className="w-3 h-3" />
              {memories.length} memories loaded
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { User, MapPin, Plus, X, Package, Calendar, Lightbulb, Link, ArrowRight, RefreshCw, ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { Lore, RelationshipWithDetails } from '../lib/db';
import { generateCharacterPortrait, base64ToDataUrl } from '../lib/imageGen';

interface WikiPanelProps {
  loreEntries: Lore[];
  chapters: unknown[]; // Keep for interface compatibility
  relationships: RelationshipWithDetails[];
  onAddLore: (title: string, type: string) => void;
  onSelectLore: (lore: Lore) => void;
  onAddRelationship: (sourceId: number, targetId: number, label: string) => void;
  onDeleteRelationship: (id: number) => void;
  onUpdateLoreImage: (loreId: number, imageData: string) => void;
  selectedLoreId?: number;
  apiKey?: string;
}

export function WikiPanel({ 
  loreEntries, 
  relationships = [], // Default to empty array
  onAddLore, 
  onSelectLore,
  onAddRelationship,
  onDeleteRelationship,
  onUpdateLoreImage,
  selectedLoreId,
  apiKey,
}: WikiPanelProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Character');
  
  // Relationship form state
  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const [relationshipTargetId, setRelationshipTargetId] = useState<number | ''>('');
  const [relationshipLabel, setRelationshipLabel] = useState('');
  
  // Image generation state
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Get the currently selected lore entry
  const selectedLore = loreEntries.find(l => l.id === selectedLoreId);

  // Safely get relationships for the selected lore entry
  const safeRelationships = relationships || [];
  const selectedLoreRelationships = selectedLoreId
    ? safeRelationships.filter(r => r.source_id === selectedLoreId || r.target_id === selectedLoreId)
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onAddLore(newTitle.trim(), newType);
      setNewTitle('');
      setNewType('Character');
      setIsAddingNew(false);
    }
  };

  const handleAddRelationship = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLoreId && relationshipTargetId && relationshipLabel.trim()) {
      onAddRelationship(selectedLoreId, Number(relationshipTargetId), relationshipLabel.trim());
      setRelationshipTargetId('');
      setRelationshipLabel('');
      setIsAddingRelationship(false);
    }
  };

  // Handle image generation
  const handleGenerateImage = async () => {
    if (!selectedLore || !apiKey) {
      setImageError('API key not configured. Please set it in the AI tab.');
      return;
    }

    setIsGeneratingImage(true);
    setImageError(null);

    try {
      const result = await generateCharacterPortrait(apiKey, {
        name: selectedLore.title,
        type: selectedLore.type,
        description: selectedLore.content,
      });

      if (selectedLore.id) {
        onUpdateLoreImage(selectedLore.id, result.base64);
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      setImageError(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Character':
        return <User className="w-4 h-4" />;
      case 'Location':
        return <MapPin className="w-4 h-4" />;
      case 'Item':
        return <Package className="w-4 h-4" />;
      case 'Event':
        return <Calendar className="w-4 h-4" />;
      case 'Concept':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Character':
        return 'text-rose-400';
      case 'Location':
        return 'text-emerald-400';
      case 'Item':
        return 'text-amber-400';
      case 'Event':
        return 'text-purple-400';
      case 'Concept':
        return 'text-cyan-400';
      default:
        return 'text-zinc-400';
    }
  };

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case 'Character':
        return 'bg-rose-500/20';
      case 'Location':
        return 'bg-emerald-500/20';
      case 'Item':
        return 'bg-amber-500/20';
      case 'Event':
        return 'bg-purple-500/20';
      case 'Concept':
        return 'bg-cyan-500/20';
      default:
        return 'bg-zinc-500/20';
    }
  };

  const groupedLore = loreEntries.reduce((acc, lore) => {
    if (!acc[lore.type]) {
      acc[lore.type] = [];
    }
    acc[lore.type].push(lore);
    return acc;
  }, {} as Record<string, Lore[]>);

  // Get other lore entries for the relationship dropdown (exclude selected)
  const otherLoreEntries = loreEntries.filter(l => l.id !== selectedLoreId);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Wiki / Lore</h2>
          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
            title="Add new lore entry"
          >
            {isAddingNew ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <>
          {/* Add New Form */}
          {isAddingNew && (
            <div className="px-4 py-3 border-b border-zinc-800">
              <form onSubmit={handleSubmit} className="space-y-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Name..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 text-sm"
                  autoFocus
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600 text-sm"
                >
                  <option value="Character">Character</option>
                  <option value="Location">Location</option>
                  <option value="Item">Item</option>
                  <option value="Event">Event</option>
                  <option value="Concept">Concept</option>
                </select>
                <button
                  type="submit"
                  className="w-full px-3 py-2 bg-zinc-700 text-zinc-100 rounded-lg hover:bg-zinc-600 transition-colors text-sm font-medium"
                >
                  Add Entry
                </button>
              </form>
            </div>
          )}

          {/* Selected Lore Portrait & Connections Section */}
          {selectedLore && (
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
              {/* Portrait Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-semibold text-zinc-100">Portrait</span>
                  </div>
                  {selectedLore.image_data && (
                    <button
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage || !apiKey}
                      className="p-1 rounded bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Regenerate portrait"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingImage ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </div>

                {selectedLore.image_data ? (
                  <div className="relative rounded-lg overflow-hidden bg-zinc-900">
                    <img
                      src={base64ToDataUrl(selectedLore.image_data)}
                      alt={selectedLore.title}
                      className="w-full h-40 object-cover"
                    />
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage || !apiKey}
                    className="w-full h-32 rounded-lg border-2 border-dashed border-zinc-700 hover:border-amber-500/50 bg-zinc-900/50 hover:bg-zinc-900 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                        <span className="text-xs text-zinc-400">Generating...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                          <Sparkles className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="text-xs text-zinc-400 group-hover:text-zinc-300">
                          {apiKey ? 'Generate with AI' : 'Set API key in AI tab'}
                        </span>
                      </>
                    )}
                  </button>
                )}

                {imageError && (
                  <div className="mt-2 px-2 py-1.5 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400">
                    {imageError}
                  </div>
                )}
              </div>

              {/* Connections Section */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm font-semibold text-zinc-100">
                    Connections for {selectedLore.title}
                  </span>
                </div>
                <button
                  onClick={() => setIsAddingRelationship(!isAddingRelationship)}
                  className="p-1 rounded bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-zinc-100 transition-colors"
                  title="Add connection"
                >
                  {isAddingRelationship ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Add Relationship Form */}
              {isAddingRelationship && (
                <form onSubmit={handleAddRelationship} className="mb-3 space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={relationshipTargetId}
                      onChange={(e) => setRelationshipTargetId(e.target.value ? Number(e.target.value) : '')}
                      className="flex-1 px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600 text-sm"
                    >
                      <option value="">Select target...</option>
                      {otherLoreEntries.map((lore) => (
                        <option key={lore.id} value={lore.id}>
                          {lore.title} ({lore.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={relationshipLabel}
                      onChange={(e) => setRelationshipLabel(e.target.value)}
                      placeholder="Relationship (e.g., Father of, Rival)"
                      className="flex-1 px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!relationshipTargetId || !relationshipLabel.trim()}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}

              {/* Existing Relationships */}
              {selectedLoreRelationships.length === 0 ? (
                <div className="text-xs text-zinc-500 text-center py-2">
                  No connections yet. Add one above.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedLoreRelationships.map((rel) => {
                    const isSource = rel.source_id === selectedLoreId;
                    const otherTitle = isSource ? rel.target_title : rel.source_title;
                    const otherType = isSource ? rel.target_type : rel.source_type;
                    const otherId = isSource ? rel.target_id : rel.source_id;
                    const otherLore = loreEntries.find(l => l.id === otherId);
                    
                    return (
                      <div
                        key={rel.id}
                        className="flex items-center gap-2 px-2 py-1.5 bg-zinc-900 rounded group"
                      >
                        <span className={`${getTypeBgColor(otherType || 'Character')} ${getTypeColor(otherType || 'Character')} px-1.5 py-0.5 rounded text-xs font-medium`}>
                          {rel.label}
                        </span>
                        <ArrowRight className="w-3 h-3 text-zinc-500" />
                        <button
                          onClick={() => otherLore && onSelectLore(otherLore)}
                          className={`flex items-center gap-1.5 text-sm hover:underline ${getTypeColor(otherType || 'Character')}`}
                        >
                          {getIcon(otherType || 'Character')}
                          <span className="text-xs">{otherTitle}</span>
                        </button>
                        <button
                          onClick={() => rel.id && onDeleteRelationship(rel.id)}
                          className="ml-auto p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-all"
                          title="Delete connection"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Lore List */}
          <div className="flex-1 overflow-y-auto">
            {Object.keys(groupedLore).length === 0 ? (
              <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                No lore entries yet. Click the + button to add one.
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {Object.entries(groupedLore).map(([type, entries]) => (
                  <div key={type}>
                    <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${getTypeColor(type)}`}>
                      {type}s ({entries.length})
                    </div>
                    <div className="space-y-1 px-2">
                      {entries.map((lore) => (
                        <button
                          key={lore.id}
                          onClick={() => onSelectLore(lore)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                            selectedLoreId === lore.id
                              ? 'bg-zinc-700 text-zinc-100'
                              : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                          }`}
                        >
                          <span className={getTypeColor(lore.type)}>
                            {getIcon(lore.type)}
                          </span>
                          <span className="text-sm truncate">{lore.title}</span>
                          {/* Show connection count badge */}
                          {safeRelationships.filter(r => r.source_id === lore.id || r.target_id === lore.id).length > 0 && (
                            <span className="ml-auto text-xs bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">
                              {safeRelationships.filter(r => r.source_id === lore.id || r.target_id === lore.id).length}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
    </div>
  );
}

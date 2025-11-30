import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { User, MapPin, Package, Calendar, Lightbulb } from 'lucide-react';

export interface MentionItem {
  id: number;
  title: string;
  type: string;
}

interface MentionListProps {
  items: MentionItem[];
  command: (item: { id: string; label: string; type: string }) => void;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'Character':
      return <User className="w-3.5 h-3.5" />;
    case 'Location':
      return <MapPin className="w-3.5 h-3.5" />;
    case 'Item':
      return <Package className="w-3.5 h-3.5" />;
    case 'Event':
      return <Calendar className="w-3.5 h-3.5" />;
    case 'Concept':
      return <Lightbulb className="w-3.5 h-3.5" />;
    default:
      return <User className="w-3.5 h-3.5" />;
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

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) {
        command({
          id: String(item.id),
          label: item.title,
          type: item.type,
        });
      }
    };

    const upHandler = () => {
      setSelectedIndex((selectedIndex + items.length - 1) % items.length);
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          upHandler();
          return true;
        }

        if (event.key === 'ArrowDown') {
          downHandler();
          return true;
        }

        if (event.key === 'Enter') {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-3 text-zinc-500 text-sm">
          No results found
        </div>
      );
    }

    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
              index === selectedIndex
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-300 hover:bg-zinc-750'
            }`}
          >
            <span className={getTypeColor(item.type)}>
              {getIcon(item.type)}
            </span>
            <span className="text-sm font-medium">{item.title}</span>
            <span className="text-xs text-zinc-500 ml-auto">{item.type}</span>
          </button>
        ))}
      </div>
    );
  }
);

MentionList.displayName = 'MentionList';


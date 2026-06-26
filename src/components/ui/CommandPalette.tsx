import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Search, Terminal, ArrowRight, X, Moon, RefreshCw, Eye } from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: 'Pages' | 'Actions';
  action: () => void;
  icon?: React.ReactNode;
  shortcut?: string;
}

export default function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { setActiveModule } = useApp() as any;
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle Dark Mode
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    onClose();
  };

  // Clear Session
  const clearSession = () => {
    sessionStorage.clear();
    window.location.reload();
  };

  const commands: CommandItem[] = [
    // Pages
    { id: 'page-chat', title: 'Go to AI Chat Dashboard', category: 'Pages', action: () => setActiveModule('chat'), icon: <Terminal className="w-4 h-4" /> },
    { id: 'page-sales', title: 'Go to Sales Coach Practice', category: 'Pages', action: () => setActiveModule('sales'), icon: <ArrowRight className="w-4 h-4" /> },
    { id: 'page-dealer', title: 'Go to Dealer Portal', category: 'Pages', action: () => setActiveModule('dealer'), icon: <ArrowRight className="w-4 h-4" /> },
    { id: 'page-enterprise', title: 'Go to Enterprise IT Portal', category: 'Pages', action: () => setActiveModule('enterprise'), icon: <ArrowRight className="w-4 h-4" /> },
    { id: 'page-news', title: 'Go to IT News Center', category: 'Pages', action: () => setActiveModule('news'), icon: <ArrowRight className="w-4 h-4" /> },
    { id: 'page-learn', title: 'Go to Technical Learning Center', category: 'Pages', action: () => setActiveModule('learn'), icon: <ArrowRight className="w-4 h-4" /> },
    { id: 'page-market', title: 'Go to Market Intelligence', category: 'Pages', action: () => setActiveModule('market'), icon: <ArrowRight className="w-4 h-4" /> },
    { id: 'page-solutions', title: 'Go to Solution Designer', category: 'Pages', action: () => setActiveModule('solutions'), icon: <ArrowRight className="w-4 h-4" /> },
    { id: 'page-obs', title: 'Go to Telemetry & Observability Dashboard', category: 'Pages', shortcut: 'G O', action: () => setActiveModule('observability'), icon: <Eye className="w-4 h-4" /> },
    
    // Actions
    { id: 'action-theme', title: 'Toggle Light / Dark Mode', category: 'Actions', shortcut: 'T T', action: toggleTheme, icon: <Moon className="w-4 h-4" /> },
    { id: 'action-clear', title: 'Clear Chat Cache & Reset', category: 'Actions', shortcut: 'C C', action: clearSession, icon: <RefreshCw className="w-4 h-4" /> }
  ];

  const filtered = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filtered, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm transition-all duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl overflow-hidden bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800">
          <Search className="w-5 h-5 mr-3 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or page name..."
            className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 text-base"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[350px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-slate-500">
              No commands found matching "{query}"
            </div>
          ) : (
            Object.entries(
              filtered.reduce((acc, cmd) => {
                if (!acc[cmd.category]) acc[cmd.category] = [];
                acc[cmd.category].push(cmd);
                return acc;
              }, {} as Record<string, CommandItem[]>)
            ).map(([category, items]) => (
              <div key={category} className="mb-2">
                <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-950/20">
                  {category}
                </div>
                <div className="mt-1 px-2 space-y-0.5">
                  {items.map(item => {
                    const globalIdx = filtered.findIndex(f => f.id === item.id);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          item.action();
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all duration-150 ${
                          isSelected 
                            ? 'bg-orange-600/20 border-l-2 border-orange-500 text-orange-200 pl-4' 
                            : 'text-slate-300 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {item.icon && <span className="text-slate-400">{item.icon}</span>}
                          <span className="font-medium text-sm">{item.title}</span>
                        </div>
                        {item.shortcut && (
                          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-slate-800 border border-slate-700 text-slate-400">
                            {item.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-slate-950/30 text-[11px] text-slate-500 font-medium">
          <div className="flex items-center space-x-3">
            <span>Use <kbd className="px-1 bg-slate-800 rounded">↑↓</kbd> to navigate</span>
            <span><kbd className="px-1 bg-slate-800 rounded">Enter</kbd> to select</span>
          </div>
          <div>
            <span>Press <kbd className="px-1 bg-slate-800 rounded">Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

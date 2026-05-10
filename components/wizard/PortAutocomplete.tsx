'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { usePortSearch } from '@/hooks/usePortSearch';
import type { Port } from '@/types';

interface Props {
  value: string;
  onChange: (port: Port) => void;
  placeholder?: string;
}

export function PortAutocomplete({ value, onChange, placeholder = 'Search port...' }: Props) {
  const { query, setQuery, results } = usePortSearch();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [setQuery]);

  function handleSelect(port: Port) {
    onChange(port);
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={open ? query : value}
          onFocus={() => setOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
          {results.map((port) => (
            <button
              key={port.id}
              type="button"
              onClick={() => handleSelect(port)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-border/50 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground font-medium">{port.name}</span>
                  {(port.isBosphorus || port.isDardanelles || port.isSuez) && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                      {port.isBosphorus ? 'Bosphorus' : port.isDardanelles ? 'Dardanelles' : 'Suez'}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{port.country} · {port.id}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.length > 0 && results.length === 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-xl px-3 py-2.5 text-xs text-muted-foreground">
          No ports found for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}

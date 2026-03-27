import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface OCRHighlightedTextProps {
  text: string;
}

const HighlightMatch = ({ text, query }: { text: string; query: string }) => {
  if (!query) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/30 text-foreground rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

const OCRHighlightedText = ({ text }: OCRHighlightedTextProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const q = searchQuery.trim();

  const matchCount = useMemo(() => {
    if (!q) return 0;
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return (text.match(regex) || []).length;
  }, [text, q]);

  const lines = text.split('\n');

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search in OCR text..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-8 text-xs bg-muted/50"
        />
        {q && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
            {matchCount} {matchCount === 1 ? 'match' : 'matches'}
          </span>
        )}
      </div>

      <div className="text-xs font-mono leading-relaxed space-y-0">
        {lines.map((line, i) => {
          const trimmed = line.trim();

          // Page headers
          if (/^---\s*Page\s+\d+\s*---$/i.test(trimmed)) {
            return (
              <div key={i} className="py-2 my-2 border-y border-primary/20 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  <HighlightMatch text={trimmed.replace(/---/g, '').trim()} query={q} />
                </span>
              </div>
            );
          }

          // Section headers
          if (
            (trimmed.length > 2 && trimmed.length < 80 && trimmed === trimmed.toUpperCase() && /[A-Z]{3,}/.test(trimmed)) ||
            (/^[A-Z][A-Za-z\s&/()-]+:$/.test(trimmed))
          ) {
            return (
              <div key={i} className="text-accent-foreground font-bold mt-3 mb-1 text-[11px]">
                <HighlightMatch text={trimmed} query={q} />
              </div>
            );
          }

          // Key-value lines
          const kvMatch = trimmed.match(/^(.+?)\s*[:=]\s*(\d+[\d.,]*)\s*(.*)/);
          if (kvMatch) {
            return (
              <div key={i} className="flex flex-wrap gap-x-2 py-0.5">
                <span className="text-muted-foreground"><HighlightMatch text={kvMatch[1] + ':'} query={q} /></span>
                <span className="font-semibold text-primary"><HighlightMatch text={kvMatch[2]} query={q} /></span>
                {kvMatch[3] && <span className="text-muted-foreground/70"><HighlightMatch text={kvMatch[3]} query={q} /></span>}
              </div>
            );
          }

          // Numeric table rows
          const numMatch = trimmed.match(/^(.+?)\s{2,}(\d+[\d.,]*)\s*(.*)/);
          if (numMatch) {
            return (
              <div key={i} className="flex flex-wrap gap-x-2 py-0.5">
                <span className="text-foreground"><HighlightMatch text={numMatch[1]} query={q} /></span>
                <span className="font-semibold text-primary"><HighlightMatch text={numMatch[2]} query={q} /></span>
                {numMatch[3] && <span className="text-muted-foreground/70"><HighlightMatch text={numMatch[3]} query={q} /></span>}
              </div>
            );
          }

          // Empty lines
          if (!trimmed) {
            return <div key={i} className="h-2" />;
          }

          // Default
          return (
            <div key={i} className="text-foreground py-0.5 whitespace-pre-wrap">
              <HighlightMatch text={line} query={q} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OCRHighlightedText;

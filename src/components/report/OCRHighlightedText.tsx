import React from 'react';

interface OCRHighlightedTextProps {
  text: string;
}

const OCRHighlightedText = ({ text }: OCRHighlightedTextProps) => {
  const lines = text.split('\n');

  return (
    <div className="text-xs font-mono leading-relaxed space-y-0">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // Page headers: --- Page 1 ---
        if (/^---\s*Page\s+\d+\s*---$/i.test(trimmed)) {
          return (
            <div key={i} className="py-2 my-2 border-y border-primary/20 text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {trimmed.replace(/---/g, '').trim()}
              </span>
            </div>
          );
        }

        // Section headers: all-caps lines or lines ending with colon
        if (
          (trimmed.length > 2 && trimmed.length < 80 && trimmed === trimmed.toUpperCase() && /[A-Z]{3,}/.test(trimmed)) ||
          (/^[A-Z][A-Za-z\s&/()-]+:$/.test(trimmed))
        ) {
          return (
            <div key={i} className="text-accent-foreground font-bold mt-3 mb-1 text-[11px]">
              {trimmed}
            </div>
          );
        }

        // Test result lines: "Test Name: value unit" or "Test Name ... value"
        const kvMatch = trimmed.match(/^(.+?)\s*[:=]\s*(\d+[\d.,]*)\s*(.*)/);
        if (kvMatch) {
          return (
            <div key={i} className="flex flex-wrap gap-x-2 py-0.5">
              <span className="text-muted-foreground">{kvMatch[1]}:</span>
              <span className="font-semibold text-primary">{kvMatch[2]}</span>
              {kvMatch[3] && <span className="text-muted-foreground/70">{kvMatch[3]}</span>}
            </div>
          );
        }

        // Lines with numeric values (e.g. table rows)
        const numMatch = trimmed.match(/^(.+?)\s{2,}(\d+[\d.,]*)\s*(.*)/);
        if (numMatch) {
          return (
            <div key={i} className="flex flex-wrap gap-x-2 py-0.5">
              <span className="text-foreground">{numMatch[1]}</span>
              <span className="font-semibold text-primary">{numMatch[2]}</span>
              {numMatch[3] && <span className="text-muted-foreground/70">{numMatch[3]}</span>}
            </div>
          );
        }

        // Empty lines
        if (!trimmed) {
          return <div key={i} className="h-2" />;
        }

        // Default text
        return (
          <div key={i} className="text-foreground py-0.5 whitespace-pre-wrap">
            {line}
          </div>
        );
      })}
    </div>
  );
};

export default OCRHighlightedText;

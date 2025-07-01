"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          // Custom styling for markdown elements
          h1: ({ children }) => <h1 className="text-xl font-bold mb-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-medium mb-2">{children}</h3>,
          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            ) : (
              <code className="block bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg text-sm font-mono overflow-x-auto" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="mb-3">{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-neutral-300 dark:border-neutral-600 pl-4 italic mb-2">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

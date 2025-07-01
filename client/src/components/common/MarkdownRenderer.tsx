import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom styling for different elements
          h1: ({...props}) => <h1 className="text-lg font-bold mb-3 text-neutral-900 dark:text-neutral-100" {...props} />,
          h2: ({...props}) => <h2 className="text-base font-semibold mb-2 text-neutral-900 dark:text-neutral-100" {...props} />,
          h3: ({...props}) => <h3 className="text-sm font-medium mb-2 text-neutral-900 dark:text-neutral-100" {...props} />,
          p: ({...props}) => <p className="mb-3 last:mb-0 text-neutral-900 dark:text-neutral-100 leading-relaxed" {...props} />,
          ul: ({...props}) => <ul className="list-disc list-inside mb-3 space-y-1 text-neutral-900 dark:text-neutral-100" {...props} />,
          ol: ({...props}) => <ol className="list-decimal list-inside mb-3 space-y-1 text-neutral-900 dark:text-neutral-100" {...props} />,
          li: ({...props}) => <li className="text-neutral-900 dark:text-neutral-100" {...props} />,
          blockquote: ({...props}) => (
            <blockquote 
              className="border-l-4 border-neutral-300 dark:border-neutral-700 pl-4 italic my-3 text-neutral-700 dark:text-neutral-300" 
              {...props} 
            />
          ),
          code: ({inline, ...props}: {inline?: boolean} & React.HTMLAttributes<HTMLElement>) => 
            inline ? (
              <code 
                className="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-1.5 py-0.5 rounded text-xs font-mono" 
                {...props} 
              />
            ) : (
              <code 
                className="block bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 p-3 rounded-lg text-xs font-mono overflow-x-auto" 
                {...props} 
              />
            ),
          pre: ({...props}) => (
            <pre 
              className="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 p-3 rounded-lg text-xs font-mono overflow-x-auto mb-3" 
              {...props} 
            />
          ),
          strong: ({...props}) => <strong className="font-semibold text-neutral-900 dark:text-neutral-100" {...props} />,
          em: ({...props}) => <em className="italic text-neutral-900 dark:text-neutral-100" {...props} />,
          a: ({...props}) => (
            <a 
              className="text-blue-600 dark:text-blue-400 hover:underline" 
              target="_blank" 
              rel="noopener noreferrer" 
              {...props} 
            />
          ),
          table: ({...props}) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border-collapse border border-neutral-300 dark:border-neutral-700" {...props} />
            </div>
          ),
          th: ({...props}) => (
            <th className="border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-left font-medium text-neutral-900 dark:text-neutral-100" {...props} />
          ),
          td: ({...props}) => (
            <td className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

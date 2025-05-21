import React, { useMemo } from "react";
import { MarkdownRenderer } from "markdown-react-renderer";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import "katex/dist/katex.min.css";
import katex from "katex";

interface MarkdownProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string;
}

// Function to convert HTML table to markdown table format
const convertHtmlTableToMarkdown = (content: string): string => {
  // Pattern to find HTML tables
  const tablePattern = /<table>([\s\S]*?)<\/table>/g;

  return content.replace(tablePattern, (match, tableContent) => {
    // Process the table content row by row
    const rows = tableContent.match(/<tr>([\s\S]*?)<\/tr>/g) || [];

    // Start building the markdown table
    let markdownTable = "\n";

    // Process each row
    rows.forEach((row, rowIndex) => {
      const cells = row.match(/<t[hd]>([\s\S]*?)<\/t[hd]>/g) || [];
      const cellsContent = cells.map((cell) => {
        // Extract content from the cell
        const content = cell
          .replace(/<t[hd]>([\s\S]*?)<\/t[hd]>/g, "$1")
          .trim();
        return content || " ";
      });

      markdownTable += `| ${cellsContent.join(" | ")} |\n`;

      // Add separator row after headers
      if (rowIndex === 0 && row.includes("<th>")) {
        markdownTable += `| ${cells.map(() => "---").join(" | ")} |\n`;
      }
    });

    return markdownTable;
  });
};

// Function to clean HTML comments and excessive whitespace
const cleanMarkdown = (content: string): string => {
  return content
    .replace(/<!--.*?-->/g, "") // Remove HTML comments
    .replace(/\n{3,}/g, "\n\n") // Replace excessive line breaks
    .replace(/\s+/g, " ") // Replace multiple spaces with a single space
    .replace(/> /g, ">") // Clean blockquote spacing
    .replace(/ </g, "<"); // Clean tag spacing
};

// Function to process math expressions and convert to HTML
const processMathExpressions = (content: string): string => {
  // For inline math: $...$ (single dollar sign)
  const inlineRegex = /\$([^$]+)\$/g;
  // For block math: $$...$$ (double dollar sign)
  const blockRegex = /\$\$([^$]+)\$\$/g;

  // First handle block math
  let processedContent = content.replace(blockRegex, (match, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
      });
      return `<div class="math-block">${rendered}</div>`;
    } catch (error) {
      console.error("KaTeX error rendering block formula:", error);
      return match; // Return original on error
    }
  });

  // Then handle inline math
  processedContent = processedContent.replace(inlineRegex, (match, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
      });
      // Add a space character after inline math to ensure proper spacing
      return `<span class="math-inline">${rendered}</span> `;
    } catch (error) {
      console.error("KaTeX error rendering inline formula:", error);
      return match; // Return original on error
    }
  });

  return processedContent;
};

// Add CSS styles for HTML tables
const tableStyles = `
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
  
  table th {
    background-color: hsl(var(--muted));
    font-weight: 500;
    text-align: left;
    padding: 0.5rem 1rem;
  }
  
  table td {
    padding: 0.5rem 1rem;
    border-top: 1px solid hsl(var(--border));
  }
  
  table tr:hover {
    background-color: hsl(var(--muted) / 0.5);
  }
  
  table tbody tr:nth-child(odd) {
    background-color: hsl(var(--muted) / 0.3);
  }
  
  .math-block {
    overflow-x: auto;
    margin: 1rem 0;
    padding: 0.5rem 0;
  }
  
  .math-inline {
    display: inline-block;
    margin: 0 0.15rem;
    vertical-align: middle;
  }
  
  /* Add styling for KaTeX elements */
  .katex-display {
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.5rem 0;
    margin: 0.5rem 0;
  }
  
  /* Fix spacing around inline math */
  .katex {
    text-rendering: auto;
    font-size: 1.1em;
  }
  
  /* Ensure proper line height with inline math */
  .katex-html {
    white-space: normal;
  }
`;

export function Markdown({ content, className, ...props }: MarkdownProps) {
  // Check if content has LaTeX math expressions using a simpler pattern
  const hasMathExpressions = useMemo(() => {
    const dollarPattern = content.includes("$");
    if (!dollarPattern) return false;

    // More detailed check if we found a dollar sign
    return (
      /\$((?!\$).)+\$/g.test(content) || /\$\$((?!\$\$).)+\$\$/g.test(content)
    );
  }, [content]);

  // Process content with tables and math
  const processedContent = useMemo(() => {
    // Process math expressions first
    let result = content;

    if (hasMathExpressions) {
      result = processMathExpressions(result);
    }

    // Then convert HTML tables to markdown tables
    result = convertHtmlTableToMarkdown(result);

    // Clean the markdown content
    return cleanMarkdown(result);
  }, [content, hasMathExpressions]);

  // Check if content has HTML (tables or math)
  const hasHtml = useMemo(() => {
    return (
      processedContent.includes("<table>") ||
      processedContent.includes("</table>") ||
      processedContent.includes('<div class="math-block">') ||
      processedContent.includes('<span class="math-inline">')
    );
  }, [processedContent]);

  // For content that has HTML, we'll use the fallback renderer
  const renderWithHtml = useMemo(() => {
    if (hasHtml) {
      return { __html: DOMPurify.sanitize(processedContent) };
    }
    return null;
  }, [processedContent, hasHtml]);

  // If content contains HTML, render with dangerouslySetInnerHTML
  if (renderWithHtml) {
    return (
      <div
        className={cn(
          "prose dark:prose-invert max-w-none break-words",
          className
        )}
        {...props}
      >
        <style>{tableStyles}</style>
        <div dangerouslySetInnerHTML={renderWithHtml} />
      </div>
    );
  }

  // Otherwise use MarkdownRenderer
  return (
    <div
      className={cn(
        "prose dark:prose-invert max-w-none break-words",
        className
      )}
      {...props}
    >
      <MarkdownRenderer
        markdown={processedContent}
        components={{
          // Table styling
          table: (props) => (
            <div className="overflow-auto my-4 border rounded-md">
              <table className="min-w-full divide-y divide-border" {...props} />
            </div>
          ),
          thead: (props) => <thead className="bg-muted" {...props} />,
          th: (props) => (
            <th
              className="px-4 py-2 text-left text-sm font-medium text-muted-foreground"
              {...props}
            />
          ),
          td: (props) => (
            <td
              className="px-4 py-2 text-sm border-t border-border"
              {...props}
            />
          ),
          tr: ({ className, ...props }) => (
            <tr className={cn("hover:bg-muted/50", className)} {...props} />
          ),
          // Heading styling
          h1: (props) => <h1 className="mt-6 mb-4 first:mt-0" {...props} />,
          h2: (props) => <h2 className="mt-6 mb-3 first:mt-0" {...props} />,
          h3: (props) => <h3 className="mt-5 mb-2 first:mt-0" {...props} />,
          h4: (props) => <h4 className="mt-4 mb-2 first:mt-0" {...props} />,
          // Other elements
          p: (props) => <p className="my-2" {...props} />,
          li: (props) => <li className="my-1" {...props} />,
          a: (props) => (
            <a className="text-primary hover:underline" {...props} />
          ),
          code: (props) => (
            <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props} />
          ),
          pre: (props) => (
            <pre className="p-4 rounded-md bg-muted overflow-auto" {...props} />
          ),
        }}
      />
    </div>
  );
}

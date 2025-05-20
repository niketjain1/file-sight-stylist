import React, { useMemo } from "react";
import { MarkdownRenderer } from "markdown-react-renderer";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";

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
`;

export function Markdown({ content, className, ...props }: MarkdownProps) {
  // Process content to handle HTML tables before passing to MarkdownRenderer
  const processedContent = useMemo(() => {
    // First convert HTML tables to markdown tables
    const contentWithTables = convertHtmlTableToMarkdown(content);

    // Clean the markdown content
    return cleanMarkdown(contentWithTables);
  }, [content]);

  // Check if content has HTML tables (both <table> and </table> tags)
  const hasHtmlTables = useMemo(() => {
    return content.includes("<table>") && content.includes("</table>");
  }, [content]);

  // For tables that might still be in HTML format, we'll use this as a fallback
  const renderWithHtml = useMemo(() => {
    // Only use this as fallback if the content contains HTML tables
    if (hasHtmlTables) {
      return { __html: DOMPurify.sanitize(content) };
    }
    return null;
  }, [content, hasHtmlTables]);

  // If content contains HTML tables, render with dangerouslySetInnerHTML
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

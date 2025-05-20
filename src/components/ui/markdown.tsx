import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

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

export function Markdown({ content, className, ...props }: MarkdownProps) {
  // Process content to handle HTML tables
  const processedContent = React.useMemo(() => {
    // First convert HTML tables to markdown tables
    const contentWithTables = convertHtmlTableToMarkdown(content);

    // Clean the markdown content
    return cleanMarkdown(contentWithTables);
  }, [content]);

  return (
    <div
      className={cn(
        "prose dark:prose-invert max-w-none break-words",
        className
      )}
      {...props}
    >
      <ReactMarkdown
        components={{
          // Improve table rendering
          table: ({ node, ...props }) => (
            <div className="overflow-auto my-4 border rounded-md">
              <table className="min-w-full divide-y divide-border" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-muted" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="px-4 py-2 text-left text-sm font-medium text-muted-foreground"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="px-4 py-2 text-sm border-t border-border"
              {...props}
            />
          ),
          tr: ({ node, className, ...props }) => (
            <tr className={cn("hover:bg-muted/50", className)} {...props} />
          ),
          // Fix spacing in lists
          li: ({ node, ...props }) => <li className="my-1" {...props} />,
          // Ensure headers have proper spacing
          h1: ({ node, ...props }) => (
            <h1 className="mt-6 mb-4 first:mt-0" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="mt-6 mb-3 first:mt-0" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="mt-5 mb-2 first:mt-0" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="mt-4 mb-2 first:mt-0" {...props} />
          ),
          // Fix paragraph spacing
          p: ({ node, ...props }) => <p className="my-2" {...props} />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

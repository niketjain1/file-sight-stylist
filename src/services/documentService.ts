import { toast } from "sonner";

export interface BoxCoordinates {
  l: number;
  t: number;
  r: number;
  b: number;
}

export interface Grounding {
  box: BoxCoordinates;
  page: number;
}

export interface Error {
  page_num: number;
  error: string;
  error_code: number;
}

export interface DocumentChunk {
  text: string;
  chunk_type:
    | "title"
    | "page_header"
    | "page_footer"
    | "page_number"
    | "key_value"
    | "form"
    | "table"
    | "figure"
    | "text";
  chunk_id: string;
  grounding: Grounding[] | null;
}

export interface DocumentResponse {
  markdown: string;
  chunks: DocumentChunk[];
  errors?: Error[];
  documentId?: string;
  pageCount?: number;
}

export interface ApiResponse {
  data: DocumentResponse;
  errors?: Error[];
}

export interface ChatResponse {
  message: string;
  sourceChunks?: DocumentChunk[];
  error?: string;
  suggestedQuestions?: string[];
}

// Define API endpoints
const BACKEND_ENABLED = true; // Always use the backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const DIRECT_API_BASE_URL = "https://api.va.landing.ai";
const API_PATH = "/v1/tools/agentic-document-analysis";

// Get the full API URL based on environment
const getApiUrl = (path = "") => {
  const baseUrl = BACKEND_ENABLED ? BACKEND_URL : DIRECT_API_BASE_URL;
  return `${baseUrl}${API_PATH}${path}`;
};

// Helper function to create common headers
const createHeaders = (apiKey: string, contentType?: string) => {
  const headers: Record<string, string> = {
    Authorization: `Basic ${apiKey}`,
  };

  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  return headers;
};

// Clean up markdown content to remove HTML comments and fix table formatting
const cleanMarkdownContent = (markdown: string): string => {
  return markdown
    .replace(/<!--.*?-->/g, "") // Remove HTML comments
    .replace(/<\/?table>/g, "") // Remove table tags but keep the content
    .replace(/<tr>\s*<th>/g, "| ") // Replace table row starts with markdown table syntax
    .replace(/<\/th>\s*<th>/g, " | ") // Replace internal column separators
    .replace(/<\/th>\s*<\/tr>/g, " |\n") // Replace row ends
    .replace(/<tr>\s*<td>/g, "| ") // Replace data row starts
    .replace(/<\/td>\s*<td>/g, " | ") // Replace internal data column separators
    .replace(/<\/td>\s*<\/tr>/g, " |\n") // Replace data row ends
    .replace(/\n{3,}/g, "\n\n"); // Replace excessive newlines
};

// Get Demo Form Data for "Loan Form" example
const getLoanFormDemoData = async (): Promise<ApiResponse> => {
  try {
    // Fetch the demo_form.json file
    const response = await fetch("/demo_form.json");
    if (!response.ok) {
      throw new Error("Failed to load demo form data");
    }

    const demoData = await response.json();

    // Create a mock document ID
    const mockDocumentId = "demo-loan-form-" + Date.now();

    // Add document ID to the response
    demoData.documentId = mockDocumentId;

    // Ensure pageCount is set
    if (!demoData.pageCount) {
      demoData.pageCount = 1;
    }

    // Clean up markdown content
    if (demoData.markdown) {
      demoData.markdown = cleanMarkdownContent(demoData.markdown);
    }

    // Clean up chunks content
    if (demoData.chunks && demoData.chunks.length) {
      demoData.chunks = demoData.chunks.map((chunk) => {
        if (chunk.text) {
          chunk.text = cleanMarkdownContent(chunk.text);
        }
        return chunk;
      });
    }

    return { data: demoData };
  } catch (error) {
    console.error("Error loading demo form data:", error);
    throw error;
  }
};

export const processDocument = async (
  file: File,
  pages: string | null = null,
  isDemo: boolean = false,
  demoType: string = ""
): Promise<ApiResponse> => {
  // Check if this is a demo request for "Loan Form"
  if (isDemo && demoType === "Loan Form") {
    toast.success("Loading Loan Form demo data...");
    return await getLoanFormDemoData();
  }

  try {
    const formData = new FormData();

    if (file.type === "application/pdf") {
      formData.append("pdf", file);
    } else {
      formData.append("image", file);
    }

    if (pages) {
      formData.append("pages", pages);
    }

    formData.append("include_marginalia", "true");
    formData.append("include_metadata_in_markdown", "true");

    const apiKey = import.meta.env.VITE_LANDING_AI_API_KEY;

    const response = await fetch(getApiUrl(), {
      method: "POST",
      headers: createHeaders(apiKey),
      body: formData,
      credentials: "omit",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to process document");
    }

    const result = await response.json();

    console.log("API Response:", result);

    if (result.data && Array.isArray(result.data.chunks)) {
      if (!result.data.pageCount) {
        const maxPage = Math.max(
          ...result.data.chunks
            .filter((chunk) => chunk.grounding && chunk.grounding.length > 0)
            .flatMap((chunk) => chunk.grounding?.map((g) => g.page) || []),
          0
        );

        result.data.pageCount = maxPage + 1;
      }

      return result;
    }

    return {
      data: {
        markdown: result.markdown || "",
        chunks: result.chunks || [],
        errors: result.errors || [],
        pageCount: 1,
      },
    };
  } catch (error) {
    console.error("Error processing document:", error);
    toast.error("Failed to process document. Please try again.");

    // For demo purposes - use mock data if API access fails due to CORS
    if (error instanceof TypeError && error.message.includes("CORS")) {
      toast.info(
        "Using sample data due to CORS restrictions. Make sure the backend server is running."
      );

      // Return mock data to demonstrate the UI functionality
      return {
        data: {
          markdown:
            "# Sample Document\n\n## Extracted Content\n\nThis is sample extracted content to demonstrate the UI functionality.\n\n## Note\n\nIn a real application, this would show actual content extracted from your document.",
          chunks: [
            {
              chunk_id: "sample-1",
              chunk_type: "title",
              text: "Sample Document Title",
              grounding: [{ box: { l: 0.1, t: 0.1, r: 0.9, b: 0.2 }, page: 0 }],
            },
            {
              chunk_id: "sample-2",
              chunk_type: "text",
              text: "This is sample extracted content to demonstrate the UI functionality.",
              grounding: [{ box: { l: 0.1, t: 0.3, r: 0.9, b: 0.4 }, page: 0 }],
            },
            {
              chunk_id: "sample-3",
              chunk_type: "form",
              text: "Field: Sample Value",
              grounding: [{ box: { l: 0.2, t: 0.5, r: 0.8, b: 0.6 }, page: 0 }],
            },
          ],
          pageCount: 1,
        },
      };
    }

    throw error;
  }
};

export const parseDocument = async (
  documentId: string
): Promise<ApiResponse> => {
  try {
    const apiKey = import.meta.env.VITE_LANDING_AI_API_KEY;

    const response = await fetch(getApiUrl(`/parse/${documentId}`), {
      method: "POST",
      headers: createHeaders(apiKey, "application/json"),
      credentials: "omit",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to parse document");
    }

    const result = await response.json();

    console.log("API Response:", result);

    if (result.data && Array.isArray(result.data.chunks)) {
      if (!result.data.pageCount) {
        const maxPage = Math.max(
          ...result.data.chunks
            .filter((chunk) => chunk.grounding && chunk.grounding.length > 0)
            .flatMap((chunk) => chunk.grounding?.map((g) => g.page) || []),
          0
        );

        result.data.pageCount = maxPage + 1;
      }

      return result;
    }

    return {
      data: {
        markdown: result.markdown || "",
        chunks: result.chunks || [],
        errors: result.errors || [],
        pageCount: 1,
      },
    };
  } catch (error) {
    console.error("Error parsing document:", error);
    toast.error("Failed to parse document. Please try again.");
    throw error;
  }
};

export const chatWithDocument = async (
  documentData: DocumentResponse,
  message: string
): Promise<ChatResponse> => {
  try {
    // Call the backend endpoint which will use Gemini API for large context window
    const apiKey = import.meta.env.VITE_LANDING_AI_API_KEY;
    const url = `${BACKEND_URL}/chat`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        documentData,
        message,
      }),
      credentials: "omit",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to chat with document");
    }

    const result = await response.json();
    console.log("Chat API Response:", result);

    return {
      message: result.message || "",
      sourceChunks: result.sourceChunks || [],
      suggestedQuestions: result.suggestedQuestions || [],
    };
  } catch (error) {
    console.error("Error chatting with document:", error);

    // For demo/fallback purposes
    return {
      message:
        "I can answer questions about the document. What would you like to know?",
      suggestedQuestions: [
        "What is the main topic of this document?",
        "Can you summarize the key points?",
        "Are there any figures or tables in this document?",
      ],
    };
  }
};

export const getSuggestedQuestions = async (
  documentData: DocumentResponse
): Promise<string[]> => {
  try {
    // Call the backend endpoint which will use Gemini API for suggestions
    const apiKey = import.meta.env.VITE_LANDING_AI_API_KEY;
    const url = `${BACKEND_URL}/suggest-questions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        documentData,
      }),
      credentials: "omit",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get suggested questions");
    }

    const result = await response.json();
    console.log("Suggested Questions API Response:", result);

    return result.questions || [];
  } catch (error) {
    console.error("Error getting suggested questions:", error);

    // Default questions if API fails
    return [
      "What is the main topic of this document?",
      "Can you summarize the key points?",
      "What data is presented in this document?",
      "What are the main findings in this document?",
    ];
  }
};

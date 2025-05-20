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
const BACKEND_URL = "http://localhost:5000/api/landing";
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

export const processDocument = async (
  file: File,
  pages: string | null = null
): Promise<ApiResponse> => {
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
  documentId: string,
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
        documentId,
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
  documentId: string
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
        documentId,
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
      "Are there any tables or figures in this document?",
      "What data is presented in this document?",
    ];
  }
};

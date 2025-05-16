
import { toast } from 'sonner';

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
  chunk_type: 'title' | 'page_header' | 'page_footer' | 'page_number' | 'key_value' | 'form' | 'table' | 'figure' | 'text';
  chunk_id: string;
  grounding: Grounding[] | null;
}

export interface DocumentResponse {
  markdown: string;
  chunks: DocumentChunk[];
  errors?: Error[];
}

export interface ApiResponse {
  data: DocumentResponse;
}

const API_ENDPOINT = 'https://api.va.landing.ai/v1/tools/agentic-document-analysis';

export const processDocument = async (file: File, pages: string | null = null): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    
    if (file.type === 'application/pdf') {
      formData.append('pdf', file);
    } else {
      formData.append('image', file);
    }
    
    if (pages) {
      formData.append('pages', pages);
    }
    
    formData.append('include_marginalia', 'true');
    formData.append('include_metadata_in_markdown', 'true');
    
    const response = await fetch(`${API_ENDPOINT}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to process document');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error processing document:', error);
    toast.error('Failed to process document. Please try again.');
    throw error;
  }
};

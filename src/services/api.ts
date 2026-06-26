import { ChatMessage } from '../types/index';

const BASE_URL = '';

interface StreamChatParams {
  messages: ChatMessage[];
  agent?: string;
  language?: string;
}

/**
 * Stream chat response using Server-Sent Events (SSE) or plain JSON fallback
 * @param params - { messages, agent, language }
 * @param onChunk - Called with each text chunk
 * @param onDone - Called when streaming completes with metadata
 * @param onError - Called on error with error message string
 */
export async function streamChat(
  { messages, agent = 'auto', language = 'en' }: StreamChatParams,
  onChunk: (text: string) => void,
  onDone: (metadata: any) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, agent, language, stream: true })
    });

    if (!response.ok) {
      let errMsg = `HTTP ${response.status}`;
      try {
        const err = await response.json();
        errMsg = err.error || errMsg;
      } catch { /* noop */ }
      throw new Error(errMsg);
    }

    const contentType = response.headers.get('content-type') || '';

    // SSE streaming path
    if (contentType.includes('text/event-stream')) {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body not readable');
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const data = JSON.parse(raw);
            if (data.error) { onError?.(data.error); return; }
            if (data.text) onChunk?.(data.text);
            if (data.done) onDone?.(data.metadata);
          } catch { /* ignore malformed SSE */ }
        }
      }

      // Flush remaining buffer
      if (buffer.startsWith('data: ')) {
        const raw = buffer.slice(6).trim();
        if (raw && raw !== '[DONE]') {
          try {
            const data = JSON.parse(raw);
            if (data.text) onChunk?.(data.text);
            if (data.done) onDone?.(data.metadata);
          } catch { /* noop */ }
        }
      }
    } else {
      // Non-streaming JSON fallback
      const data = await response.json();
      const text = data.content?.map((b: any) => b.text || '').join('') || data.text || '';
      onChunk?.(text);
      onDone?.(data.metadata);
    }
  } catch (err: any) {
    onError?.(err.message || 'Network error');
  }
}

/**
 * Fetch IT news articles
 */
export async function fetchNews(category: string | null = null, limit = 10, page = 1, lang = 'en'): Promise<any> {
  const params = new URLSearchParams({ limit: String(limit), page: String(page), lang });
  if (category) params.set('category', category);
  const res = await fetch(`${BASE_URL}/api/news?${params}`);
  if (!res.ok) throw new Error('Failed to fetch news');
  return res.json();
}

/**
 * Fetch market intelligence data
 */
export async function fetchMarketData(category: string | null = null, lang = 'en'): Promise<any> {
  const params = new URLSearchParams({ lang });
  if (category) params.set('category', category);
  const res = await fetch(`${BASE_URL}/api/market?${params}`);
  if (!res.ok) throw new Error('Failed to fetch market data');
  return res.json();
}

/**
 * Fetch current dealer schemes and offers
 */
export async function fetchSchemes(lang = 'en'): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/dealer/schemes?lang=${lang}`);
  if (!res.ok) throw new Error('Failed to fetch schemes');
  return res.json();
}

/**
 * Generate a formal quotation document
 */
export async function generateQuotation(items: any[], gstRate = 18, lang = 'en'): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/dealer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, gstRate, lang })
  });
  if (!res.ok) throw new Error('Failed to generate quotation');
  return res.json();
}

/**
 * Fetch stock/inventory levels
 */
export async function fetchStock(sku: string | null = null, category: string | null = null): Promise<any> {
  const params = new URLSearchParams();
  if (sku) params.set('sku', sku);
  if (category) params.set('category', category);
  const query = params.toString() ? `?${params}` : '';
  const res = await fetch(`${BASE_URL}/api/stock${query}`);
  if (!res.ok) throw new Error('Failed to fetch stock data');
  return res.json();
}

/**
 * Fetch learning courses and modules
 */
export async function fetchCourses(category: string | null = null, lang = 'en'): Promise<any> {
  const params = new URLSearchParams({ lang });
  if (category) params.set('category', category);
  const res = await fetch(`${BASE_URL}/api/learn?${params}`);
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

/**
 * Submit quiz answers and get results
 */
export async function submitQuiz(quizId: string, answers: any[]): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/learn/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quizId, answers })
  });
  if (!res.ok) throw new Error('Failed to submit quiz');
  return res.json();
}

/**
 * Check backend health status
 */
export async function checkHealth(): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    return res.json();
  } catch {
    return { status: 'offline' };
  }
}

/**
 * Export data as CSV or PDF
 */
export async function exportData(type: string, data: any, format = 'pdf'): Promise<Blob> {
  const res = await fetch(`${BASE_URL}/api/export/${type}?format=${format}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Failed to export ${type}`);
  return res.blob();
}

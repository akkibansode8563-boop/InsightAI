const BASE_URL = '';

/**
 * Stream chat response using Server-Sent Events (SSE) or plain JSON fallback
 * @param {Object} params - { messages, agent, language }
 * @param {Function} onChunk - Called with each text chunk
 * @param {Function} onDone - Called when streaming completes with metadata
 * @param {Function} onError - Called on error with error message string
 */
export async function streamChat(
  { messages, agent = 'auto', language = 'en' },
  onChunk,
  onDone,
  onError
) {
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
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line in buffer

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
      const text = data.content?.map(b => b.text || '').join('') || data.text || '';
      onChunk?.(text);
      onDone?.(data.metadata);
    }
  } catch (err) {
    onError?.(err.message || 'Network error');
  }
}

/**
 * Fetch IT news articles
 * @param {string|null} category - Optional category filter
 * @param {number} limit - Number of articles
 * @param {number} page - Page number for pagination
 * @returns {Promise<Object>}
 */
export async function fetchNews(category = null, limit = 10, page = 1) {
  const params = new URLSearchParams({ limit: String(limit), page: String(page) });
  if (category) params.set('category', category);
  const res = await fetch(`${BASE_URL}/api/news?${params}`);
  if (!res.ok) throw new Error('Failed to fetch news');
  return res.json();
}

/**
 * Fetch market intelligence data
 * @param {string|null} category - Optional category filter
 * @returns {Promise<Object>}
 */
export async function fetchMarketData(category = null) {
  const params = category ? `?category=${encodeURIComponent(category)}` : '';
  const res = await fetch(`${BASE_URL}/api/market${params}`);
  if (!res.ok) throw new Error('Failed to fetch market data');
  return res.json();
}

/**
 * Fetch current dealer schemes and offers
 * @returns {Promise<Object>}
 */
export async function fetchSchemes() {
  const res = await fetch(`${BASE_URL}/api/dealer/schemes`);
  if (!res.ok) throw new Error('Failed to fetch schemes');
  return res.json();
}

/**
 * Generate a formal quotation document
 * @param {Array} items - Line items [{ name, qty, unitPrice, sku? }]
 * @param {number} gstRate - GST rate (default 18%)
 * @returns {Promise<Object>}
 */
export async function generateQuotation(items, gstRate = 18) {
  const res = await fetch(`${BASE_URL}/api/dealer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, gstRate })
  });
  if (!res.ok) throw new Error('Failed to generate quotation');
  return res.json();
}

/**
 * Fetch stock/inventory levels
 * @param {string|null} sku - Optional SKU to check
 * @param {string|null} category - Optional category filter
 * @returns {Promise<Object>}
 */
export async function fetchStock(sku = null, category = null) {
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
 * @param {string|null} category - Optional category filter
 * @returns {Promise<Object>}
 */
export async function fetchCourses(category = null) {
  const params = category ? `?category=${encodeURIComponent(category)}` : '';
  const res = await fetch(`${BASE_URL}/api/learn${params}`);
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

/**
 * Submit quiz answers and get results
 * @param {string} quizId - Quiz identifier
 * @param {Array} answers - User's answers
 * @returns {Promise<Object>}
 */
export async function submitQuiz(quizId, answers) {
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
 * @returns {Promise<Object>} Health status object
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    return res.json();
  } catch {
    return { status: 'offline' };
  }
}

/**
 * Export data as CSV or PDF
 * @param {string} type - Export type ('quotation', 'report', etc.)
 * @param {Object} data - Data to export
 * @param {string} format - 'csv' or 'pdf'
 * @returns {Promise<Blob>}
 */
export async function exportData(type, data, format = 'pdf') {
  const res = await fetch(`${BASE_URL}/api/export/${type}?format=${format}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Failed to export ${type}`);
  return res.blob();
}

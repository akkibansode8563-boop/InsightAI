import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp, AGENTS } from '../context/AppContext.jsx';
import { streamChat } from '../services/api.js';
import { createSession, saveSession, loadSessions, deleteSession } from '../services/sessionStorage.js';

// Helper functions
function buildId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function timestamp() { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }

// Thinking Indicator
function ThinkingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '16px 20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', width: 'fit-content', border: '1px solid var(--glass-border-strong)' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="loading-dot"
          style={{ animationDelay: `${i * 0.16}s`, background: 'var(--primary)' }}
        />
      ))}
    </div>
  );
}

// ── Product Image Component ──────────────────────────────────────────
function ProductImageCard({ src, alt }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Fallback chain: original → /api/product-image proxy → category fallback
  const getCategoryFallback = (altText) => {
    const t = (altText || '').toLowerCase();
    if (t.includes('server') || t.includes('proliant') || t.includes('poweredge')) return '/showcase-server.png';
    if (t.includes('printer') || t.includes('laserjet') || t.includes('ecotank') || t.includes('pixma')) return '/showcase-printer.png';
    if (t.includes('switch') || t.includes('router') || t.includes('catalyst') || t.includes('networking')) return '/showcase-networking.png';
    if (t.includes('ssd') || t.includes('storage') || t.includes('hdd') || t.includes('nvme')) return '/showcase-storage.png';
    if (t.includes('desktop') || t.includes('workstation') || t.includes('elitedesk')) return '/showcase-desktop.png';
    return '/showcase-laptop.png';
  };

  const handleError = () => {
    if (retryCount === 0 && imgSrc && imgSrc.startsWith('https://')) {
      // Try fetching via our backend proxy endpoint (avoids CORS/hotlink issues)
      const model = encodeURIComponent(alt || '');
      setImgSrc(`/api/product-image?model=${model}&redirect=1`);
      setRetryCount(1);
    } else {
      // Use category fallback
      const fallback = getCategoryFallback(alt);
      setImgSrc(fallback);
      setError(true);
      setRetryCount(2);
    }
  };

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-[var(--glass-border-strong)] shadow-md bg-[var(--bg-elevated)]">
      {/* Image */}
      <div className="relative bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-surface)] flex items-center justify-center" style={{ minHeight: 200, maxHeight: 320 }}>
        {!loaded && (
          <div className="absolute inset-0 skeleton rounded-none" />
        )}
        <img
          src={imgSrc}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className="w-full object-contain transition-opacity duration-300"
          style={{
            maxHeight: 300,
            padding: '12px',
            opacity: loaded ? 1 : 0,
            background: 'transparent',
          }}
        />
      </div>
      {/* Caption */}
      <div className="px-4 py-2.5 border-t border-[var(--glass-border-strong)] bg-[var(--bg-surface)] flex items-center gap-2">
        <span className="text-lg">🖼️</span>
        <span className="text-sm font-semibold text-[var(--text-secondary)] truncate">{alt}</span>
        {!error && imgSrc.startsWith('https://') && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20">Official Image</span>
        )}
        {error && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-orange-500 bg-orange-50 dark:bg-orange-900/20">Category Preview</span>
        )}
      </div>
    </div>
  );
}

// Inline Markdown Parser
function parseInlineMarkdown(str) {
  if (!str) return '';
  const regex = /(\*\*.*?\*\*|`.*?`|!\[.*?\]\(.*?\))/g;
  const tokens = str.split(regex);
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={idx} style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return <code key={idx} style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85em', fontFamily: 'monospace', color: 'var(--primary)', border: '1px solid var(--glass-border-strong)' }}>{token.slice(1, -1)}</code>;
    }
    if (token.startsWith('![') && token.includes('](')) {
      const altMatch = token.match(/!\[(.*?)\]\((.*?)\)/);
      if (altMatch) {
        const [, alt, url] = altMatch;
        return <ProductImageCard key={idx} src={url} alt={alt} />;
      }
    }
    return token;
  });
}

// Markdown Parser Helper
function parseMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  
  let currentTable = null;
  let currentList = null;

  const flushTable = (key) => {
    if (currentTable) {
      elements.push(
        <div key={key} style={{ overflowX: 'auto', margin: '16px 0', border: '1px solid var(--glass-border-strong)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2.5px solid var(--glass-border-strong)', background: 'var(--bg-elevated)' }}>
                {currentTable.headers.map((h, i) => (
                  <th key={i} style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-secondary)' }}>{parseInlineMarkdown(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentTable.rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--glass-border-strong)', transition: 'background var(--transition-fast)' }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{parseInlineMarkdown(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = null;
    }
  };

  const flushList = (key) => {
    if (currentList) {
      elements.push(
        <ul key={key} style={{ margin: '12px 0', paddingLeft: '24px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {currentList.map((item, i) => (
            <li key={i} style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>{parseInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      currentList = null;
    }
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trim();
    const key = `block-${idx}`;

    // Table parsing
    if (line.startsWith('|')) {
      flushList(key);
      const cells = line.split('|').map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
      
      const isSeparator = cells.every(c => c.match(/^:?-+:?$/));
      if (isSeparator) {
        continue;
      }

      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    } else {
      flushTable(key);
    }

    // List parsing
    if (line.startsWith('* ') || line.startsWith('- ')) {
      const itemText = line.slice(2).trim();
      if (!currentList) {
        currentList = [itemText];
      } else {
        currentList.push(itemText);
      }
      continue;
    } else {
      flushList(key);
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<h4 key={key} className="font-heading" style={{ fontSize: '1.05em', fontWeight: '800', color: 'var(--text-secondary)', marginTop: 20, marginBottom: 8 }}>{parseInlineMarkdown(line.slice(4))}</h4>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h3 key={key} className="font-heading" style={{ fontSize: '1.18em', fontWeight: '800', color: 'var(--text-secondary)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid var(--glass-border-strong)', paddingBottom: 6 }}>{parseInlineMarkdown(line.slice(3))}</h3>);
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<h2 key={key} className="font-heading" style={{ fontSize: '1.35em', fontWeight: '900', color: 'var(--primary)', marginTop: 28, marginBottom: 16 }}>{parseInlineMarkdown(line.slice(2))}</h2>);
      continue;
    }

    // Horizontal Rule
    if (line === '---' || line === '***') {
      elements.push(<hr key={key} style={{ border: 'none', borderTop: '1px solid var(--glass-border-strong)', margin: '20px 0' }} />);
      continue;
    }

    // Normal text
    if (line === '') {
      elements.push(<div key={key} style={{ height: 8 }} />);
    } else {
      elements.push(<p key={key} style={{ margin: '8px 0', lineHeight: 1.6, color: 'var(--text-primary)' }}>{parseInlineMarkdown(line)}</p>);
    }
  }

  flushTable('table-final');
  flushList('list-final');

  return elements;
}

// Message Bubble
function MessageBubble({ msg, onCopy }) {
  const { t } = useApp();
  const isUser = msg.role === 'user';
  return (
    <div
      className="msg-anim"
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 12,
        alignItems: 'flex-start',
        padding: '8px 0',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: isUser
            ? 'linear-gradient(135deg, var(--primary), #ea580c)'
            : 'linear-gradient(135deg, #6366f1, #4f46e5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {isUser ? '👤' : msg.agentIcon || '🤖'}
      </div>

      {/* Bubble Content */}
      <div style={{ maxWidth: '75%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            background: isUser
              ? 'linear-gradient(135deg, var(--primary), #ea580c)'
              : 'var(--bg-surface)',
            color: isUser ? '#fff' : 'var(--text-primary)',
            padding: '12px 18px',
            borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
            fontSize: '0.88em',
            lineHeight: 1.6,
            boxShadow: 'var(--shadow-sm)',
            border: isUser ? 'none' : '1px solid var(--glass-border-strong)',
            whiteSpace: isUser ? 'pre-wrap' : 'normal',
            wordBreak: 'break-word',
          }}
        >
          {isUser ? msg.content : parseMarkdown(msg.content)}
        </div>

        {/* Copy & Meta Actions */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            marginTop: 2,
            justifyContent: isUser ? 'flex-end' : 'flex-start',
          }}
        >
          <span style={{ fontSize: '0.68em', color: 'var(--text-muted)', fontWeight: 500 }}>{msg.time}</span>
          {!isUser && (
            <button
              onClick={() => onCopy(msg.content)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.7em',
                color: 'var(--text-muted)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={e => e.target.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >
              📋 {t('chat.copy')}
            </button>
          )}
          {msg.confidence && (
            <span style={{ fontSize: '0.68em', color: 'var(--accent-market)', fontWeight: 700 }}>
              🎯 {Math.round(msg.confidence * 100)}% {t('chat.confidenceSuffix')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Agent Panel
function AgentPanel({ activeAgent, onSelect }) {
  const { t } = useApp();
  return (
    <div
      className="glass chat-sidebar"
      style={{
        width: 'var(--sidebar-width)',
        borderRight: '1px solid var(--glass-border-strong)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
        margin: '12px 0 12px 16px',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border-strong)', background: 'var(--bg-surface)' }}>
        <h3 className="font-heading" style={{ fontSize: '0.8em', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {t('chat.agent')}
        </h3>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }} className="custom-scrollbar">
        {AGENTS.map(agent => {
          const name = t(`agent.${agent.id}.name`) !== `agent.${agent.id}.name` ? t(`agent.${agent.id}.name`) : agent.name;
          const desc = t(`agent.${agent.id}.description`) !== `agent.${agent.id}.description` ? t(`agent.${agent.id}.description`) : agent.description;
          const isActive = activeAgent === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => onSelect(agent.id)}
              className="hover-scale"
              style={{
                width: '100%',
                textAlign: 'left',
                marginBottom: 6,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                border: isActive ? `1.5px solid ${agent.color}` : '1.5px solid transparent',
                background: isActive ? `${agent.color}14` : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'var(--transition-smooth)',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? agent.color : 'var(--bg-elevated)',
                  color: isActive ? '#fff' : 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  transition: 'var(--transition-fast)',
                }}
              >
                {agent.icon}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.82em', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {name}
                </div>
                <div className="truncate" style={{ fontSize: '0.7em', color: 'var(--text-muted)', marginTop: 2 }}>
                  {desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Chat Input
function ChatInput({ onSend, disabled, placeholder }) {
  const [text, setText] = useState('');
  const ref = useRef(null);
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);
  const { language } = useApp();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => {
        setRecording(true);
      };
      
      rec.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setText(prev => (prev ? prev + ' ' : '') + transcript);
          // auto-resize text area after inserting voice text
          setTimeout(() => {
            if (ref.current) {
              ref.current.style.height = 'auto';
              ref.current.style.height = Math.min(ref.current.scrollHeight, 120) + 'px';
            }
          }, 50);
        }
      };
      
      rec.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        setRecording(false);
      };
      
      rec.onend = () => {
        setRecording(false);
      };
      
      recognitionRef.current = rec;
    }
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    }
  }, [language]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (recording) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start speech recognition:', e.message);
      }
    }
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  return (
    <div
      style={{
        padding: '16px 24px 24px',
        background: 'transparent',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-end',
        maxWidth: 800,
        width: '100%',
        margin: '0 auto',
      }}
    >
      <textarea
        ref={ref}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        className="input-field"
        style={{
          flex: 1,
          resize: 'none',
          maxHeight: 120,
          overflowY: 'auto',
          lineHeight: 1.5,
          paddingTop: 12,
          paddingBottom: 12,
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          border: '1.5px solid var(--glass-border-strong)',
        }}
        onInput={e => {
          e.target.style.height = 'auto';
          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
        }}
      />
      {supported && (
        <button
          onClick={toggleRecording}
          disabled={disabled}
          className={`hover-scale ${recording ? 'animate-pulse' : ''}`}
          style={{
            width: 44,
            height: 44,
            padding: 0,
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: recording
              ? '#ef4444'
              : 'var(--bg-elevated)',
            color: recording ? '#fff' : 'var(--text-secondary)',
            border: '1.5px solid var(--glass-border-strong)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            boxShadow: recording ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none',
          }}
          title={recording ? 'Stop Recording' : 'Start Voice Input'}
        >
          {recording ? '🛑' : '🎙️'}
        </button>
      )}
      <button
        onClick={submit}
        disabled={disabled || !text.trim()}
        className="premium-btn hover-scale"
        style={{
          width: 44,
          height: 44,
          padding: 0,
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: disabled || !text.trim()
            ? 'var(--bg-elevated)'
            : 'linear-gradient(135deg, var(--primary), #ea580c)',
          color: disabled || !text.trim() ? 'var(--text-muted)' : '#fff',
          boxShadow: disabled || !text.trim() ? 'none' : 'var(--shadow-primary)',
        }}
      >
        ➤
      </button>
    </div>
  );
}

// Main AIChat Page
export default function AIChat() {
  const { activeAgent, setActiveAgent, language, t } = useApp();
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef(null);

  const agent = AGENTS.find(a => a.id === activeAgent) || AGENTS[0];

  useEffect(() => {
    loadSessions().then(setSessions).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const getAgentName = useCallback((a) => {
    const key = `agent.${a.id}.name`;
    const trans = t(key);
    return trans !== key ? trans : a.name;
  }, [t]);

  const getAgentDesc = useCallback((a) => {
    const key = `agent.${a.id}.description`;
    const trans = t(key);
    return trans !== key ? trans : a.description;
  }, [t]);

  const startNewChat = useCallback(() => {
    const session = createSession(agent.id, agent.name);
    setCurrentSession(session);
    const name = getAgentName(agent);
    const desc = getAgentDesc(agent);
    const greeting = t('chat.greeting').replace('{name}', name).replace('{description}', desc);
    setMessages([{
      id: buildId(),
      role: 'assistant',
      content: greeting,
      agentIcon: agent.icon,
      time: timestamp(),
    }]);
    setShowHistory(false);
  }, [agent, language, t, getAgentName, getAgentDesc]);

  useEffect(() => {
    startNewChat();
  }, [activeAgent, language, startNewChat]);

  const handleSend = async (text) => {
    if (streaming) return;

    const userMsg = { id: buildId(), role: 'user', content: text, time: timestamp() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setStreaming(true);

    const assistantId = buildId();
    let accumulated = '';

    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      agentIcon: agent.icon,
      time: timestamp(),
      isStreaming: true,
    }]);

    const apiMessages = updatedMessages.map(m => ({ role: m.role, content: m.content }));

    await streamChat(
      { messages: apiMessages, agent: activeAgent, language },
      (chunk) => {
        accumulated += chunk;
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: accumulated } : m
        ));
      },
      (metadata) => {
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, isStreaming: false, confidence: metadata?.confidence }
            : m
        ));
        setStreaming(false);

        if (currentSession) {
          const updated = {
            ...currentSession,
            messages: [...updatedMessages, { role: 'assistant', content: accumulated }],
            preview: text.slice(0, 60),
          };
          setCurrentSession(updated);
          saveSession(updated).then(() => loadSessions().then(setSessions));
        }
      },
      (err) => {
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: `⚠️ Error: ${err}. Please try again.`, isStreaming: false }
            : m
        ));
        setStreaming(false);
      }
    );
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleDeleteSession = async (id) => {
    await deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const handleLoadSession = (session) => {
    setCurrentSession(session);
    setMessages(session.messages.map((m, i) => ({
      id: i.toString(),
      role: m.role,
      content: m.content,
      agentIcon: agent.icon,
      time: '',
    })));
    setShowHistory(false);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--navbar-height) - 12px)', overflow: 'hidden', position: 'relative' }}>
      
      {/* Aurora Ambient Mesh */}
      <div className="aurora-mesh" />

      {/* Agent Selection Panel */}
      <AgentPanel activeAgent={activeAgent} onSelect={setActiveAgent} />

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, margin: '12px 16px 12px 12px', background: 'transparent', position: 'relative', zIndex: 10 }}>
        
        {/* Chat Header */}
        <div
          className="glass-strong"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--glass-border-strong)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexShrink: 0,
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: `${agent.color}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              border: `1.5px solid ${agent.color}40`,
            }}
          >
            {agent.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-heading" style={{ fontWeight: 800, fontSize: '0.96em', color: 'var(--text-primary)' }}>
              {getAgentName(agent)}
            </div>
            <div className="truncate" style={{ fontSize: '0.74em', color: 'var(--text-muted)' }}>{getAgentDesc(agent)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowHistory(v => !v)}
              className="btn-ghost hover-scale"
              style={{ fontSize: '0.78em' }}
              title={t('chat.history')}
            >
              📋 {t('chat.history')}
            </button>
            <button
              onClick={startNewChat}
              className="premium-btn hover-scale"
              style={{
                padding: '8px 16px',
                fontSize: '0.78em',
                background: `linear-gradient(135deg, ${agent.color}, ${agent.color}cc)`,
                boxShadow: `0 4px 12px ${agent.color}25`,
              }}
            >
              + {t('chat.newChat')}
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div
          className="custom-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            background: 'var(--bg-elevated)',
            borderLeft: '1px solid var(--glass-border-strong)',
            borderRight: '1px solid var(--glass-border-strong)',
          }}
        >
          <div style={{ maxWidth: 800, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map(msg => (
              msg.isStreaming && !msg.content
                ? <ThinkingDots key={msg.id} />
                : <MessageBubble key={msg.id} msg={msg} onCopy={handleCopy} />
            ))}
            {streaming && messages[messages.length - 1]?.content === '' && <ThinkingDots />}
          </div>
          <div ref={bottomRef} />
        </div>

        {/* Floating Input Area */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--glass-border-strong)',
            borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
            borderLeft: '1px solid var(--glass-border-strong)',
            borderRight: '1px solid var(--glass-border-strong)',
            borderBottom: '1px solid var(--glass-border-strong)',
          }}
        >
          <ChatInput
            onSend={handleSend}
            disabled={streaming}
            placeholder={t('chat.placeholder')}
          />
        </div>
      </div>

      {/* Sessions History Drawer */}
      {showHistory && (
        <>
          <div className="overlay" onClick={() => setShowHistory(false)} style={{ zIndex: 300 }} />
          <div
            className="glass-strong"
            style={{
              position: 'absolute',
              right: 16,
              top: 12,
              bottom: 12,
              width: 320,
              zIndex: 350,
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
              <h3 className="font-heading" style={{ fontWeight: 800, fontSize: '0.9em' }}>
                {t('chat.history')}
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1em', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {sessions.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82em' }}>
                  No saved conversations yet
                </div>
              ) : sessions.map(s => (
                <div
                  key={s.id}
                  className="card-premium hover-scale"
                  style={{ marginBottom: 8, padding: '12px 14px', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                  onClick={() => handleLoadSession(s)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="truncate" style={{ fontSize: '0.82em', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {s.preview || 'Conversation'}
                      </div>
                      <div style={{ fontSize: '0.7em', color: 'var(--text-muted)', marginTop: 4 }}>
                        {s.agentName} · {new Date(s.updatedAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteSession(s.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9em', transition: 'var(--transition-fast)' }}
                      onMouseEnter={e => e.target.style.color = '#ef4444'}
                      onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                      title="Delete"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

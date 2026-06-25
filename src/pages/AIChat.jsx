import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp, AGENTS } from '../context/AppContext.jsx';
import { streamChat } from '../services/api.js';
import { createSession, saveSession, loadSessions, deleteSession } from '../services/sessionStorage.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function timestamp() { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }

// ── Thinking Indicator ────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '12px 16px' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="loading-dot"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, onCopy }) {
  const isUser = msg.role === 'user';
  return (
    <div
      className="msg-anim"
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 10,
        alignItems: 'flex-start',
        padding: '4px 0',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: isUser
            ? 'linear-gradient(135deg, #f97316, #ea580c)'
            : 'linear-gradient(135deg, #6366f1, #4f46e5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}
      >
        {isUser ? '👤' : msg.agentIcon || '🤖'}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: '72%', minWidth: 0 }}>
        <div
          style={{
            background: isUser
              ? 'linear-gradient(135deg, #f97316, #ea580c)'
              : 'var(--bg-surface)',
            color: isUser ? '#fff' : 'var(--text-primary)',
            padding: '10px 14px',
            borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
            fontSize: '0.875em',
            lineHeight: 1.6,
            boxShadow: 'var(--shadow-sm)',
            border: isUser ? 'none' : '1px solid var(--glass-border-strong)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {msg.content}
        </div>

        {/* Meta row */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginTop: 4,
            justifyContent: isUser ? 'flex-end' : 'flex-start',
          }}
        >
          <span style={{ fontSize: '0.7em', color: 'var(--text-muted)' }}>{msg.time}</span>
          {!isUser && (
            <button
              onClick={() => onCopy(msg.content)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.7em',
                color: 'var(--text-muted)',
                padding: '1px 4px',
                borderRadius: 4,
                transition: 'color 0.15s',
              }}
              title="Copy"
            >
              📋
            </button>
          )}
          {msg.confidence && (
            <span className="badge badge-success" style={{ fontSize: '0.62em' }}>
              {msg.confidence}% confident
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Agent Selector Panel ──────────────────────────────────────────────────────

function AgentPanel({ activeAgent, onSelect }) {
  return (
    <div
      style={{
        width: 'var(--sidebar-width)',
        borderRight: '1px solid var(--glass-border-strong)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '14px 12px 8px', borderBottom: '1px solid var(--glass-border-strong)' }}>
        <h3 className="font-heading" style={{ fontSize: '0.78em', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          AI Agents
        </h3>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }} className="custom-scrollbar">
        {AGENTS.map(agent => (
          <button
            key={agent.id}
            onClick={() => onSelect(agent.id)}
            className={`agent-card${activeAgent === agent.id ? ' active' : ''}`}
            style={{
              width: '100%',
              textAlign: 'left',
              marginBottom: 4,
              borderColor: activeAgent === agent.id ? agent.color : 'transparent',
              background: activeAgent === agent.id ? `${agent.color}12` : 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2em' }}>{agent.icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.8em', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {agent.name}
                </div>
                <div className="truncate" style={{ fontSize: '0.67em', color: 'var(--text-muted)', marginTop: 1 }}>
                  {agent.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Chat Input Bar ────────────────────────────────────────────────────────────

function ChatInput({ onSend, disabled, placeholder }) {
  const [text, setText] = useState('');
  const ref = useRef(null);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    ref.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--glass-border-strong)',
        background: 'var(--bg-surface)',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
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
          paddingTop: 10,
          paddingBottom: 10,
        }}
        onInput={e => {
          e.target.style.height = 'auto';
          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
        }}
      />
      <button
        onClick={submit}
        disabled={disabled || !text.trim()}
        className="premium-btn"
        style={{
          padding: '10px 18px',
          fontSize: '0.85em',
          background: disabled || !text.trim()
            ? 'var(--bg-elevated)'
            : 'linear-gradient(135deg, #f97316, #ea580c)',
          color: disabled || !text.trim() ? 'var(--text-muted)' : '#fff',
          flexShrink: 0,
          height: 42,
        }}
      >
        ➤
      </button>
    </div>
  );
}

// ── Main AIChat Page ──────────────────────────────────────────────────────────

export default function AIChat() {
  const { activeAgent, setActiveAgent, language, t } = useApp();
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef(null);

  const agent = AGENTS.find(a => a.id === activeAgent) || AGENTS[0];

  // Load sessions on mount
  useEffect(() => {
    loadSessions().then(setSessions).catch(() => {});
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  // Start a new chat session
  const startNewChat = useCallback(() => {
    const session = createSession(agent.id, agent.name);
    setCurrentSession(session);
    setMessages([{
      id: buildId(),
      role: 'assistant',
      content: `Hi! I'm your ${agent.name} agent. ${agent.description}. How can I help you today?`,
      agentIcon: agent.icon,
      time: timestamp(),
    }]);
    setShowHistory(false);
  }, [agent]);

  // Initialize chat on agent change
  useEffect(() => {
    startNewChat();
  }, [activeAgent]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async (text) => {
    if (streaming) return;

    const userMsg = { id: buildId(), role: 'user', content: text, time: timestamp() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setStreaming(true);

    // Prepare streaming placeholder
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

        // Persist session
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
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Agent Panel */}
      <AgentPanel activeAgent={activeAgent} onSelect={setActiveAgent} />

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Chat Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--glass-border-strong)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `${agent.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              border: `1.5px solid ${agent.color}40`,
            }}
          >
            {agent.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-heading" style={{ fontWeight: 800, fontSize: '0.9em', color: 'var(--text-primary)' }}>
              {agent.name}
            </div>
            <div style={{ fontSize: '0.72em', color: 'var(--text-muted)' }}>{agent.description}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setShowHistory(v => !v)}
              className="btn-ghost"
              title={t('chat.history')}
            >
              📋 {t('chat.history')}
            </button>
            <button
              onClick={startNewChat}
              className="premium-btn"
              style={{
                padding: '7px 14px',
                fontSize: '0.78em',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
              }}
            >
              + {t('chat.newChat')}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          className="custom-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            background: 'var(--bg-base)',
          }}
        >
          {messages.map(msg => (
            msg.isStreaming && !msg.content
              ? <ThinkingDots key={msg.id} />
              : <MessageBubble key={msg.id} msg={msg} onCopy={handleCopy} />
          ))}
          {streaming && messages[messages.length - 1]?.content === '' && <ThinkingDots />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          disabled={streaming}
          placeholder={t('chat.placeholder')}
        />
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <>
          <div className="overlay" onClick={() => setShowHistory(false)} style={{ zIndex: 30 }} />
          <div
            className="glass-strong"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 300,
              zIndex: 35,
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideIn 0.25s ease',
              borderLeft: '1px solid var(--glass-border-strong)',
            }}
          >
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--glass-border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 className="font-heading" style={{ fontWeight: 800, fontSize: '0.9em' }}>
                {t('chat.history')}
              </h3>
              <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em' }}>✕</button>
            </div>
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
              {sessions.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82em' }}>
                  No saved conversations yet
                </div>
              ) : sessions.map(s => (
                <div
                  key={s.id}
                  className="card"
                  style={{ marginBottom: 6, padding: '10px 12px', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                  onClick={() => handleLoadSession(s)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="truncate" style={{ fontSize: '0.8em', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {s.preview || 'Conversation'}
                      </div>
                      <div style={{ fontSize: '0.68em', color: 'var(--text-muted)', marginTop: 2 }}>
                        {s.agentName} · {new Date(s.updatedAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteSession(s.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85em', flexShrink: 0 }}
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

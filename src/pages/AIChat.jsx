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
            padding: '12px 16px',
            borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
            fontSize: '0.88em',
            lineHeight: 1.6,
            boxShadow: 'var(--shadow-sm)',
            border: isUser ? 'none' : '1px solid var(--glass-border-strong)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {msg.content}
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
      className="glass"
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

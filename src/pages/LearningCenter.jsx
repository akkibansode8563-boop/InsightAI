import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';

const COLOR = '#6366f1'; // Indigo accent for Learning Center

export default function LearningCenter() {
  const { language, t } = useApp();
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeQuizIndex, setActiveQuizIndex] = useState(-1); // -1 means viewing article
  const [userAnswers, setUserAnswers] = useState({}); // { questionIndex: chosenOptionIndex }
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [certifications, setCertifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('insightai_certifications') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const loadLearning = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/data/learning.json');
        if (res.ok) {
          const data = await res.json();
          setModules(data);
        }
      } catch (err) {
        console.error("Failed to load learning modules:", err);
      } finally {
        setLoading(false);
      }
    };
    loadLearning();
  }, []);

  const handleStartModule = (mod) => {
    setSelectedModule(mod);
    setActiveQuizIndex(-1);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const handleOptionSelect = (qIdx, optIdx) => {
    if (quizSubmitted) return;
    setUserAnswers({ ...userAnswers, [qIdx]: optIdx });
  };

  const handleSubmitQuiz = () => {
    let correctCount = 0;
    selectedModule.quiz.forEach((q, idx) => {
      if (userAnswers[idx] === q.answerIndex) {
        correctCount++;
      }
    });

    const percent = (correctCount / selectedModule.quiz.length) * 100;
    setQuizScore(percent);
    setQuizSubmitted(true);

    if (percent >= 80) {
      const updated = { ...certifications, [selectedModule.id]: { score: percent, date: new Date().toLocaleDateString('en-IN') } };
      setCertifications(updated);
      localStorage.setItem('insightai_certifications', JSON.stringify(updated));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          padding: '24px 32px',
          background: `linear-gradient(135deg, ${COLOR}12 0%, transparent 60%)`,
          borderBottom: '1px solid var(--glass-border-strong)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: `${COLOR}20`,
              border: `2px solid ${COLOR}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24
            }}
          >
            🎓
          </div>
          <div>
            <h1 className="font-heading" style={{ fontSize: '1.4em', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
              Learning & Certification
            </h1>
            <p style={{ fontSize: '0.82em', color: 'var(--text-secondary)', marginTop: 4 }}>
              Learn IT Hardware configurations, test your knowledge, and earn certs
            </p>
          </div>
        </div>

        {/* Cert Stats Dashboard */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            background: 'var(--bg-surface)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--glass-border-strong)',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '0.78em', fontWeight: 700, color: 'var(--text-secondary)' }}>Certifications Earned:</span>
          <span
            style={{
              fontSize: '0.9em',
              fontWeight: 900,
              color: COLOR,
              background: `${COLOR}15`,
              padding: '2px 8px',
              borderRadius: 4
            }}
          >
            🏆 {Object.keys(certifications).length} / {modules.length || '—'}
          </span>
        </div>
      </div>

      {/* Main Panel split */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Module Sidebar */}
        <div
          style={{
            width: 320,
            borderRight: '1px solid var(--glass-border-strong)',
            background: 'rgba(0, 0, 0, 0.01)',
            overflowY: 'auto',
            padding: '16px 20px',
            flexShrink: 0
          }}
          className="custom-scrollbar"
        >
          <h3 className="font-heading" style={{ fontSize: '0.88em', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
            Knowledge Modules
          </h3>
          {loading ? (
            <div style={{ fontSize: '0.82em', color: 'var(--text-muted)' }}>Loading...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {modules.map(mod => {
                const completed = certifications[mod.id];
                const active = selectedModule?.id === mod.id;
                return (
                  <div
                    key={mod.id}
                    className="card"
                    onClick={() => handleStartModule(mod)}
                    style={{
                      padding: 14,
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-md)',
                      border: active ? `1px solid ${COLOR}` : '1px solid var(--glass-border-strong)',
                      background: active ? `${COLOR}05` : 'var(--bg-surface)',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85em', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {mod.title}
                      </span>
                      {completed && <span title="Passed" style={{ fontSize: '1em' }}>✅</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                      {mod.keywords?.slice(0, 3).map((kw, i) => (
                        <span key={i} style={{ fontSize: '0.62em', background: 'var(--bg-elevated)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 4 }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Center Panel (Article Reader / Quiz) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px', background: 'var(--bg-surface)' }} className="custom-scrollbar">
          {selectedModule ? (
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              {/* Module Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid var(--glass-border-strong)', paddingBottom: 16 }}>
                <div>
                  <h2 className="font-heading" style={{ fontSize: '1.4em', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedModule.title}
                  </h2>
                  <span style={{ fontSize: '0.78em', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Module Topic: {selectedModule.topic}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setActiveQuizIndex(-1)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--glass-border-strong)',
                      background: activeQuizIndex === -1 ? COLOR : 'transparent',
                      color: activeQuizIndex === -1 ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.8em',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Read Lesson
                  </button>
                  <button
                    onClick={() => setActiveQuizIndex(0)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--glass-border-strong)',
                      background: activeQuizIndex >= 0 ? COLOR : 'transparent',
                      color: activeQuizIndex >= 0 ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.8em',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Take Quiz
                  </button>
                </div>
              </div>

              {/* View Article */}
              {activeQuizIndex === -1 ? (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div
                    style={{
                      fontSize: '0.98em',
                      color: 'var(--text-primary)',
                      lineHeight: 1.7,
                      textAlign: 'justify',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {selectedModule.content}
                  </div>

                  <div
                    style={{
                      marginTop: 32,
                      padding: 24,
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--glass-border-strong)',
                      textAlign: 'center'
                    }}
                  >
                    <h3 className="font-heading" style={{ fontSize: '1.05em', fontWeight: 800, margin: '0 0 10px' }}>
                      Ready to test your knowledge?
                    </h3>
                    <p style={{ fontSize: '0.8em', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                      Complete the 5-question quiz. Score 80% (4 correct answers) to earn your certification badge.
                    </p>
                    <button
                      onClick={() => setActiveQuizIndex(0)}
                      style={{
                        padding: '10px 24px',
                        background: COLOR,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.88em',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      Start Interactive Quiz ✍️
                    </button>
                  </div>
                </div>
              ) : (
                /* View Quiz */
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  {selectedModule.quiz.map((q, idx) => (
                    <div
                      key={q.id}
                      className="card"
                      style={{
                        padding: 20,
                        marginBottom: 16,
                        border: '1px solid var(--glass-border-strong)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <h4 style={{ fontSize: '0.92em', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 14px' }}>
                        {idx + 1}. {q.question}
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {q.options.map((opt, oIdx) => {
                          const chosen = userAnswers[idx] === oIdx;
                          const correct = q.answerIndex === oIdx;
                          let optBg = 'transparent';
                          let optBorder = '1px solid var(--glass-border-strong)';
                          if (chosen) {
                            optBg = quizSubmitted ? (correct ? 'rgba(5, 150, 105, 0.08)' : 'rgba(239, 68, 68, 0.08)') : `${COLOR}10`;
                            optBorder = quizSubmitted ? (correct ? '1px solid #059669' : '1px solid #ef4444') : `1px solid ${COLOR}`;
                          } else if (quizSubmitted && correct) {
                            optBg = 'rgba(5, 150, 105, 0.08)';
                            optBorder = '1px solid #059669';
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleOptionSelect(idx, oIdx)}
                              disabled={quizSubmitted}
                              style={{
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-md)',
                                background: optBg,
                                border: optBorder,
                                color: 'var(--text-primary)',
                                textAlign: 'left',
                                cursor: quizSubmitted ? 'default' : 'pointer',
                                fontSize: '0.8em',
                                fontWeight: chosen ? 700 : 500,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && correct && <span style={{ color: '#059669', fontWeight: 800 }}>✓</span>}
                              {quizSubmitted && chosen && !correct && <span style={{ color: '#ef4444', fontWeight: 800 }}>✗</span>}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {quizSubmitted && (
                        <div style={{ marginTop: 12, padding: 10, background: 'var(--bg-elevated)', borderRadius: 4, fontSize: '0.78em', color: 'var(--text-secondary)' }}>
                          💡 <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Submission Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingBottom: 48 }}>
                    {!quizSubmitted ? (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(userAnswers).length < selectedModule.quiz.length}
                        style={{
                          padding: '12px 24px',
                          background: COLOR,
                          color: '#fff',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: '0.88em',
                          opacity: Object.keys(userAnswers).length < selectedModule.quiz.length ? 0.5 : 1
                        }}
                      >
                        Submit Answers
                      </button>
                    ) : (
                      <div
                        style={{
                          padding: '14px 20px',
                          borderRadius: 'var(--radius-lg)',
                          background: quizScore >= 80 ? 'rgba(5, 150, 105, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          border: quizScore >= 80 ? '1px solid #059669' : '1px solid #ef4444',
                          width: '100%',
                          textAlign: 'center'
                        }}
                      >
                        <h3 className="font-heading" style={{ fontSize: '1.1em', fontWeight: 900, color: quizScore >= 80 ? '#059669' : '#ef4444', margin: '0 0 6px' }}>
                          {quizScore >= 80 ? '🏆 Certification Earned!' : '😢 Try Again'}
                        </h3>
                        <p style={{ fontSize: '0.85em', color: 'var(--text-secondary)', margin: '0 0 10px' }}>
                          You scored <strong>{quizScore}%</strong> ({selectedModule.quiz.filter((q, i) => userAnswers[i] === q.answerIndex).length} / 5 correct answers).
                        </p>
                        {quizScore < 80 && (
                          <button
                            onClick={() => {
                              setUserAnswers({});
                              setQuizSubmitted(false);
                              setQuizScore(0);
                            }}
                            style={{
                              padding: '8px 16px',
                              background: 'var(--text-primary)',
                              color: 'var(--bg-surface)',
                              border: 'none',
                              borderRadius: 'var(--radius-md)',
                              fontSize: '0.78em',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Retake Quiz
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '3.5em', marginBottom: 12 }}>📚</span>
              <h3 className="font-heading" style={{ fontSize: '1.2em', fontWeight: 800, color: 'var(--text-secondary)' }}>
                Select a Module to Start Learning
              </h3>
              <p style={{ fontSize: '0.8em', maxWidth: 360, marginTop: 4 }}>
                Choose a hardware or network category from the left pane to view tutorials, test your skills, and earn official certifications.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

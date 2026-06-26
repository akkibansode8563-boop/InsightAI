import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useToast } from '../components/ui/Toast.jsx';

const COLOR = '#6366f1'; // Indigo accent for Learning Center

export default function LearningCenter() {
  const { language, t, addXp } = useApp();
  const { showToast } = useToast();
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
        const res = await fetch(`/api/learn?lang=${language}`);
        if (res.ok) {
          const data = await res.json();
          setModules(data);
        } else {
          const fallbackRes = await fetch('/api/data/learning.json');
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            const localized = data.map(m => ({
              ...m,
              title: m[`title_${language}`] || m.title,
              content: m[`content_${language}`] || m.content,
              quiz: m.quiz?.map(q => ({
                ...q,
                question: q[`question_${language}`] || q.question,
                options: q[`options_${language}`] || q.options,
                explanation: q[`explanation_${language}`] || q.explanation
              }))
            }));
            setModules(localized);
          }
        }
      } catch (err) {
        console.error("Failed to load learning modules:", err);
      } finally {
        setLoading(false);
      }
    };
    loadLearning();
  }, [language]);

  useEffect(() => {
    if (selectedModule) {
      const updated = modules.find(m => m.id === selectedModule.id);
      if (updated) setSelectedModule(updated);
    }
  }, [modules]);

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
      
      const xpResult = addXp(100);
      if (xpResult?.leveledUp) {
        showToast(`🎉 Level Up! You reached Level ${xpResult.newLevel}!`, 'success');
      } else {
        showToast('🎯 Earned 100 XP for passing the quiz!', 'success');
      }
    } else {
      showToast('⚠️ Score under 80%. Try again to earn your certificate and XP!', 'warning');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <div className="aurora-mesh" />

      {/* Header */}
      <div
        className="p-6 md:px-10 md:py-8 border-b border-[var(--glass-border-strong)] flex flex-col md:flex-row md:items-center justify-between gap-4 z-10"
        style={{
          background: `linear-gradient(135deg, ${COLOR}12 0%, transparent 60%)`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: `${COLOR}18`,
              border: `2px solid ${COLOR}35`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            🎓
          </div>
          <div>
            <h1 className="font-heading" style={{ fontSize: '1.5em', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {t('module.learn.title')}
            </h1>
            <p style={{ fontSize: '0.85em', color: 'var(--text-secondary)', marginTop: 6 }}>
              {t('module.learn.desc')}
            </p>
          </div>
        </div>

        {/* Certification Badge Dashboard */}
        <div
          className="glass-strong"
          style={{
            display: 'flex',
            gap: 14,
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            alignItems: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span style={{ fontSize: '0.8em', fontWeight: 700, color: 'var(--text-secondary)' }}>{t('learn.certificationsEarned')}</span>
          <span
            style={{
              fontSize: '0.88em',
              fontWeight: 900,
              color: COLOR,
              background: `${COLOR}15`,
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${COLOR}30`,
            }}
          >
            🏆 {Object.keys(certifications).length} / {modules.length || '—'}
          </span>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden z-10">
        
        {/* Module Sidebar */}
        <div
          className={`w-full md:w-[320px] md:border-r border-[var(--glass-border-strong)] bg-transparent overflow-y-auto p-6 flex-shrink-0 ${selectedModule ? 'hidden md:block' : 'block'}`}
        >
          <h3 className="font-heading" style={{ fontSize: '0.82em', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            {t('learn.knowledgeModules')}
          </h3>
          {loading ? (
            <div style={{ fontSize: '0.82em', color: 'var(--text-muted)' }}>{t('common.loading')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {modules.map(mod => {
                const completed = certifications[mod.id];
                const active = selectedModule?.id === mod.id;
                return (
                  <div
                    key={mod.id}
                    className="card-premium hover-scale"
                    onClick={() => handleStartModule(mod)}
                    style={{
                      padding: 18,
                      cursor: 'pointer',
                      border: active ? `2px solid ${COLOR}` : '1.5px solid var(--glass-border-strong)',
                      background: active ? `${COLOR}08` : 'var(--bg-surface)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '0.88em', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {mod.title}
                      </span>
                      {completed && <span title="Passed" style={{ fontSize: '1.2em' }}>🏆</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                      {mod.keywords?.slice(0, 3).map((kw, i) => (
                        <span key={i} style={{ fontSize: '0.66em', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', padding: '3px 8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--glass-border-strong)' }}>
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

        {/* Center Panel (Reader / Quiz) */}
        <div className={`flex-1 overflow-y-auto p-6 md:p-10 md:py-8 bg-[var(--bg-surface)] ${selectedModule ? 'block' : 'hidden md:block'}`}>
          {selectedModule ? (
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              {/* Back to modules button for mobile */}
              <button
                onClick={() => setSelectedModule(null)}
                className="flex md:hidden items-center gap-2 text-sm font-semibold mb-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                ← {t('learn.knowledgeModules') || 'Back to Modules'}
              </button>
              
              {/* Module Sub-Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, borderBottom: '1px solid var(--glass-border-strong)', paddingBottom: 20 }}>
                <div>
                  <h2 className="font-heading" style={{ fontSize: '1.45em', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedModule.title}
                  </h2>
                  <span style={{ fontSize: '0.82em', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.02em', marginTop: 4, display: 'inline-block' }}>
                    {t('learn.topic')} {selectedModule.topic}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setActiveQuizIndex(-1)}
                    className="hover-scale"
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--glass-border-strong)',
                      background: activeQuizIndex === -1 ? COLOR : 'transparent',
                      color: activeQuizIndex === -1 ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.8em',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: activeQuizIndex === -1 ? `0 4px 12px ${COLOR}25` : 'none',
                    }}
                  >
                    {t('learn.readLesson')}
                  </button>
                  <button
                    onClick={() => setActiveQuizIndex(0)}
                    className="hover-scale"
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--glass-border-strong)',
                      background: activeQuizIndex >= 0 ? COLOR : 'transparent',
                      color: activeQuizIndex >= 0 ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.8em',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: activeQuizIndex >= 0 ? `0 4px 12px ${COLOR}25` : 'none',
                    }}
                  >
                    {t('learn.takeQuiz')}
                  </button>
                </div>
              </div>

              {/* View Article */}
              {activeQuizIndex === -1 ? (
                <div style={{ animation: 'fadeUp 0.3s ease-out' }}>
                  <div
                    style={{
                      fontSize: '0.96em',
                      color: 'var(--text-primary)',
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selectedModule.content}
                  </div>

                  <div
                    className="glass-strong"
                    style={{
                      marginTop: 36,
                      padding: 32,
                      borderRadius: 'var(--radius-lg)',
                      textAlign: 'center',
                    }}
                  >
                    <h3 className="font-heading" style={{ fontSize: '1.1em', fontWeight: 800, marginBottom: 8 }}>
                      {t('learn.readyText')}
                    </h3>
                    <p style={{ fontSize: '0.84em', color: 'var(--text-secondary)', marginBottom: 20, maxWidth: 380, margin: '0 auto 20px' }}>
                      {t('learn.readyDesc')}
                    </p>
                    <button
                      onClick={() => setActiveQuizIndex(0)}
                      className="premium-btn hover-scale"
                      style={{
                        padding: '12px 28px',
                        background: COLOR,
                        boxShadow: `0 4px 12px ${COLOR}25`,
                      }}
                    >
                      {t('learn.startQuiz')}
                    </button>
                  </div>
                </div>
              ) : (
                /* View Quiz */
                <div style={{ animation: 'fadeUp 0.3s ease-out' }}>
                  {selectedModule.quiz.map((q, idx) => (
                    <div
                      key={q.id}
                      className="glass-strong"
                      style={{
                        padding: 24,
                        marginBottom: 20,
                        borderRadius: 'var(--radius-lg)',
                      }}
                    >
                      <h4 style={{ fontSize: '0.94em', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
                        {idx + 1}. {q.question}
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {q.options.map((opt, oIdx) => {
                          const chosen = userAnswers[idx] === oIdx;
                          const correct = q.answerIndex === oIdx;
                          let optBg = 'transparent';
                          let optBorder = '1.5px solid var(--glass-border-strong)';
                          if (chosen) {
                            optBg = quizSubmitted ? (correct ? 'rgba(5, 150, 105, 0.08)' : 'rgba(239, 68, 68, 0.08)') : `${COLOR}12`;
                            optBorder = quizSubmitted ? (correct ? '1.5px solid #059669' : '1.5px solid #ef4444') : `1.5px solid ${COLOR}`;
                          } else if (quizSubmitted && correct) {
                            optBg = 'rgba(5, 150, 105, 0.08)';
                            optBorder = '1.5px solid #059669';
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleOptionSelect(idx, oIdx)}
                              disabled={quizSubmitted}
                              className="hover-scale"
                              style={{
                                padding: '12px 16px',
                                borderRadius: 'var(--radius-md)',
                                background: optBg,
                                border: optBorder,
                                color: 'var(--text-primary)',
                                textAlign: 'left',
                                cursor: quizSubmitted ? 'default' : 'pointer',
                                fontSize: '0.84em',
                                fontWeight: chosen ? 700 : 500,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'var(--transition-fast)',
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
                        <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border-strong)', fontSize: '0.8em', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          💡 <strong>{t('learn.explanation')}</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Submission Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingBottom: 48 }}>
                    {!quizSubmitted ? (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(userAnswers).length < selectedModule.quiz.length}
                        className="premium-btn hover-scale"
                        style={{
                          padding: '14px 28px',
                          background: COLOR,
                          boxShadow: `0 4px 12px ${COLOR}25`,
                          opacity: Object.keys(userAnswers).length < selectedModule.quiz.length ? 0.5 : 1,
                        }}
                      >
                        {t('learn.submitAnswers')}
                      </button>
                    ) : (
                      <div
                        className="glass-strong"
                        style={{
                          padding: 24,
                          borderRadius: 'var(--radius-lg)',
                          background: quizScore >= 80 ? 'rgba(5, 150, 105, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                          border: quizScore >= 80 ? '2px solid #059669' : '2px solid #ef4444',
                          width: '100%',
                          textAlign: 'center',
                          boxShadow: 'var(--shadow-md)',
                        }}
                      >
                        <h3 className="font-heading" style={{ fontSize: '1.2em', fontWeight: 900, color: quizScore >= 80 ? '#059669' : '#ef4444', marginBottom: 8 }}>
                          {quizScore >= 80 ? t('learn.certEarned') : t('learn.tryAgain')}
                        </h3>
                        <p style={{ fontSize: '0.88em', color: 'var(--text-secondary)', marginBottom: 16 }}>
                          {t('learn.scoreText').replace('{score}', quizScore).replace('{correct}', selectedModule.quiz.filter((q, i) => userAnswers[i] === q.answerIndex).length).replace('{total}', 5)}
                        </p>
                        {quizScore < 80 && (
                          <button
                            onClick={() => {
                              setUserAnswers({});
                              setQuizSubmitted(false);
                              setQuizScore(0);
                            }}
                            className="premium-btn hover-scale"
                            style={{
                              padding: '10px 20px',
                              background: 'var(--text-primary)',
                              boxShadow: 'none',
                            }}
                          >
                            {t('learn.retakeQuiz')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: 'var(--text-muted)', minHeight: 300 }}>
              <span style={{ fontSize: '4.2em', marginBottom: 16 }}>📚</span>
              <h3 className="font-heading" style={{ fontSize: '1.25em', fontWeight: 800, color: 'var(--text-secondary)' }}>
                {t('learn.selectModule')}
              </h3>
              <p style={{ fontSize: '0.84em', maxWidth: 380, marginTop: 6, lineHeight: 1.6 }}>
                {t('learn.selectModuleDesc')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

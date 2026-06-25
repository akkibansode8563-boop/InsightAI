import { createContext, useContext, useState, useEffect } from 'react';
import { t } from '../services/language.js';

const AppContext = createContext(null);

export const MODULES = [
  { id: 'chat',       label: 'AI Chat',      icon: '🤖', accent: 'var(--accent-chat)' },
  { id: 'sales',      label: 'Sales Coach',  icon: '🎯', accent: 'var(--accent-sales)' },
  { id: 'dealer',     label: 'Dealer',       icon: '🏪', accent: 'var(--accent-dealer)' },
  { id: 'enterprise', label: 'Enterprise',   icon: '🏢', accent: 'var(--accent-enterprise)' },
  { id: 'solutions',  label: 'Solutions',    icon: '⚡', accent: 'var(--accent-solution)' },
  { id: 'news',       label: 'News',         icon: '📰', accent: 'var(--accent-news)' },
  { id: 'learn',      label: 'Learn',        icon: '🎓', accent: 'var(--accent-learning)' },
  { id: 'market',     label: 'Market',       icon: '📊', accent: 'var(--accent-market)' },
];

export const AGENTS = [
  { id: 'product_intelligence',  name: 'Product Intelligence', icon: '💡', description: 'Specs, features, product details',     color: '#f97316' },
  { id: 'recommendation',        name: 'Recommendation',       icon: '🎯', description: 'Best products for your needs',         color: '#8b5cf6' },
  { id: 'compatibility_agent',   name: 'Compatibility',        icon: '🔗', description: 'Hardware compatibility check',          color: '#0ea5e9' },
  { id: 'sales_coach',           name: 'Sales Coach',          icon: '🎤', description: 'Pitch, objections, negotiation',       color: '#f59e0b' },
  { id: 'market_intelligence',   name: 'Market Intel',         icon: '📈', description: 'Trends, demand, brand data',           color: '#10b981' },
  { id: 'news_agent',            name: 'IT News',              icon: '📰', description: 'Latest IT industry news',              color: '#ef4444' },
  { id: 'forecast_agent',        name: 'Forecast',             icon: '🔮', description: 'Price & demand forecasts',             color: '#6366f1' },
  { id: 'solution_designer',     name: 'Solution Designer',    icon: '⚡', description: 'Complete setup design',               color: '#f59e0b' },
  { id: 'quotation_agent',       name: 'Quotation',            icon: '📋', description: 'Generate sales quotations',           color: '#059669' },
  { id: 'inventory_agent',       name: 'Inventory',            icon: '📦', description: 'Stock & availability check',          color: '#0ea5e9' },
  { id: 'enterprise_agent',      name: 'Enterprise',           icon: '🏢', description: 'Infra planning, TCO, lifecycle',      color: '#6366f1' },
  { id: 'troubleshoot_agent',    name: 'Troubleshoot',         icon: '🔧', description: 'Diagnose hardware issues',            color: '#ef4444' },
  { id: 'learning_agent',        name: 'Learning',             icon: '🎓', description: 'IT hardware education',               color: '#8b5cf6' },
  { id: 'dealer_agent',          name: 'Dealer',               icon: '🤝', description: 'Schemes, margins, channel',           color: '#059669' },
];

export function AppProvider({ children }) {
  const [language, setLanguage] = useState(
    () => localStorage.getItem('insightai_lang') || 'en'
  );
  const [activeModule, setActiveModule] = useState('chat');
  const [activeAgent, setActiveAgent] = useState('product_intelligence');
  const [theme, setTheme] = useState(
    () => localStorage.getItem('insightai_theme') || 'light'
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Persist language preference
  useEffect(() => {
    localStorage.setItem('insightai_lang', language);
  }, [language]);

  // Apply theme class to document root and persist
  useEffect(() => {
    localStorage.setItem('insightai_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleLanguage = () => {
    setLanguage(l => l === 'en' ? 'mr' : l === 'mr' ? 'hi' : 'en');
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const translate = (key) => t(key, language);

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    activeModule,
    setActiveModule,
    activeAgent,
    setActiveAgent,
    theme,
    toggleTheme,
    sidebarOpen,
    setSidebarOpen,
    t: translate,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

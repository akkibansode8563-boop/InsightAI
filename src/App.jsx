import { AppProvider, useApp } from './context/AppContext.jsx';
import NavBar from './components/NavBar.jsx';
import { BottomNav } from './components/ui/BottomNav.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import AIChat from './pages/AIChat.jsx';
import SalesCoach from './pages/SalesCoach.jsx';
import DealerPortal from './pages/DealerPortal.jsx';
import EnterprisePortal from './pages/EnterprisePortal.jsx';
import SolutionDesigner from './pages/SolutionDesigner.jsx';
import NewsCenter from './pages/NewsCenter.jsx';
import LearningCenter from './pages/LearningCenter.jsx';
import MarketIntelligence from './pages/MarketIntelligence.jsx';

function AppShell() {
  const { activeModule, theme } = useApp();

  const pages = {
    chat:       <AIChat />,
    sales:      <SalesCoach />,
    dealer:     <DealerPortal />,
    enterprise: <EnterprisePortal />,
    solutions:  <SolutionDesigner />,
    news:       <NewsCenter />,
    learn:      <LearningCenter />,
    market:     <MarketIntelligence />,
  };

  return (
    <div className={`app-shell${theme === 'dark' ? ' dark' : ''}`}>
      <NavBar />
      <main
        className="page-content has-bottom-nav"
        key={activeModule}
        style={{ animation: 'fadeUp 0.3s ease' }}
      >
        {pages[activeModule] ?? <AIChat />}
      </main>
      {/* Mobile-only bottom navigation */}
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </AppProvider>
  );
}

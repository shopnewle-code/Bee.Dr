import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, Bot, Clock, User } from 'lucide-react';

const tabs = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: FileText, label: 'Reports', path: '/upload' },
  { icon: Bot, label: 'AI Doctor', path: '/chat' },
  { icon: Clock, label: 'History', path: '/history' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ icon: Icon, label, path }) => {
          const active = pathname === path || (path === '/dashboard' && pathname === '/');
          return (
            <button key={path} onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <Icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : ''}`}>{label}</span>
              {active && <span className="w-1 h-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, Bot, Clock, User } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="mx-3 mb-3">
        <div className="glass rounded-2xl border border-white/30 px-2 py-1">
          <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
            {tabs.map(({ icon: Icon, label, path }) => {
              const active = pathname === path || (path === '/dashboard' && pathname === '/');
              return (
                <motion.button
                  key={path}
                  onClick={() => navigate(path)}
                  whileTap={{ scale: 0.9 }}
                  className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-300 ${
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute inset-0 rounded-xl bg-primary/10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 relative z-10 ${active ? 'text-primary' : ''}`} />
                  <span className={`text-[10px] font-medium relative z-10 ${active ? 'text-primary font-semibold' : ''}`}>
                    {label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

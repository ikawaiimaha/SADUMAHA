import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const NavigationContext = createContext<{ path: string; navigate: (path: string) => void } | null>(null);
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname.replace(/\/$/, '') || '/');
  useEffect(() => {
    const update = () => { setPath(window.location.pathname.replace(/\/$/, '') || '/'); window.scrollTo(0, 0); };
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  const navigate = (next: string) => {
    if (window.location.pathname !== next) window.history.pushState(null, '', next);
    setPath(next); window.scrollTo(0, 0);
  };
  return <NavigationContext.Provider value={{ path, navigate }}>{children}</NavigationContext.Provider>;
}
export function useNavigation() {
  const value = useContext(NavigationContext);
  if (!value) throw new Error('NavigationProvider required');
  return value;
}

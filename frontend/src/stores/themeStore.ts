import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  const body = document.body;

  if (theme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
    if (body) {
      body.classList.add('dark');
      body.setAttribute('data-theme', 'dark');
    }
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
    if (body) {
      body.classList.remove('dark');
      body.setAttribute('data-theme', 'light');
    }
  }
};

const stored = (typeof window !== 'undefined' ? localStorage.getItem('flowboard_theme') as Theme : null) || 'dark';

export const useThemeStore = create<ThemeState>((set) => ({
  theme: stored,

  toggle: () =>
    set((state) => {
      const next: Theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('flowboard_theme', next);
      applyTheme(next);
      return { theme: next };
    }),

  setTheme: (t) => {
    localStorage.setItem('flowboard_theme', t);
    applyTheme(t);
    set({ theme: t });
  },
}));

// Aplicar inmediatamente al cargar
if (typeof window !== 'undefined') {
  applyTheme(stored);
}

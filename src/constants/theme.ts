// Theme colors and styles for dark and light modes

export interface Theme {
  background: string;
  surface: string;
  primary: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  accent: string;
  card: string;
  statusBar: 'light-content' | 'dark-content';
}

export const lightTheme: Theme = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  primary: '#3B82F6',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  accent: '#8B5CF6',
  card: '#FFFFFF',
  statusBar: 'dark-content',
};

export const darkTheme: Theme = {
  background: '#0F172A',
  surface: '#1E293B',
  primary: '#60A5FA',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#334155',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  accent: '#A78BFA',
  card: '#1E293B',
  statusBar: 'light-content',
};


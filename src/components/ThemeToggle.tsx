import { useState } from 'react';
import { effectiveTheme, setTheme } from '../lib/theme';
import Icon from './Icon';

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => effectiveTheme());
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      className="icon-btn"
      aria-label={'Switch to ' + next + ' mode'}
      title={'Switch to ' + next + ' mode'}
      onClick={() => {
        setTheme(next);
        setThemeState(next);
      }}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
    </button>
  );
}

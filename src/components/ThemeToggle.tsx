import { useState } from 'react';
import { effectiveTheme, setTheme } from '../lib/theme';

// Sun/moon switch: shows the mode you'd switch TO, with a label.
export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => effectiveTheme());
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      className={compact ? 'btn btn-icon theme-toggle' : 'btn theme-toggle theme-toggle--labeled'}
      aria-label={'Switch to ' + next + ' mode'}
      title={'Switch to ' + next + ' mode'}
      onClick={() => {
        setTheme(next);
        setThemeState(next);
      }}
    >
      <i className={'ph-duotone ' + (theme === 'dark' ? 'ph-sun' : 'ph-moon')} aria-hidden="true" />
      {!compact && (theme === 'dark' ? 'Light' : 'Dark')}
    </button>
  );
}

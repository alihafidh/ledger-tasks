import { useState } from 'react';
import type { User } from '../lib/auth';
import { signIn, signUp, signUpOpen } from '../lib/auth';
import ThemeToggle from './ThemeToggle';

type Props = { onAuthed: (user: User) => void };

export default function AuthScreen({ onAuthed }: Props) {
  const [canSignUp] = useState(() => signUpOpen());
  const [mode, setMode] = useState<'signin' | 'signup'>(canSignUp ? 'signup' : 'signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Enter your email.');
    if (password.length < 6) return setError('The password needs at least 6 characters.');
    if (mode === 'signup' && !name.trim()) return setError('Enter your name.');
    setBusy(true);
    try {
      const user =
        mode === 'signup' ? await signUp(name, email, password) : await signIn(email, password);
      onAuthed(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <div className="brand" style={{ marginBottom: 18 }}>
          <span className="brand__mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span className="brand__text">
            <div className="brand__name">Ledger Tasks</div>
            <div className="brand__sub">workspace</div>
          </span>
        </div>
        <h1 className="auth__title">{mode === 'signin' ? 'Sign in' : 'Create your account'}</h1>
        <p className="auth__lede">
          {mode === 'signin'
            ? 'Pick up where you left off.'
            : 'An account keeps your tasks to yourself on this device.'}
        </p>

        <form onSubmit={submit} className="auth__form">
          {mode === 'signup' && (
            <div className="field">
              <label className="field__label" htmlFor="au-name">
                Name
              </label>
              <input
                id="au-name"
                type="text"
                value={name}
                autoComplete="name"
                placeholder="How should we address you?"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div className="field">
            <label className="field__label" htmlFor="au-email">
              Email
            </label>
            <input
              id="au-email"
              type="text"
              inputMode="email"
              value={email}
              autoComplete="email"
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="au-pass">
              Password
            </label>
            <input
              id="au-pass"
              type="password"
              value={password}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="auth__error">
              {error}
            </p>
          )}

          <button className="btn btn--md btn--primary auth__submit" type="submit" disabled={busy}>
            {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {canSignUp && (
          <p className="auth__switch">
            {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
            <button
              type="button"
              className="auth__link"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
              }}
            >
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        )}

        <div className="auth__foot">
          <p className="auth__note">
            Accounts live in this browser — your tasks stay on your device and don’t sync elsewhere.
          </p>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

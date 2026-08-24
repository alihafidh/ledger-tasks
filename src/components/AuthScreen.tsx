import { useState } from 'react';
import type { User } from '../lib/auth';
import { signIn, signUp, signUpOpen } from '../lib/auth';
import PlateHeading from './PlateHeading';

type Props = { onAuthed: (user: User) => void };

export default function AuthScreen({ onAuthed }: Props) {
  // A fresh browser goes straight to creating its one account; after that,
  // sign-up is closed and only sign-in is offered.
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
      <div className="auth-card">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <i className="ph-duotone ph-check-fat" />
          </span>
          <span className="brand-name">Ledger Tasks</span>
        </div>
        <PlateHeading text={mode === 'signin' ? 'Sign in' : 'Sign up'} />
        <p className="text-muted auth-lede">
          {mode === 'signin'
            ? 'Pick up the day’s edition where you left it.'
            : 'An account keeps your tasks to yourself on this device.'}
        </p>

        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="au-name">Name</label>
              <input
                id="au-name"
                className="input"
                value={name}
                autoComplete="name"
                placeholder="How should we address you?"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="au-email">Email</label>
            <input
              id="au-email"
              className="input"
              type="email"
              value={email}
              autoComplete="email"
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="au-pass">Password</label>
            <input
              id="au-pass"
              className="input"
              type="password"
              value={password}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="auth-error">
              {error}
            </p>
          )}

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'One moment…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {canSignUp && (
          <p className="auth-switch">
            {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
            <button
              type="button"
              className="auth-link"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
              }}
            >
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        )}

        <p className="auth-note">
          Accounts live in this browser — your tasks stay on your device and don’t sync elsewhere.
        </p>
      </div>
    </div>
  );
}

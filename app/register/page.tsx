'use client';

import { useState } from 'react';
import { Ship, Lock, User, Mail, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Registration failed'); return; }
      setSuccess(true);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-green-400/10 border border-green-400/20 mb-4">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Request Submitted</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              Your registration is pending admin approval. You will be able to log in once your account is approved.
            </p>
          </div>
          <Link href="/login" className="text-sm text-primary hover:underline">← Back to login</Link>
        </div>
      </div>
    );
  }

  const inputCls = "w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Ship className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Maritime Voyage Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Create an account</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" value={form.username} onChange={(e) => set('username', e.target.value)}
                  placeholder="Choose a username" required data-no-uppercase className={inputCls} />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                  placeholder="Your full name" required className={inputCls} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-1.5">Email <span className="text-muted-foreground/60 text-xs">(optional)</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  placeholder="your@email.com" data-no-uppercase className={inputCls} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="At least 8 characters" required data-no-uppercase
                  className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type={showPw ? 'text' : 'password'} value={form.confirm}
                  onChange={(e) => set('confirm', e.target.value)}
                  placeholder="Repeat password" required data-no-uppercase className={inputCls.replace('pl-10 pr-4', 'pl-10 pr-4')} />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                <Lock className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors">
              {loading ? 'Submitting…' : 'Request Access'}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

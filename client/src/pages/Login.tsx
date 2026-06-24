import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldAlert } from 'lucide-react';
import JSIcon from '../components/JSIcon';
import api from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Store in LocalStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center px-6 py-12 md:px-10 bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {/* Background Decorators */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(247,223,30,0.08),transparent_70%)]"></div>

      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-850 dark:bg-slate-900">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-jsyellow/10 text-jsyellow">
            <JSIcon className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Sign in to continue your JavaScript journey
          </p>
        </div>

        {/* Warning Alert about admin approval */}
        <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs text-blue-650 dark:text-blue-400 flex items-start gap-2.5">
          <ShieldAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-blue-500" />
          <div>
            <span className="font-bold">Important Notice:</span> New accounts must be approved by the admin before logging in.
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-sm font-semibold text-rose-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-transparent py-3 pl-10 pr-4 text-sm outline-none focus:border-jsyellow dark:border-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-transparent py-3 pl-10 pr-4 text-sm outline-none focus:border-jsyellow dark:border-slate-800"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-jsyellow py-3.5 font-bold text-black shadow-md shadow-jsyellow/15 transition hover:bg-jsyellow-hover disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
          New student?{' '}
          <Link to="/signup" className="font-bold text-jsyellow hover:underline">
            Register here
          </Link>
          <div className="mt-3">
            <Link to="/admin/login" className="text-slate-400 hover:text-jsyellow hover:underline">
              Are you an Admin?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import api from '../services/api';

const AdminLogin: React.FC = () => {
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
      const response = await api.post('/auth/admin/login', { email, password });
      const { token, user } = response.data;

      // Store in LocalStorage
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(user));

      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid admin credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center px-6 py-12 bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(15,23,42,0.1),transparent_70%)]"></div>

      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-slate-900 p-8 text-white shadow-xl dark:border-slate-800">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-jsyellow/10 text-jsyellow">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Admin Console</h2>
          <p className="mt-1.5 text-sm text-slate-400">
            Sign in to manage JS Bootcamp modules and approvals
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-sm font-semibold text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Administrator Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="email"
                placeholder="admin@jsbootcamp.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-transparent py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-jsyellow"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Admin Key Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-transparent py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-jsyellow"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-jsyellow py-3.5 font-bold text-black shadow-md shadow-jsyellow/15 transition hover:bg-jsyellow-hover disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : 'Access Admin Dashboard'}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          <Link to="/login" className="font-semibold text-slate-400 hover:text-jsyellow hover:underline">
            Go back to Student Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

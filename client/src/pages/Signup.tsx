import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, ShieldAlert } from 'lucide-react';
import JSIcon from '../components/JSIcon';
import api from '../services/api';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      await api.post('/auth/signup', { name, email, password });
      setIsRegistered(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="relative flex min-h-[80vh] items-center justify-center px-6 py-12 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-850 dark:bg-slate-900">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-450">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black">Registration Pending</h2>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Thank you for signing up to JS Bootcamp! Your registration has been submitted and is currently in the **Admin approval queue**.
          </p>
          <div className="my-6 rounded-xl bg-slate-50 p-4 text-left text-xs dark:bg-slate-850">
            <span className="font-bold block mb-1">What happens next?</span>
            <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400">
              <li>Admin will verify your application.</li>
              <li>You will receive an email once approved.</li>
              <li>You will then be able to log in and start learning.</li>
            </ul>
          </div>
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-xl bg-jsyellow py-3.5 font-bold text-black shadow-md shadow-jsyellow/15 hover:bg-jsyellow-hover"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center px-6 py-12 md:px-10 bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(247,223,30,0.08),transparent_70%)]"></div>

      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-850 dark:bg-slate-900">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-jsyellow/10 text-jsyellow">
            <JSIcon className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Create Account</h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Register to join the interactive JS Bootcamp
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-sm font-semibold text-rose-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-transparent py-3 pl-10 pr-4 text-sm outline-none focus:border-jsyellow dark:border-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-transparent py-3 pl-10 pr-4 text-sm outline-none focus:border-jsyellow dark:border-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="password"
                placeholder="Min. 8 characters"
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
            {isLoading ? 'Creating account...' : 'Submit Registration'}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-jsyellow hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;

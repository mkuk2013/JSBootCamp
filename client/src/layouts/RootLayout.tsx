import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Laptop, Menu, X, ArrowRight } from 'lucide-react';
import JSIcon from '../components/JSIcon';

const RootLayout: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {/* Background Decorators */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[800px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(247,223,30,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(247,223,30,0.06),transparent_70%)]"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-jsyellow/30 blur-lg transition group-hover:bg-jsyellow/50"></div>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <JSIcon className="h-5.5 w-5.5" />
              </div>
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              JS <span className="text-jsyellow dark:text-jsyellow">BootCamp</span>
            </span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link to="/features" className="text-slate-600 transition hover:text-jsyellow dark:text-slate-300">Features</Link>
            <Link to="/curriculum" className="text-slate-600 transition hover:text-jsyellow dark:text-slate-300">Curriculum</Link>
            <Link to="/how-it-works" className="text-slate-600 transition hover:text-jsyellow dark:text-slate-300">How it works</Link>
            <Link to="/login" className="text-slate-700 transition hover:text-jsyellow dark:text-slate-200">Login</Link>
            
            {/* Get Started Button */}
            <Link 
              to="/signup" 
              className="inline-flex items-center gap-1.5 rounded-xl bg-jsyellow px-4 py-2 font-bold text-black shadow-md shadow-jsyellow/20 transition hover:bg-jsyellow-hover active:scale-95"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Theme Toggle Selector */}
            <div className="relative">
              <button 
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Toggle theme"
              >
                {theme === 'light' && <Sun className="h-4.5 w-4.5" />}
                {theme === 'dark' && <Moon className="h-4.5 w-4.5" />}
                {theme === 'system' && <Laptop className="h-4.5 w-4.5" />}
              </button>

              {themeDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setThemeDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 z-50 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <button
                      onClick={() => { setTheme('light'); setThemeDropdownOpen(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Sun className="h-4 w-4 text-amber-500" /> Light
                    </button>
                    <button
                      onClick={() => { setTheme('dark'); setThemeDropdownOpen(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Moon className="h-4 w-4 text-indigo-400" /> Dark
                    </button>
                    <button
                      onClick={() => { setTheme('system'); setThemeDropdownOpen(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Laptop className="h-4 w-4 text-slate-400" /> System
                    </button>
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* Mobile Menu Actions */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Theme Toggle - Simple Click for Mobile */}
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-400" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-6 py-4 shadow-lg dark:border-slate-800 dark:bg-slate-950 md:hidden">
            <nav className="flex flex-col gap-4 text-sm font-medium">
              <Link to="/features" onClick={handleNavClick} className="text-slate-600 dark:text-slate-300">Features</Link>
              <Link to="/curriculum" onClick={handleNavClick} className="text-slate-600 dark:text-slate-300">Curriculum</Link>
              <Link to="/how-it-works" onClick={handleNavClick} className="text-slate-600 dark:text-slate-300">How it works</Link>
              <hr className="border-slate-200 dark:border-slate-800" />
              <Link to="/login" onClick={handleNavClick} className="text-slate-700 dark:text-slate-200">Login</Link>
              <Link 
                to="/signup" 
                onClick={handleNavClick} 
                className="flex items-center justify-center gap-1.5 rounded-xl bg-jsyellow py-2.5 font-bold text-black"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-slate-50 py-12 dark:border-slate-800/80 dark:bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <JSIcon className="h-6 w-6" />
                <span className="text-lg font-bold tracking-tight">JS Bootcamp</span>
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Master JavaScript interactively. From fundamentals to professional full-stack features.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Platform</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link to="/features" className="hover:text-jsyellow">Features</Link></li>
                <li><Link to="/curriculum" className="hover:text-jsyellow">Curriculum</Link></li>
                <li><Link to="/how-it-works" className="hover:text-jsyellow">How it works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Legal</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link to="/privacy-policy" className="hover:text-jsyellow">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-jsyellow">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Copyright</h4>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                &copy; {new Date().getFullYear()} JS Bootcamp. All rights reserved.
              </p>
            </div>
          </div>

          {/* Bottom credit bar */}
          <div className="mt-10 border-t border-slate-200/80 pt-6 dark:border-slate-800/60 flex items-center justify-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              Made with{' '}
              <span className="text-red-500 animate-pulse text-base">❤️</span>
              {' '}by{' '}
              <a
                href="https://www.facebook.com/innoxent.mukesh"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-slate-800 dark:text-slate-200 hover:text-jsyellow dark:hover:text-jsyellow transition-colors duration-200"
              >
                Mukesh Kumar
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RootLayout;

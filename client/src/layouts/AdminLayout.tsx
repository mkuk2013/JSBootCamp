import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  Sun, Moon, Laptop, Users, ShieldAlert, Sparkles, 
  Settings, LogOut, Menu, X, BarChart 
} from 'lucide-react';
import JSIcon from '../components/JSIcon';

const AdminLayout: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [adminUser] = useState<{ name: string; email: string } | null>(() => {
    try {
      const stored = localStorage.getItem('adminUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const menuItems = [
    { name: 'Admin Overview', path: '/admin', icon: BarChart },
    { name: 'Student Approvals', path: '/admin/approvals', icon: Users },
    { name: 'AI Module Generator', path: '/admin/generator', icon: Sparkles },
    { name: 'System Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 border-r border-slate-200 bg-slate-900 dark:border-slate-800 dark:bg-slate-900 md:flex md:flex-col">
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
          <JSIcon className="h-6 w-6" />
          <span className="text-lg font-bold tracking-tight text-white">JS Bootcamp <span className="rounded-md bg-jsyellow/20 px-1.5 py-0.5 text-[9px] font-black text-jsyellow">ADMIN</span></span>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-jsyellow text-black shadow-md shadow-jsyellow/15' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-800 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-950/20"
          >
            <LogOut className="h-5 w-5" />
            Logout Admin
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar - Mobile */}
      <aside 
        className={`fixed bottom-0 top-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-slate-900 transition-transform duration-300 dark:border-slate-800 md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <JSIcon className="h-6 w-6" />
            <span className="text-lg font-bold tracking-tight text-white">JS Bootcamp <span className="rounded-md bg-jsyellow/20 px-1.5 py-0.5 text-[9px] font-black text-jsyellow">ADMIN</span></span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-850"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-jsyellow text-black' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-950/20"
          >
            <LogOut className="h-5 w-5" />
            Logout Admin
          </button>
        </div>
      </aside>

      {/* Main Workspace Wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Workspace Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Admin Title indicator */}
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-500" />
              <span>Admin Console</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle dropdown */}
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

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 font-extrabold text-white text-sm dark:bg-slate-700">
                {adminUser ? getInitials(adminUser.name) : 'AD'}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-xs font-bold leading-none">{adminUser ? adminUser.name : 'Super Administrator'}</p>
                <p className="mt-0.5 text-[10px] text-emerald-500 font-semibold">Active Session</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Panel */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;

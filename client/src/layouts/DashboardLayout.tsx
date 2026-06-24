import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { 
  Sun, Moon, Laptop, LayoutDashboard, BookOpen, 
  Trophy, User, LogOut, Menu, X, ChevronRight, Award
} from 'lucide-react';
import JSIcon from '../components/JSIcon';
import api from '../services/api';

const DashboardLayout: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();



  // Helper to generate breadcrumbs from path
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(p => p);
    return paths.map((path, index) => {
      let url = `/${paths.slice(0, index + 1).join('/')}`;
      const isLast = index === paths.length - 1;
      let label = path.charAt(0).toUpperCase() + path.slice(1);
      
      if (path === 'dashboard') label = 'Dashboard';
      if (path === 'learn') {
        label = 'Learning Path';
        url = '/dashboard';
      }
      if (path === 'leaderboard') label = 'Leaderboard';
      if (path === 'profile') label = 'Profile';
      
      // Enhance learning path sub-breadcrumbs to be human readable and link to dashboard
      if (paths[0] === 'learn') {
        if (index === 1) {
          label = `Module ${path}`;
          url = '/dashboard';
        }
        if (index === 2) {
          label = `Lesson ${path}`;
        }
      }
      
      return { label, url, isLast };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { name: 'Student', xp: 0 };
  
  // Retrieve profile dynamically from shared query cache to stay in sync
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/students/profile');
      return response.data.data;
    },
    enabled: !!localStorage.getItem('token')
  });

  const learnPath = (profile?.last_task_id && profile?.last_module_id)
    ? `/learn/${profile.last_module_id}/${profile.last_task_id}`
    : '/learn/1/1';

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Learn JS', path: learnPath, icon: BookOpen },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Certificate', path: '/certificate', icon: Award },
  ];

  const displayName = profile?.name || user.name;
  const displayXp = profile?.xp !== undefined ? profile.xp : user.xp;
  const avatarUrl = profile?.avatar_url;

  const initials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'ST';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex md:flex-col">
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6 dark:border-slate-800">
          <JSIcon className="h-6 w-6" />
          <span className="text-lg font-bold tracking-tight">JS Bootcamp</span>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path.split('/:')[0]);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-jsyellow text-black shadow-md shadow-jsyellow/15' 
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-850'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
          >
            <LogOut className="h-5 w-5" />
            Logout
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
        className={`fixed bottom-0 top-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <JSIcon className="h-6 w-6" />
            <span className="text-lg font-bold tracking-tight">JS Bootcamp</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path.split('/:')[0]);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-jsyellow text-black' 
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-850'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
          >
            <LogOut className="h-5 w-5" />
            Logout
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

            {/* Breadcrumbs */}
            <nav className="hidden items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 md:flex">
              <Link to="/dashboard" className="hover:text-jsyellow">Home</Link>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={`${crumb.url}-${idx}`}>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                  {crumb.isLast ? (
                    <span className="font-semibold text-slate-900 dark:text-white">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.url} className="hover:text-jsyellow">{crumb.label}</Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
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
              {avatarUrl ? (
                <img 
                  src={`http://localhost:5000${avatarUrl}`} 
                  alt={displayName} 
                  className="h-9 w-9 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-jsyellow font-extrabold text-black text-sm">
                  {initials}
                </div>
              )}
              <div className="hidden text-left md:block">
                <p className="text-xs font-bold leading-none">{displayName}</p>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{displayXp} XP</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Panel */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />

          {/* Footer — hide on full-screen code editor (Learn page) */}
          {!location.pathname.startsWith('/learn') && (
            <footer className="mt-12 border-t border-slate-200/80 pt-6 pb-2 dark:border-slate-800/60 flex items-center justify-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                Made with{' '}
                <span className="text-red-400 animate-pulse">❤️</span>
                {' '}by{' '}
                <a
                  href="https://www.facebook.com/innoxent.mukesh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-slate-600 dark:text-slate-400 hover:text-jsyellow dark:hover:text-jsyellow transition-colors duration-200"
                >
                  Mukesh Kumar
                </a>
              </p>
            </footer>
          )}
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;

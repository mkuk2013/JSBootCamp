import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Sparkles, ShieldCheck, Trophy, ArrowRight, Code, Zap } from 'lucide-react';
import JSIcon from '../components/JSIcon';

const Features: React.FC = () => {
  const featureList = [
    {
      title: 'Interactive Code Editor',
      description: 'A complete Monaco Editor workspace with JavaScript syntax highlighting, indentation helpers, and automatic error tracking.',
      icon: Code,
      color: 'text-amber-500 bg-amber-500/10'
    },
    {
      title: 'Browser-Based Runner',
      description: 'Execute standard modern JavaScript natively in your browser. Sandbox isolates code for safe, zero-latency execution feedback.',
      icon: Zap,
      color: 'text-blue-500 bg-blue-500/10'
    },
    {
      title: 'Auto-Graded Verification',
      description: 'Submit your solution to execute against hidden assertion test cases. Auto-grader checks return types, values, and console outputs.',
      icon: ShieldCheck,
      color: 'text-emerald-500 bg-emerald-500/10'
    },
    {
      title: 'AI Programming Mentor',
      description: 'Query our Gemini-powered tutoring mentor to receive hints, explanations of errors, and guidance without getting direct code answers.',
      icon: Sparkles,
      color: 'text-jsyellow bg-jsyellow/10'
    },
    {
      title: 'Leaderboard & Streaks',
      description: 'Compete on the global rankings board. Track active learning streaks, complete tasks daily, and claim XP points.',
      icon: Trophy,
      color: 'text-orange-500 bg-orange-500/10'
    },
    {
      title: 'Printable Graduation Certificate',
      description: 'Unlock a verifiable graduation certification when you solve all curriculum tasks. Perfect for sharing on professional networks.',
      icon: Award,
      color: 'text-purple-500 bg-purple-500/10'
    }
  ];

  return (
    <div className="relative overflow-hidden bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 py-16 md:py-24 text-left">
      {/* Background blobs */}
      <div className="pointer-events-none absolute right-[-15%] top-40 -z-10 h-[400px] w-[400px] rounded-full bg-jsyellow/10 blur-3xl dark:bg-jsyellow/5"></div>
      
      <div className="mx-auto max-w-5xl px-6 md:px-10 space-y-16">
        
        {/* Title Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-jsyellow/20 bg-jsyellow/10 px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-jsyellow">
            <JSIcon className="h-4 w-4" /> Platform Features
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Everything you need to master <span className="text-jsyellow">JavaScript</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            JS Bootcamp is designed to feel like a real engineering sandbox. Learn, compile, debug, and certify your expertise in one place.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featureList.map((f, i) => {
            const Icon = f.icon;
            return (
              <div 
                key={i} 
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 hover:border-jsyellow transition-all duration-300"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-slate-150">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{f.description}</p>
              </div>
            );
          })}
        </div>

        {/* Call to action section */}
        <div className="rounded-2xl border border-jsyellow/25 bg-jsyellow/5 p-8 md:p-12 text-center max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-black">Ready to compile your first line?</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Sign up today to join the global leaderboard, study structured JavaScript modules, and earn your developer certificate.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-jsyellow px-6 py-3 text-xs font-bold text-black hover:bg-jsyellow-hover transition"
            >
              Start Learning Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Features;

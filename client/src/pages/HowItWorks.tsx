import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, BookOpen, Terminal, Sparkles, Trophy, Award, ArrowRight } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: 'Step 1',
      title: 'Register & Await Approval',
      description: 'Create your account. In order to manage server load and preserve database resources, all student accounts enter a pending queue for administrative approval. You will receive an automated email notification once approved.',
      icon: UserPlus,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    },
    {
      step: 'Step 2',
      title: 'Read Module Concept Theory',
      description: 'Navigate to the current module page. Study structural JavaScript concepts, examine sample syntaxes, and read curriculum markdown theory. Then click on the "Practice Task" tab.',
      icon: BookOpen,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    },
    {
      step: 'Step 3',
      title: 'Write & Execute Code',
      description: 'Implement your solution inside the interactive Monaco Editor. Click "Run Tests" to execute your code inside a sandboxed client-side runner. Intercepted console logs and test results render dynamically.',
      icon: Terminal,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      step: 'Step 4',
      title: 'Submit & Gamify Stats',
      description: 'When all assertions pass, click "Submit Code". The backend updates your profile XP, recalculates your level (capped at 10), updates streaks, logs attempts, and checks badge unlocks.',
      icon: Trophy,
      color: 'text-orange-500 bg-orange-500/10 border-orange-500/20'
    },
    {
      step: 'Step 5',
      title: 'Ask AI Mentor & Graduate',
      description: 'Stuck on logic or syntax bugs? Tap "Ask AI Mentor" to get Gemini hints. Complete all tasks, master the syllabus, and unlock your downloadable Completion Certificate!',
      icon: Award,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20'
    }
  ];

  return (
    <div className="relative overflow-hidden bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 py-16 md:py-24 text-left">
      <div className="pointer-events-none absolute right-[-10%] top-[10rem] -z-10 h-[350px] w-[350px] rounded-full bg-jsyellow/10 blur-3xl"></div>

      <div className="mx-auto max-w-4xl px-6 md:px-10 space-y-16">
        
        {/* Title Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-jsyellow/20 bg-jsyellow/10 px-3.5 py-1.5 text-xs font-bold text-slate-805 dark:text-jsyellow">
            <Sparkles className="h-4 w-4" /> Student Guide
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            How JS Bootcamp Works
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Follow our learning pipeline from signing up to writing code, compiling test assertions, and downloading certifications.
          </p>
        </div>

        {/* Steps Timeline Grid */}
        <div className="space-y-8 relative before:absolute before:left-8 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="flex gap-6 items-start relative pl-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${s.color} z-10 bg-white dark:bg-slate-900`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-1.5 pt-1.5">
                  <span className="text-xs font-bold text-jsyellow tracking-widest uppercase font-mono">{s.step}</span>
                  <h3 className="text-lg font-bold text-slate-850 dark:text-slate-150">{s.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 max-w-2xl">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Call to Action */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 md:p-12 text-center space-y-6 dark:border-slate-850 dark:bg-slate-900/30">
          <h2 className="text-2xl font-black">Begin your coding journey today</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Set up your credentials, complete modules at your own pace, and master modern JavaScript fundamentals completely free.
          </p>
          <div className="flex justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-jsyellow px-6 py-3 text-xs font-bold text-black hover:bg-jsyellow-hover transition"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HowItWorks;

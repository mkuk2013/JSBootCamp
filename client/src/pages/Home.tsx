import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, ArrowRight, CheckCircle2, GraduationCap, Zap, 
  Layers, BarChart3, Trophy, Award, Terminal, Sparkles
} from 'lucide-react';

const Home: React.FC = () => {
  const code = `// Your first JS Bootcamp task
function fibonacci(n) {
  if (n < 2) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

for (let i = 0; i < 10; i++) {
  console.log(fibonacci(i));
}`;

  const [output, setOutput] = useState('0\n1\n1\n2\n3\n5\n8\n13\n21\n34');
  const [isRunning, setIsRunning] = useState(false);
  const [isAccepted, setIsAccepted] = useState(true);

  const runCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      try {
        // Safe evaluation of simple logs for mock compiler
        const logs: string[] = [];
        const customConsole = {
          log: (msg: any) => logs.push(String(msg))
        };
        // Setup code wrap
        const runFn = new Function('console', code);
        runFn(customConsole);
        setOutput(logs.join('\n') || 'Code executed successfully with no output.');
        setIsAccepted(true);
      } catch (err: any) {
        setOutput(err.message || 'Error executing script.');
        setIsAccepted(false);
      }
    }, 600);
  };

  const curriculum = [
    {
      level: 'Level 1',
      title: '🌱 Beginner',
      desc: 'The JavaScript fundamentals every developer needs.',
      modules: [
        'Hello, JavaScript & Console',
        'Variables, let & const',
        'Data Types (Strings, Numbers, Booleans)',
        'Operators & Basic Math',
        'Conditional Statements (if / else / switch)',
        'Loops (for, while, do-while)',
        'Functions & Scope Basics',
        'Strings & Template Literals'
      ]
    },
    {
      level: 'Level 2',
      title: '⚡ Intermediate',
      desc: 'Data structures, DOM manipulation, and intermediate logic.',
      modules: [
        'Arrays & Array Methods',
        'Objects & JSON',
        'DOM Manipulation & Events',
        'Callbacks & Arrow Functions',
        'Error Handling (try / catch)',
        'ES6+ Features (Destructuring, Spread/Rest)',
        'Asynchronous JavaScript (Promises, async/await)',
        'Working with External APIs (fetch, Axios)'
      ]
    },
    {
      level: 'Level 3',
      title: '🚀 Advanced',
      desc: 'Object-Oriented JavaScript, advanced async patterns, and algorithms.',
      modules: [
        'Prototypes & Object-Oriented JS',
        'Classes, Inheritance & Encapsulation',
        'Closures & Lexical Scope',
        'Advanced Async (Promise.all, Race, Generators)',
        'Local & Session Storage',
        'RegEx (Regular Expressions)',
        'Design Patterns & Modules',
        'Algorithms & Code Performance'
      ]
    }
  ];

  return (
    <div className="relative overflow-hidden bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      
      {/* Decorative Blob backgrounds */}
      <div aria-hidden="true" className="pointer-events-none absolute right-[-15%] top-40 -z-10 h-[400px] w-[400px] animate-blob rounded-full bg-jsyellow/15 blur-3xl dark:bg-jsyellow/5"></div>
      <div aria-hidden="true" className="pointer-events-none absolute left-[-10%] top-[28rem] -z-10 h-[420px] w-[420px] animate-blob rounded-full bg-blue-500/10 blur-3xl [animation-delay:3s] dark:bg-blue-500/5"></div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[700px] bg-dot-grid [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-12 md:px-10 md:pb-28 md:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
          {/* Hero Left */}
          <div className="text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-jsyellow/20 bg-jsyellow/10 px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-jsyellow">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jsyellow opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-jsyellow"></span>
              </span>
              Real JavaScript — running in your browser
            </div>
            
            <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
              Master <span className="text-js-gradient">JavaScript</span><br />
              the <span className="relative inline-block">
                <span className="relative z-10">interactive</span>
                <span className="absolute bottom-1.5 left-0 right-0 -z-10 h-3 bg-jsyellow/40"></span>
              </span> way.
            </h1>
            
            <p className="mb-9 max-w-xl text-lg leading-relaxed text-slate-650 dark:text-slate-350">
              An immersive bootcamp with <strong className="text-slate-900 dark:text-white">3 levels</strong>, <strong className="text-slate-900 dark:text-white">24 modules</strong>, and <strong className="text-slate-900 dark:text-white">76+ hands-on tasks</strong>. Auto-graded. Beautifully designed. Completely free.
            </p>

            <div className="mb-10 flex flex-wrap gap-4">
              <Link 
                to="/signup" 
                className="group inline-flex items-center gap-2 rounded-xl bg-jsyellow px-7 py-3.5 font-bold text-black shadow-lg shadow-jsyellow/20 transition hover:bg-jsyellow-hover active:scale-95"
              >
                Start Learning Free
                <ArrowRight className="h-4.5 w-4.5 transition group-hover:translate-x-1" />
              </Link>
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-6 py-3.5 font-semibold text-slate-700 backdrop-blur transition hover:border-jsyellow hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-jsyellow"
              >
                <Play className="h-4 w-4 fill-current" />
                I have an account
              </Link>
            </div>

            <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /> 100% free forever
              </li>
              <li className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /> No credit card required
              </li>
              <li className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /> Browser-based execution
              </li>
              <li className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /> Certificates of completion
              </li>
            </ul>
          </div>

          {/* Hero Right - Interactive Mock Editor */}
          <div className="relative animate-float">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-jsyellow/20 to-blue-500/10 blur-2xl"></div>
            
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-2xl dark:border-slate-800">
              
              {/* Window Controls */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-500"></span>
                  <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                  <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                  <span className="ml-3 inline-flex items-center gap-1.5 rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-white">
                    <Terminal className="h-3.5 w-3.5 text-jsyellow" />
                    playground.js
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-jsyellow/10 px-2.5 py-0.5 text-[10px] font-bold text-jsyellow">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-jsyellow"></span>
                  V8 Ready
                </span>
              </div>

              {/* Editable area */}
              <div className="grid grid-cols-[45px_1fr] font-mono text-[13px] leading-relaxed">
                {/* Line Numbers */}
                <div className="select-none border-r border-slate-800/50 bg-slate-900/20 py-4 text-right text-slate-650 pr-2">
                  <div>1</div><div>2</div><div>3</div><div>4</div><div>5</div><div>6</div><div>7</div><div>8</div>
                </div>
                {/* Code textarea */}
                <textarea
                  value={code}
                  readOnly={true}
                  className="w-full resize-none border-0 bg-transparent py-4 pl-4 pr-5 font-mono text-slate-300 outline-none focus:ring-0 cursor-default select-text"
                  rows={8}
                />
              </div>

              {/* Output Panel */}
              <div className="border-t border-slate-800 bg-slate-900/40 p-4">
                <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <span className="inline-flex items-center gap-1">Output</span>
                  <button 
                    onClick={runCode}
                    disabled={isRunning}
                    className="inline-flex items-center gap-1.5 rounded bg-jsyellow px-2.5 py-1 text-[10px] font-black text-black transition hover:bg-jsyellow-hover"
                  >
                    {isRunning ? 'Running...' : 'Run Code'}
                  </button>
                </div>
                <div className={`font-mono text-sm ${isAccepted ? 'text-emerald-400' : 'text-rose-400'} whitespace-pre-wrap`}>
                  {output}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-20 rounded-2xl border border-slate-200/80 bg-white/60 p-2 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl px-5 py-5 text-center transition hover:bg-slate-50 dark:hover:bg-slate-850">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white md:text-4xl">3</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Levels</div>
              <div className="text-[11px] text-slate-405">Beginner to Expert</div>
            </div>
            <div className="rounded-xl px-5 py-5 text-center transition hover:bg-slate-50 dark:hover:bg-slate-850">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white md:text-4xl">24</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Modules</div>
              <div className="text-[11px] text-slate-405">Structured Curriculum</div>
            </div>
            <div className="rounded-xl px-5 py-5 text-center transition hover:bg-slate-50 dark:hover:bg-slate-850">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white md:text-4xl">76+</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tasks</div>
              <div className="text-[11px] text-slate-405">Instant Autograder</div>
            </div>
            <div className="rounded-xl px-5 py-5 text-center transition hover:bg-slate-50 dark:hover:bg-slate-850">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white md:text-4xl">$0</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cost</div>
              <div className="text-[11px] text-slate-405">Free Forever</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 border-t border-slate-100 bg-slate-50/50 py-20 dark:border-slate-900 dark:bg-slate-900/20">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-jsyellow/20 bg-jsyellow/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-800 dark:text-jsyellow">
              <Sparkles className="h-3.5 w-3.5 text-jsyellow" />
              Comprehensive Platform
            </div>
            <h2 className="mb-3 text-3xl font-extrabold tracking-tight md:text-5xl">Built like a real developer workspace</h2>
            <p className="text-lg text-slate-500 dark:text-slate-450">Everything you need to go from a total beginner to writing professional SaaS features.</p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Feature Card 1 */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-350 hover:-translate-y-1 hover:border-jsyellow hover:shadow-glow dark:border-slate-800 dark:bg-slate-900">
              <div className="absolute inset-x-0 top-0 h-1 bg-jsyellow opacity-0 transition-opacity duration-350 group-hover:opacity-100"></div>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-jsyellow/10 text-jsyellow">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold">Level-based Curriculum</h3>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Unlock lessons sequentially as you solve challenges. Gain structured understanding from theory to projects.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-350 hover:-translate-y-1 hover:border-jsyellow hover:shadow-glow dark:border-slate-800 dark:bg-slate-900">
              <div className="absolute inset-x-0 top-0 h-1 bg-jsyellow opacity-0 transition-opacity duration-350 group-hover:opacity-100"></div>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-jsyellow/10 text-jsyellow">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold">Browser execution</h3>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Write and execute standard modern JS directly in a custom Monaco editor. Zero development setup needed.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-350 hover:-translate-y-1 hover:border-jsyellow hover:shadow-glow dark:border-slate-800 dark:bg-slate-900">
              <div className="absolute inset-x-0 top-0 h-1 bg-jsyellow opacity-0 transition-opacity duration-350 group-hover:opacity-100"></div>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-jsyellow/10 text-jsyellow">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold">76+ Autograded Tasks</h3>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Submit code to run test cases. Get immediate validation and explanations for failing scenarios.
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-350 hover:-translate-y-1 hover:border-jsyellow hover:shadow-glow dark:border-slate-800 dark:bg-slate-900">
              <div className="absolute inset-x-0 top-0 h-1 bg-jsyellow opacity-0 transition-opacity duration-350 group-hover:opacity-100"></div>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-jsyellow/10 text-jsyellow">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold">XP & Progress Tracking</h3>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Track exact module mastery. Earn XP for correct submissions, and unlock customized profile badges.
              </p>
            </div>

            {/* Feature Card 5 */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-350 hover:-translate-y-1 hover:border-jsyellow hover:shadow-glow dark:border-slate-800 dark:bg-slate-900">
              <div className="absolute inset-x-0 top-0 h-1 bg-jsyellow opacity-0 transition-opacity duration-350 group-hover:opacity-100"></div>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-jsyellow/10 text-jsyellow">
                <Trophy className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold">Global Leaderboard</h3>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Compete with other bootcamper candidates. Check rank listings, scores, and completed milestones.
              </p>
            </div>

            {/* Feature Card 6 */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-350 hover:-translate-y-1 hover:border-jsyellow hover:shadow-glow dark:border-slate-800 dark:bg-slate-900">
              <div className="absolute inset-x-0 top-0 h-1 bg-jsyellow opacity-0 transition-opacity duration-350 group-hover:opacity-100"></div>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-jsyellow/10 text-jsyellow">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold">JS Certification</h3>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Earn an authorized developer certification showing your syllabus mastery, credentials, and achievements.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Curriculum Showcase Section */}
      <section id="curriculum" className="relative z-10 py-20 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-3 text-3xl font-extrabold tracking-tight md:text-5xl">Curriculum Syllabus</h2>
            <p className="text-lg text-slate-500 dark:text-slate-450 font-medium">
              3 Levels. 24 Modules. 76+ coding challenges.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {curriculum.map((level) => (
              <div 
                key={level.level} 
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 flex flex-col"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <span className="inline-block rounded-full bg-jsyellow/10 px-3 py-1 text-xs font-bold text-slate-805 dark:text-jsyellow">
                      {level.level}
                    </span>
                    <h3 className="mt-3 text-xl font-black">{level.title}</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{level.modules.length} Modules</span>
                </div>
                
                <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{level.desc}</p>
                
                <ul className="space-y-3 flex-1">
                  {level.modules.map((mod, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-350">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-jsyellow" />
                      <span>{mod}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;

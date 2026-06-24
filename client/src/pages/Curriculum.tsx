import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle, ArrowRight, Layers } from 'lucide-react';

const Curriculum: React.FC = () => {
  const syllabus = [
    {
      level: '🌱 Level 1: Beginner',
      desc: 'Master foundational syntax, programming concepts, operators, conditions, and core structures.',
      modules: [
        {
          title: 'Variables & Constants',
          topics: ['Semicolons & Syntax rules', 'Variables declarations (let, const)', 'Scope variables limitations']
        },
        {
          title: 'Operators & Basic Math',
          topics: ['Mathematical operators (+, -, *, /)', 'Modulo operator (%)', 'Logical comparisons (==, ===, !=)']
        },
        {
          title: 'Data Types',
          topics: ['Strings & characters', 'Numbers & decimals', 'Booleans (true / false)', 'Null & undefined']
        }
      ]
    },
    {
      level: '⚡ Level 2: Intermediate',
      desc: 'Learn complex workflows including logical blocks, repeat instructions, and collection methods.',
      modules: [
        {
          title: 'Loops & Loops Controls',
          topics: ['For loops counters', 'While conditions loops', 'Break & continue loops controllers']
        },
        {
          title: 'Function Declarations',
          topics: ['Declaring parameters', 'Returning values keywords', 'Function expressions']
        },
        {
          title: 'Arrays Basics',
          topics: ['Declaring lists arrays', 'Accessing indices', 'Modifying length properties']
        }
      ]
    },
    {
      level: '🚀 Level 3: Advanced',
      desc: 'Dive into functional array methodologies, closures, object manipulation, and modern ES6.',
      modules: [
        {
          title: 'Array Transformations',
          topics: ['Mapping elements (.map())', 'Filtering lists (.filter())', 'Reducing calculations (.reduce())']
        },
        {
          title: 'Object Structures',
          topics: ['Declaring properties objects', 'Key-value maps accessors', 'Objects nesting patterns']
        },
        {
          title: 'Advanced Operations',
          topics: ['Array mapping filters tasks', 'Function returns checks', 'Console inputs captures']
        }
      ]
    }
  ];

  return (
    <div className="relative overflow-hidden bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 py-16 md:py-24 text-left">
      <div className="pointer-events-none absolute left-[-10%] top-[20rem] -z-10 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-3xl"></div>

      <div className="mx-auto max-w-5xl px-6 md:px-10 space-y-16">
        
        {/* Header Title */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-jsyellow/20 bg-jsyellow/10 px-3.5 py-1.5 text-xs font-bold text-slate-805 dark:text-jsyellow">
            <BookOpen className="h-4 w-4" /> Learning Curriculum
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Syllabus Curriculum Map
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            A comprehensive, structured syllabus listing lessons from Javascript syntax basics up to modular arrays and object-oriented transformation methods.
          </p>
        </div>

        {/* Syllabus Grid */}
        <div className="space-y-8">
          {syllabus.map((lvl, index) => (
            <div 
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 space-y-6"
            >
              <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{lvl.level}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{lvl.desc}</p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {lvl.modules.map((m, idx) => (
                  <div key={idx} className="space-y-3">
                    <h4 className="font-bold text-sm text-jsyellow flex items-center gap-1.5">
                      <Layers className="h-4 w-4" /> {m.title}
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-450">
                      {m.topics.map((t, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA section */}
        <div className="rounded-2xl border border-jsyellow/20 bg-jsyellow/5 p-8 md:p-12 text-center max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-black">Test your knowledge with auto-grader challenges</h2>
          <p className="text-xs text-slate-550 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Write real Javascript code, test it in the compiler, pass all test requirements, and climb up the leaderboard ranks.
          </p>
          <div className="flex justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-jsyellow px-6 py-3 text-xs font-bold text-black hover:bg-jsyellow-hover transition"
            >
              Unlock Syllabus Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Curriculum;

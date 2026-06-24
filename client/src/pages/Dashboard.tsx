import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Play, Award, Flame, Star, BookOpen, 
  CheckCircle2, ChevronDown, ChevronUp, ArrowRight, Check,
  Sparkles, Code, Copy, Lock, Compass, Send, X
} from 'lucide-react';
import api from '../services/api';

interface Level {
  id: number;
  title: string;
  description: string;
  orderNum: number;
  modules: Array<{
    id: number;
    levelId: number;
    title: string;
    orderNum: number;
    tasks: Array<{
      id: number;
      moduleId: number;
      title: string;
      difficulty: string;
      orderNum: number;
    }>;
  }>;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  xp: number;
  streak: number;
  level: number;
  rank: number;
  last_task_id?: number;
  last_module_id?: number;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    badge_color: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [expandedLevelId, setExpandedLevelId] = useState<number | null>(1);
  const [referenceTab, setReferenceTab] = useState<'basics' | 'flow' | 'arrays'>('basics');
  const [copyState, setCopyState] = useState<Record<string, boolean>>({});
  
  // AI Modal States
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Fetch student stats from database
  const { data: user } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/students/profile');
      return response.data.data;
    }
  });

  // Fetch full curriculum mapping
  const { data: levels = [] } = useQuery<Level[]>({
    queryKey: ['curriculum-levels'],
    queryFn: async () => {
      const response = await api.get('/curriculum/levels');
      return response.data.data;
    }
  });

  // Fetch solved tasks list
  const { data: solvedTasks = [] } = useQuery<number[]>({
    queryKey: ['user-solved-tasks'],
    queryFn: async () => {
      const response = await api.get('/submissions/user');
      return response.data.data;
    }
  });

  const totalTasks = levels.reduce((acc, lvl) => {
    return acc + lvl.modules.reduce((accMod, mod) => accMod + mod.tasks.length, 0);
  }, 0) || 5;
  const overallProgressPercent = Math.min(100, Math.round((solvedTasks.length / totalTasks) * 100));

  // Circular gauge config
  const circleRadius = 32;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (overallProgressPercent / 100) * circumference;

  // Helper to get all modules in order across levels
  const getOrderedModules = (levelsList: Level[]) => {
    return [...levelsList]
      .sort((a, b) => a.orderNum - b.orderNum)
      .flatMap(lvl => 
        [...lvl.modules].sort((a, b) => a.orderNum - b.orderNum)
      );
  };

  // Helper to check if a specific module is locked
  const checkModuleLocked = (modId: number, levelsList: Level[], solvedList: number[]) => {
    const ordered = getOrderedModules(levelsList);
    const idx = ordered.findIndex(m => m.id === modId);
    if (idx <= 0) return false; // First module is never locked
    for (let i = 0; i < idx; i++) {
      const prev = ordered[i];
      const allSolved = prev.tasks.every(t => solvedList.includes(t.id));
      if (!allSolved) return true;
    }
    return false;
  };

  // Calculate dynamic levels progress
  const levelsProgress = levels.map((lvl) => {
    const lvlTasks: number[] = [];
    lvl.modules.forEach(m => {
      m.tasks.forEach(t => {
        lvlTasks.push(t.id);
      });
    });

    const totalLvlTasks = lvlTasks.length;
    const solvedLvlTasks = lvlTasks.filter(id => solvedTasks.includes(id)).length;
    const progressPercent = totalLvlTasks > 0 ? Math.round((solvedLvlTasks / totalLvlTasks) * 100) : 0;
    
    let isCompleted = progressPercent === 100;
    let isLocked = false;
    
    // Level locking logic: Level is locked if its first module is locked
    if (lvl.modules && lvl.modules.length > 0) {
      const sortedModules = [...lvl.modules].sort((a, b) => a.orderNum - b.orderNum);
      const firstModId = sortedModules[0].id;
      isLocked = checkModuleLocked(firstModId, levels, solvedTasks);
    }

    return {
      id: lvl.id,
      title: lvl.title,
      description: lvl.description,
      progress: progressPercent,
      isCompleted,
      isLocked,
      tasksInfo: `${solvedLvlTasks} / ${totalLvlTasks} Solved`,
      modules: lvl.modules
    };
  });

  // Locate the student's next incomplete task
  let recommendedTask: any = null;
  let recommendedModuleId: number | null = null;
  let recommendedLevelTitle = '';

  let found = false;
  for (const lvl of levels) {
    for (const mod of lvl.modules) {
      for (const t of mod.tasks) {
        if (!solvedTasks.includes(t.id)) {
          recommendedTask = t;
          recommendedModuleId = mod.id;
          recommendedLevelTitle = lvl.title.split(': ')[1] || lvl.title;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) break;
  }

  // Locate student's last visited task
  let lastVisitedTask: any = null;
  let lastVisitedLevelTitle = '';
  if (user?.last_task_id && levels.length > 0) {
    let foundLast = false;
    for (const lvl of levels) {
      for (const mod of lvl.modules) {
        for (const t of mod.tasks) {
          if (t.id === user.last_task_id) {
            lastVisitedTask = t;
            lastVisitedLevelTitle = lvl.title.split(': ')[1] || lvl.title;
            foundLast = true;
            break;
          }
        }
        if (foundLast) break;
      }
      if (foundLast) break;
    }
  }

  const isCurriculumFinished = solvedTasks.length >= totalTasks;

  const toggleLevelExpand = (id: number, isLocked: boolean) => {
    if (isLocked) return;
    setExpandedLevelId(prev => (prev === id ? null : id));
  };

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyState(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopyState(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  // Ask General AI Mentor handler
  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setIsAiModalOpen(true);
    setAiResponse(null);
    try {
      const response = await api.post('/ai/mentor', {
        question: `Explain this JavaScript concept for an absolute beginner with an example: "${aiQuestion}"`,
        code: '// General question from student',
        expectedOutput: 'N/A',
        currentOutput: 'N/A',
        hintsRevealed: 0
      });
      setAiResponse(response.data.message);
    } catch (err) {
      setAiResponse("I'm unable to connect to the model right now. Please verify your internet connection or Google Gemini API key configuration.");
    } finally {
      setAiLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-jsyellow border-t-transparent"></div>
          <p className="text-sm font-semibold">Loading student workspace...</p>
        </div>
      </div>
    );
  }

  // Cheat Sheet Data
  const cheatSheets = {
    basics: {
      title: "Variables & Standard Output",
      desc: "Variables store data values. Use let for values that change, and const for read-only constants.",
      code: `// let permits variable reassignment
let studentName = "Ali";
studentName = "Raza"; 

// const creates immutable values
const maxPoints = 100;

// output values to the screen
console.log("Welcome " + studentName);`
    },
    flow: {
      title: "Conditional Control Flow",
      desc: "Conditional blocks allow your code to make logical decisions dynamically.",
      code: `// Strict equality operator is ===
let score = 85;

if (score >= 90) {
  console.log("Outstanding! Level passed.");
} else if (score >= 50) {
  console.log("Good job! Keep practicing.");
} else {
  console.log("Try again.");
}`
    },
    arrays: {
      title: "Arrays & Iteration",
      desc: "Arrays store lists of items. Map transforms items, filter extracts matching items.",
      code: `let scores = [10, 45, 95, 120];

// Double each score using map
let doubled = scores.map(x => x * 2);

// Keep scores greater than 50
let highScores = scores.filter(x => x > 50);

console.log(highScores); // [95, 120]`
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto relative px-2 sm:px-4">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-jsyellow/5 blur-3xl dark:bg-jsyellow/5 animate-blob"></div>
      <div className="absolute bottom-1/4 left-1/4 -z-10 h-80 w-80 rounded-full bg-orange-500/5 blur-3xl dark:bg-orange-500/5 animate-blob"></div>

      {/* 1. Header Banner & Progress Widget */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-md shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr] items-center">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-jsyellow/15 px-3 py-1 text-[11px] font-bold text-jsyellow uppercase font-mono tracking-wider dark:bg-jsyellow/10">
                <Compass className="h-3.5 w-3.5" /> Core Curriculum
              </span>
              {user.streak > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-bold text-orange-500 uppercase font-mono tracking-wider dark:bg-orange-500/10">
                  <Flame className="h-3.5 w-3.5 fill-current animate-pulse" /> {user.streak} Day Streak
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Welcome back, <span className="text-js-gradient">{user.name}</span>! 👋
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-450 max-w-xl leading-relaxed">
              Step into the world of JavaScript coding! Complete exercises, gain experience points (XP), unlock achievements badges, and earn your certificate.
            </p>
          </div>

          {/* Circular Progress Gauge */}
          <div className="flex items-center justify-start md:justify-end gap-5 border-t border-slate-100 pt-6 md:border-t-0 md:pt-0 dark:border-slate-800">
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="h-20 w-20 transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="40"
                  cy="40"
                  r={circleRadius}
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="6"
                  fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                  cx="40"
                  cy="40"
                  r={circleRadius}
                  className="stroke-jsyellow transition-all duration-1000 ease-out"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{overallProgressPercent}%</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Done</span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Syllabus Progression</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You have passed <strong className="text-slate-900 dark:text-white">{solvedTasks.length}</strong> of the <strong className="text-slate-900 dark:text-white">{totalTasks}</strong> core coding challenges.
              </p>
            </div>
          </div>

        </div>
      </div>


      {/* 2. Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        
        {/* Streak */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-glow dark:border-slate-800/80 dark:bg-slate-900">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-orange-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Daily Streak</p>
              <h4 className="mt-1 text-2xl font-black text-slate-900 dark:text-white animate-count-up">{user.streak || 0} Days</h4>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 group-hover:scale-110 group-hover:bg-orange-500/20 transition duration-300">
              <Flame className="h-6 w-6 fill-current" />
            </div>
          </div>
          <div className="mt-4 text-[11px] text-slate-500 dark:text-slate-400">
            {user.streak > 0 ? "🔥 Keep it up! Log in daily." : "Solve a task to start a streak!"}
          </div>
        </div>

        {/* Total XP */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-glow dark:border-slate-800/80 dark:bg-slate-900">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-jsyellow to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Experience Points</p>
              <h4 className="mt-1 text-2xl font-black text-slate-900 dark:text-white animate-count-up">{Number(user.xp || 0).toLocaleString()} XP</h4>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-jsyellow/15 text-jsyellow group-hover:scale-110 group-hover:bg-jsyellow/25 transition duration-300">
              <Star className="h-5 w-5 fill-current" />
            </div>
          </div>
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-jsyellow to-amber-400 transition-all duration-1000"
                style={{ width: `${Math.min(100, (user.xp % 1000) / 10)}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-400">Level {user.level || 1} · {1000 - (user.xp % 1000)} XP to next level</p>
          </div>
        </div>

        {/* Completed Challenges */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-glow dark:border-slate-800/80 dark:bg-slate-900">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Solved Tasks</p>
              <h4 className="mt-1 text-2xl font-black text-slate-900 dark:text-white animate-count-up">{solvedTasks.length} / {totalTasks}</h4>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 group-hover:bg-blue-500/20 transition duration-300">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-[11px] text-slate-500 dark:text-slate-400">
            {totalTasks - solvedTasks.length} tasks left · {overallProgressPercent}% complete
          </div>
        </div>

        {/* Leaderboard Rank */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-glow dark:border-slate-800/80 dark:bg-slate-900">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Global Standings</p>
              <h4 className="mt-1 text-2xl font-black text-slate-900 dark:text-white animate-count-up">#{user.rank || 'N/A'}</h4>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 group-hover:bg-purple-500/20 transition duration-300">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-[11px] text-slate-500 dark:text-slate-400">
            Among all registered students
          </div>
        </div>

      </div>

      {/* 3. Primary Workspace Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        
        {/* LEFT COLUMN: The Interactive Learning Roadmap */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">JavaScript Journey Roadmap</h2>
              <p className="text-xs text-slate-500 dark:text-slate-450">Follow the path step-by-step. Solve tasks to unlock subsequent levels.</p>
            </div>
          </div>

          <div className="relative border-l-2 border-slate-200 pl-6 space-y-6 dark:border-slate-850 ml-3">
            {levelsProgress.map((lvl) => {
              const isExpanded = expandedLevelId === lvl.id;
              
              // Colors configuration
              let nodeColor = 'bg-slate-250 border-slate-300 text-slate-400 dark:bg-slate-800 dark:border-slate-700';
              let borderGlow = 'border-slate-200/60 dark:border-slate-850';
              
              if (lvl.isCompleted) {
                nodeColor = 'bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-500/20';
              } else if (!lvl.isLocked) {
                nodeColor = 'bg-jsyellow border-jsyellow text-black shadow-lg shadow-jsyellow/20 animate-pulse';
                borderGlow = 'border-jsyellow/20 dark:border-jsyellow/10 ring-1 ring-jsyellow/15';
              }

              return (
                <div key={lvl.id} className="relative group/timeline">
                  
                  {/* Timeline Node Symbol */}
                  <div className={`absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-black transition-all duration-300 z-10 ${nodeColor}`}>
                    {lvl.isCompleted ? <Check className="h-3 w-3" /> : lvl.id}
                  </div>

                  {/* Level Card */}
                  <div className={`rounded-2xl border bg-white shadow-sm dark:bg-slate-900 transition-all duration-300 ${borderGlow} ${lvl.isLocked ? 'opacity-60' : 'hover:shadow-md'}`}>
                    
                    {/* Header */}
                    <button
                      onClick={() => toggleLevelExpand(lvl.id, lvl.isLocked)}
                      disabled={lvl.isLocked}
                      className={`w-full flex items-center justify-between p-5 text-left select-none ${lvl.isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="space-y-1.5 flex-1 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white group-hover/timeline:text-jsyellow transition-colors duration-200">
                            {lvl.title}
                          </span>
                          {lvl.isLocked ? (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-850 dark:text-slate-400">
                              <Lock className="h-2.5 w-2.5" /> Locked
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded dark:bg-slate-850 dark:text-slate-400">
                              {lvl.tasksInfo}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal max-w-lg">{lvl.description}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Horizontal Mini progress gauge */}
                        {!lvl.isLocked && (
                          <div className="hidden sm:flex flex-col items-end gap-1 w-20">
                            <span className="text-[10px] font-extrabold text-slate-500">{lvl.progress}%</span>
                            <div className="h-1 w-full bg-slate-100 rounded-full dark:bg-slate-800 overflow-hidden">
                              <div 
                                className={`h-full ${lvl.isCompleted ? 'bg-emerald-500' : 'bg-jsyellow'}`} 
                                style={{ width: `${lvl.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        {!lvl.isLocked && (
                          isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-slate-450" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-450" />
                          )
                        )}
                      </div>
                    </button>

                    {/* Collapsible Tasks List */}
                    {!lvl.isLocked && isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/15 p-5 pt-4 dark:border-slate-800/60 dark:bg-slate-950/20 space-y-4 rounded-b-2xl">
                        {lvl.modules.map((mod) => {
                          const isModLocked = checkModuleLocked(mod.id, levels, solvedTasks);
                          return (
                            <div key={mod.id} className={`space-y-2 ${isModLocked ? 'opacity-65' : ''}`}>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-100/60 dark:border-slate-800/40 flex items-center gap-1.5 select-none">
                                {isModLocked && <Lock className="h-3 w-3 text-slate-400" />}
                                Module {mod.id}: {mod.title}
                              </span>
                              
                              <div className="grid gap-3 sm:grid-cols-2">
                                {mod.tasks.map((t, taskIdx) => {
                                  const isSolved = solvedTasks.includes(t.id);
                                  // Task-level sequential locking: each task needs previous task solved
                                  const prevTask = taskIdx > 0 ? mod.tasks[taskIdx - 1] : null;
                                  const isTaskLocked = !isSolved && taskIdx > 0 && prevTask ? !solvedTasks.includes(prevTask.id) : false;
                                  const isEffectiveLocked = isModLocked || isTaskLocked;
                                  const isNextUp = !isEffectiveLocked && recommendedTask && recommendedTask.id === t.id;
                                  
                                  let cardBorder = 'border-slate-150 bg-white dark:border-slate-800/65 dark:bg-slate-900';
                                  if (isEffectiveLocked) {
                                    cardBorder = 'border-slate-200 bg-slate-50/50 dark:border-slate-800/60 dark:bg-slate-900/50 cursor-not-allowed select-none pointer-events-none opacity-50';
                                  } else if (isSolved) {
                                    cardBorder = 'border-emerald-500/20 bg-emerald-50/5 hover:border-emerald-500/40 dark:border-emerald-950/20 dark:bg-emerald-950/5';
                                  } else if (isNextUp) {
                                    cardBorder = 'border-jsyellow/40 bg-jsyellow/5 dark:border-jsyellow/20 dark:bg-jsyellow/5 shadow-sm shadow-jsyellow/5';
                                  }

                                  const cardContent = (
                                    <>
                                      <div className="space-y-1.5 pr-2">
                                        <div className="flex items-center gap-1.5">
                                          <p className="text-xs font-bold text-slate-850 dark:text-slate-200 leading-snug">{t.title}</p>
                                          {!isEffectiveLocked && isNextUp && (
                                            <span className="inline-flex h-2 w-2 rounded-full bg-jsyellow animate-ping"></span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1 text-[9px] text-slate-400 uppercase font-bold">
                                          <span className={`px-1.5 py-0.5 rounded ${
                                            isEffectiveLocked
                                              ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                              : t.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                t.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-505' :
                                                'bg-rose-500/10 text-rose-500'
                                          }`}>
                                            {t.difficulty}
                                          </span>
                                          <span>•</span>
                                          <span>{t.difficulty === 'easy' ? '50 XP' : t.difficulty === 'medium' ? '100 XP' : '150 XP'}</span>
                                        </div>
                                      </div>
                                      
                                      {isEffectiveLocked ? (
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                                          <Lock className="h-3.5 w-3.5" />
                                        </div>
                                      ) : isSolved ? (
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-450">
                                          <CheckCircle2 className="h-4 w-4 fill-current text-emerald-500" />
                                        </div>
                                      ) : (
                                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-250 ${
                                          isNextUp 
                                            ? 'bg-jsyellow border-jsyellow text-black hover:bg-jsyellow-hover' 
                                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-jsyellow hover:bg-jsyellow/10 hover:text-jsyellow dark:bg-slate-850 dark:border-slate-800'
                                        }`}>
                                          <Play className="h-3.5 w-3.5 fill-current" />
                                        </div>
                                      )}
                                    </>
                                  );

                                  if (isEffectiveLocked) {
                                    return (
                                      <div
                                        key={t.id}
                                        title={isTaskLocked ? "Complete the previous task first to unlock this one" : "Complete previous module first"}
                                        className={`flex items-center justify-between rounded-xl border p-4.5 ${cardBorder}`}
                                      >
                                        {cardContent}
                                      </div>
                                    );
                                  }

                                  return (
                                    <Link
                                      key={t.id}
                                      to={`/learn/${mod.id}/${t.id}`}
                                      className={`flex items-center justify-between rounded-xl border p-4.5 transition duration-200 hover:-translate-y-0.5 ${cardBorder}`}
                                    >
                                      {cardContent}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar (Resume Card + Quick AI Box + Cheat Sheet Desk) */}
        <div className="space-y-6">
          
          {/* Quick Resume Challenge Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-250/70 bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-white shadow-lg dark:border-slate-850 dark:from-slate-900 dark:to-slate-950">
            {/* Ambient Background Glow */}
            <div className="absolute right-0 top-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-jsyellow/10 blur-2xl"></div>
            
            <div className="space-y-4">
              <span className="inline-flex rounded bg-jsyellow/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-jsyellow font-mono">
                Resume Learning
              </span>

              {isCurriculumFinished ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-1.5 font-mono">
                    🎓 Course Completed!
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Splendid achievement! You have successfully resolved all 5 core JavaScript coding challenges. Claim your official JS BootCamp completion certificate now.
                  </p>
                  <Link
                    to="/certificate"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-jsyellow py-3 text-xs font-bold text-black hover:bg-jsyellow-hover transition duration-200 shadow-lg shadow-jsyellow/10"
                  >
                    Get Graduation Certificate <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : lastVisitedTask ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium">{lastVisitedLevelTitle}</span>
                    <h3 className="text-lg font-black text-white leading-tight">{lastVisitedTask.title}</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    Difficulty Level: <strong className="text-jsyellow capitalize">{lastVisitedTask.difficulty}</strong>. Resume your JS practice right where you left off.
                  </p>
                  <Link
                    to={`/learn/${user.last_module_id}/${user.last_task_id}`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-jsyellow py-3 text-xs font-bold text-black hover:bg-jsyellow-hover transition duration-200 shadow-lg shadow-jsyellow/10"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" /> Resume Learning <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : recommendedTask ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium">{recommendedLevelTitle}</span>
                    <h3 className="text-lg font-black text-white leading-tight">{recommendedTask.title}</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    Difficulty Level: <strong className="text-jsyellow capitalize">{recommendedTask.difficulty}</strong>. Complete this exercise to unlock more advanced modules.
                  </p>
                  <Link
                    to={`/learn/${recommendedModuleId}/${recommendedTask.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-jsyellow py-3 text-xs font-bold text-black hover:bg-jsyellow-hover transition duration-200 shadow-lg shadow-jsyellow/10"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" /> Solve Challenge <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Loading next curriculum challenge...</p>
              )}
            </div>
          </div>

          {/* Quick AI Mentor Assistant Widget */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-jsyellow/15 text-jsyellow">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Ask AI Mentor</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Confused by a JS concept? Type your question below to get an instant beginner-friendly explanation.
            </p>
            
            <form onSubmit={handleAskAi} className="space-y-3">
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="e.g. what is let vs const?"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-jsyellow"
              />
              <button
                type="submit"
                disabled={!aiQuestion.trim()}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-850 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:hover:bg-slate-750"
              >
                <Send className="h-3.5 w-3.5" /> Ask Mentor
              </button>
            </form>
          </div>

          {/* JavaScript Quick Reference Desk (Tabbed Widget) */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Code className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">JS Reference Desk</h3>
            </div>
            
            {/* Custom Tab buttons */}
            <div className="flex border-b border-slate-100 mb-4 dark:border-slate-800">
              <button
                onClick={() => setReferenceTab('basics')}
                className={`flex-1 pb-2 text-center text-xs font-bold transition-all ${
                  referenceTab === 'basics' 
                    ? 'border-b-2 border-jsyellow text-slate-900 dark:text-white' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Basics
              </button>
              <button
                onClick={() => setReferenceTab('flow')}
                className={`flex-1 pb-2 text-center text-xs font-bold transition-all ${
                  referenceTab === 'flow' 
                    ? 'border-b-2 border-jsyellow text-slate-900 dark:text-white' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Control
              </button>
              <button
                onClick={() => setReferenceTab('arrays')}
                className={`flex-1 pb-2 text-center text-xs font-bold transition-all ${
                  referenceTab === 'arrays' 
                    ? 'border-b-2 border-jsyellow text-slate-900 dark:text-white' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Arrays
              </button>
            </div>

            {/* Displaying selected Cheat Sheet */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {cheatSheets[referenceTab].title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                {cheatSheets[referenceTab].desc}
              </p>

              {/* Code Snippet block */}
              <div className="relative group/code rounded-xl overflow-hidden bg-slate-950 p-4 border border-slate-900 font-mono text-[10px] text-slate-300">
                <button
                  onClick={() => handleCopyCode(cheatSheets[referenceTab].code, referenceTab)}
                  className="absolute right-2 top-2 hidden group-hover/code:flex h-6 w-6 items-center justify-center rounded bg-slate-800 hover:bg-slate-700 transition"
                  title="Copy code"
                >
                  {copyState[referenceTab] ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-slate-400" />
                  )}
                </button>
                <pre className="overflow-x-auto text-left whitespace-pre">{cheatSheets[referenceTab].code}</pre>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. AI Tutor Guidance Dialog Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <div 
            onClick={() => setIsAiModalOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          ></div>

          {/* Modal box */}
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-850 dark:bg-slate-900 text-left overflow-hidden z-10 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2 text-jsyellow">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">AI Tutor Guidance</h3>
              </div>
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-4">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/40 text-xs border border-slate-100 dark:border-slate-900">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Your Question:</span>
                <p className="italic text-slate-700 dark:text-slate-350">"{aiQuestion}"</p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-jsyellow uppercase tracking-wider block">AI Explanation:</span>
                
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-3 text-slate-400">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-jsyellow border-t-transparent"></div>
                    <span className="text-xs font-semibold animate-pulse">Consulting Gemini Tutor...</span>
                  </div>
                ) : aiResponse ? (
                  <div className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-jsyellow/5 p-4 rounded-xl border border-jsyellow/15 font-sans">
                    {aiResponse}
                  </div>
                ) : (
                  <p className="text-xs text-rose-500">Failed to generate response. Try again later.</p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end dark:border-slate-800">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="rounded-xl bg-jsyellow px-5 py-2 text-xs font-bold text-black hover:bg-jsyellow-hover transition"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

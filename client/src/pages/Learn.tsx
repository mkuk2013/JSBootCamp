import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Play, CheckCircle2, ChevronLeft, 
  ChevronRight, Terminal, HelpCircle, Sparkles,
  RefreshCw, Send, X, Award, Menu, RotateCcw, Lock, Copy
} from 'lucide-react';
import axios from 'axios';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface Task {
  id: number;
  moduleId: number;
  title: string;
  question: string;
  starterCode: string;
  expectedOutput: string;
  testCases: Array<{ input: any[]; expected: any; funcName: string; type?: string }>;
  hints: string[];
  examples: string;
  difficulty: 'easy' | 'medium' | 'hard';
  orderNum: number;
}

interface ModuleDetails {
  id: number;
  levelId: number;
  title: string;
  content: string;
  orderNum: number;
  tasks: Task[];
}

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

const Learn: React.FC = () => {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useTheme();

  const [code, setCode] = useState('');
  const [output, setOutput] = useState('Console output will appear here...');
  const [testResults, setTestResults] = useState<Array<{label: string; passed: boolean; expected: string; got: string}>>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState<'theory' | 'tasks'>('theory');
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [codeCopied, setCodeCopied] = useState(false);
  const [outputCopied, setOutputCopied] = useState(false);
  const [runtimeMs, setRuntimeMs] = useState<number | null>(null);
  const [showRunBar, setShowRunBar] = useState(false);

  // AI Mentor state
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [aiInput, setAiInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [revealedHints, setRevealedHints] = useState(0);;

  // New badge unlock modal state
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);

  // Syllabus drawer state
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);

  // Mobile navigation tab state
  const [mobileTab, setMobileTab] = useState<'docs' | 'editor' | 'console'>('docs');

  // Particles celebration state
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; angle: number; speed: number }[]>([]);

  // Fetch full curriculum mapping
  const { data: levels = [] } = useQuery<Level[]>({
    queryKey: ['curriculum-levels'],
    queryFn: async () => {
      const response = await api.get('/curriculum/levels');
      return response.data.data;
    }
  });



  // Fetch current module details
  const { data: moduleData, isLoading: moduleLoading } = useQuery<ModuleDetails>({
    queryKey: ['curriculum-module', moduleId],
    queryFn: async () => {
      const response = await api.get(`/curriculum/modules/${moduleId}`);
      return response.data.data;
    },
    enabled: !!moduleId
  });

  // Fetch solved tasks list to highlight icons
  const { data: solvedTasks = [] } = useQuery<number[]>({
    queryKey: ['user-solved-tasks'],
    queryFn: async () => {
      const response = await api.get('/submissions/user');
      return response.data.data;
    }
  });

  // Identify current task
  const currentTaskId = Number(lessonId);
  const tasks = moduleData?.tasks || [];
  const currentTask = tasks.find(t => t.id === currentTaskId);
  const currentTaskIdx = tasks.findIndex(t => t.id === currentTaskId);

  // Initialize Code state when task loads
  useEffect(() => {
    if (currentTask) {
      setCode(currentTask.starterCode || '');
      setOutput('Console output will appear here...');
      setIsAccepted(false);
      setHintsRevealed(0);
      setChatMessages([
        { 
          sender: 'ai', 
          text: `Hi! I'm your AI JavaScript Mentor. Show me your code, or ask me any question about the "${currentTask.title}" challenge. I'll guide you to the solution without giving away the direct code!`
        }
      ]);
    }
  }, [currentTask]);

  // Helper to get all modules in order across levels
  const getOrderedModules = (levelsList: Level[]) => {
    return [...levelsList]
      .sort((a, b) => a.orderNum - b.orderNum)
      .flatMap(lvl => 
        [...lvl.modules].sort((a, b) => a.orderNum - b.orderNum)
      );
  };

  // Helper to check if a specific module is locked
  const isModuleLocked = (modId: number) => {
    const ordered = getOrderedModules(levels);
    const idx = ordered.findIndex(m => m.id === modId);
    if (idx <= 0) return false; // First module is never locked
    for (let i = 0; i < idx; i++) {
      const prev = ordered[i];
      const allSolved = prev.tasks.every(t => solvedTasks.includes(t.id));
      if (!allSolved) return true;
    }
    return false;
  };

  // Helper to check if a specific task is locked (previous task in same module must be solved)
  const isTaskLockedFn = (taskId: number, modTasks: typeof tasks) => {
    const idx = modTasks.findIndex(t => t.id === taskId);
    if (idx <= 0) return false; // First task is never locked
    const prevTask = modTasks[idx - 1];
    return !solvedTasks.includes(prevTask.id);
  };

  // Redirect if trying to access locked module's task OR locked task directly
  useEffect(() => {
    if (moduleId && levels.length > 0 && solvedTasks.length >= 0 && tasks.length > 0 && currentTaskId) {
      const mid = Number(moduleId);
      if (isModuleLocked(mid)) {
        navigate('/dashboard', { replace: true });
        return;
      }
      // Task-level lock: if this task is locked, redirect to the last unlocked task in this module
      if (isTaskLockedFn(currentTaskId, tasks)) {
        // Find the last solved or first unsolved task in module
        const firstUnlocked = tasks.find(t => !solvedTasks.includes(t.id));
        if (firstUnlocked) {
          navigate(`/learn/${moduleId}/${firstUnlocked.id}`, { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    }
  }, [moduleId, currentTaskId, levels, solvedTasks, tasks, navigate]);

  // Save current active task progress
  useEffect(() => {
    if (currentTaskId && !isNaN(currentTaskId) && levels.length > 0 && tasks.length > 0) {
      const mid = Number(moduleId);
      // Only save progress if the module and the task are NOT locked!
      if (!isModuleLocked(mid) && !isTaskLockedFn(currentTaskId, tasks)) {
        const controller = new AbortController();
        api.put('/students/profile/last-task', { lastTaskId: currentTaskId }, { signal: controller.signal })
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
          })
          .catch(err => {
            if (err.name !== 'CanceledError' && err.message !== 'canceled' && !axios.isCancel?.(err)) {
              console.error('Failed to save last active task progress:', err);
            }
          });
        return () => {
          controller.abort();
        };
      }
    }
  }, [currentTaskId, moduleId, levels, solvedTasks, tasks, queryClient]);

  // Dynamic Theme
  const editorTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'light')
    : (theme === 'dark' ? 'vs-dark' : 'light');

  // Confetti Particle Celebration Trigger
  const triggerConfetti = () => {
    const newParticles = [];
    const colors = ['#F7DF1E', '#10B981', '#3B82F6', '#EF4444', '#EC4899', '#8B5CF6'];
    for (let i = 0; i < 70; i++) {
      newParticles.push({
        id: Math.random(),
        x: 50,
        y: 45,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * 360,
        speed: 3 + Math.random() * 6
      });
    }
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2500);
  };

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          handleSubmitCode();
        } else {
          runCode();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, currentTask]);

  // Reset to Starter Code confirmation
  const handleResetCode = () => {
    if (!currentTask) return;
    const confirmReset = window.confirm("Are you sure you want to reset the editor code back to the starter template?");
    if (confirmReset) {
      setCode(currentTask.starterCode || '');
      setOutput('Code reset to starter template.');
      setIsAccepted(false);
    }
  };

  // Code runner
  const runCode = () => {
    if (!currentTask) return;
    setIsRunning(true);
    setIsAccepted(false);
    setTestResults([]);
    setRuntimeMs(null);
    setShowRunBar(true);
    setOutput('⏳ Running test suite in sandbox...');
    const startTime = Date.now();

    setTimeout(async () => {
      setIsRunning(false);
      setShowRunBar(false);
      const elapsed = Date.now() - startTime;
      setRuntimeMs(elapsed);

      try {
        const testCases = currentTask.testCases;
        if (!testCases || testCases.length === 0) {
          throw new Error('No test cases defined for this task.');
        }

        const logs: string[] = [];
        const customConsole = {
          log: (...args: any[]) => {
            logs.push(args.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '));
          }
        };

        const isScript = testCases[0] && (testCases[0] as any).type === 'script';
        let allPassed = true;
        const details: string[] = [];
        const newTestResults: Array<{label: string; passed: boolean; expected: string; got: string}> = [];

        if (isScript) {
          const runScript = new Function('console', `
            let lastVal;
            try {
              lastVal = eval(${JSON.stringify(code)});
            } catch(e) {
              lastVal = (function(){
                ${code}
              })();
            }
            return lastVal;
          `);
          
          const scriptResult = runScript(customConsole);

          testCases.forEach((tc, idx) => {
            const expectedStr = String(tc.expected).trim();
            const hasLog = logs.some(log => log.trim() === expectedStr);
            const hasReturn = String(scriptResult).trim() === expectedStr;
            const pass = hasLog || hasReturn;
            newTestResults.push({ label: `Test ${idx + 1}: Expected "${tc.expected}"`, passed: pass, expected: String(tc.expected), got: hasLog ? logs.find(l => l.trim() === expectedStr) || '' : String(scriptResult) });
            if (pass) {
              details.push(`✓ Test ${idx + 1}: Passed`);
            } else {
              allPassed = false;
              details.push(`✗ Test ${idx + 1}: Expected "${tc.expected}" in output`);
            }
          });
        } else {
          const funcName = testCases[0].funcName;
          const runFn = new Function('console', `${code}\nreturn typeof ${funcName} !== 'undefined' ? ${funcName} : null;`);
          const targetFn = runFn(customConsole);

          if (typeof targetFn !== 'function') {
            throw new Error(`Function "${funcName}" is not defined. Make sure you declared: function ${funcName}(...) { ... }`);
          }

          for (let idx = 0; idx < testCases.length; idx++) {
            const tc = testCases[idx];
            const args = tc.input.map((arg: any) => {
              if (typeof arg === 'string' && (arg.startsWith('(') || arg.startsWith('function'))) {
                return new Function(`return ${arg}`)();
              }
              return arg;
            });

            let result: any;
            let pass = false;
            let executionError: any = null;

            try {
              if (tc.type === 'closure') {
                const innerFn = targetFn(...args);
                if (typeof innerFn !== 'function') throw new Error(`Closure creator did not return a function.`);
                const results = [innerFn(), innerFn(), innerFn()];
                result = results;
                pass = Array.isArray(tc.expected) && tc.expected.every((v, i) => results[i] === v);
              } else if (tc.type === 'error') {
                try { targetFn(...args); result = 'No error thrown'; } catch (e: any) { result = e.message; }
                pass = result === tc.expected;
              } else if (tc.type === 'func_length') {
                const val = targetFn(...args);
                result = typeof val === 'string' ? val.length : 0;
                pass = result === tc.expected;
              } else {
                const val = targetFn(...args);
                if (val && typeof val.then === 'function') { result = await val; } else { result = val; }
                if (Array.isArray(tc.expected)) {
                  pass = Array.isArray(result) && result.length === tc.expected.length && result.every((v, i) => v === tc.expected[i]);
                } else if (typeof tc.expected === 'object' && tc.expected !== null && result !== null && typeof result === 'object') {
                  pass = Object.keys(tc.expected).length === Object.keys(result).length && Object.keys(tc.expected).every(k => result[k] === tc.expected[k]);
                } else {
                  pass = result === tc.expected;
                }
              }
            } catch (e: any) {
              executionError = e;
              if (tc.type === 'promise_catch' && e.message === tc.expected) { pass = true; result = e.message; }
              else { allPassed = false; }
            }

            const label = tc.funcName ? `Test ${idx + 1}: ${tc.funcName}(${(tc.input || []).map((x: any) => JSON.stringify(x)).join(', ')})` : `Test ${idx + 1}`;
            newTestResults.push({ label, passed: pass, expected: JSON.stringify(tc.expected), got: executionError ? executionError.message : JSON.stringify(result) });

            if (pass) {
              details.push(`✓ Test ${idx + 1}: Passed (${JSON.stringify(result)})`);
            } else {
              allPassed = false;
              if (executionError) details.push(`✗ Test ${idx + 1}: Error — ${executionError.message}`);
              else details.push(`✗ Test ${idx + 1}: Expected ${JSON.stringify(tc.expected)}, got ${JSON.stringify(result)}`);
            }
          }
        }

        setTestResults(newTestResults);
        const passedCount = newTestResults.filter(r => r.passed).length;
        const totalCount = newTestResults.length;
        const summaryLine = allPassed
          ? `✅ All ${totalCount} test(s) passed!`
          : `❌ ${passedCount}/${totalCount} test(s) passed`;
        setOutput([summaryLine, ...(logs.length > 0 ? ['', '--- Console Logs ---', ...logs] : []), '', ...details].join('\n'));
        setIsAccepted(allPassed);
        if (allPassed) triggerConfetti();
      } catch (err: any) {
        setOutput(`❌ Error: ${err.message || 'Execution failed.'}`);
        setIsAccepted(false);
        setTestResults([]);
      }
    }, 500);
  };

  // Submit code logic
  const submitCodeMutation = useMutation({
    mutationFn: async (payload: { taskId: number; code: string; passed: boolean; output: string; runtimeMs: number }) => {
      const response = await api.post('/submissions', payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-solved-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });

      if (data.pass) {
        triggerConfetti();
        if (data.unlockedAchievements && data.unlockedAchievements.length > 0) {
          setUnlockedBadges(data.unlockedAchievements);
        }
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.error?.message || 'Failed to submit code.');
    }
  });

  const handleSubmitCode = () => {
    if (!currentTask) return;
    
    try {
      const testCases = currentTask.testCases;
      const isScript = testCases[0] && (testCases[0] as any).type === 'script';
      let allPassed = true;

      if (isScript) {
        const logs: string[] = [];
        const customConsole = {
          log: (...args: any[]) => {
            logs.push(args.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '));
          }
        };
        const runScript = new Function('console', `
          let lastVal;
          try {
            lastVal = eval(${JSON.stringify(code)});
          } catch(e) {
            lastVal = (function(){
              ${code}
            })();
          }
          return lastVal;
        `);
        const scriptResult = runScript(customConsole);

        testCases.forEach((tc) => {
          const expectedStr = String(tc.expected).trim();
          const hasLog = logs.some(log => log.trim() === expectedStr);
          const hasReturn = String(scriptResult).trim() === expectedStr;
          if (!(hasLog || hasReturn)) {
            allPassed = false;
          }
        });
      } else {
        const customConsole = { log: () => {} };
        const funcName = testCases[0].funcName;
        const runFn = new Function('console', `${code}\nreturn typeof ${funcName} !== 'undefined' ? ${funcName} : null;`);
        const targetFn = runFn(customConsole);

        if (typeof targetFn !== 'function') {
          alert('Please run and test your code locally first. The function is not declared.');
          return;
        }

        testCases.forEach((tc) => {
          const args = JSON.parse(JSON.stringify(tc.input));
          const result = targetFn(...args);
          let pass = false;
          if (Array.isArray(tc.expected)) {
            pass = Array.isArray(result) && result.length === tc.expected.length && result.every((v, i) => v === tc.expected[i]);
          } else {
            pass = result === tc.expected;
          }
          if (!pass) allPassed = false;
        });
      }

      submitCodeMutation.mutate({
        taskId: currentTask.id,
        code,
        passed: allPassed,
        output: output,
        runtimeMs: 45
      });
    } catch (err: any) {
      alert(`Errors detected: ${err.message}. Resolve issues before submitting.`);
    }
  };

  // Ask AI Mentor logic
  const askAiMentor = async (customQuestion?: string) => {
    if (!currentTask) return;
    
    const queryText = customQuestion || `Provide a helpful hint for completing the challenge "${currentTask.title}".`;
    
    // Add user message to chat history
    setChatMessages(prev => [...prev, { sender: 'user', text: queryText }]);
    setAiInput('');
    setAiLoading(true);
    setIsAiOpen(true);
    
    try {
      const response = await api.post('/ai/mentor', {
        code,
        question: `${currentTask.question}\n\nStudent's direct question: ${queryText}`,
        expectedOutput: currentTask.expectedOutput,
        currentOutput: output,
        hintsRevealed
      });
      
      const reply = response.data.message;
      setChatMessages(prev => [...prev, { sender: 'ai', text: reply }]);
      setHintsRevealed(prev => prev + 1);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: "Failed to query AI Mentor. Verify your internet connection or Google Gemini API key configuration." }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Syllabus custom markdown renderer
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n\n').map((paragraph, index) => {
      if (paragraph.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-black mt-2 mb-3 text-slate-900 dark:text-white">{paragraph.replace('# ', '')}</h1>;
      }
      if (paragraph.startsWith('## ')) {
        return <h2 key={index} className="text-lg font-extrabold mt-4 mb-2 text-slate-800 dark:text-slate-200">{paragraph.replace('## ', '')}</h2>;
      }
      if (paragraph.startsWith('### ')) {
        return <h3 key={index} className="text-sm font-bold mt-3 mb-2 text-slate-700 dark:text-slate-350">{paragraph.replace('### ', '')}</h3>;
      }
      if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
        return (
          <ul key={index} className="list-disc pl-5 my-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
            {paragraph.split('\n').map((li, i) => (
              <li key={i}>{li.replace(/^[-*]\s+/, '')}</li>
            ))}
          </ul>
        );
      }
      if (paragraph.startsWith('```')) {
        const codeLines = paragraph.split('\n');
        const code = codeLines.slice(1, -1).join('\n');
        return (
          <pre key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs dark:border-slate-800 dark:bg-slate-950 overflow-x-auto my-3 text-emerald-600 dark:text-emerald-400">
            <code>{code}</code>
          </pre>
        );
      }
      const parts = paragraph.split('`');
      return (
        <p key={index} className="text-slate-655 text-sm leading-relaxed dark:text-slate-350 my-2">
          {parts.map((part, i) => i % 2 === 1 ? (
            <code key={i} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-850 text-jsyellow font-bold">{part}</code>
          ) : part)}
        </p>
      );
    });
  };

  // Is current task solved (needed to lock next navigation)
  const isCurrentTaskSolved = solvedTasks.includes(currentTaskId);

  // Navigations: Next / Previous tasks
  const handlePrevTask = () => {
    if (currentTaskIdx > 0 && tasks[currentTaskIdx - 1]) {
      navigate(`/learn/${moduleId}/${tasks[currentTaskIdx - 1].id}`);
    }
  };

  const handleNextTask = () => {
    // Block navigation to next task if current task is not solved
    if (!isCurrentTaskSolved) return;
    if (currentTaskIdx < tasks.length - 1 && tasks[currentTaskIdx + 1]) {
      navigate(`/learn/${moduleId}/${tasks[currentTaskIdx + 1].id}`);
    }
  };

  if (moduleLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-jsyellow" />
          <span className="text-sm font-semibold">Loading curriculum workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 top-16 flex flex-col lg:flex-row overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      
      {/* Mobile Tab Navigation Bar */}
      <div className="flex lg:hidden shrink-0 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-xs font-bold shadow-sm">
        <button
          onClick={() => setMobileTab('docs')}
          className={`flex-1 py-3.5 text-center border-b-2 transition-all duration-200 ${
            mobileTab === 'docs' 
              ? 'border-jsyellow text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-850/20' 
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          {activeTab === 'theory' ? '📖 Theory' : '🎯 Task'}
        </button>
        <button
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-3.5 text-center border-b-2 transition-all duration-200 ${
            mobileTab === 'editor' 
              ? 'border-jsyellow text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-850/20' 
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          💻 Editor
        </button>
        <button
          onClick={() => setMobileTab('console')}
          className={`flex-1 py-3.5 text-center border-b-2 transition-all duration-200 ${
            mobileTab === 'console' 
              ? 'border-jsyellow text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-850/20' 
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          📟 Console {testResults.length > 0 && `(${testResults.filter(r => r.passed).length}/${testResults.length})`}
        </button>
      </div>

      {/* Left panel: Curriculum list sidebar + Task description */}
      <div className={`w-full lg:w-1/2 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${
        mobileTab === 'docs' ? 'flex' : 'hidden lg:flex'
      }`}>
        
        {/* Module Header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSyllabusOpen(true)}
              className="mr-1 rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer animate-pulse"
              title="Open Syllabus Outline"
            >
              <Menu className="h-4.5 w-4.5 text-slate-500 hover:text-jsyellow transition-colors" />
            </button>
            <BookOpen className="h-4.5 w-4.5 text-jsyellow" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Module {moduleId}: {moduleData?.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={handlePrevTask}
              disabled={currentTaskIdx <= 0}
              className="rounded p-1 hover:bg-slate-105 dark:hover:bg-slate-800 disabled:opacity-30"
              title="Previous Task"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <span className="text-xs font-bold text-slate-550 py-1">
              {currentTaskIdx !== -1 ? `${currentTaskIdx + 1} / ${tasks.length}` : '0 / 0'}
            </span>
            <button 
              onClick={handleNextTask}
              disabled={currentTaskIdx === -1 || currentTaskIdx >= tasks.length - 1 || !isCurrentTaskSolved}
              className="rounded p-1 hover:bg-slate-105 dark:hover:bg-slate-800 disabled:opacity-30"
              title={!isCurrentTaskSolved ? 'Solve this task first to unlock the next one' : 'Next Task'}
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex shrink-0 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold">
          <button 
            onClick={() => setActiveTab('theory')}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              activeTab === 'theory' ? 'border-jsyellow text-slate-900 dark:text-white' : 'border-transparent text-slate-400'
            }`}
          >
            Theory & Concepts
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              activeTab === 'tasks' ? 'border-jsyellow text-slate-900 dark:text-white' : 'border-transparent text-slate-400'
            }`}
          >
            Practice Task
          </button>
        </div>

        {/* Lesson Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          {activeTab === 'theory' ? (
            <div className="space-y-4">
              {moduleData?.content ? renderMarkdown(moduleData.content) : (
                <p className="text-slate-400 text-sm">No lecture theory materials uploaded for this module.</p>
              )}
            </div>
          ) : currentTask ? (
            <div className="space-y-5 animate-fade-in-up">
              {/* Task header */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-xl font-black leading-tight">{currentTask.title}</h1>
                  {solvedTasks.includes(currentTaskId) && (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Solved
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    currentTask.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                    currentTask.difficulty === 'medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                    'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                  }`}>
                    {currentTask.difficulty}
                  </span>
                  <span className="text-[10px] font-bold text-jsyellow">
                    +{currentTask.difficulty === 'easy' ? 50 : currentTask.difficulty === 'medium' ? 100 : 150} XP
                  </span>
                  <span className="text-[10px] text-slate-400">Task {currentTaskIdx + 1} of {tasks.length}</span>
                </div>
              </div>

              {/* Description */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">📋 Problem Statement</p>
                <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {renderMarkdown(currentTask.question)}
                </div>
              </div>

              {/* Examples */}
              {currentTask.examples && (
                <div className="rounded-xl border border-blue-200/60 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-2">💡 Example</p>
                  <div className="text-xs font-mono leading-relaxed text-slate-600 dark:text-slate-400">
                    {renderMarkdown(currentTask.examples)}
                  </div>
                </div>
              )}

              {/* Hints — reveal one by one */}
              {currentTask.hints && currentTask.hints.length > 0 && (
                <div className="rounded-xl border border-jsyellow/20 bg-jsyellow/5 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-jsyellow flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5" /> Hints ({revealedHints}/{currentTask.hints.length})
                    </span>
                    {revealedHints < currentTask.hints.length && (
                      <button
                        onClick={() => setRevealedHints(r => r + 1)}
                        className="text-[10px] font-bold text-jsyellow hover:text-jsyellow-hover underline transition cursor-pointer"
                      >
                        Reveal next hint →
                      </button>
                    )}
                  </div>
                  {revealedHints === 0 && (
                    <p className="text-[11px] text-slate-400 italic">Click "Reveal next hint" when you're stuck.</p>
                  )}
                  <ul className="space-y-1.5">
                    {currentTask.hints.slice(0, revealedHints).map((hint, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 animate-fade-in-up">
                        <span className="text-jsyellow font-bold shrink-0">{i + 1}.</span>
                        <span>{hint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Test Cases */}
              <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">🧪 Test Requirements</span>
                  <span className="text-[10px] text-slate-400">{currentTask.testCases.length} tests</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                  {currentTask.testCases.map((tc, idx) => {
                    const isScriptTask = !tc.funcName;
                    const passed = testResults[idx]?.passed;
                    return (
                      <div key={idx} className={`flex items-center gap-2 px-4 py-2.5 ${
                        passed === true ? 'bg-emerald-50/50 dark:bg-emerald-950/10' :
                        passed === false ? 'bg-rose-50/50 dark:bg-rose-950/10' : ''
                      }`}>
                        {passed !== undefined ? (
                          <span className={passed ? 'text-emerald-500' : 'text-rose-500'}>{passed ? '✓' : '✗'}</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">○</span>
                        )}
                        <span className="flex-1 text-slate-600 dark:text-slate-400">
                          {isScriptTask ? 'Console Output' : `${tc.funcName}(${(tc.input || []).map(x => JSON.stringify(x)).join(', ')})`}
                        </span>
                        <code className="text-jsyellow text-[10px]">{JSON.stringify(tc.expected)}</code>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Select a learning module to render questions.</p>
          )}
        </div>

        {/* AI Tutor Assistant Widget Footer */}
        {currentTask && (
          <div className="shrink-0 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-jsyellow" />
              <div className="text-left">
                <span className="text-xs font-bold block">Need help? Ask AI Mentor</span>
                <span className="text-[10px] text-slate-400">Explains scope syntax, logic fixes, hints.</span>
              </div>
            </div>
            <button 
              onClick={() => askAiMentor()}
              className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-1"
            >
              <Sparkles className="h-3.5 w-3.5" /> Ask AI Mentor
            </button>
          </div>
        )}

      </div>

      {/* Right panel: Monaco Editor and Output Terminal */}
      <div className={`w-full lg:w-1/2 flex-col ${
        mobileTab !== 'docs' ? 'flex' : 'hidden lg:flex'
      }`}>
        <div className={`flex-1 flex flex-col ${mobileTab === 'editor' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Editor Toolbar */}
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-3 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-1">
            {/* Font size controls */}
            <button
              onClick={() => setEditorFontSize(s => Math.max(10, s - 1))}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white transition text-xs font-bold"
              title="Decrease font size"
            >A-</button>
            <span className="text-[10px] font-bold text-slate-400 w-6 text-center">{editorFontSize}</span>
            <button
              onClick={() => setEditorFontSize(s => Math.min(22, s + 1))}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white transition text-sm font-bold"
              title="Increase font size"
            >A+</button>
            <div className="mx-1.5 h-4 w-px bg-slate-200 dark:bg-slate-700" />
            {/* Copy code */}
            <button
              onClick={() => { navigator.clipboard.writeText(code); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 1500); }}
              className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 transition"
              title="Copy code"
            >
              {codeCopied ? <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Copied!</> : <><Copy className="h-3 w-3" /> Copy</>}
            </button>
            {/* Reset */}
            <button
              onClick={handleResetCode}
              className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 transition"
              title="Reset to starter code"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 hidden sm:block">Ctrl+Enter = Run</span>
            {currentTask && (
              <>
                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50 transition dark:bg-slate-700 dark:hover:bg-slate-600"
                  title="Run code (Ctrl+Enter)"
                >
                  <Play className="h-3 w-3 fill-current" />
                  {isRunning ? 'Running...' : 'Run'}
                </button>
                <button
                  onClick={handleSubmitCode}
                  disabled={submitCodeMutation.isPending || !isAccepted}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-black transition ${
                    isAccepted
                      ? 'bg-jsyellow text-black hover:bg-jsyellow-hover shadow-sm shadow-jsyellow/20'
                      : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                  }`}
                  title={!isAccepted ? 'Run tests first to unlock Submit' : 'Submit for XP'}
                >
                  <Send className="h-3 w-3" />
                  {submitCodeMutation.isPending ? 'Submitting...' : 'Submit'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Run progress bar */}
        {showRunBar && (
          <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-800 shrink-0">
            <div className="editor-run-bar" />
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 relative border-b border-slate-200 dark:border-slate-800 group/editor">
          {currentTask ? (
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme={editorTheme}
              value={code}
              onChange={(val) => setCode(val || '')}
              onMount={(editor) => {
                editor.addCommand(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (window as any).monaco?.KeyMod?.CtrlCmd | (window as any).monaco?.KeyCode?.Enter || 2048 | 3,
                  () => runCode()
                );
              }}
              options={{
                minimap: { enabled: false },
                fontSize: editorFontSize,
                fontFamily: '"Fira Code", "JetBrains Mono", Monaco, monospace',
                fontLigatures: true,
                lineHeight: 22,
                padding: { top: 14, bottom: 14 },
                tabSize: 2,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                renderLineHighlight: 'line',
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                contextmenu: false,
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 text-sm">
              Select a task to activate the coding workspace.
            </div>
          )}
        </div>
      </div>

      {/* Output Console area */}
      <div className={`flex flex-col bg-slate-950 text-white font-mono text-xs ${
        mobileTab === 'console' ? 'flex-1 flex' : 'hidden lg:flex lg:h-72 lg:flex-none'
      }`}>
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-900 bg-slate-900 px-4">
            <span className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-500">
              <Terminal className="h-4 w-4" /> Console
              {runtimeMs !== null && (
                <span className="text-[9px] font-normal text-slate-600 ml-1">{runtimeMs}ms</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {/* Copy output */}
              <button
                onClick={() => { navigator.clipboard.writeText(output); setOutputCopied(true); setTimeout(() => setOutputCopied(false), 1500); }}
                className="flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold text-slate-500 hover:bg-slate-800 transition"
              >
                {outputCopied ? <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
              </button>
            </div>
          </div>

          {/* Test case results */}
          {testResults.length > 0 && (
            <div className="shrink-0 border-b border-slate-800 max-h-32 overflow-y-auto">
              {testResults.map((tr, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-1.5 text-[10px] ${tr.passed ? 'test-pass bg-emerald-950/20' : 'test-fail bg-rose-950/20'}`}>
                  <span className={tr.passed ? 'text-emerald-400' : 'text-rose-400'}>
                    {tr.passed ? '✓' : '✗'}
                  </span>
                  <span className="text-slate-400 flex-1 truncate">{tr.label}</span>
                  {!tr.passed && (
                    <span className="text-slate-500 text-[9px]">
                      Expected: <code className="text-jsyellow">{tr.expected}</code>{' '}Got: <code className="text-rose-400">{tr.got}</code>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className={`flex-1 overflow-y-auto p-4 whitespace-pre-wrap text-left leading-relaxed ${
            output.startsWith('✅') ? 'text-emerald-400' :
            output.startsWith('❌') ? 'text-rose-400' :
            output.startsWith('Console output') ? 'text-slate-600' :
            'text-slate-300'
          }`}>
            {output}
          </div>

          {solvedTasks.includes(currentTaskId) && (
            <div className="shrink-0 bg-emerald-950/40 border-t border-emerald-900/50 px-4 py-2 flex items-center justify-between">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5" /> Task Solved! XP Awarded
              </span>
              {currentTaskIdx < tasks.length - 1 && (
                <button
                  onClick={handleNextTask}
                  disabled={!isCurrentTaskSolved}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-500 transition"
                >
                  Next Task <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Mentor Drawer */}
      <AnimatePresence>
        {isAiOpen && (
          <>
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAiOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[420px] border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-850">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-jsyellow" />
                  <h3 className="font-extrabold text-lg">AI Mentor Chat</h3>
                </div>
                <button 
                  onClick={() => setIsAiOpen(false)}
                  className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Chat Content */}
              <div className="flex-1 overflow-y-auto py-6 space-y-4 text-left">
                {chatMessages.map((msg, idx) => {
                  const isAi = msg.sender === 'ai';
                  return (
                    <div key={idx} className="flex gap-2.5 items-start">
                      {isAi ? (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-jsyellow text-black font-extrabold text-xs">AI</div>
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700 font-extrabold text-xs dark:bg-slate-800 dark:text-slate-350">ME</div>
                      )}
                      <div className={`rounded-2xl p-4 text-xs leading-relaxed max-w-[85%] ${
                        isAi 
                          ? 'bg-jsyellow/5 border border-jsyellow/15 text-slate-850 dark:text-slate-205' 
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-955 dark:text-slate-250 ml-auto'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}

                {aiLoading && (
                  <div className="flex gap-2.5 items-start">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-jsyellow text-black font-extrabold text-xs">AI</div>
                    <div className="rounded-2xl bg-slate-55 p-4 text-xs dark:bg-slate-950 text-slate-400 italic">
                      <RefreshCw className="h-4.5 w-4.5 animate-spin inline mr-1 text-jsyellow" /> Thinking...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="border-t border-slate-200 pt-4 dark:border-slate-850 space-y-3">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!aiInput.trim()) return;
                    askAiMentor(aiInput);
                  }}
                  className="relative flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Ask a specific question..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-jsyellow pr-10"
                    disabled={aiLoading}
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !aiInput.trim()}
                    className="absolute right-2 text-slate-400 hover:text-jsyellow disabled:opacity-30 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                
                <div className="flex gap-2 justify-between items-center text-[10px] text-slate-400">
                  <span>Hints Asked: {hintsRevealed}</span>
                  <button
                    onClick={() => askAiMentor()}
                    disabled={aiLoading}
                    className="text-jsyellow hover:underline bg-transparent border-0 cursor-pointer font-bold flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" /> Get Auto-Hint
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Achievement Unlock Celebration Modal */}
      <AnimatePresence>
        {unlockedBadges.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="max-w-md w-full mx-4 rounded-2xl border border-slate-250 bg-white p-8 text-center shadow-2xl dark:border-slate-850 dark:bg-slate-900"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-jsyellow/10 text-jsyellow mb-4">
                <Award className="h-8 w-8 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Badge Unlocked! 🎉</h2>
              <p className="mt-1.5 text-sm text-slate-500">Congratulations! You earned a new learning achievement:</p>

              {/* Badge Item details */}
              <div className="my-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-850 dark:bg-slate-950 flex flex-col items-center">
                <div className={`text-4xl ${unlockedBadges[0].badgeColor || 'text-jsyellow'}`}>
                  <Award className="h-12 w-12" />
                </div>
                <h4 className="mt-3 text-lg font-bold">{unlockedBadges[0].name}</h4>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-xs">{unlockedBadges[0].description}</p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setUnlockedBadges([])}
                  className="w-full rounded-xl bg-jsyellow py-3 text-xs font-extrabold text-black hover:bg-jsyellow-hover transition"
                >
                  Awesome, Continue!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Syllabus Outline Drawer */}
      <AnimatePresence>
        {isSyllabusOpen && (
          <>
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSyllabusOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[360px] border-r border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-855">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-jsyellow" />
                  <h3 className="font-extrabold text-lg">Syllabus Outline</h3>
                </div>
                <button 
                  onClick={() => setIsSyllabusOpen(false)}
                  className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Syllabus List */}
              <div className="flex-1 overflow-y-auto py-6 space-y-6 text-left">
                {levels.map((lvl) => (
                  <div key={lvl.id} className="space-y-3">
                    <h4 className="font-bold text-sm text-jsyellow uppercase tracking-wider">{lvl.title}</h4>
                    <div className="pl-2 space-y-2 border-l border-slate-100 dark:border-slate-800">
                      {lvl.modules.map((mod) => {
                        const isModLocked = isModuleLocked(mod.id);
                        return (
                          <div key={mod.id} className="space-y-1">
                            <span className="text-xs font-bold text-slate-405 block mt-2 flex items-center gap-1">
                              {isModLocked && <Lock className="h-3 w-3 text-slate-400" />}
                              Module {mod.id}: {mod.title}
                            </span>
                            <div className="space-y-1">
                              {mod.tasks.map((t, tIdx) => {
                                const isSolved = solvedTasks.includes(t.id);
                                const isCurrent = t.id === currentTaskId;
                                // Task sequential lock: previous task must be solved
                                const prevTaskInMod = tIdx > 0 ? mod.tasks[tIdx - 1] : null;
                                const isThisTaskLocked = isModLocked || (tIdx > 0 && prevTaskInMod ? !solvedTasks.includes(prevTaskInMod.id) : false);
                                return (
                                  <button
                                    key={t.id}
                                    disabled={isThisTaskLocked}
                                    onClick={() => {
                                      if (isThisTaskLocked) return;
                                      navigate(`/learn/${mod.id}/${t.id}`);
                                      setIsSyllabusOpen(false);
                                    }}
                                    title={isThisTaskLocked ? 'Complete the previous task first' : t.title}
                                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                                      isThisTaskLocked 
                                        ? 'opacity-40 cursor-not-allowed text-slate-450' 
                                        : isCurrent
                                          ? 'bg-jsyellow text-black font-bold cursor-pointer' 
                                          : 'text-slate-600 hover:bg-slate-105 dark:text-slate-350 dark:hover:bg-slate-800 cursor-pointer'
                                    }`}
                                  >
                                    <span className="truncate pr-2">{t.title}</span>
                                    {isThisTaskLocked ? (
                                      <Lock className="h-3.5 w-3.5 shrink-0 opacity-60 text-slate-400" />
                                    ) : isSolved ? (
                                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${isCurrent ? 'text-black' : 'text-emerald-500'}`} />
                                    ) : (
                                      <Play className={`h-3.5 w-3.5 shrink-0 opacity-40`} />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confetti Celebration Particle Burst */}
      {particles.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {particles.map((p) => {
            const duration = 1.2 + Math.random() * 1.2;
            const angleRad = (p.angle * Math.PI) / 180;
            const distance = p.speed * 45;
            const targetX = Math.cos(angleRad) * distance;
            const targetY = Math.sin(angleRad) * distance + 120; // downward gravity drift
            return (
              <motion.div
                key={p.id}
                initial={{ 
                  x: '50vw', 
                  y: '45vh', 
                  scale: 1 + Math.random() * 0.6, 
                  opacity: 1,
                  rotate: 0 
                }}
                animate={{ 
                  x: `calc(50vw + ${targetX}px)`, 
                  y: `calc(45vh + ${targetY}px)`, 
                  opacity: 0,
                  scale: 0.1,
                  rotate: p.angle * 2.5 
                }}
                transition={{ duration, ease: 'easeOut' }}
                className="absolute w-2 h-2 rounded-sm"
                style={{ backgroundColor: p.color }}
              />
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Learn;

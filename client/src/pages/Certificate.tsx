import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Lock, Printer } from 'lucide-react';
import api from '../services/api';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  xp: number;
  streak: number;
  level: number;
  created_at: string;
}

const Certificate: React.FC = () => {
  // Fetch profile stats
  const { data: user } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/students/profile');
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

  // Fetch full curriculum mapping to dynamically count total tasks
  const { data: levels = [] } = useQuery<any[]>({
    queryKey: ['curriculum-levels'],
    queryFn: async () => {
      const response = await api.get('/curriculum/levels');
      return response.data.data;
    }
  });

  const totalTasks = levels.reduce((acc, lvl) => {
    return acc + (lvl.modules || []).reduce((mAcc: number, mod: any) => mAcc + (mod.tasks?.length || 0), 0);
  }, 0) || 72; // fallback to 72 if levels are still loading

  const solvedCount = solvedTasks.length;
  const isUnlocked = solvedCount >= totalTasks;

  const handlePrint = () => {
    window.print();
  };

  if (!user) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-500">
        <p className="text-sm font-semibold">Loading student profile status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6 text-jsyellow" />
            Graduation Certificate
          </h1>
          <p className="text-sm text-slate-550 dark:text-slate-400 mt-1">
            Official certificate issued upon completing the full JS Bootcamp curriculum.
          </p>
        </div>

        {isUnlocked && (
          <div className="flex gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-jsyellow px-4 py-2 text-xs font-bold text-black hover:bg-jsyellow-hover transition shadow-md shadow-jsyellow/10"
            >
              <Printer className="h-4 w-4" /> Print / Save PDF
            </button>
          </div>
        )}
      </div>

      {isUnlocked ? (
        /* Certificate rendering block */
        <div className="relative overflow-hidden rounded-2xl border-4 border-jsyellow bg-white p-8 md:p-12 shadow-2xl text-center dark:bg-slate-900 transition-colors select-none print:border-8 print:shadow-none print:my-0 print:p-16">
          {/* Decorative Corner borders */}
          <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-jsyellow/35 rounded-tl-lg"></div>
          <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-jsyellow/35 rounded-tr-lg"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-jsyellow/35 rounded-bl-lg"></div>
          <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-jsyellow/35 rounded-br-lg"></div>

          {/* Certificate Header */}
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-jsyellow/10 text-jsyellow">
              <Award className="h-10 w-10 animate-pulse" />
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-serif font-black tracking-wide text-slate-800 dark:text-slate-100 uppercase">
            Certificate of Completion
          </h2>
          <p className="mt-2 text-xs font-bold tracking-widest text-jsyellow uppercase font-mono">
            JS BOOTCAMP LMS ACADEMY
          </p>

          <div className="my-8">
            <p className="text-sm font-semibold text-slate-400 italic">This is proudly presented to</p>
            <h3 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white underline decoration-jsyellow decoration-2 underline-offset-8">
              {user.name}
            </h3>
            <p className="mt-6 text-sm text-slate-550 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              for successfully mastering modern JavaScript, proving proficiency through the completion of 
              interactive programming tasks, variables management, loop structures, logical branches, and advanced array manipulation.
            </p>
          </div>

          {/* Certificate Footer signatures */}
          <div className="mt-12 pt-8 border-t border-slate-150 dark:border-slate-800 grid grid-cols-2 gap-8 max-w-lg mx-auto text-xs">
            <div>
              <p className="font-mono text-slate-800 dark:text-slate-200 font-bold italic">Hon3y Chauhan</p>
              <div className="w-24 h-0.5 bg-slate-300 dark:bg-slate-700 mx-auto my-1.5"></div>
              <p className="text-slate-450 uppercase font-bold tracking-wider">LMS Lead Instructor</p>
            </div>
            <div>
              <p className="font-mono text-slate-850 dark:text-slate-205 font-bold">JSB-{user.id.toUpperCase()}</p>
              <div className="w-24 h-0.5 bg-slate-300 dark:bg-slate-700 mx-auto my-1.5"></div>
              <p className="text-slate-450 uppercase font-bold tracking-wider">Credential ID</p>
            </div>
          </div>

          {/* Date stamp */}
          <div className="mt-8 text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
            Issued on: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      ) : (
        /* Locked Page render */
        <div className="rounded-2xl border border-slate-250 bg-white p-12 text-center shadow-md dark:border-slate-850 dark:bg-slate-900 space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black">Certificate Locked</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Complete the interactive syllabus coding tasks to claim your certificate. 
              Currently, you have resolved <strong className="text-jsyellow">{solvedCount} of {totalTasks}</strong> tasks.
            </p>
          </div>

          {/* Progress bar */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-450">
              <span>Syllabus Solving Progress</span>
              <span>{Math.round((solvedCount / totalTasks) * 100)}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-jsyellow transition-all duration-500" 
                style={{ width: `${(solvedCount / totalTasks) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={`/learn/1/1`}
              className="inline-flex items-center gap-2 rounded-xl bg-jsyellow px-5 py-3 text-xs font-bold text-black hover:bg-jsyellow-hover transition"
            >
              Resume Learning
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificate;

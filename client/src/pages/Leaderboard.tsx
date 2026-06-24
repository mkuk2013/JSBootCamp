import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal } from 'lucide-react';
import api from '../services/api';

interface LeaderboardUser {
  id: string;
  name: string;
  email: string;
  xp: number;
  streak: number;
  rank: number;
}

const Leaderboard: React.FC = () => {
  const loggedInUserStr = localStorage.getItem('user');
  const loggedInUser = loggedInUserStr ? JSON.parse(loggedInUserStr) : null;

  // Fetch leaderboard data from database
  const { data: users = [], isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const response = await api.get('/students/leaderboard');
      return response.data.data;
    }
  });

  const top1 = users[0] || { name: 'Loading...', xp: 0 };
  const top2 = users[1] || { name: 'Loading...', xp: 0 };
  const top3 = users[2] || { name: 'Loading...', xp: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 text-left">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Trophy className="h-6 w-6 text-jsyellow" />
          Global Leaderboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Compete with fellow JavaScript bootcampers. Ranks are updated instantly on task acceptance.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-850 dark:bg-slate-900">
          <p className="text-slate-500">Loading standings from Turso Database...</p>
        </div>
      ) : (
        <>
          {/* Podiums for Top 3 */}
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Podium 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-850 dark:bg-slate-900 flex flex-col items-center order-2 sm:order-1 sm:mt-6">
              <Medal className="h-10 w-10 text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-400">Rank #2</span>
              <h3 className="mt-1 font-bold">{top2.name}</h3>
              <p className="text-sm font-black text-slate-800 mt-2 dark:text-slate-200">
                {Number(top2.xp).toLocaleString()} XP
              </p>
            </div>

            {/* Podium 1 */}
            <div className="rounded-2xl border-2 border-jsyellow bg-white p-6 text-center shadow-lg dark:bg-slate-900 flex flex-col items-center order-1 sm:order-2">
              <Trophy className="h-12 w-12 text-jsyellow mb-2 animate-bounce" />
              <span className="text-xs font-bold text-jsyellow">Rank #1</span>
              <h3 className="mt-1 text-lg font-black">{top1.name}</h3>
              <p className="text-sm font-black text-slate-800 mt-2 dark:text-slate-200">
                {Number(top1.xp).toLocaleString()} XP
              </p>
            </div>

            {/* Podium 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-850 dark:bg-slate-900 flex flex-col items-center order-3 sm:order-3 sm:mt-12">
              <Medal className="h-10 w-10 text-amber-600 mb-2" />
              <span className="text-xs font-bold text-slate-400">Rank #3</span>
              <h3 className="mt-1 font-bold">{top3.name}</h3>
              <p className="text-sm font-black text-slate-800 mt-2 dark:text-slate-200">
                {Number(top3.xp).toLocaleString()} XP
              </p>
            </div>
          </div>

          {/* Leaderboard Table List */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-850 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-850 dark:bg-slate-900/50">
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Experience</th>
                  <th className="px-6 py-4">Tasks Solved</th>
                  <th className="px-6 py-4">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {users.map((u, i) => {
                  const isActive = loggedInUser && u.email === loggedInUser.email;
                  return (
                    <tr 
                      key={u.id || i} 
                      className={`transition-colors duration-150 ${
                        isActive 
                          ? 'bg-jsyellow/10 font-bold dark:bg-jsyellow/5' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-850/50'
                      }`}
                    >
                      <td className="px-6 py-4 flex items-center gap-2">
                        {u.rank === 1 && <span className="text-jsyellow font-black">#1</span>}
                        {u.rank === 2 && <span className="text-slate-400 font-bold">#2</span>}
                        {u.rank === 3 && <span className="text-amber-600 font-bold">#3</span>}
                        {u.rank > 3 && <span>#{u.rank}</span>}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {u.name} {isActive && <span className="text-xs text-jsyellow font-semibold ml-1">(You)</span>}
                      </td>
                      <td className="px-6 py-4">{Number(u.xp).toLocaleString()} XP</td>
                      <td className="px-6 py-4">{Math.min(76, Math.floor(u.xp / 50))} / 76</td>
                      <td className="px-6 py-4">{u.streak} days</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;

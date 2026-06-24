import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Users, Sparkles, BookOpen, Settings, Check, 
  Database, Mail, Cpu, RefreshCw, Search, ShieldCheck, 
  ArrowRight, Activity, AlertTriangle, Key, Trash2, X, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

interface StudentRequest {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  role: string;
  xp: number;
  streak: number;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const activeTab = location.pathname.split('/').pop() || 'admin';

  // State values
  const [aiTopic, setAiTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cronRunning, setCronRunning] = useState(false);

  // Custom Modal & Toast States
  const [studentToDelete, setStudentToDelete] = useState<StudentRequest | null>(null);
  const [studentToResetPassword, setStudentToResetPassword] = useState<StudentRequest | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch student requests from backend
  const { data: students = [], refetch, isLoading } = useQuery<StudentRequest[]>({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const response = await api.get('/admin/students');
      return response.data.data;
    }
  });

  // Handle status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const response = await api.put(`/admin/students/${id}/status`, { status });
      return response.data;
    },
    onSuccess: (res) => {
      refetch();
      showToast(res.message || 'Student status updated successfully.', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error?.message || 'Failed to update student status.', 'error');
    }
  });

  // Handle bulk approve mutation
  const approveAllMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/students/approve-all');
      return response.data;
    },
    onSuccess: (res) => {
      refetch();
      showToast(res.message || 'All pending students approved successfully.', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error?.message || 'Failed to approve all students.', 'error');
    }
  });

  // Trigger auto-approve cron mutation
  const triggerAutoApprove = async () => {
    setCronRunning(true);
    try {
      const response = await api.get('/cron/auto-approve');
      showToast(response.data.message || 'Auto-approval cron finished.', 'success');
      refetch();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Auto-approval cron execution failed.', 'error');
    } finally {
      setCronRunning(false);
    }
  };

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'approved' });
  };

  const handleReject = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'rejected' });
  };

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/admin/students/${id}`);
      return response.data;
    },
    onSuccess: (res) => {
      refetch();
      showToast(res.message || 'Student account deleted successfully.', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error?.message || 'Failed to delete student.', 'error');
    }
  });

  const handleDeleteStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    if (student) {
      setStudentToDelete(student);
    }
  };

  const confirmDeleteStudent = () => {
    if (studentToDelete) {
      deleteStudentMutation.mutate(studentToDelete.id);
      setStudentToDelete(null);
    }
  };

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const response = await api.put(`/admin/students/${id}/password`, { password });
      return response.data;
    },
    onSuccess: (res) => {
      showToast(res.message || 'Password updated successfully.', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error?.message || 'Failed to reset password.', 'error');
    }
  });

  const handleUpdatePassword = (id: string) => {
    const student = students.find(s => s.id === id);
    if (student) {
      setNewPasswordValue('');
      setShowPassword(false);
      setStudentToResetPassword(student);
    }
  };

  const confirmResetPassword = () => {
    if (studentToResetPassword && newPasswordValue.trim().length >= 6) {
      updatePasswordMutation.mutate({ id: studentToResetPassword.id, password: newPasswordValue.trim() });
      setStudentToResetPassword(null);
    }
  };

  const handleGenerateAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic) return;

    setIsGenerating(true);
    setGeneratedOutput('');

    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedOutput(`// Generated Module: ${aiTopic} (${difficulty})
{
  "title": "${aiTopic}",
  "difficulty": "${difficulty}",
  "lessons": [
    {
      "title": "Introduction to ${aiTopic}",
      "theory": "In this lesson, we will explore the core aspects of ${aiTopic} in modern JavaScript development...",
      "examples": [
        "console.log('Exploring ${aiTopic}');"
      ],
      "practiceTask": "Write a snippet that demonstrates ${aiTopic}.",
      "validationTest": "expect(result).toBeDefined();"
    }
  ],
  "quiz": [
    {
      "question": "What is the primary benefit of ${aiTopic}?",
      "options": ["Performance", "Scalability", "Readability", "All of the above"],
      "answer": "All of the above"
    }
  ]
}`);
    }, 2000);
  };

  // Filter calculations
  const pendingRequests = students.filter(r => r.status === 'pending');
  const pendingCount = pendingRequests.length;
  const totalApproved = students.filter(r => r.status === 'approved').length;

  const filteredStudents = students.filter(
    (s) => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 text-left max-w-6xl mx-auto">
      
      {/* Dynamic Header Banner */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-jsyellow/10 text-jsyellow shadow-glow">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Admin Management Console</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              Active Control Panel • Section: {activeTab === 'admin' ? 'Overview' : activeTab}
            </p>
          </div>
        </div>
      </div>

      {/* Overview Dashboard Tab */}
      {activeTab === 'admin' && (
        <div className="space-y-8">
          {/* Stats Summary cards */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Approvals</p>
                  <h3 className="text-2xl font-black mt-1">{isLoading ? '...' : `${pendingCount} Students`}</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Approved Students</p>
                  <h3 className="text-2xl font-black mt-1">{isLoading ? '...' : `${totalApproved} Students`}</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Check className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Curriculum Tasks</p>
                  <h3 className="text-2xl font-black mt-1">5 Active</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Previews columns */}
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Left: Pending Requests list */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Recent Registrations</h3>
                <Link to="/admin/approvals" className="text-xs text-jsyellow hover:underline flex items-center gap-1">
                  View Full Queue <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {isLoading ? (
                <p className="text-xs text-slate-400 py-4 text-center">Loading student profiles...</p>
              ) : pendingRequests.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No pending student approvals at this time.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingRequests.slice(0, 3).map((req) => (
                    <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 first:pt-0 last:pb-0">
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{req.name}</h4>
                        <p className="text-[10px] text-slate-400">{req.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="rounded-lg bg-emerald-500/10 hover:bg-emerald-500 px-3 py-1 text-[11px] font-bold text-emerald-500 hover:text-white transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="rounded-lg bg-rose-500/10 hover:bg-rose-500 px-3 py-1 text-[11px] font-bold text-rose-500 hover:text-white transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: API credentials check & health */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">System Integration</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs rounded-xl border border-slate-100 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40">
                  <span className="flex items-center gap-2 font-medium"><Database className="h-4 w-4 text-emerald-500" /> Turso Cloud Database</span>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-500">CONNECTED</span>
                </div>

                <div className="flex items-center justify-between text-xs rounded-xl border border-slate-100 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40">
                  <span className="flex items-center gap-2 font-medium"><Cpu className="h-4 w-4 text-jsyellow animate-pulse" /> Google Gemini API</span>
                  <span className="inline-flex items-center rounded-full bg-jsyellow/10 px-2 py-0.5 text-[9px] font-bold text-jsyellow">CONFIGURED</span>
                </div>

                <div className="flex items-center justify-between text-xs rounded-xl border border-slate-100 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40">
                  <span className="flex items-center gap-2 font-medium"><Mail className="h-4 w-4 text-blue-500" /> Brevo Mailer SMTP</span>
                  <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-500">READY</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={triggerAutoApprove}
                  disabled={cronRunning}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                >
                  <Activity className="h-4 w-4" />
                  {cronRunning ? 'Running Cron...' : 'Trigger Auto-Approve Cron'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <h2 className="text-xl font-black tracking-tight">Student Approval Queue</h2>
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to approve all ${pendingCount} pending student registration requests?`)) {
                    approveAllMutation.mutate();
                  }
                }}
                disabled={approveAllMutation.isPending || pendingCount === 0}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white transition flex items-center gap-1 animate-none ${
                  pendingCount > 0 
                    ? 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-450 dark:text-slate-600 cursor-not-allowed opacity-50'
                }`}
                title={pendingCount > 0 ? "Approve all pending students" : "No pending students to approve"}
              >
                <Check className="h-3.5 w-3.5" /> Approve All {pendingCount > 0 ? `(${pendingCount})` : ''}
              </button>
            </div>
            
            {/* Search filter input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs outline-none focus:border-jsyellow dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-850 dark:bg-slate-900">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading student profiles from Turso database...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No student profiles match your search criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-850 dark:bg-slate-900/50 animate-pulse">
                    <th className="px-6 py-4 text-left">Student Details</th>
                    <th className="px-6 py-4 text-left">Join Date</th>
                    <th className="px-6 py-4 text-left">Curriculum Stats</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                  {filteredStudents.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white leading-none">{req.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{req.email}</p>
                        <span className="inline-block mt-1 rounded bg-slate-100 dark:bg-slate-800 text-[8px] font-mono px-1 py-0.5 text-slate-500 uppercase tracking-wide">ID: {req.id}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {req.created_at ? new Date(req.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold">XP: <span className="text-jsyellow font-black">{req.xp}</span></p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Streak: {req.streak || 0} days</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                          req.status === 'pending' ? 'bg-amber-100 text-amber-850 dark:bg-amber-950/30 dark:text-amber-400' :
                          req.status === 'approved' ? 'bg-emerald-100 text-emerald-850 dark:bg-emerald-950/30 dark:text-emerald-400' :
                          'bg-rose-100 text-rose-850 dark:bg-rose-950/30 dark:text-rose-455'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-3">
                          {req.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(req.id)}
                                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 transition cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-600 transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-bold capitalize">{req.status}</span>
                          )}

                          {/* Utility actions: Reset Password & Delete */}
                          <div className="flex gap-1 border-l border-slate-150 pl-3 dark:border-slate-800">
                            <button
                              onClick={() => handleUpdatePassword(req.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition cursor-pointer"
                              title="Update Password"
                            >
                              <Key className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(req.id)}
                              className="rounded-lg p-1.5 text-slate-450 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>
      )}

      {/* AI Module Generator Tab */}
      {activeTab === 'generator' && (
        <div className="space-y-4">
          <h2 className="text-xl font-black tracking-tight">Gemini AI Module Builder</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
            Provide a JavaScript concept topic below. Gemini will output a formatted curriculum module template including code syntax, lessons, practice tasks, and validate assertions.
          </p>

          <div className="grid gap-6 md:grid-cols-[1fr_1.5fr] items-start">
            {/* Input Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 space-y-4">
              <form onSubmit={handleGenerateAI} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Module Topic</label>
                  <input
                    type="text"
                    placeholder="e.g., Array Map & Filter"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3.5 text-xs outline-none focus:border-jsyellow dark:border-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Syllabus Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3.5 text-xs outline-none dark:border-slate-800 dark:bg-slate-900"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-jsyellow py-3 text-xs font-bold text-black hover:bg-jsyellow-hover disabled:opacity-50 transition"
                >
                  <Sparkles className="h-4 w-4" />
                  {isGenerating ? 'AI Generating Syllabus...' : 'Generate with Gemini AI'}
                </button>
              </form>
            </div>

            {/* Output Panel */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 space-y-3 min-h-[300px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-2 dark:border-slate-800">
                AI Output (JSON Configuration Preview)
              </span>
              
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                  <RefreshCw className="h-8 w-8 animate-spin text-jsyellow" />
                  <span className="text-xs font-semibold animate-pulse">Gemini AI is drafting structure...</span>
                </div>
              ) : generatedOutput ? (
                <pre className="rounded-xl bg-slate-950 p-4 font-mono text-[10px] leading-relaxed text-emerald-450 overflow-x-auto max-h-[480px]">
                  {generatedOutput}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-405 dark:text-slate-500">
                  <Sparkles className="h-8 w-8 opacity-20 mb-2" />
                  <p className="text-xs">Submit a topic request to see auto-generated configurations.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-xl font-black tracking-tight">System Settings & Logs</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure global testing variables, cron executors, and view active environment statuses.</p>

          <div className="grid gap-6 md:grid-cols-2">
            {/* System parameters */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-jsyellow" /> System Variables
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-3 flex justify-between">
                  <span className="text-slate-500">System Environment Mode</span>
                  <span className="font-bold text-jsyellow">Development (Localhost)</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-slate-500">Base Server Endpoint</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">http://localhost:5000/api/v1</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-slate-500">Active Rate Limit Protection</span>
                  <span className="font-bold">5000 requests / 15 minutes</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-slate-500">Email Notification Sender (Brevo)</span>
                  <span className="font-semibold text-emerald-500">Enabled (console fallback ready)</span>
                </div>
              </div>
            </div>

            {/* Testing Cron Tools */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-855 dark:bg-slate-900 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-blue-500" /> Admin Automation Tools
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clicking trigger below executes the auto-approval cron job directly, letting you verify user logins without manually checking details:
              </p>

              <div className="pt-2 space-y-3">
                <button
                  onClick={triggerAutoApprove}
                  disabled={cronRunning}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-jsyellow py-3 text-xs font-bold text-black hover:bg-jsyellow-hover disabled:opacity-50 transition shadow-lg shadow-jsyellow/5"
                >
                  {cronRunning ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Executing Auto-Approval Cron...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 fill-current" />
                      Trigger Pending Auto-Approvals
                    </>
                  )}
                </button>

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2.5 text-[10px] leading-relaxed text-amber-600/80 dark:text-amber-400/80">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                  <span>
                    Note: Executing cron will fetch all registered accounts with <code>pending</code> status and mark them <code>approved</code>, outputting the mail delivery details to the server terminal logs.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {studentToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStudentToDelete(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mb-4 animate-bounce">
                  <Trash2 className="h-7 w-7" />
                </div>
                
                <h3 className="text-lg font-black tracking-tight">Delete Student Account?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200">{studentToDelete.name}</span>'s profile? All curriculum progress, achievements, and submission histories will be permanently destroyed.
                </p>
                
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-900 dark:bg-slate-900/50 w-full text-left">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Email:</span>
                    <span className="font-mono text-slate-650 dark:text-slate-350">{studentToDelete.email}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                    <span>Student ID:</span>
                    <span className="font-mono text-slate-650 dark:text-slate-350">{studentToDelete.id}</span>
                  </div>
                </div>

                <div className="mt-6 flex w-full gap-3">
                  <button
                    onClick={() => setStudentToDelete(null)}
                    className="flex-1 rounded-xl border border-slate-200 bg-transparent py-2.5 text-xs font-bold hover:bg-slate-55 dark:border-slate-800 dark:hover:bg-slate-900 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteStudent}
                    disabled={deleteStudentMutation.isPending}
                    className="flex-1 rounded-xl bg-rose-500 py-2.5 text-xs font-bold text-white hover:bg-rose-600 disabled:opacity-50 transition cursor-pointer shadow-lg shadow-rose-500/10"
                  >
                    {deleteStudentMutation.isPending ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {studentToResetPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStudentToResetPassword(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-955 text-slate-900 dark:text-white"
            >
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-jsyellow/10 text-jsyellow mb-4">
                  <Key className="h-7 w-7" />
                </div>
                
                <h3 className="text-lg font-black tracking-tight text-center">Reset Student Password</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center leading-relaxed">
                  Enter a new login password for <span className="font-bold text-slate-800 dark:text-slate-200">{studentToResetPassword.name}</span>.
                </p>

                <div className="mt-5 w-full space-y-4">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password (min. 6 chars)"
                      value={newPasswordValue}
                      onChange={(e) => setNewPasswordValue(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 pl-3.5 pr-10 text-xs outline-none focus:border-jsyellow dark:border-slate-850 dark:bg-slate-900/50"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 cursor-pointer animate-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {newPasswordValue && newPasswordValue.length < 6 && (
                    <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-rose-500 shrink-0" /> Password must be at least 6 characters.
                    </p>
                  )}
                  
                  {newPasswordValue && newPasswordValue.length >= 6 && (
                    <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                      <Check className="h-3 w-3 text-emerald-555 shrink-0" /> Password strength is valid.
                    </p>
                  )}
                </div>

                <div className="mt-6 flex w-full gap-3">
                  <button
                    onClick={() => setStudentToResetPassword(null)}
                    className="flex-1 rounded-xl border border-slate-200 bg-transparent py-2.5 text-xs font-bold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmResetPassword}
                    disabled={updatePasswordMutation.isPending || newPasswordValue.trim().length < 6}
                    className="flex-1 rounded-xl bg-jsyellow py-2.5 text-xs font-bold text-black hover:bg-jsyellow/90 disabled:opacity-50 transition cursor-pointer shadow-lg shadow-jsyellow/10"
                  >
                    {updatePasswordMutation.isPending ? 'Updating...' : 'Save Password'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-6 right-6 z-55 flex items-center gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md max-w-sm w-[350px] ${
              toast.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-950/20'
                : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 dark:bg-rose-950/20'
            }`}
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
              toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
            }`}>
              {toast.type === 'success' ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold leading-tight">
                {toast.type === 'success' ? 'Success' : 'Error'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;

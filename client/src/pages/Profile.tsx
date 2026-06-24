import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Star, Flame, Trophy, Download, Calendar, Mail, Camera, Edit2, Save, X, AlertTriangle, Check, Eye, EyeOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../services/api';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  xp: number;
  streak: number;
  level: number;
  rank: number;
  created_at: string;
  avatar_url?: string;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    badge_color: string;
  }>;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Password change states
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Image Crop & Zoom states
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Fetch student profile details (includes unlocked achievements)
  const { data: user } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/students/profile');
      return response.data.data;
    }
  });

  // Fetch solved tasks count
  const { data: solvedTasks = [] } = useQuery<number[]>({
    queryKey: ['user-solved-tasks'],
    queryFn: async () => {
      const response = await api.get('/submissions/user');
      return response.data.data;
    }
  });

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: { name: string; email: string }) => {
      const response = await api.put('/students/profile', payload);
      return response.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // Update local storage user if matching
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        u.name = editName;
        u.email = editEmail;
        localStorage.setItem('user', JSON.stringify(u));
      }
      setIsEditing(false);
      setToast({ message: res.message || 'Profile details updated successfully!', type: 'success' });
    },
    onError: (err: any) => {
      setToast({ message: err.response?.data?.error?.message || 'Failed to update profile details.', type: 'error' });
    }
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await api.post('/students/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // Update local storage avatar url
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        u.avatar_url = res.avatarUrl;
        localStorage.setItem('user', JSON.stringify(u));
      }
      setToast({ message: res.message || 'Avatar profile picture updated successfully!', type: 'success' });
    },
    onError: (err: any) => {
      setToast({ message: err.response?.data?.error?.message || 'Failed to upload profile picture.', type: 'error' });
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      const response = await api.put('/students/profile/password', payload);
      return response.data;
    },
    onSuccess: (res) => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
      setToast({ message: res.message || 'Password changed successfully!', type: 'success' });
    },
    onError: (err: any) => {
      setToast({ message: err.response?.data?.error?.message || 'Failed to update password.', type: 'error' });
    }
  });

  const totalTasks = 5; // total tasks in syllabus
  const solvedCount = solvedTasks.length;

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'ST';

  const joinedDate = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'June 2026';

  const getAvatarUrl = (path: string | undefined | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '')}${path}`;
  };

  // Image Drag & Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Canvas cropping helper
  const handleCropSave = () => {
    if (!selectedImageSrc) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill canvas background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 200, 200);

      // Crop viewport configurations (circle mask is 176px wide relative to 256px layout box)
      const scale = zoom;
      const x = offset.x;
      const y = offset.y;

      const cropDiameter = 176;
      const imgWidth = img.width;
      const imgHeight = img.height;
      const minDimension = Math.min(imgWidth, imgHeight);

      // Map scale factor: smallest dimension of img must map to cropDiameter
      const baseWidth = (imgWidth / minDimension) * cropDiameter;
      const baseHeight = (imgHeight / minDimension) * cropDiameter;

      const drawWidth = baseWidth * scale;
      const drawHeight = baseHeight * scale;

      // Draw relative to canvas center
      const drawX = 100 - drawWidth / 2 + x;
      const drawY = 100 - drawHeight / 2 + y;

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // Export canvas as image blob
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
          uploadAvatarMutation.mutate(file);
          setSelectedImageSrc(null);
        }
      }, 'image/jpeg', 0.9);
    };
    img.src = selectedImageSrc;
  };

  const badgesSchema = [
    { id: 'first_code', title: 'Hello JS World', desc: 'Solved your very first programming task.', icon: Award },
    { id: 'streak_3', title: 'Consistent Coder', desc: 'Achieved a 3-day active learning streak.', icon: Flame },
    { id: 'xp_1000', title: 'XP Collector', desc: 'Earned 1000 total Experience Points.', icon: Star },
    { id: 'js_master', title: 'JS Guru', desc: 'Completed all syllabus coding tasks successfully.', icon: Trophy }
  ];

  const handleDownloadCertificate = () => {
    navigate('/certificate');
  };

  if (!user) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-500">
        <p className="text-sm font-semibold">Loading student profile details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left relative">
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

      {/* Profile Overview header card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4.5">
            {/* Avatar presentation */}
            <div className="relative group/avatar shrink-0 h-16 w-16">
              {user.avatar_url ? (
                <img 
                  src={getAvatarUrl(user.avatar_url) || ''} 
                  alt={user.name} 
                  className="h-16 w-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-jsyellow font-black text-black text-2xl">
                  {initials}
                </div>
              )}
              
              {/* Camera overlay for uploads */}
              <label className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center rounded-2xl bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity text-white">
                <Camera className="h-5 w-5" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setSelectedImageSrc(reader.result as string);
                        setZoom(1);
                        setOffset({ x: 0, y: 0 });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>

            {/* Profile fields: View mode vs Edit mode */}
            {!isEditing ? (
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{user.name}</h1>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                    title="Edit Details"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-455 flex items-center gap-1.5 mt-1.5">
                  <Mail className="h-4 w-4" /> {user.email}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                  <Calendar className="h-4 w-4" /> Member since {joinedDate}
                </p>
              </div>
            ) : (
              <div className="flex-1 space-y-2 max-w-xs">
                <div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-transparent py-1.5 px-3 text-xs outline-none focus:border-jsyellow dark:border-slate-800"
                    placeholder="Your Name"
                    required
                  />
                </div>
                <div>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-transparent py-1.5 px-3 text-xs outline-none focus:border-jsyellow dark:border-slate-800"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setEditName(user.name);
                      setEditEmail(user.email);
                      setIsEditing(false);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editName.trim() && editEmail.trim()) {
                        updateProfileMutation.mutate({ name: editName.trim(), email: editEmail.trim() });
                      }
                    }}
                    disabled={updateProfileMutation.isPending}
                    className="inline-flex items-center gap-1 rounded-lg bg-jsyellow px-3 py-1.5 text-xs font-bold text-black hover:bg-jsyellow-hover transition disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" /> {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {!isEditing && (
            <div>
              <button 
                onClick={handleDownloadCertificate}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Download className="h-4.5 w-4.5" />
                Download JS Certificate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Global Rank</p>
          <p className="mt-2 text-2xl font-black">#{user.rank || 'N/A'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Experience Level</p>
          <p className="mt-2 text-2xl font-black">Level {user.level || 1}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Streak</p>
          <p className="mt-2 text-2xl font-black text-amber-500">{user.streak || 0} Days</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasks Solved</p>
          <p className="mt-2 text-2xl font-black text-jsyellow">{solvedCount} / {totalTasks}</p>
        </div>
      </div>

      {/* Achievements Badges grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-black tracking-tight">Unlocked Badges & Achievements</h2>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {badgesSchema.map((badge) => {
            const Icon = badge.icon;
            const isUnlocked = user.achievements?.some(a => a.id === badge.id);

            return (
              <div 
                key={badge.id} 
                className={`rounded-2xl border p-5 shadow-sm transition-all duration-200 ${
                  isUnlocked 
                    ? 'border-slate-200 bg-white dark:border-slate-850 dark:bg-slate-900' 
                    : 'border-slate-100 bg-slate-50/50 opacity-40 dark:border-slate-900 dark:bg-slate-955/20'
                }`}
              >
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${
                  isUnlocked ? 'bg-jsyellow/10 text-jsyellow' : 'bg-slate-250 text-slate-400 dark:bg-slate-850'
                }`}>
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{badge.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-555 dark:text-slate-450">{badge.desc}</p>
                <span className="mt-3 block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isUnlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Change Password / Security Settings card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 max-w-xl">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Security Settings</h2>
        
        {!showPasswordSection ? (
          <button
            onClick={() => setShowPasswordSection(true)}
            className="rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-xs font-bold hover:bg-slate-55 dark:border-slate-800 dark:hover:bg-slate-850 transition cursor-pointer"
          >
            Change Login Password
          </button>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Current Password</label>
              <input
                type={showCurrentPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 pl-3.5 pr-10 text-xs outline-none focus:border-jsyellow dark:border-slate-800 dark:bg-slate-950/40"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3.5 top-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer"
              >
                {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">New Password</label>
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 pl-3.5 pr-10 text-xs outline-none focus:border-jsyellow dark:border-slate-800 dark:bg-slate-955/40"
                placeholder="Min. 6 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3.5 top-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer"
              >
                {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Confirm New Password</label>
              <input
                type={showConfirmPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 pl-3.5 pr-10 text-xs outline-none focus:border-jsyellow dark:border-slate-800 dark:bg-slate-950/40"
                placeholder="Verify new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3.5 top-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer"
              >
                {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {newPassword && newPassword.length < 6 && (
              <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-rose-500 shrink-0" /> Password must be at least 6 characters.
              </p>
            )}

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-rose-500 shrink-0" /> Passwords do not match.
              </p>
            )}

            {newPassword && confirmPassword && newPassword.length >= 6 && newPassword === confirmPassword && (
              <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-555 shrink-0" /> Passwords match and meet strength requirements.
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setShowPasswordSection(false);
                }}
                className="rounded-xl border border-slate-200 bg-transparent px-4 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (currentPassword && newPassword.length >= 6 && newPassword === confirmPassword) {
                    updatePasswordMutation.mutate({ currentPassword, newPassword });
                  }
                }}
                disabled={updatePasswordMutation.isPending || !currentPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                className="rounded-xl bg-jsyellow px-4 py-2 text-xs font-bold text-black hover:bg-jsyellow-hover disabled:opacity-50 transition cursor-pointer"
              >
                {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image Crop/Zoom Modal */}
      <AnimatePresence>
        {selectedImageSrc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImageSrc(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-center mb-4">Adjust Profile Picture</h3>
              
              {/* Crop Frame Area */}
              <div 
                className="relative h-64 w-full rounded-xl bg-slate-900 border border-slate-800 overflow-hidden cursor-move flex items-center justify-center select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
              >
                {/* Visual Circle Crop Boundary Mask */}
                <div className="absolute inset-0 border-8 border-slate-950/70 pointer-events-none z-10 flex items-center justify-center">
                  <div className="h-44 w-44 rounded-full border-2 border-dashed border-jsyellow shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]" />
                </div>
                
                {/* Draggable image */}
                <img
                  src={selectedImageSrc}
                  alt="Crop Preview"
                  draggable={false}
                  className="max-w-none origin-center pointer-events-none"
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    height: '176px', // Matches the crop circular diameter
                    width: 'auto'
                  }}
                />
              </div>
              
              {/* Zoom slider control */}
              <div className="mt-5 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Zoom Level</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-jsyellow"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setSelectedImageSrc(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-transparent py-2.5 text-xs font-bold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropSave}
                  disabled={uploadAvatarMutation.isPending}
                  className="flex-1 rounded-xl bg-jsyellow py-2.5 text-xs font-bold text-black hover:bg-jsyellow-hover disabled:opacity-50 transition cursor-pointer shadow-lg shadow-jsyellow/10"
                >
                  {uploadAvatarMutation.isPending ? 'Uploading...' : 'Apply Picture'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;

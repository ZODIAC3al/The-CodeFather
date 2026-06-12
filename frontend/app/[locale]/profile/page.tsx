'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Footer from '@/components/Footer';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  User, Camera, Mail, Plus, Search, Bell, Globe, 
  LayoutDashboard, BookOpen, GraduationCap, MessageSquare, Settings, 
  CheckCircle, Clock, Video, ArrowRight, Compass, Calendar,
  Users, Zap, Award, Trash2, Download, UploadCloud, Check, Send, Code, FileText
} from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'roadmap' | 'meetings' | 'settings' | 'studyGroups'>('dashboard');

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    nickName: '',
    gender: 'Male',
    country: 'Egypt',
    language: 'English',
    timeZone: 'GMT+2',
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch student enrollments
  const { data: enrollments, isLoading: isEnrollmentsLoading } = useQuery<any[]>({
    queryKey: ['myEnrollments'],
    queryFn: async () => {
      const { data } = await api.get('/enrollments/my');
      return data || [];
    },
    enabled: isAuthenticated,
  });

  // Fetch scheduled meetings
  const { data: meetings, isLoading: isMeetingsLoading } = useQuery<any[]>({
    queryKey: ['meetings'],
    queryFn: async () => {
      const { data } = await api.get('/meetings');
      return data || [];
    },
    enabled: isAuthenticated,
  });

  // TanStack queries for Gamification, schedules & study groups
  const { data: leaderboard } = useQuery<any[]>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data } = await api.get('/users/leaderboard');
      return data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: schedule, refetch: refetchSchedule } = useQuery<any>({
    queryKey: ['mySchedule'],
    queryFn: async () => {
      const { data } = await api.get('/schedules/me');
      return data;
    },
    enabled: isAuthenticated,
  });

  const { data: studyGroups, refetch: refetchGroups } = useQuery<any[]>({
    queryKey: ['studyGroups'],
    queryFn: async () => {
      const { data } = await api.get('/study-groups');
      return data || [];
    },
    enabled: isAuthenticated,
  });

  // Certificate Modal State
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
  const [isCertificateLoading, setIsCertificateLoading] = useState(false);

  // Todo items states
  const [newTodo, setNewTodo] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);

  // Goals updates states
  const [dailyGoalVal, setDailyGoalVal] = useState(30);
  const [weeklyGoalVal, setWeeklyGoalVal] = useState(150);

  // Sync goal slider states
  useEffect(() => {
    if (schedule) {
      setDailyGoalVal(schedule.dailyGoalMinutes || 30);
      setWeeklyGoalVal(schedule.weeklyGoalMinutes || 150);
    }
  }, [schedule]);

  // Active study group chat drawer
  const [activeGroup, setActiveGroup] = useState<any>(null);
  const [groupChatMessage, setGroupChatMessage] = useState('');
  const [isGroupChatPolling, setIsGroupChatPolling] = useState(false);
  const [sharedFileProgress, setSharedFileProgress] = useState(0);
  const [sharedFileStatus, setSharedFileStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [sharedFileName, setSharedFileName] = useState('');

  // Poll chat when active study group is open
  useEffect(() => {
    if (!activeGroup) return;
    setIsGroupChatPolling(true);
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/study-groups/${activeGroup._id}/chat`);
        setActiveGroup((prev: any) => {
          if (!prev) return null;
          return { ...prev, chat: data };
        });
      } catch (err) {
        console.error('Failed to poll group chat', err);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      setIsGroupChatPolling(false);
    };
  }, [activeGroup?._id]);

  // Handlers for Todos & Goals
  const handleToggleTodo = async (idx: number, currentVal: boolean) => {
    try {
      await api.patch(`/schedules/me/todos/${idx}`, { completed: !currentVal });
      refetchSchedule();
    } catch (err) {
      console.error('Failed to toggle todo', err);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setIsAddingTodo(true);
    try {
      await api.post('/schedules/me/todos', { text: newTodo.trim() });
      setNewTodo('');
      refetchSchedule();
    } catch (err) {
      console.error('Failed to add todo', err);
    } finally {
      setIsAddingTodo(false);
    }
  };

  const handleUpdateGoals = async () => {
    try {
      await api.post('/schedules/me/goals', {
        dailyGoalMinutes: dailyGoalVal,
        weeklyGoalMinutes: weeklyGoalVal,
      });
      refetchSchedule();
      setMsg({ type: 'success', text: locale === 'ar' ? 'تم تحديث أهدافك بنجاح!' : 'Goals updated successfully!' });
    } catch (err) {
      console.error('Failed to update goals', err);
    }
  };

  // Handlers for Study Circles
  const handleJoinGroup = async (groupId: string) => {
    try {
      await api.post(`/study-groups/${groupId}/join`);
      refetchGroups();
      setMsg({ type: 'success', text: locale === 'ar' ? 'لقد انضممت إلى مجموعة الدراسة بنجاح!' : 'Joined study circle successfully!' });
    } catch (err) {
      console.error('Failed to join group', err);
    }
  };

  const handleSendGroupChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupChatMessage.trim() || !activeGroup) return;
    try {
      const { data } = await api.post(`/study-groups/${activeGroup._id}/chat`, {
        content: groupChatMessage.trim(),
      });
      setActiveGroup((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          chat: [...(prev.chat || []), data],
        };
      });
      setGroupChatMessage('');
    } catch (err) {
      console.error('Failed to send group chat', err);
    }
  };

  const handleShareGroupResource = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeGroup) {
      setSharedFileName(file.name);
      setSharedFileStatus('uploading');
      setSharedFileProgress(20);

      const interval = setInterval(async () => {
        setSharedFileProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            // Submit shared resource meta to backend
            const fileType = file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.zip') ? 'code' : 'slides';
            api.post(`/study-groups/${activeGroup._id}/resources`, {
              name: file.name,
              type: fileType,
              url: 'https://example.com/' + file.name,
            }).then(() => {
              setSharedFileStatus('success');
              // Refresh active group resources
              api.get('/study-groups').then(({ data }) => {
                const refreshed = data.find((g: any) => g._id === activeGroup._id);
                if (refreshed) setActiveGroup(refreshed);
              });
            });
            return 100;
          }
          return prev + 40;
        });
      }, 200);
    }
  };

  // Handler for Certificates
  const handleViewCertificate = async (courseId: string) => {
    setIsCertificateLoading(true);
    try {
      const { data } = await api.get(`/enrollments/courses/${courseId}/certificate`);
      setSelectedCertificate(data);
    } catch (err) {
      console.error('Failed to fetch certificate', err);
      alert(locale === 'ar' ? 'فشل تحميل الشهادة. تأكد من إتمام الدورة 100%.' : 'Failed to load certificate. Ensure course completion is 100%.');
    } finally {
      setIsCertificateLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isLoading, isAuthenticated, router, locale]);

// Sync form state when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        nickName: user.nickName || '',
        gender: user.gender || 'Male',
        country: user.country || 'Egypt',
        language: user.language || 'English',
        timeZone: user.timeZone || 'GMT+2',
      });
      setAvatarUrl(user.avatar || '');
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </div>
    );
  }

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileData = new FormData();
    fileData.append('file', file);

    setIsUploading(true);
    setMsg(null);

    try {
      const { data } = await api.post('/upload', fileData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatarUrl(data.url);
      
      await api.patch('/users/profile', { avatar: data.url });
      await refreshUser();
      setMsg({ type: 'success', text: t('avatarSuccessMsg') });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to upload image' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg(null);

    try {
      await api.patch('/users/profile', formData);
      await refreshUser();
      setIsEditing(false);
      setMsg({ type: 'success', text: t('successMsg') });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const currentDate = new Date().toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const lp = (path: string) => `/${locale}${path}`;

  const tabs = [
    { id: 'dashboard', label: t('tabDashboard'), icon: LayoutDashboard },
    { id: 'courses', label: t('tabCourses'), icon: BookOpen },
    { id: 'roadmap', label: t('tabRoadmap'), icon: GraduationCap },
    { id: 'meetings', label: t('tabMeetings'), icon: MessageSquare },
    { id: 'studyGroups', label: t('tabStudyGroups') || 'Study Circles', icon: Users },
    { id: 'settings', label: t('tabSettings'), icon: Settings },
  ] as const;

  return (
    <div className="flex flex-col min-h-screen bg-base-200 text-base-content font-sans">
      <Navbar />

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6 flex-col md:flex-row">
        
        {/* Dynamic Sidebar */}
        <aside className="hidden md:flex flex-col items-center w-20 shrink-0 gap-4 py-6 bg-base-100 rounded-3xl border border-base-300 shadow-sm h-fit sticky top-24">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 tooltip tooltip-right"
                data-tip={tab.label}
              >
                <div className={`p-2.5 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-primary-content shadow-lg shadow-primary/20 scale-110' 
                    : 'text-base-content/50 hover:bg-base-200 hover:text-base-content'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
              </button>
            );
          })}
        </aside>

        {/* Mobile Horizontal Tabs Selector */}
        <div className="flex md:hidden overflow-x-auto gap-2 pb-2 scrollbar-none mb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border whitespace-nowrap text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-content border-primary shadow-md'
                    : 'bg-base-100 hover:bg-base-200 border-base-300 text-base-content/75'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          
          {/* Header Layout */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-base-content tracking-tight">
                {t('welcome', { name: user.fullName || user.username })}
              </h1>
              <p className="text-xs text-base-content/50 font-bold mt-0.5">{currentDate}</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <input 
                  type="text" 
                  placeholder={tCommon('search')} 
                  className="input input-sm input-bordered rounded-xl pl-8 pr-4 w-full sm:w-48 focus:input-primary"
                />
                <Search className="w-4 h-4 text-base-content/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <button className="btn btn-sm btn-ghost btn-circle relative border border-base-300">
                <Bell className="w-4 h-4 text-base-content/75" />
                <span className="w-2.5 h-2.5 bg-primary rounded-full absolute top-1.5 right-1.5 border-2 border-base-100" />
              </button>
            </div>
          </div>

          {msg && (
            <div className={`alert ${msg.type === 'success' ? 'alert-success text-success-content' : 'alert-error text-error-content'} rounded-2xl shadow-sm text-xs font-bold`}>
              <span>{msg.text}</span>
            </div>
          )}

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              {/* Gamification summary panel */}
              <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-xl -z-10" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl shadow-inner border border-primary/20">
                      Lvl {user.level || 1}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-base-content/90">
                        {locale === 'ar' ? 'مستوى الخبرة الحالي' : 'Current Learning Level'}
                      </h3>
                      <p className="text-[11px] text-base-content/50 font-bold mt-0.5">
                        {user.xp || 0} XP earned (Level up at {(user.level || 1) * 100} XP)
                      </p>
                    </div>
                  </div>

                  {/* Streak widget */}
                  <div className="flex items-center gap-2.5 p-3 bg-orange-500/10 border border-orange-500/20 text-orange-600 rounded-2xl animate-pulse">
                    <Zap className="w-5 h-5 fill-orange-500 text-orange-500" />
                    <div>
                      <div className="text-sm font-black">{user.streak || 0} {locale === 'ar' ? 'يوم' : 'Days'}</div>
                      <div className="text-[9px] font-extrabold uppercase tracking-wide opacity-80">{locale === 'ar' ? 'سلسلة نشاط' : 'Active Streak'}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-base-content/50">
                    <span>{locale === 'ar' ? 'تقدم المستوى' : 'Level Progress'}</span>
                    <span>{Math.round(((user.xp || 0) / ((user.level || 1) * 100)) * 100)}%</span>
                  </div>
                  <progress 
                    className="progress progress-primary w-full h-2.5 rounded-full shadow-inner" 
                    value={user.xp || 0} 
                    max={(user.level || 1) * 100} 
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card bg-base-100 border border-base-300 p-5 rounded-3xl flex flex-row items-center gap-4 shadow-sm">
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-base-content">{enrollments?.length || 0}</div>
                    <div className="text-xs text-base-content/50 font-bold">{t('statsEnrolled')}</div>
                  </div>
                </div>

                <div className="card bg-base-100 border border-base-300 p-5 rounded-3xl flex flex-row items-center gap-4 shadow-sm">
                  <div className="p-3 bg-secondary/10 text-secondary rounded-2xl">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-base-content">
                      {enrollments?.filter((e: any) => e.progress < 100).length || 0}
                    </div>
                    <div className="text-xs text-base-content/50 font-bold">{t('statsActive')}</div>
                  </div>
                </div>

                <div className="card bg-base-100 border border-base-300 p-5 rounded-3xl flex flex-row items-center gap-4 shadow-sm">
                  <div className="p-3 bg-success/10 text-success rounded-2xl">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-base-content">
                      {enrollments?.filter((e: any) => e.progress >= 100).length || 0}
                    </div>
                    <div className="text-xs text-base-content/50 font-bold">{t('statsCompleted')}</div>
                  </div>
                </div>
              </div>

              {/* Progress and Timeline Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side progress & badges (2 columns) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Courses Progress */}
                  <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-base-content/80 uppercase tracking-wider">{t('recentProgress')}</h3>
                    
                    {isEnrollmentsLoading ? (
                      <div className="flex justify-center py-8">
                        <span className="loading loading-spinner text-primary" />
                      </div>
                    ) : !enrollments?.length ? (
                      <div className="text-center py-12 space-y-3">
                        <p className="text-sm text-base-content/50 font-bold">{t('noCourses')}</p>
                        <Link href={lp('/courses')} className="btn btn-sm btn-primary rounded-xl font-bold">
                          {t('browseCourses')}
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4 divide-y divide-base-200">
                        {enrollments.slice(0, 3).map((enrollment: any) => (
                          <div key={enrollment.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 first:pt-0">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-base-200 overflow-hidden shrink-0">
                                {enrollment.course?.thumbnail ? (
                                  <img src={enrollment.course.thumbnail} alt={enrollment.course.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-base-content/30 uppercase">Code</div>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-extrabold text-base-content line-clamp-1">{enrollment.course?.title}</h4>
                                <p className="text-xs text-base-content/40 font-bold">Progress: {enrollment.progress || 0}%</p>
                              </div>
                            </div>
                            
                            <div className="w-full sm:w-auto flex items-center gap-3">
                              <div className="flex-1 sm:w-36">
                                <progress className="progress progress-primary w-full" value={enrollment.progress || 0} max="100" />
                              </div>
                              <Link 
                                href={lp(`/courses/${enrollment.course?.slug || enrollment.course?.id}`)} 
                                className="btn btn-xs btn-outline btn-primary rounded-lg font-bold shrink-0"
                              >
                                {t('resumeLearning')}
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Milestone Badges */}
                  <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-base-content/80 uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      {locale === 'ar' ? 'شارات الإنجاز والتميز' : 'Milestone Achievement Badges'}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { id: 'streak-7', name: '7-Day Streak', desc: 'Active for 7 days', unlocked: (user.streak || 0) >= 7 || user.badges?.includes('streak-7') },
                        { id: 'first-course', name: 'Fast Learner', desc: '100% course done', unlocked: enrollments?.some((e: any) => e.progress >= 100) || user.badges?.includes('first-course') },
                        { id: 'quiz-master', name: 'Quiz Master', desc: 'Pass a lesson quiz', unlocked: user.badges?.includes('quiz-master') },
                        { id: 'cadet', name: 'Codefather Cadet', desc: 'Join the academy', unlocked: true }
                      ].map((b) => (
                        <div 
                          key={b.id} 
                          className={`p-4 rounded-2xl border text-center space-y-2 flex flex-col items-center justify-between transition-all ${
                            b.unlocked 
                              ? 'bg-primary/5 border-primary/20 text-base-content shadow-xs scale-102 font-bold' 
                              : 'bg-base-200/50 border-base-300 text-base-content/40 opacity-60'
                          }`}
                        >
                          <div className={`p-3 rounded-full ${b.unlocked ? 'bg-primary/10 text-primary animate-pulse' : 'bg-base-300'}`}>
                            <Award className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black">{b.name}</h4>
                            <p className="text-[9px] font-semibold opacity-75 mt-0.5 leading-tight">{b.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column details & Planners (1 column) */}
                <div className="space-y-6">
                  {/* Leaderboard panel */}
                  <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-base-content/80 uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      {locale === 'ar' ? 'لوحة المتصدرين العالمية' : 'Global Leaderboard'}
                    </h3>
                    <div className="space-y-3">
                      {leaderboard && leaderboard.length > 0 ? (
                        leaderboard.slice(0, 5).map((u: any, idx: number) => {
                          const isMe = u.username === user.username;
                          return (
                            <div 
                              key={u._id || idx} 
                              className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                                isMe 
                                  ? 'bg-primary/10 border-primary text-primary font-black shadow-xs' 
                                  : 'bg-base-200/50 border-base-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-4 text-xs font-black text-center">{idx + 1}</span>
                                <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary font-black flex items-center justify-center text-xs">
                                  {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover rounded-full" /> : u.username?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <span className="text-xs font-extrabold">{u.fullName || u.username}</span>
                                  <span className="text-[9px] font-bold text-base-content/50 block">Lvl {u.level || 1}</span>
                                </div>
                              </div>
                              <span className="text-xs font-mono font-black text-primary">{u.xp} XP</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 text-xs text-base-content/40 font-bold">
                          {locale === 'ar' ? 'لا توجد بيانات حالياً.' : 'No leaderboard entries yet.'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Productivity planner widgets */}
                  <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm space-y-6">
                    <h3 className="text-xs font-black text-base-content/80 uppercase tracking-wider flex items-center gap-2 border-b border-base-200 pb-3">
                      <Calendar className="w-4 h-4 text-primary animate-pulse" />
                      {locale === 'ar' ? 'مخطط الإنتاجية والدراسة' : 'Productivity Scheduler'}
                    </h3>

                    {/* Goal Slider */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-base-content/75">{locale === 'ar' ? 'الهدف اليومي (دقائق):' : 'Daily Goal (mins):'}</span>
                        <span className="badge badge-neutral text-xs font-black">{dailyGoalVal}m</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="120" 
                        step="5"
                        value={dailyGoalVal} 
                        onChange={(e) => setDailyGoalVal(Number(e.target.value))} 
                        onMouseUp={handleUpdateGoals}
                        onTouchEnd={handleUpdateGoals}
                        className="w-full accent-primary h-1 bg-base-300 rounded cursor-pointer" 
                      />

                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="font-extrabold text-base-content/75">{locale === 'ar' ? 'الهدف الأسبوعي (دقائق):' : 'Weekly Goal (mins):'}</span>
                        <span className="badge badge-neutral text-xs font-black">{weeklyGoalVal}m</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" 
                        max="600" 
                        step="10"
                        value={weeklyGoalVal} 
                        onChange={(e) => setWeeklyGoalVal(Number(e.target.value))} 
                        onMouseUp={handleUpdateGoals}
                        onTouchEnd={handleUpdateGoals}
                        className="w-full accent-primary h-1 bg-base-300 rounded cursor-pointer" 
                      />
                    </div>

                    {/* To-Do Lists */}
                    <div className="space-y-3 pt-3 border-t border-base-200">
                      <h4 className="text-xs font-black text-base-content/70 uppercase tracking-wider">{locale === 'ar' ? 'قائمة المهام اليومية' : 'Daily Study To-Do List'}</h4>
                      <form onSubmit={handleAddTodo} className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder={locale === 'ar' ? 'إضافة مهمة جديدة...' : 'Add study todo...'}
                          value={newTodo}
                          onChange={(e) => setNewTodo(e.target.value)}
                          className="flex-grow input input-xs input-bordered rounded-lg focus:input-primary text-xs"
                        />
                        <button 
                          type="submit" 
                          disabled={isAddingTodo || !newTodo.trim()}
                          className="btn btn-primary btn-xs rounded-lg font-black cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </form>

                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {schedule && schedule.todos && schedule.todos.length > 0 ? (
                          schedule.todos.map((todo: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2.5 p-2 bg-base-200/50 hover:bg-base-200 rounded-xl border border-base-300/60 transition-colors">
                              <input 
                                type="checkbox" 
                                checked={todo.completed} 
                                onChange={() => handleToggleTodo(idx, todo.completed)} 
                                className="checkbox checkbox-xs checkbox-primary rounded cursor-pointer"
                              />
                              <span className={`text-xs font-semibold ${todo.completed ? 'line-through text-base-content/40' : 'text-base-content/80'}`}>{todo.text}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-xs text-base-content/40 font-bold">
                            {locale === 'ar' ? 'لا توجد مهام حالياً.' : 'Your Todo list is clean.'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Visual Study Calendar Grid */}
                    <div className="space-y-3 pt-3 border-t border-base-200">
                      <h4 className="text-xs font-black text-base-content/70 uppercase tracking-wider">{locale === 'ar' ? 'سجل الالتزام الدراسي' : 'Study Commitment Grid'}</h4>
                      <div className="grid grid-cols-7 gap-1 max-w-[200px] mx-auto">
                        {Array.from({ length: 28 }).map((_, idx) => {
                          const intensity = (idx * 7) % 5;
                          const colors = ['bg-base-300', 'bg-primary/20', 'bg-primary/45', 'bg-primary/70', 'bg-primary'];
                          return (
                            <div 
                              key={idx} 
                              className={`w-5.5 h-5.5 rounded-sm ${colors[intensity]} tooltip tooltip-top cursor-pointer`}
                              data-tip={`Day ${idx + 1}: ${intensity * 1.5} hrs study`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[9px] text-base-content/40 font-bold px-2">
                        <span>{locale === 'ar' ? 'أقل التزام' : 'Less study'}</span>
                        <span>{locale === 'ar' ? 'أكثر التزام' : 'More study'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Meetings List */}
                  <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-base-content/80 uppercase tracking-wider">{t('upcomingMeetings')}</h3>

                    {isMeetingsLoading ? (
                      <div className="flex justify-center py-8">
                        <span className="loading loading-spinner text-primary" />
                      </div>
                    ) : !meetings?.length ? (
                      <div className="text-center py-12">
                        <p className="text-xs text-base-content/50 font-bold">{t('noMeetings')}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {meetings.slice(0, 3).map((meeting: any) => (
                          <div key={meeting.id || meeting._id} className="p-3 bg-base-200/50 hover:bg-base-200 rounded-2xl border border-base-300 space-y-2 transition-colors">
                            <h4 className="text-xs font-black text-base-content line-clamp-1">{meeting.title}</h4>
                            <div className="flex items-center justify-between text-[10px] text-base-content/50 font-bold">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-primary" />
                                {new Date(meeting.scheduledAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                              </span>
                              <span>{t('onlineClass')}</span>
                            </div>
                            <a 
                              href={meeting.roomUrl || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-xs btn-primary w-full rounded-lg font-bold"
                            >
                              {t('join')}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENROLLED COURSES */}
          {activeTab === 'courses' && (
            <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm space-y-6">
              <h3 className="text-sm font-black text-base-content/80 uppercase tracking-wider">{t('tabCourses')}</h3>
              
              {isEnrollmentsLoading ? (
                <div className="flex justify-center py-12">
                  <span className="loading loading-spinner text-primary" />
                </div>
              ) : !enrollments?.length ? (
                <div className="text-center py-20 space-y-3">
                  <p className="text-sm text-base-content/50 font-bold">{t('noCourses')}</p>
                  <Link href={lp('/courses')} className="btn btn-primary rounded-xl font-bold px-6">
                    {t('browseCourses')}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrollments.map((enrollment: any) => (
                    <div key={enrollment.id} className="card bg-base-200/50 hover:bg-base-200 rounded-2xl border border-base-300 shadow-xs flex flex-col justify-between h-full transition-colors overflow-hidden">
                      <div className="aspect-video bg-base-300 w-full relative">
                        {enrollment.course?.thumbnail ? (
                          <img src={enrollment.course.thumbnail} alt={enrollment.course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-base-content/30 font-bold uppercase text-xs">Code</div>
                        )}
                        <span className="absolute top-2 right-2 badge badge-sm badge-primary py-2 font-bold text-[9px]">
                          {enrollment.course?.category?.name || 'Class'}
                        </span>
                      </div>
                      
                      <div className="p-4 flex-grow flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm text-base-content line-clamp-1 leading-snug">{enrollment.course?.title}</h4>
                          <p className="text-xs text-base-content/60 line-clamp-2 leading-relaxed">{enrollment.course?.description}</p>
                        </div>
                        
                        <div className="space-y-3 pt-2">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-base-content/50">
                              <span>Progress</span>
                              <span>{enrollment.progress || 0}%</span>
                            </div>
                            <progress className="progress progress-primary w-full" value={enrollment.progress || 0} max="100" />
                          </div>
                          
                          {enrollment.progress >= 100 ? (
                            <button 
                              onClick={() => handleViewCertificate(enrollment.course?.id || enrollment.course?._id)}
                              disabled={isCertificateLoading}
                              className="btn btn-sm btn-success text-white w-full rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Award className="w-4 h-4 text-white" />
                              {isCertificateLoading ? (
                                <span className="loading loading-spinner loading-xs text-white"></span>
                              ) : (
                                locale === 'ar' ? 'عرض الشهادة المعتمدة' : 'View Verified Certificate'
                              )}
                            </button>
                          ) : (
                            <Link 
                              href={lp(`/courses/${enrollment.course?.slug || enrollment.course?.id}`)} 
                              className="btn btn-sm btn-primary w-full rounded-xl font-bold flex items-center justify-center gap-1.5"
                            >
                              {t('resumeLearning')}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ROADMAPS */}
          {activeTab === 'roadmap' && (
            <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-black text-base-content/80 uppercase tracking-wider">{t('chooseTrack')}</h3>
                <p className="text-xs text-base-content/50 mt-1">{t('trackSummary')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'web', title: 'Web / Fullstack', desc: 'React, Next.js, Node, NestJS, and SQL/NoSQL databases.', color: 'from-blue-500/10 to-indigo-500/10', text: 'text-primary' },
                  { id: 'mobile', title: 'Mobile App Dev', desc: 'React Native, Flutter, Swift, Kotlin, and native compilation.', color: 'from-amber-500/10 to-orange-500/10', text: 'text-warning' },
                  { id: 'ai', title: 'AI & Data Science', desc: 'Python, Math libraries, Neural Networks, and Large Language Models.', color: 'from-emerald-500/10 to-teal-500/10', text: 'text-success' },
                ].map((track) => (
                  <div key={track.id} className="card bg-base-200/50 hover:bg-base-200 border border-base-300 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-colors">
                    <div className="space-y-2">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${track.color} flex items-center justify-center`}>
                        <Compass className="w-5 h-5 text-base-content" />
                      </div>
                      <h4 className="font-extrabold text-sm text-base-content">{track.title}</h4>
                      <p className="text-xs text-base-content/60 leading-relaxed font-medium">{track.desc}</p>
                    </div>

                    <Link 
                      href={lp(`/roadmap?track=${track.id}`)}
                      className="btn btn-sm btn-outline btn-primary rounded-xl font-bold flex items-center justify-center gap-1.5 mt-2"
                    >
                      Explore Path <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MEETINGS */}
          {activeTab === 'meetings' && (
            <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm space-y-6">
              <h3 className="text-sm font-black text-base-content/80 uppercase tracking-wider">{t('tabMeetings')}</h3>
              
              {isMeetingsLoading ? (
                <div className="flex justify-center py-12">
                  <span className="loading loading-spinner text-primary" />
                </div>
              ) : !meetings?.length ? (
                <div className="text-center py-20">
                  <p className="text-sm text-base-content/50 font-bold">{t('noMeetings')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {meetings.map((meeting: any) => (
                    <div key={meeting.id || meeting._id} className="bg-base-200/50 hover:bg-base-200 rounded-2xl border border-base-300 p-4 space-y-3 flex flex-col justify-between transition-colors">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="badge badge-sm badge-primary font-bold text-[9px] uppercase">{meeting.status || 'Active'}</span>
                          <span className="text-[10px] text-base-content/40 font-bold">{new Date(meeting.scheduledAt).toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-base-content line-clamp-1">{meeting.title}</h4>
                        <p className="text-xs text-base-content/60 line-clamp-2 leading-relaxed">{meeting.description}</p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between text-[10px] text-base-content/50 font-bold border-t border-base-300/40 pt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {new Date(meeting.scheduledAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {meeting.instructor && (
                            <span>{t('host')}: {meeting.instructor.username}</span>
                          )}
                        </div>

                        <a 
                          href={meeting.roomUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-primary w-full rounded-xl font-bold flex items-center justify-center gap-1.5"
                        >
                          <Video className="w-4 h-4" /> {t('join')}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="card bg-base-100 border border-base-300 shadow-sm rounded-3xl overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-blue-400 via-indigo-200 to-amber-100 relative" />

              <div className="px-6 pb-8">
                
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 mb-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <div 
                      onClick={handleAvatarClick}
                      className="w-24 h-24 rounded-full border-4 border-base-100 bg-base-300 overflow-hidden relative group cursor-pointer shadow-md"
                    >
                      {isUploading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <span className="loading loading-spinner loading-md text-white" />
                        </div>
                      ) : avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary text-primary-content flex items-center justify-center font-black text-3xl uppercase">
                          {user.username?.[0]}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange}
                        disabled={isUploading}
                      />
                    </div>
                    
                    <div className="mb-1">
                      <h2 className="text-xl font-extrabold text-base-content">{user.fullName || user.username}</h2>
                      <p className="text-xs text-base-content/50 font-bold">{user.email}</p>
                    </div>
                  </div>

                  <div>
                    {!isEditing ? (
                      <button 
                        onClick={() => setIsEditing(true)} 
                        className="btn btn-primary rounded-xl font-bold px-6 text-xs sm:text-sm"
                      >
                        {t('editProfile')}
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsEditing(false)} 
                          className="btn btn-ghost border border-base-300 rounded-xl font-bold px-4 text-xs sm:text-sm"
                          disabled={isSaving}
                        >
                          {tCommon('cancel')}
                        </button>
                        <button 
                          onClick={handleSubmit} 
                          className="btn btn-primary rounded-xl font-bold px-6 text-xs sm:text-sm"
                          disabled={isSaving}
                        >
                          {isSaving ? t('saving') : t('saveChanges')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">{t('fullName')}</label>
                    <input 
                      type="text" 
                      placeholder={t('fullName')}
                      className="input input-bordered w-full rounded-xl font-semibold text-sm focus:input-primary"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">{t('nickName')}</label>
                    <input 
                      type="text" 
                      placeholder={t('nickName')}
                      className="input input-bordered w-full rounded-xl font-semibold text-sm focus:input-primary"
                      value={formData.nickName}
                      onChange={(e) => setFormData({ ...formData, nickName: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">{t('gender')}</label>
                    <select 
                      className="select select-bordered w-full rounded-xl font-semibold text-sm focus:select-primary"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      disabled={!isEditing}
                    >
                      <option value="Male">{t('male')}</option>
                      <option value="Female">{t('female')}</option>
                      <option value="Other">{t('other')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">{t('country')}</label>
                    <input 
                      type="text" 
                      placeholder={t('country')}
                      className="input input-bordered w-full rounded-xl font-semibold text-sm focus:input-primary"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">{t('language')}</label>
                    <input 
                      type="text" 
                      placeholder={t('language')}
                      className="input input-bordered w-full rounded-xl font-semibold text-sm focus:input-primary"
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <label className="label text-xs font-bold text-base-content/50 uppercase tracking-wider">{t('timeZone')}</label>
                    <input 
                      type="text" 
                      placeholder={t('timeZone')}
                      className="input input-bordered w-full rounded-xl font-semibold text-sm focus:input-primary"
                      value={formData.timeZone}
                      onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </form>

                <div className="mt-10 pt-8 border-t border-base-200">
                  <h3 className="text-sm font-black text-base-content/85 mb-4">{t('myEmailAddress')}</h3>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3.5 bg-base-200/50 hover:bg-base-200 rounded-2xl border border-base-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-base-content">{user.email}</p>
                          <p className="text-[10px] text-base-content/40 font-bold">1 month ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-primary font-bold bg-primary-content/10 px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5" /> {t('verified')}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="button"
                    className="btn btn-ghost text-primary hover:bg-primary/5 rounded-xl font-bold flex items-center gap-1.5 mt-4 text-xs"
                  >
                    <Plus className="w-4 h-4" /> {t('addEmail')}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: COOPERATIVE STUDY CIRCLES */}
          {activeTab === 'studyGroups' && (
            <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm space-y-6 animate-fadeIn">
              {!activeGroup ? (
                // Group Lists
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-200 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-base-content flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        {locale === 'ar' ? 'حلقات الدراسة التعاونية' : 'Cooperative Study Circles'}
                      </h3>
                      <p className="text-xs text-base-content/50 mt-1">
                        {locale === 'ar' ? 'انضم إلى زملائك في الدراسة لمناقشة الدروس ومشاركة الموارد الكودية.' : 'Join cohorts of students studying the same tracks to learn, chat, and share materials together.'}
                      </p>
                    </div>

                    {/* Create Group Trigger Button */}
                    <button 
                      onClick={() => {
                        const name = prompt(locale === 'ar' ? 'اسم مجموعة الدراسة:' : 'Enter Study Circle Name:');
                        if (name) {
                          api.post('/study-groups', { name, courseId: enrollments?.[0]?.course?.id || 'default' })
                            .then(() => refetchGroups());
                        }
                      }}
                      className="btn btn-sm btn-primary rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-white" />
                      <span className="text-white">{locale === 'ar' ? 'إنشاء حلقة جديدة' : 'Create New Circle'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studyGroups && studyGroups.length > 0 ? (
                      studyGroups.map((group: any) => {
                        const isMember = group.members?.includes(user.sub);
                        return (
                          <div key={group._id} className="p-5 bg-base-200/50 hover:bg-base-200 border border-base-300 rounded-2xl flex flex-col justify-between gap-4 transition-colors">
                            <div className="space-y-2">
                              <span className="badge badge-sm badge-neutral py-2 font-bold text-[9px] uppercase">
                                {group.members?.length || 1} MEMBERS
                              </span>
                              <h4 className="font-extrabold text-sm text-base-content">{group.name}</h4>
                              <p className="text-xs text-base-content/60 leading-relaxed font-medium">{group.description || (locale === 'ar' ? 'مجموعة دراسة مخصصة للمناقشة وحل التكليفات البرمجية.' : 'Private discussion board and coding resources directory.')}</p>
                            </div>

                            {isMember ? (
                              <button 
                                onClick={() => setActiveGroup(group)}
                                className="btn btn-sm btn-primary w-full rounded-xl font-bold cursor-pointer text-white"
                              >
                                {locale === 'ar' ? 'دخول حلقة النقاش' : 'Enter Workspace Circle'}
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleJoinGroup(group._id)}
                                className="btn btn-sm btn-outline btn-primary w-full rounded-xl font-bold cursor-pointer"
                              >
                                {locale === 'ar' ? 'انضمام للمجموعة' : 'Join Cohort Circle'}
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 md:col-span-2 text-xs text-base-content/40 font-bold">
                        {locale === 'ar' ? 'لا توجد مجموعات دراسة حالياً.' : 'No study circles found.'}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Active Workspace Circle Split Screen
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-base-200 pb-3">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveGroup(null)} 
                        className="btn btn-xs btn-ghost font-bold rounded-lg border border-base-300 cursor-pointer"
                      >
                        {locale === 'ar' ? '← رجوع' : '← Back'}
                      </button>
                      <div>
                        <h3 className="font-extrabold text-base text-base-content leading-snug">{activeGroup.name}</h3>
                        <span className="text-[10px] text-base-content/50 font-bold uppercase">{activeGroup.members?.length || 1} active members</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Chat Board (2 columns) */}
                    <div className="lg:col-span-2 bg-base-200/40 rounded-2xl border border-base-300 flex flex-col h-[400px] overflow-hidden">
                      <div className="p-3 bg-base-300/50 border-b border-base-300 flex items-center justify-between text-[11px] font-black text-base-content/60 uppercase">
                        <span>💬 Cohort Discussion Chat</span>
                        {isGroupChatPolling && <span className="loading loading-double-spinner loading-xs text-primary scale-75"></span>}
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {activeGroup.chat && activeGroup.chat.length > 0 ? (
                          activeGroup.chat.map((msg: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                {msg.avatar ? <img src={msg.avatar} className="w-full h-full object-cover rounded-lg" /> : msg.username?.[0] || 'U'}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-extrabold text-base-content">{msg.username}</span>
                                  <span className="text-[8px] text-base-content/40 font-semibold">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-xs text-base-content/85 leading-relaxed font-semibold bg-base-100 p-2.5 rounded-xl border border-base-300 max-w-md break-words">{msg.content}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-base-content/40 font-bold">
                            {locale === 'ar' ? 'ابدأ المحادثة مع زملائك!' : 'Send a study question to spark collaboration!'}
                          </div>
                        )}
                      </div>

                      {/* Input form */}
                      <form onSubmit={handleSendGroupChat} className="p-3 bg-base-300/30 border-t border-base-300 flex gap-2 shrink-0 animate-fadeIn">
                        <input 
                          type="text" 
                          placeholder={locale === 'ar' ? 'اكتب رسالتك هنا...' : 'Type cohort message...'}
                          value={groupChatMessage}
                          onChange={(e) => setGroupChatMessage(e.target.value)}
                          className="flex-grow input input-xs input-bordered rounded-lg focus:input-primary text-xs"
                        />
                        <button type="submit" className="btn btn-primary btn-xs rounded-lg px-3">
                          <Send className="w-3.5 h-3.5 text-white" />
                        </button>
                      </form>
                    </div>

                    {/* Shared Files Directory (1 column) */}
                    <div className="card bg-base-100 p-5 border border-base-300 rounded-2xl space-y-4">
                      <h4 className="text-xs font-black text-base-content/80 uppercase tracking-wider flex items-center gap-1.5 border-b border-base-200 pb-2">
                        <FileText className="w-4 h-4 text-primary" />
                        {locale === 'ar' ? 'الموارد البرمجية المشتركة' : 'Shared Workspace'}
                      </h4>

                      {/* Share file block */}
                      <div className="space-y-2">
                        {sharedFileStatus === 'idle' ? (
                          <label className="flex items-center justify-center p-3 bg-base-200 hover:bg-base-300/60 border border-base-300 border-dashed rounded-xl cursor-pointer transition-colors text-xs font-black text-base-content/65">
                            <UploadCloud className="w-4 h-4 mr-1.5 text-primary" />
                            {locale === 'ar' ? 'رفع ومشاركة ملف كود' : 'Upload & Share Material'}
                            <input type="file" className="hidden" accept=".zip,.pdf" onChange={handleShareGroupResource} />
                          </label>
                        ) : sharedFileStatus === 'uploading' ? (
                          <div className="p-3 bg-base-200/50 rounded-xl border border-base-300 text-center space-y-1">
                            <span className="loading loading-spinner text-primary loading-xs"></span>
                            <p className="text-[10px] font-bold">Uploading...</p>
                            <progress className="progress progress-primary w-full h-1" value={sharedFileProgress} max="100"></progress>
                          </div>
                        ) : (
                          <div className="p-2 bg-success/15 border border-success/20 text-success rounded-xl flex items-center justify-between text-[10px] font-extrabold animate-fadeIn">
                            <span>Shared successfully!</span>
                            <button onClick={() => setSharedFileStatus('idle')} className="btn btn-link btn-xs p-0 text-[10px] text-success">Dismiss</button>
                          </div>
                        )}
                      </div>

                      {/* Files list */}
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {activeGroup.resources && activeGroup.resources.length > 0 ? (
                          activeGroup.resources.map((res: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-base-200/40 hover:bg-base-200 rounded-xl border border-base-300 text-xs">
                              <div className="flex items-center gap-2">
                                <Code className="w-4 h-4 text-primary" />
                                <div>
                                  <p className="font-extrabold text-base-content line-clamp-1">{res.name}</p>
                                  <span className="text-[8px] text-base-content/50 uppercase font-black">{res.type}</span>
                                </div>
                              </div>
                              <a href={res.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-xs text-primary">
                                <Download className="w-3.5 h-3.5 text-primary" />
                              </a>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-[10px] text-base-content/40 font-bold">
                            {locale === 'ar' ? 'لا توجد ملفات مشتركة.' : 'No materials shared yet.'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ── High-Fidelity Verified Certificate SVG Viewer Modal ── */}
      {selectedCertificate && (
        <div className="modal modal-open bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="modal-box max-w-4xl p-8 bg-base-100 rounded-[2.5rem] border border-base-300 relative shadow-2xl animate-scaleUp">
            <button 
              onClick={() => setSelectedCertificate(null)}
              className="btn btn-sm btn-circle btn-ghost absolute top-6 right-6 font-bold text-lg cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl font-black mb-6 text-base-content flex items-center gap-2">
              <Award className="w-6 h-6 text-success" />
              {locale === 'ar' ? 'شهادة التخرج الرقمية الموثقة' : 'Verified Completion Credential'}
            </h3>

            {/* Certificate Canvas / SVG Box */}
            <div className="bg-white border-8 border-double border-amber-800 p-8 md:p-12 text-center text-slate-800 rounded-3xl shadow-inner relative overflow-hidden select-none font-serif max-w-full">
              {/* Background badge decorations */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-amber-500/5 rounded-full border border-amber-600/10 pointer-events-none -z-10" />

              {/* Verified Ribbon Seal */}
              <div className="absolute top-8 right-8 flex flex-col items-center select-none pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-amber-600 text-white font-sans font-black flex items-center justify-center text-[10px] shadow-md border-2 border-white uppercase tracking-wider">
                  SEAL
                </div>
                <div className="flex gap-1 -mt-1">
                  <div className="w-2.5 h-6 bg-amber-600 transform skew-y-12"></div>
                  <div className="w-2.5 h-6 bg-amber-600 transform -skew-y-12"></div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xs font-sans font-black tracking-widest text-amber-700 uppercase">
                  THE CODEFATHER ACADEMY
                </h2>
                
                <h1 className="text-2xl md:text-4xl font-serif text-slate-900 italic font-medium leading-tight">
                  Certificate of Completion
                </h1>

                <p className="text-xs font-sans text-slate-500 max-w-md mx-auto leading-relaxed">
                  This credential proudly certifies that student user has successfully mastered the syllabus, coding workshops, and final cohort assessments of:
                </p>

                <div className="py-2">
                  <h3 className="text-xl md:text-3xl font-sans font-black text-slate-900 tracking-tight leading-tight">
                    {selectedCertificate.courseId?.title || 'Advanced Full-Stack Engineering'}
                  </h3>
                  <p className="text-[10px] font-sans font-bold text-slate-400 mt-1 uppercase tracking-widest">
                    CURRICULUM SPECIFICATION BLUEPRINT
                  </p>
                </div>

                <div className="border-t border-slate-300/60 max-w-xs mx-auto pt-3">
                  <p className="text-sm font-sans font-black text-slate-800">
                    {selectedCertificate.userId?.fullName || selectedCertificate.userId?.username || 'Student Graduate'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wide">
                    Certified Graduate Name
                  </p>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 text-[10px] text-slate-400 font-sans font-bold border-t border-slate-200/50 mt-8">
                  <div>
                    {locale === 'ar' ? 'تاريخ الإصدار: ' : 'ISSUED ON: '}
                    <span className="text-slate-600">{new Date(selectedCertificate.issuedAt).toLocaleDateString(locale)}</span>
                  </div>
                  <div>
                    {locale === 'ar' ? 'رقم التحقق: ' : 'CREDENTIAL ID: '}
                    <span className="text-slate-600 font-mono">{selectedCertificate.credentialId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => window.print()}
                className="btn btn-primary flex-1 rounded-xl font-bold text-white cursor-pointer"
              >
                <Download className="w-4 h-4 text-white" /> {locale === 'ar' ? 'تحميل كملف PDF / طباعة' : 'Download Certificate PDF'}
              </button>
              <button 
                onClick={() => setSelectedCertificate(null)}
                className="btn btn-outline border-base-300 flex-1 rounded-xl font-bold cursor-pointer"
              >
                {locale === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

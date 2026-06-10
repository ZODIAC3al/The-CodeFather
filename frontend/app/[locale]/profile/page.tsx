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
  CheckCircle, Clock, Video, ArrowRight, Compass, Calendar, CreditCard, Terminal
} from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'roadmap' | 'meetings' | 'settings'>('dashboard');

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

  const [triggeringType, setTriggeringType] = useState<string | null>(null);

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

  const handleTriggerTestNotification = async (type: 'PAYMENT' | 'COURSE' | 'ASSIGNMENT' | 'MEETING' | 'SYSTEM') => {
    setTriggeringType(type);
    let title = 'Test Alert';
    let message = 'This is a test notification generated from the developer console.';
    
    switch (type) {
      case 'PAYMENT':
        title = 'Payment Received';
        message = 'Your Stripe checkout payment of $19.99 for Premium Plan succeeded.';
        break;
      case 'COURSE':
        title = 'New Course Published';
        message = 'Next.js 15 App Router & Strict TypeScript Course is now live!';
        break;
      case 'ASSIGNMENT':
        title = 'Assignment Graded';
        message = 'Your Full-Stack NestJS Gateway assignment score: 100/100 (Excellent).';
        break;
      case 'MEETING':
        title = 'Class Slot Booked';
        message = 'Live study circle video slot booked with Instructor Bob for tomorrow 10:00 AM.';
        break;
      case 'SYSTEM':
        title = 'System Update';
        message = 'Core API database migration completed. WebSocket servers are now fully active.';
        break;
    }

    try {
      await api.post('/notifications/test', { title, message, type });
    } catch (err) {
      console.error('Failed to trigger test notification', err);
    } finally {
      setTriggeringType(null);
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
            <div className="flex flex-col gap-6">
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
                {/* Courses Progress */}
                <div className="card bg-base-100 border border-base-300 p-6 rounded-3xl shadow-sm lg:col-span-2 space-y-4">
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
                          
                          <Link 
                            href={lp(`/courses/${enrollment.course?.slug || enrollment.course?.id}`)} 
                            className="btn btn-sm btn-primary w-full rounded-xl font-bold flex items-center justify-center gap-1.5"
                          >
                            {t('resumeLearning')}
                          </Link>
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

                {/* Developer Tools: Test Notification System */}
                <div className="mt-10 pt-8 border-t border-base-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-black text-base-content/85 uppercase tracking-wider">
                      Developer Tools: Real-time Alerts Simulation
                    </h3>
                  </div>
                  <p className="text-xs text-base-content/50 font-bold mb-6">
                    Trigger synthetic events to test frontend WebSocket integrations, Web Audio bell chime effects, and local desktop notifications.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      disabled={triggeringType !== null}
                      onClick={() => handleTriggerTestNotification('PAYMENT')}
                      className="btn btn-outline btn-sm rounded-xl font-bold hover:btn-success flex items-center gap-1.5 justify-start text-xs cursor-pointer py-2 px-3 h-auto"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{triggeringType === 'PAYMENT' ? 'Triggering...' : 'Payment Success'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={triggeringType !== null}
                      onClick={() => handleTriggerTestNotification('COURSE')}
                      className="btn btn-outline btn-sm rounded-xl font-bold hover:btn-primary flex items-center gap-1.5 justify-start text-xs cursor-pointer py-2 px-3 h-auto"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{triggeringType === 'COURSE' ? 'Triggering...' : 'New Course Pub'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={triggeringType !== null}
                      onClick={() => handleTriggerTestNotification('ASSIGNMENT')}
                      className="btn btn-outline btn-sm rounded-xl font-bold hover:btn-warning flex items-center gap-1.5 justify-start text-xs cursor-pointer py-2 px-3 h-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{triggeringType === 'ASSIGNMENT' ? 'Triggering...' : 'Assignment Graded'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={triggeringType !== null}
                      onClick={() => handleTriggerTestNotification('MEETING')}
                      className="btn btn-outline btn-sm rounded-xl font-bold hover:btn-info flex items-center gap-1.5 justify-start text-xs cursor-pointer py-2 px-3 h-auto"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{triggeringType === 'MEETING' ? 'Triggering...' : 'Meeting Booked'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={triggeringType !== null}
                      onClick={() => handleTriggerTestNotification('SYSTEM')}
                      className="btn btn-outline btn-sm rounded-xl font-bold hover:btn-neutral flex items-center gap-1.5 justify-start text-xs cursor-pointer py-2 px-3 h-auto"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{triggeringType === 'SYSTEM' ? 'Triggering...' : 'System Broadcast'}</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>
      <Footer />
    </div>
  );
}

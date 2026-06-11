'use client';

import {
	AlertCircle,
	ArrowLeft,
	BookOpen,
	Calendar,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Code,
	FileText,
	Hash,
	Lock,
	MessageSquare,
	Play,
	Save,
	Send,
	Sparkles,
	Star,
	Tag,
	ThumbsUp,
	UserCheck,
	Users,
	Wifi,
	WifiOff,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export default function LessonView() {
  const params = useParams();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;
  const router = useRouter();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'chat' | 'cohort'>('overview');
  const [isOnline, setIsOnline] = useState(true);
  const [offlineNotes, setOfflineNotes] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

  // Review states
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  // Chat/Message states
  const [chatMessage, setChatMessage] = useState('');
  const [chatLanguage, setChatLanguage] = useState('General');
  const [chatCodeSnippet, setChatCodeSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);

  // Scheduling states
  const [selectedDay, setSelectedDay] = useState<number>(15);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);

  // Connection monitoring for PWA
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const saved = localStorage.getItem(`lesson_notes_${lessonId}`);
    if (saved) {
      setOfflineNotes(saved);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [lessonId]);

  // Fetch course details
  const { data: course, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${slug}`);
      return data;
    },
  });

  // Fetch reviews for this course
  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', course?.id],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/${course.id || course._id}`);
      return data || [];
    },
    enabled: !!course?.id,
  });

  // Fetch chat room messages
  const { data: chatMessages = [], refetch: refetchChat } = useQuery<any[]>({
    queryKey: ['messages', lessonId],
    queryFn: async () => {
      const { data } = await api.get(`/messages/${lessonId}`);
      return data || [];
    },
    refetchInterval: 3000, // Poll every 3 seconds for dynamic active chat room experience
  });

  // Review submission mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; comment: string }) => {
      const { data } = await api.post('/reviews', {
        courseId: course.id || course._id,
        ...reviewData,
      });
      return data;
    },
    onSuccess: () => {
      setReviewSuccess('Thank you for rating this course!');
      setNewComment('');
      setReviewError(null);
      queryClient.invalidateQueries({ queryKey: ['reviews', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['course', slug] });
    },
    onError: (err: any) => {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
      setReviewSuccess(null);
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; language?: string; codeSnippet?: string }) => {
      const { data } = await api.post('/messages', {
        courseId: course.id || course._id,
        lessonId,
        ...messageData,
      });
      return data;
    },
    onSuccess: () => {
      setChatMessage('');
      setChatCodeSnippet('');
      setShowCodeInput(false);
      queryClient.invalidateQueries({ queryKey: ['messages', lessonId] });
    }
  });

  // Like message mutation
  const likeMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { data } = await api.post(`/messages/${messageId}/like`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', lessonId] });
    }
  });

  const currentLesson = course?.lessons?.find(
    (l: any) => l.id === lessonId || l._id === lessonId
  );

  const currentIndex = course?.lessons?.findIndex(
    (l: any) => l.id === lessonId || l._id === lessonId
  );
  
  const prevLesson = currentIndex > 0 ? course?.lessons?.[currentIndex - 1] : null;
  const nextLesson = currentIndex < (course?.lessons?.length - 1) ? course?.lessons?.[currentIndex + 1] : null;

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setOfflineNotes(text);
    setSaveStatus('saving');
    localStorage.setItem(`lesson_notes_${lessonId}`, text);
    
    // Save to backend notebook
    if (isAuthenticated && course?.id) {
      saveNotebookMutation.mutate({
        courseId: course.id || course._id,
        lessonId: currentLesson?.id || currentLesson?._id,
        title: `Notes for ${currentLesson?.title || 'Lesson'}`,
        content: text,
        type: 'notes',
      });
    }
    
    setTimeout(() => {
      setSaveStatus('saved');
    }, 600);
  };

  // Notebook save mutation
  const saveNotebookMutation = useMutation({
    mutationFn: async (entry: { courseId: string; lessonId?: string; title: string; content: string; type: string }) => {
      const { data } = await api.post('/notebook', entry);
      return data;
    },
  });

  // Notebook export to markdown
  const exportNotebook = () => {
    const markdown = `# ${currentLesson?.title || 'Lesson Notes'}\n\n${offlineNotes}\n\n---\n*Exported from The Codefather*\n`;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-${lessonId}-${Date.now()}.md`;
    a.click();
  };

  const handleBooking = () => {
    if (!selectedTime) {
      setBookingMessage('Please select a preferred time slot first.');
      return;
    }
    setBookingMessage(`Successfully requested virtual cohort session for the ${selectedDay}th at ${selectedTime}!`);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    if (!chatMessage.trim()) return;

    sendMessageMutation.mutate({
      content: chatMessage,
      language: chatLanguage !== 'General' ? chatLanguage : undefined,
      codeSnippet: chatCodeSnippet.trim() ? chatCodeSnippet : undefined,
    });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    submitReviewMutation.mutate({
      rating: newRating,
      comment: newComment,
    });
  };

  if (isCourseLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow flex-col">
          <AlertCircle className="w-16 h-16 text-error mb-4 opacity-50" />
          <h1 className="text-2xl font-bold text-base-content mb-4">Lesson or Course not found</h1>
          <Link href={`/${locale}/courses`} className="btn-premium px-6 py-2 rounded-xl">Go back to Courses</Link>
        </div>
      </div>
    );
  }

  // Calculate rating breakdown
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : '4.8'; // default fallback

  const starCounts = [0, 0, 0, 0, 0]; // index 0 = 5 star, ..., index 4 = 1 star
  reviews.forEach((r: any) => {
    const starIdx = Math.max(0, Math.min(4, 5 - r.rating));
    starCounts[starIdx]++;
  });

  const starPercentages = starCounts.map(count => totalReviews > 0 ? (count / totalReviews) * 100 : 0);

  const lpUrl = (path: string) => `/${locale}${path}`;

  return (
    <div className="flex flex-col min-h-screen bg-base-200 font-sans text-base-content">
      <Navbar />

      {/* Connection Mode Alert */}
      {!isOnline && (
        <div className="bg-warning text-warning-content font-bold px-4 py-2 text-center text-xs flex items-center justify-center gap-2 z-40">
          <WifiOff className="w-4 h-4 animate-bounce" />
          Offline Mode Active. Notes are saved locally and sync automatically when you reconnect.
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link 
            href={`/${locale}/courses/${slug}`} 
            className="flex items-center gap-2 text-sm font-bold text-base-content/60 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Course Overview
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-base-content/50">
            <span>{course.title}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-base-content">Lesson {currentIndex + 1} of {course.lessons?.length}</span>
          </div>
        </div>

        {/* ── TOP AREA: Video & Syllabus Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Box Container (Left) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative rounded-[2rem] overflow-hidden bg-black aspect-video shadow-2xl border-4 border-base-100/50">
              {isOnline ? (
                currentLesson.videoUrl ? (
                  <iframe
                    src={currentLesson.videoUrl}
                    className="w-full h-full"
                    allowFullScreen
                    title={currentLesson.title}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-content p-8 bg-neutral">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary">
                      <Play className="w-10 h-10 fill-primary" />
                    </div>
                    <h3 className="text-xl font-bold">No Video Available</h3>
                    <p className="text-sm opacity-60 mt-1">This lesson is structured as code documentation and study reading.</p>
                  </div>
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-content p-8 bg-neutral">
                  <WifiOff className="w-16 h-16 opacity-40 mb-4 text-warning" />
                  <h3 className="text-xl font-bold">Offline Stream Standby</h3>
                  <p className="text-sm opacity-60 mt-1 max-w-xs text-center">Video streams require network connectivity. Notes remain fully readable.</p>
                </div>
              )}
            </div>

            {/* Video Navigation Controls */}
            <div className="flex justify-between items-center bg-base-100 p-4 rounded-2xl border border-base-300 shadow-sm">
              {prevLesson ? (
                <Link 
                  href={`/${locale}/courses/${slug}/lessons/${prevLesson.id || prevLesson._id}`}
                  className="btn btn-sm btn-ghost gap-2 font-bold text-base-content/85 hover:text-primary transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Link>
              ) : (
                <div />
              )}
              
              <button 
                onClick={() => setIsCompleted(!isCompleted)}
                className={`btn btn-sm rounded-xl font-bold gap-2 ${isCompleted ? 'btn-success text-success-content' : 'btn-outline border-base-300'}`}
              >
                <CheckCircle2 className="w-4 h-4" /> {isCompleted ? 'Lesson Completed' : 'Mark Completed'}
              </button>

              {nextLesson ? (
                <Link 
                  href={`/${locale}/courses/${slug}/lessons/${nextLesson.id || nextLesson._id}`}
                  className="btn btn-sm btn-ghost gap-2 font-bold text-base-content/85 hover:text-primary transition-all"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>

          {/* Syllabus Right Sidebar */}
          <div className="card bg-base-100 rounded-[2rem] border border-base-300 shadow-xl overflow-hidden flex flex-col h-[400px] lg:h-auto">
            <div className="p-6 border-b border-base-300 bg-base-200/50 flex items-center gap-2 shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-extrabold text-base-content">Course Syllabus</h3>
            </div>
            <div className="divide-y divide-base-300 overflow-y-auto flex-grow">
              {course.lessons?.map((lesson: any, index: number) => {
                const isActive = lesson.id === lessonId || lesson._id === lessonId;
                return (
                  <Link
                    key={lesson.id || lesson._id}
                    href={`/${locale}/courses/${slug}/lessons/${lesson.id || lesson._id}`}
                    className={`p-4 block transition-all ${isActive ? 'bg-primary/5 border-l-4 border-primary font-bold' : 'hover:bg-base-200/40'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${isActive ? 'bg-primary text-primary-content animate-pulse' : 'bg-base-300 text-base-content/60'}`}>
                        {index + 1}
                      </div>
                      <div className="flex-grow">
                        <h4 className={`text-sm leading-snug ${isActive ? 'text-primary' : 'text-base-content'}`}>
                          {lesson.title}
                        </h4>
                        {lesson.duration && (
                          <span className="text-[10px] font-bold text-base-content/50 block mt-1">{lesson.duration} mins</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── LOWER AREA: Dynamic Features Tab System ── */}
        <div className="space-y-6">
          {/* Tab Selector Links */}
          <div className="flex border-b border-base-300/80 gap-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview & Notes', count: null },
              { id: 'reviews', label: 'Reviews & Ratings', count: reviews.length },
              { id: 'chat', label: 'Developer Chat Room', count: chatMessages.length },
              { id: 'cohort', label: 'Cohort Scheduler', count: null },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 text-sm font-extrabold transition-all relative whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'text-primary font-black border-b-2 border-primary' 
                    : 'text-base-content/60 hover:text-primary'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {tab.label}
                  {tab.count !== null && (
                    <span className="badge badge-sm badge-neutral">{tab.count}</span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          <div>
            {/* 1. OVERVIEW & NOTES TAB */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lesson text content (Left) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="card bg-base-100 p-8 rounded-3xl border border-base-300/80 shadow-md">
                    <span className="badge badge-primary badge-outline text-xs font-bold uppercase tracking-wider mb-4">
                      Lesson Description
                    </span>
                    <h2 className="text-2xl font-black text-base-content mb-4">{currentLesson.title}</h2>
                    <div className="prose max-w-none text-base-content/85 leading-relaxed font-medium">
                      {currentLesson.content || 'This lesson consists of visual coding tutorials and physical study group reviews.'}
                    </div>
                  </div>
                </div>

                {/* Notebook (Right) */}
                <div className="card bg-base-100 p-6 rounded-3xl border border-base-300/80 shadow-md h-fit relative">
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    {saveStatus === 'saving' && <span className="loading loading-spinner loading-xs text-primary"></span>}
                    {saveStatus === 'saved' && <span className="text-[10px] font-bold text-success flex items-center gap-0.5"><Save className="w-3 h-3" /> Saved</span>}
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="font-extrabold text-base text-base-content">Notebook Sandbox</h3>
                      <p className="text-[10px] font-medium text-base-content/60">Persistent offline study logs</p>
                    </div>
                  </div>

                  <textarea
                    value={offlineNotes}
                    onChange={handleNotesChange}
                    placeholder="Type code logs, formulas, or lesson summaries here..."
                    rows={8}
                    className="textarea textarea-bordered w-full font-mono text-xs p-3 leading-relaxed resize-y focus:outline-none focus:border-primary bg-base-200/50"
                  />
                </div>
              </div>
            )}

            {/* 2. REVIEWS & RATINGS TAB */}
            {activeTab === 'reviews' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Reviews List & Feedback Column (Left) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="card bg-base-100 p-8 rounded-3xl border border-base-300 shadow-md">
                    <h3 className="text-xl font-extrabold text-base-content mb-6">User Reviews</h3>
                    {reviews.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.map((r: any) => (
                          <div key={r.id} className="border-b border-base-300 pb-6 last:border-b-0 last:pb-0 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-extrabold text-sm uppercase shrink-0">
                              {r.user?.avatar ? (
                                <img src={r.user.avatar} alt={r.user.username} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                r.user?.username?.[0] || 'U'
                              )}
                            </div>
                            <div className="flex-grow space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-base-content">{r.user?.username || 'Student User'}</span>
                                <span className="text-[10px] text-base-content/50 font-bold">{new Date(r.createdAt || Date.now()).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-warning text-warning' : 'text-base-content/25'}`} />
                                ))}
                              </div>
                              <p className="text-sm text-base-content/80 font-medium leading-relaxed pt-1">
                                {r.comment || 'No written review provided.'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-base-content/50 font-bold">
                        No reviews posted yet. Be the first to review!
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating Breakdown & Submission Form (Right) */}
                <div className="space-y-6">
                  
                  {/* Rating breakdown box */}
                  <div className="card bg-base-100 p-6 rounded-3xl border border-base-300 shadow-md space-y-4">
                    <div className="text-center space-y-1">
                      <div className="text-5xl font-black text-base-content">{averageRating}</div>
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(averageRating)) ? 'fill-warning text-warning' : 'text-base-content/20'}`} />
                        ))}
                      </div>
                      <div className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider">{totalReviews} Ratings</div>
                    </div>

                    {/* Bars */}
                    <div className="space-y-2 text-xs font-semibold">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = starCounts[5 - stars];
                        const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                        return (
                          <div key={stars} className="flex items-center gap-3">
                            <span className="w-12 text-base-content/75 text-end">{stars} Stars</span>
                            <div className="flex-grow bg-base-200 h-2 rounded-full overflow-hidden">
                              <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-8 text-base-content/50 text-start">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit review form */}
                  <div className="card bg-base-100 p-6 rounded-3xl border border-base-300 shadow-md">
                    <h4 className="font-extrabold text-base-content text-sm mb-4">Rate this Course</h4>
                    
                    {reviewSuccess && (
                      <div className="alert alert-success text-xs font-bold mb-4">{reviewSuccess}</div>
                    )}
                    {reviewError && (
                      <div className="alert alert-error text-xs font-bold mb-4">{reviewError}</div>
                    )}

                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      {/* Star selection */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-base-content/65">Rating:</span>
                        <div className="rating rating-sm">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <input 
                              key={s} 
                              type="radio" 
                              name="rating-star" 
                              className="mask mask-star-2 bg-orange-400"
                              checked={newRating === s}
                              onChange={() => setNewRating(s)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-base-content/60 uppercase">Feedback Comment</label>
                        <textarea
                          placeholder="What did you like or dislike about the syllabus?"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={3}
                          className="textarea textarea-bordered w-full text-xs focus:outline-none focus:border-primary"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitReviewMutation.isPending}
                        className="btn btn-primary btn-sm w-full rounded-xl font-bold"
                      >
                        {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            )}

            {/* 3. DEV CHAT ROOM TAB */}
            {activeTab === 'chat' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Chat feed container (Left) */}
                <div className="lg:col-span-2 card bg-base-100 rounded-3xl border border-base-300 shadow-md flex flex-col h-[550px] overflow-hidden">
                  <div className="p-4 bg-base-200/50 border-b border-base-300 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Hash className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-extrabold text-sm text-base-content">developer-classroom-chat</h3>
                        <p className="text-[10px] font-bold text-base-content/40 uppercase">Interactive Developer Forum</p>
                      </div>
                    </div>
                    <div className="badge badge-sm badge-neutral font-bold">{chatMessages.length} active logs</div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-grow overflow-y-auto p-6 space-y-6">
                    {chatMessages.length > 0 ? (
                      chatMessages.map((msg: any) => {
                        const isLiked = msg.likes?.includes(user?.sub);
                        return (
                          <div key={msg.id || msg._id} className="flex gap-4 items-start group">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center font-bold text-sm uppercase shrink-0">
                              {msg.user?.avatar ? (
                                <img src={msg.user.avatar} alt={msg.user.username} className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                msg.user?.username?.[0] || 'U'
                              )}
                            </div>
                            
                            {/* Content Body */}
                            <div className="flex-grow space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-base-content">{msg.user?.username || 'Developer'}</span>
                                  {msg.language && (
                                    <span className="badge badge-primary badge-outline text-[9px] font-bold uppercase tracking-wider">{msg.language}</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-base-content/40 font-semibold">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>

                              <p className="text-sm text-base-content/90 font-medium leading-relaxed break-words whitespace-pre-wrap">
                                {msg.content}
                              </p>

                              {/* Code block preview */}
                              {msg.codeSnippet && (
                                <div className="relative bg-base-300 rounded-xl p-4 font-mono text-xs text-base-content border border-base-300 overflow-x-auto max-w-full my-2">
                                  <div className="absolute top-2 right-3 text-[9px] font-bold text-base-content/50 uppercase select-none">{msg.language || 'code'}</div>
                                  <pre className="mt-1"><code>{msg.codeSnippet}</code></pre>
                                </div>
                              )}

                              {/* Action items like Upvote */}
                              <div className="flex items-center gap-4 pt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => likeMessageMutation.mutate(msg.id || msg._id)}
                                  className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                                    isLiked ? 'text-primary' : 'text-base-content/50 hover:text-primary'
                                  }`}
                                >
                                  <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-primary' : ''}`} />
                                  <span>{msg.likes?.length || 0} Upvotes</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col justify-center items-center text-center p-8 space-y-2 opacity-50">
                        <MessageSquare className="w-12 h-12 text-primary" />
                        <h4 className="font-bold">No chat history here</h4>
                        <p className="text-xs max-w-xs font-medium">Type a programming query or paste code to start a collaboration!</p>
                      </div>
                    )}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendChatMessage} className="p-4 bg-base-200/50 border-t border-base-300 space-y-3 shrink-0">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Discuss lessons or ask for code help..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        className="flex-grow input input-bordered input-sm rounded-xl focus:outline-none focus:border-primary text-xs"
                        required
                      />

                      {/* Code attachment trigger */}
                      <button
                        type="button"
                        onClick={() => setShowCodeInput(!showCodeInput)}
                        className={`btn btn-sm rounded-xl flex items-center justify-center font-bold gap-1 px-3 ${showCodeInput ? 'btn-primary text-white' : 'btn-outline border-base-300'}`}
                      >
                        <Code className="w-4 h-4" />
                        <span className="hidden md:inline text-[10px]">Snippet</span>
                      </button>

                      <button
                        type="submit"
                        disabled={sendMessageMutation.isPending}
                        className="btn btn-primary btn-sm rounded-xl px-4"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Collapsible Code Snippet block */}
                    {showCodeInput && (
                      <div className="flex flex-col gap-2 p-3 bg-base-300 rounded-xl border border-base-300 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-base-content/60 uppercase">Paste Code Snippet</label>
                          
                          {/* Tag selector */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-base-content/40 uppercase">Stack:</span>
                            <select
                              value={chatLanguage}
                              onChange={(e) => setChatLanguage(e.target.value)}
                              className="select select-bordered select-xs text-[10px] rounded-lg focus:outline-none"
                            >
                              {['General', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Python', 'Go', 'Next.js', 'React'].map((lang) => (
                                <option key={lang} value={lang}>{lang}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <textarea
                          placeholder="const example = () => { console.log('Hello Codefather!'); };"
                          value={chatCodeSnippet}
                          onChange={(e) => setChatCodeSnippet(e.target.value)}
                          rows={4}
                          className="textarea textarea-bordered w-full font-mono text-xs focus:outline-none focus:border-primary bg-base-200"
                        />
                      </div>
                    )}
                  </form>
                </div>

                {/* Info Side Panel (Right) */}
                <div className="card bg-base-100 p-6 rounded-3xl border border-base-300 shadow-md space-y-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    <h4 className="font-extrabold text-sm text-base-content">Syllabus Chat Rules</h4>
                  </div>
                  <ul className="text-xs text-base-content/85 space-y-2 list-disc pl-4 font-medium leading-relaxed">
                    <li>This channel is tied to this lesson and course.</li>
                    <li>Share clean formatted code snippets.</li>
                    <li>Be helpful and review other student upvotes.</li>
                  </ul>
                  <div className="pt-2 border-t border-base-300">
                    <span className="text-[10px] font-bold text-success flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> Checked & Seeded by Local Mentors
                    </span>
                  </div>
                </div>

              </div>
            )}

            {/* 4. COHORT SCHEDULER TAB */}
            {activeTab === 'cohort' && (
              <div className="max-w-xl mx-auto card bg-base-100 p-8 rounded-3xl border border-base-300 shadow-md space-y-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-extrabold text-lg text-base-content">Interactive Cohort</h3>
                    <p className="text-xs font-semibold text-base-content/60">Schedule a 1-on-1 review or study group session.</p>
                  </div>
                </div>

                {bookingMessage && (
                  <div className="p-3.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold leading-relaxed">
                    {bookingMessage}
                  </div>
                )}

                {/* Day selection */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-base-content/60 uppercase tracking-wider">Select Date (June)</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[15, 16, 17, 18, 19].map((day) => (
                      <button
                        key={day}
                        onClick={() => {
                          setSelectedDay(day);
                          setBookingMessage(null);
                        }}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${selectedDay === day ? 'bg-primary text-primary-content border-primary shadow-md' : 'bg-base-200 hover:bg-base-300 border-base-300'}`}
                      >
                        {day}th
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time selection */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#1E2A38] dark:text-white/60 uppercase tracking-wider">Select Time Slot</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['10:00 AM', '2:00 PM', '6:00 PM'].map((time) => (
                      <button
                        key={time}
                        onClick={() => {
                          setSelectedTime(time);
                          setBookingMessage(null);
                        }}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${selectedTime === time ? 'bg-primary text-primary-content border-primary shadow-md' : 'bg-base-200 hover:bg-base-300 border-base-300'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={!isOnline}
                  className="btn-premium w-full py-4 rounded-xl font-bold text-xs flex justify-center items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/45"
                >
                  <Calendar className="w-4 h-4" /> Request Cohort slot
                </button>
              </div>
            )}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
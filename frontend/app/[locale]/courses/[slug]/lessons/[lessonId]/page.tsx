"use client";

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
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Plus,
  Trash2,
  Download,
  UploadCloud,
  Check,
  RotateCcw,
  FileVideo,
  Tv,
  Trophy,
  Zap,
  Shield,
  Flame,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Detect if a URL is a YouTube embed/watch URL */
const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  return (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("youtube-nocookie.com")
  );
};

/** Convert a YouTube watch URL to embed URL if needed */
const toYouTubeEmbedUrl = (url: string): string => {
  if (!url) return url;
  // Already an embed URL
  if (url.includes("/embed/")) return url;
  // youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  // youtube.com/watch?v=ID
  const watchMatch = url.match(/[?&]v=([^?&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  return url;
};

/** Detect if a URL is a direct streamable video file */
const isDirectVideoUrl = (url: string): boolean => {
  if (!url) return false;
  if (isYouTubeUrl(url)) return false;
  // Vimeo player pages are not direct video
  if (url.includes("vimeo.com") && !url.includes(".mp4")) return false;
  return true;
};

const formatTime = (sec: number) => {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

// ─── Badge definitions (themed for The Codefather) ────────────────────────────

const BADGE_DEFINITIONS = [
  {
    id: "cadet",
    name: "Codefather Cadet",
    nameAr: "مجند الكودفاذر",
    desc: "Joined the academy",
    descAr: "انضممت للأكاديمية",
    icon: Shield,
    color: "from-slate-600 to-slate-800",
    glow: "shadow-slate-500/30",
    always: true,
  },
  {
    id: "first-lesson",
    name: "First Blood",
    nameAr: "أول درس",
    desc: "Completed your first lesson",
    descAr: "أنهيت درسك الأول",
    icon: Flame,
    color: "from-orange-500 to-red-700",
    glow: "shadow-orange-500/40",
    always: false,
  },
  {
    id: "quiz-master",
    name: "Quiz Consigliere",
    nameAr: "مستشار الاختبارات",
    desc: "Passed a lesson quiz",
    descAr: "اجتزت اختبار درس",
    icon: Trophy,
    color: "from-amber-400 to-yellow-600",
    glow: "shadow-amber-400/40",
    always: false,
  },
  {
    id: "streak-7",
    name: "7-Day Don",
    nameAr: "دون 7 أيام",
    desc: "Active 7 days in a row",
    descAr: "نشط 7 أيام متتالية",
    icon: Zap,
    color: "from-violet-500 to-purple-700",
    glow: "shadow-violet-500/40",
    always: false,
  },
];

// ─── BadgeCard component ──────────────────────────────────────────────────────

function BadgeCard({
  badge,
  unlocked,
  locale,
}: {
  badge: (typeof BADGE_DEFINITIONS)[0];
  unlocked: boolean;
  locale: string;
}) {
  const Icon = badge.icon;
  const isAr = locale === "ar";
  return (
    <div
      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${unlocked
        ? `bg-gradient-to-br ${badge.color} border-white/10 shadow-lg ${badge.glow} scale-100`
        : "bg-base-200/60 border-base-300 opacity-40 grayscale"
        }`}
    >
      {unlocked && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-success rounded-full flex items-center justify-center border-2 border-base-100 z-10">
          <Check className="w-2.5 h-2.5 text-white" />
        </div>
      )}
      <div
        className={`p-3 rounded-xl ${unlocked ? "bg-white/15" : "bg-base-300"}`}
      >
        <Icon
          className={`w-6 h-6 ${unlocked ? "text-white" : "text-base-content/40"}`}
        />
      </div>
      <div className="text-center">
        <h4
          className={`text-[10px] font-black leading-tight ${unlocked ? "text-white" : "text-base-content/50"}`}
        >
          {isAr ? badge.nameAr : badge.name}
        </h4>
        <p
          className={`text-[8px] mt-0.5 leading-tight ${unlocked ? "text-white/70" : "text-base-content/30"}`}
        >
          {isAr ? badge.descAr : badge.desc}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LessonView() {
  const params = useParams();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("lesson");
  const queryClient = useQueryClient();
  const { isAuthenticated, user, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<
    "overview" | "reviews" | "chat" | "cohort"
  >("overview");
  const [isOnline, setIsOnline] = useState(true);
  const [offlineNotes, setOfflineNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">(
    "idle"
  );

  // Review states
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  // Chat/Message states
  const [chatMessage, setChatMessage] = useState("");
  const [chatLanguage, setChatLanguage] = useState("General");
  const [chatCodeSnippet, setChatCodeSnippet] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);

  // Scheduling states
  const [selectedDay, setSelectedDay] = useState<number>(15);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);

  // Advanced player states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoSpeed, setVideoSpeed] = useState(1);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  // playerEngine now auto-determined by URL type; user can override
  const [playerEngineOverride, setPlayerEngineOverride] = useState<
    "auto" | "youtube" | "custom"
  >("auto");
  const [bookmarkText, setBookmarkText] = useState("");
  const [bookmarks, setBookmarks] = useState<
    Array<{ id: string; time: number; text: string }>
  >([]);

  // Load bookmarks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`lesson_bookmarks_${lessonId}`);
      if (saved) setBookmarks(JSON.parse(saved));
    } catch {
      setBookmarks([]);
    }
  }, [lessonId]);

  const saveBookmarks = (newBookmarks: any) => {
    setBookmarks(newBookmarks);
    try {
      localStorage.setItem(
        `lesson_bookmarks_${lessonId}`,
        JSON.stringify(newBookmarks)
      );
    } catch { }
  };

  const handleAddBookmark = () => {
    if (!videoRef.current) return;
    const time = Math.round(videoRef.current.currentTime);
    const text = bookmarkText.trim() || `Bookmark at ${formatTime(time)}`;
    const newB = { id: Date.now().toString(), time, text };
    const updated = [...bookmarks, newB].sort((a, b) => a.time - b.time);
    saveBookmarks(updated);
    setBookmarkText("");
  };

  const handleDeleteBookmark = (id: string) => {
    saveBookmarks(bookmarks.filter((b) => b.id !== id));
  };

  const seekToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => { });
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch((err) => {
        console.warn("Play failed:", err);
      });
      setIsPlaying(true);
    }
  };

  const changeSpeed = (speed: number) => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
    setVideoSpeed(speed);
  };

  const triggerPiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("PiP not supported:", err);
    }
  };

  // Practice Assignment upload states
  const [assignmentFile, setAssignmentFile] = useState<string | null>(null);
  const [assignmentStatus, setAssignmentStatus] = useState<
    "idle" | "uploading" | "success"
  >("idle");
  const [assignmentProgress, setAssignmentProgress] = useState(0);

  const handleAssignmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAssignmentFile(file.name);
      setAssignmentStatus("uploading");
      setAssignmentProgress(10);
      const interval = setInterval(() => {
        setAssignmentProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setAssignmentStatus("success");
            return 100;
          }
          return prev + 30;
        });
      }, 300);
    }
  };

  // Classroom Quiz states
  const { data: quiz } = useQuery({
    queryKey: ["quiz", lessonId],
    queryFn: async () => {
      const { data } = await api.get(`/quizzes/lesson/${lessonId}`);
      return data;
    },
    enabled: isAuthenticated && !!lessonId,
  });

  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<any | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const handleSelectQuizOption = (qIdx: number, oIdx: number) => {
    setQuizAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
    setQuizError(null);
  };

  const handleQuizSubmit = async () => {
    if (!quiz?.questions) return;
    if (Object.keys(quizAnswers).length < quiz.questions.length) {
      setQuizError(
        locale === "ar"
          ? "الرجاء الإجابة على جميع الأسئلة قبل الإرسال."
          : "Please answer all questions before submitting."
      );
      return;
    }
    setIsSubmittingQuiz(true);
    setQuizError(null);
    const answers = quiz.questions.map((_: any, idx: number) => quizAnswers[idx]);
    try {
      const { data } = await api.post(`/quizzes/lesson/${lessonId}/submit`, {
        answers,
      });
      setQuizResult(data);
      if (data.passed) {
        refreshUser();
        // Award quiz-master badge by invalidating user queries
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      }
    } catch (err: any) {
      setQuizError(
        err.response?.data?.message || "Failed to submit quiz."
      );
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
    setQuizResult(null);
    setQuizError(null);
  };

  // Chat segment filter
  const [chatSegment, setChatSegment] = useState<"all" | "qa" | "instructor">(
    "all"
  );

  useEffect(() => {
    if (chatSegment === "qa") setChatLanguage("Q&A");
    else if (chatSegment === "instructor") setChatLanguage("Instructor");
    else setChatLanguage("General");
  }, [chatSegment]);

  // Connection monitoring
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    try {
      const saved = localStorage.getItem(`lesson_notes_${lessonId}`);
      if (saved) setOfflineNotes(saved);
    } catch { }
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [lessonId]);

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const { data: course, isLoading: isCourseLoading } = useQuery({
    queryKey: ["course", slug],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${slug}`);
      return data;
    },
  });

  const { data: lessonContent, isLoading: isContentLoading } = useQuery({
    queryKey: ["lessonContent", lessonId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/lessons/${lessonId}/content`);
      return data;
    },
    enabled: isAuthenticated && !!lessonId,
    retry: false,
  });

  // Fetch enrollment to get current progress & completion status
  const { data: enrollments } = useQuery<any[]>({
    queryKey: ["myEnrollments"],
    queryFn: async () => {
      const { data } = await api.get("/enrollments/my");
      return data || [];
    },
    enabled: isAuthenticated,
  });

  // Determine if this specific lesson is completed from enrollment data
  const currentEnrollment = enrollments?.find(
    (e: any) =>
      e.course?.slug === slug ||
      e.course?.id === course?.id ||
      e.course?._id === course?._id
  );

  const completedLessons: string[] = currentEnrollment?.completedLessons || [];
  const [isCompleted, setIsCompleted] = useState(false);

  // Sync completed state from server on load
  useEffect(() => {
    if (completedLessons.length > 0) {
      setIsCompleted(completedLessons.includes(lessonId));
    }
  }, [completedLessons, lessonId]);

  // ─── Mark as Completed Mutation ─────────────────────────────────────────────

  const markCompletedMutation = useMutation({
    mutationFn: async ({
      courseId,
      lessonId,
      completed,
    }: {
      courseId: string;
      lessonId: string;
      completed: boolean;
    }) => {
      const { data } = await api.patch("/enrollments/progress", {
        courseId,
        lessonId,
        completed,
      });
      return data;
    },
    onSuccess: (data, variables) => {
      setIsCompleted(variables.completed);
      // Refresh enrollments to update progress bars everywhere
      queryClient.invalidateQueries({ queryKey: ["myEnrollments"] });
      // If 100% completion, refresh user for potential badge award
      if (data?.progress >= 100) {
        refreshUser();
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      }
    },
    onError: (err: any) => {
      // Revert optimistic update
      setIsCompleted((prev) => !prev);
      console.error("Failed to update lesson completion:", err);
    },
  });

  const handleToggleCompleted = useCallback(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    const courseId = course?.id || course?._id;
    if (!courseId) return;

    // Optimistic update
    const newValue = !isCompleted;
    setIsCompleted(newValue);

    markCompletedMutation.mutate({
      courseId,
      lessonId,
      completed: newValue,
    });
  }, [
    isAuthenticated,
    isCompleted,
    course,
    lessonId,
    locale,
    router,
    markCompletedMutation,
  ]);

  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ["reviews", course?.id],
    queryFn: async () => {
      const { data } = await api.get(
        `/reviews/${course.id || course._id}`
      );
      return data || [];
    },
    enabled: !!course?.id || !!course?._id,
  });

  const { data: chatMessages = [], refetch: refetchChat } = useQuery<any[]>({
    queryKey: ["messages", lessonId],
    queryFn: async () => {
      const { data } = await api.get(`/messages/${lessonId}`);
      return data || [];
    },
    refetchInterval: 3000,
    enabled: activeTab === "chat",
  });

  // Review submission
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; comment: string }) => {
      const { data } = await api.post("/reviews", {
        courseId: course.id || course._id,
        ...reviewData,
      });
      return data;
    },
    onSuccess: () => {
      setReviewSuccess(t("reviewSuccess"));
      setNewComment("");
      setReviewError(null);
      queryClient.invalidateQueries({
        queryKey: ["reviews", course?.id || course?._id],
      });
      queryClient.invalidateQueries({ queryKey: ["course", slug] });
    },
    onError: (err: any) => {
      setReviewError(
        err.response?.data?.message || t("failedSubmitReview")
      );
      setReviewSuccess(null);
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {
      content: string;
      language?: string;
      codeSnippet?: string;
    }) => {
      const { data } = await api.post("/messages", {
        courseId: course.id || course._id,
        lessonId,
        ...messageData,
      });
      return data;
    },
    onSuccess: () => {
      setChatMessage("");
      setChatCodeSnippet("");
      setShowCodeInput(false);
      queryClient.invalidateQueries({ queryKey: ["messages", lessonId] });
    },
  });

  // Like message
  const likeMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { data } = await api.post(`/messages/${messageId}/like`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", lessonId] });
    },
  });

  // ─── Derived Values ─────────────────────────────────────────────────────────

  const currentLesson = course?.lessons?.find(
    (l: any) => l.id === lessonId || l._id === lessonId
  );
  const currentIndex = course?.lessons?.findIndex(
    (l: any) => l.id === lessonId || l._id === lessonId
  );
  const prevLesson = currentIndex > 0 ? course?.lessons?.[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < course?.lessons?.length - 1
      ? course?.lessons?.[currentIndex + 1]
      : null;

  const videoUrl = lessonContent?.videoUrl || currentLesson?.videoUrl;
  const content = lessonContent?.content || currentLesson?.content;
  const isLocked = !currentLesson?.isFree && !lessonContent;

  // ─── Video Player Engine Logic ───────────────────────────────────────────────
  // FIX: Determine the correct player engine based on the actual videoUrl
  const resolvedEngine = (() => {
    if (playerEngineOverride !== "auto") return playerEngineOverride;
    if (!videoUrl) return "none";
    if (isYouTubeUrl(videoUrl)) return "youtube";
    return "custom";
  })();

  // ─── Notes handlers ─────────────────────────────────────────────────────────

  const saveNotebookMutation = useMutation({
    mutationFn: async (entry: {
      courseId: string;
      lessonId?: string;
      title: string;
      content: string;
      type: string;
    }) => {
      const { data } = await api.post("/notebook", entry);
      return data;
    },
  });

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setOfflineNotes(text);
    setSaveStatus("saving");
    try {
      localStorage.setItem(`lesson_notes_${lessonId}`, text);
    } catch { }
    if (isAuthenticated && (course?.id || course?._id)) {
      saveNotebookMutation.mutate({
        courseId: course.id || course._id,
        lessonId: currentLesson?.id || currentLesson?._id,
        title: `Notes for ${currentLesson?.title || "Lesson"}`,
        content: text,
        type: "notes",
      });
    }
    setTimeout(() => setSaveStatus("saved"), 600);
  };

  const exportNotebook = () => {
    const markdown = `# ${currentLesson?.title || "Lesson Notes"}\n\n${offlineNotes}\n\n---\n*Exported from The Codefather*\n`;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-${lessonId}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBooking = () => {
    if (!selectedTime) {
      setBookingMessage(t("noTimeSelected"));
      return;
    }
    setBookingMessage(
      t("bookingSuccess", { day: selectedDay, time: selectedTime })
    );
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
      language: chatLanguage !== "General" ? chatLanguage : undefined,
      codeSnippet: chatCodeSnippet.trim() ? chatCodeSnippet : undefined,
    });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    submitReviewMutation.mutate({ rating: newRating, comment: newComment });
  };

  // ─── Badges derived from live user data ────────────────────────────────────

  const unlockedBadgeIds = new Set<string>([
    "cadet", // always unlocked
    ...(user?.badges || []),
    ...(completedLessons.length > 0 ? ["first-lesson"] : []),
    ...((user?.streak || 0) >= 7 ? ["streak-7"] : []),
    ...(quizResult?.passed ? ["quiz-master"] : []),
  ]);

  // ─── Loading / Error states ──────────────────────────────────────────────────

  if (isCourseLoading || (isAuthenticated && isContentLoading)) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary" />
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
          <h1 className="text-2xl font-bold text-base-content mb-4">
            {t("notFound")}
          </h1>
          <Link
            href={`/${locale}/courses`}
            className="btn-premium px-6 py-2 rounded-xl"
          >
            {t("goBackCourses")}
          </Link>
        </div>
      </div>
    );
  }

  // Review calculations
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (
        reviews.reduce((acc: number, r: any) => acc + r.rating, 0) /
        totalReviews
      ).toFixed(1)
      : "4.8";

  const starCounts = [0, 0, 0, 0, 0];
  reviews.forEach((r: any) => {
    const starIdx = Math.max(0, Math.min(4, 5 - r.rating));
    starCounts[starIdx]++;
  });

  const isAr = locale === "ar";

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-base-200 font-sans text-base-content">
      <Navbar />

      {/* Connection Mode Alert */}
      {!isOnline && (
        <div className="bg-warning text-warning-content font-bold px-4 py-2 text-center text-xs flex items-center justify-center gap-2 z-40">
          <WifiOff className="w-4 h-4 animate-bounce" />
          {t("offlineBanner")}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href={`/${locale}/courses/${slug}`}
            className="flex items-center gap-2 text-sm font-bold text-base-content/60 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t("backToCourse")}
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-base-content/50">
            <span>{course.title}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-base-content">
              {t("lessonOf", {
                current: currentIndex + 1,
                total: course.lessons?.length,
              })}
            </span>
          </div>
        </div>

        {/* ── TOP AREA: Video & Syllabus ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Container */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative rounded-[2rem] overflow-hidden bg-black aspect-video shadow-2xl border-4 border-base-100/50 group">
              {/* ── LOCKED STATE ── */}
              {isLocked ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-white p-6 text-center select-none z-10">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary border border-primary/30 shadow-lg animate-pulse">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black mb-2 tracking-wide text-white">
                    {t("premiumLocked")}
                  </h3>
                  <p className="text-xs md:text-sm text-white/70 max-w-md mb-6 leading-relaxed">
                    {t("unlockDesc")}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {isAuthenticated ? (
                      <>
                        <Link
                          href={`/${locale}/checkout/purchase?courseId=${course.id || course._id}&type=individual`}
                          className="btn btn-primary btn-sm rounded-xl font-bold px-5 py-2 h-auto"
                        >
                          {t("buyNow")}
                        </Link>
                        <Link
                          href={`/${locale}/membership`}
                          className="btn btn-outline btn-primary btn-sm rounded-xl font-bold px-5 py-2 h-auto text-white hover:text-white"
                        >
                          {t("upgradeMembership")}
                        </Link>
                      </>
                    ) : (
                      <Link
                        href={`/${locale}/login?redirect=/${locale}/courses/${slug}/lessons/${lessonId}`}
                        className="btn btn-primary btn-sm rounded-xl font-bold px-5 py-2 h-auto"
                      >
                        {t("loginBtn")}
                      </Link>
                    )}
                  </div>
                </div>
              ) : !isOnline ? (
                /* ── OFFLINE STATE ── */
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-content p-8 bg-neutral">
                  <WifiOff className="w-16 h-16 opacity-40 mb-4 text-warning" />
                  <h3 className="text-xl font-bold">{t("offlineStandby")}</h3>
                  <p className="text-sm opacity-60 mt-1 max-w-xs text-center">
                    {t("offlineDesc")}
                  </p>
                </div>
              ) : !videoUrl ? (
                /* ── NO VIDEO ── */
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-content p-8 bg-neutral">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary">
                    <Play className="w-10 h-10 fill-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{t("noVideoAvailable")}</h3>
                  <p className="text-sm opacity-60 mt-1">{t("noVideoDesc")}</p>
                </div>
              ) : (
                /* ── VIDEO PLAYER ── */
                <>
                  {/* Engine toggle button — only show if URL is a direct video (can switch to YT embed if needed) */}
                  <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button
                      onClick={() => {
                        setPlayerEngineOverride((prev) => {
                          if (prev === "auto") {
                            // Force the opposite of auto-detected
                            return resolvedEngine === "youtube"
                              ? "custom"
                              : "youtube";
                          }
                          return "auto";
                        });
                        setVideoError(null);
                      }}
                      className="btn btn-xs btn-primary rounded-lg text-[9px] font-black uppercase text-white shadow-md cursor-pointer"
                    >
                      {resolvedEngine === "youtube"
                        ? isAr
                          ? "المشغل التفاعلي"
                          : "Interactive Player"
                        : isAr
                          ? "تشغيل عبر YouTube"
                          : "YouTube Engine"}
                    </button>
                  </div>

                  {/* ── YOUTUBE IFRAME ENGINE ── */}
                  {resolvedEngine === "youtube" ? (
                    <iframe
                      src={toYouTubeEmbedUrl(videoUrl)}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      title={currentLesson.title}
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : (
                    /* ── CUSTOM HTML5 VIDEO ENGINE ── */
                    <div className="relative w-full h-full">
                      {videoError ? (
                        /* Error fallback: offer iframe as last resort */
                        <div className="w-full h-full flex flex-col items-center justify-center bg-neutral text-neutral-content gap-4 p-8 text-center">
                          <AlertCircle className="w-12 h-12 opacity-50 text-error" />
                          <div>
                            <p className="font-bold text-sm">
                              {isAr
                                ? "تعذّر تشغيل الفيديو مباشرةً"
                                : "Direct playback blocked"}
                            </p>
                            <p className="text-xs opacity-60 mt-1 max-w-xs">
                              {isAr
                                ? "قد يكون الخادم يمنع التضمين المباشر. جرّب محرك YouTube."
                                : "The server may block cross-origin embedding. Try the YouTube engine."}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setPlayerEngineOverride("youtube");
                              setVideoError(null);
                            }}
                            className="btn btn-sm btn-primary rounded-xl font-bold"
                          >
                            {isAr ? "التبديل إلى YouTube" : "Switch to YouTube"}
                          </button>
                        </div>
                      ) : (
                        <>
                          <video
                            ref={videoRef}
                            // FIX: Use the actual videoUrl from API, not a hardcoded demo URL
                            src={videoUrl}
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                            onTimeUpdate={() => {
                              if (videoRef.current)
                                setVideoTime(videoRef.current.currentTime);
                            }}
                            onLoadedMetadata={() => {
                              if (videoRef.current)
                                setVideoDuration(videoRef.current.duration);
                            }}
                            onClick={togglePlay}
                            // FIX: Handle video load errors gracefully
                            onError={(e) => {
                              const target = e.target as HTMLVideoElement;
                              const errCode = target.error?.code;
                              // MEDIA_ERR_SRC_NOT_SUPPORTED = 4, MEDIA_ERR_NETWORK = 2
                              if (errCode === 4 || errCode === 2) {
                                setVideoError(
                                  target.error?.message ||
                                  "Unsupported or blocked source"
                                );
                              }
                            }}
                          />

                          {/* Hover Overlay Controls */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 text-white">
                            <input
                              type="range"
                              min={0}
                              max={videoDuration || 100}
                              value={videoTime}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (videoRef.current)
                                  videoRef.current.currentTime = val;
                                setVideoTime(val);
                              }}
                              className="w-full h-1 bg-white/30 accent-primary rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={togglePlay}
                                  className="text-white hover:text-primary transition-colors cursor-pointer"
                                >
                                  {isPlaying ? (
                                    <Pause className="w-5 h-5 fill-white" />
                                  ) : (
                                    <Play className="w-5 h-5 fill-white" />
                                  )}
                                </button>
                                <span className="text-xs font-mono font-extrabold">
                                  {formatTime(videoTime)} /{" "}
                                  {formatTime(videoDuration)}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="dropdown dropdown-top dropdown-end">
                                  <label
                                    tabIndex={0}
                                    className="btn btn-xs btn-ghost text-[10px] font-black cursor-pointer border border-white/20 px-2 rounded"
                                  >
                                    {videoSpeed}x
                                  </label>
                                  <ul
                                    tabIndex={0}
                                    className="dropdown-content menu p-1.5 shadow-lg bg-base-300 rounded-box w-20 text-xs text-base-content font-black"
                                  >
                                    {[0.5, 1, 1.25, 1.5, 2].map((s) => (
                                      <li key={s}>
                                        <button
                                          type="button"
                                          onClick={() => changeSpeed(s)}
                                          className={`px-2 py-1 ${videoSpeed === s ? "bg-primary text-white" : ""}`}
                                        >
                                          {s}x
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <button
                                  type="button"
                                  onClick={triggerPiP}
                                  className="hover:text-primary transition-colors cursor-pointer"
                                  title="Picture in Picture"
                                >
                                  <Tv className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bookmarks — only show for custom player with a working video */}
            {!isLocked && resolvedEngine === "custom" && videoUrl && !videoError && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-base-100 p-6 rounded-[2rem] border border-base-300 shadow-sm">
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-base-content/80 uppercase tracking-wider flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    {isAr ? "حفظ إشارة مرجعية" : "Lesson Bookmark Tool"}
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={
                        isAr
                          ? "ملاحظة حول هذا التوقيت..."
                          : "Enter note for this timestamp..."
                      }
                      value={bookmarkText}
                      onChange={(e) => setBookmarkText(e.target.value)}
                      className="flex-grow input input-bordered input-sm rounded-xl focus:outline-none focus:border-primary text-xs"
                    />
                    <button
                      onClick={handleAddBookmark}
                      className="btn btn-primary btn-sm rounded-xl text-xs font-black gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? "حفظ" : "Add"}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-base-content/40 font-bold">
                    {isAr
                      ? "سيتم حفظ التوقيت الحالي تلقائياً."
                      : "Current video coordinates will be saved."}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black text-base-content/80 uppercase tracking-wider">
                    {isAr ? "إشاراتك المحفوظة" : "Saved Bookmarks"}
                  </h4>
                  <div className="max-h-24 overflow-y-auto space-y-1.5 pr-2">
                    {bookmarks.length > 0 ? (
                      bookmarks.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-2 bg-base-200/50 hover:bg-base-200 rounded-xl border border-base-300 transition-all text-xs"
                        >
                          <button
                            onClick={() => seekToTime(b.time)}
                            className="flex items-center gap-2 text-start font-extrabold text-primary hover:underline cursor-pointer"
                          >
                            <span className="badge badge-sm badge-neutral font-mono">
                              {formatTime(b.time)}
                            </span>
                            <span className="line-clamp-1 text-base-content/90 font-medium">
                              {b.text}
                            </span>
                          </button>
                          <button
                            onClick={() => handleDeleteBookmark(b.id)}
                            className="text-error hover:text-error/70 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-base-content/40 font-bold">
                        {isAr ? "لا توجد إشارات بعد." : "No bookmarks saved yet."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Video Navigation Controls */}
            <div className="flex justify-between items-center bg-base-100 p-4 rounded-2xl border border-base-300 shadow-sm">
              {prevLesson ? (
                <Link
                  href={`/${locale}/courses/${slug}/lessons/${prevLesson.id || prevLesson._id}`}
                  className="btn btn-sm btn-ghost gap-2 font-bold text-base-content/85 hover:text-primary transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> {t("previous")}
                </Link>
              ) : (
                <div />
              )}

              {/* ── MARK AS COMPLETED BUTTON — full API integration ── */}
              <button
                onClick={handleToggleCompleted}
                disabled={markCompletedMutation.isPending}
                className={`btn btn-sm rounded-xl font-bold gap-2 transition-all ${isCompleted
                  ? "btn-success text-success-content"
                  : "btn-outline border-base-300 hover:border-success hover:text-success"
                  }`}
              >
                {markCompletedMutation.isPending ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {isCompleted ? t("lessonCompleted") : t("markCompleted")}
              </button>

              {nextLesson ? (
                <Link
                  href={`/${locale}/courses/${slug}/lessons/${nextLesson.id || nextLesson._id}`}
                  className="btn btn-sm btn-ghost gap-2 font-bold text-base-content/85 hover:text-primary transition-all"
                >
                  {t("next")} <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>

          {/* Syllabus Sidebar */}
          <div className="card bg-base-100 rounded-[2rem] border border-base-300 shadow-xl overflow-hidden flex flex-col h-[400px] lg:h-auto">
            <div className="p-6 border-b border-base-300 bg-base-200/50 flex items-center gap-2 shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-extrabold text-base-content">
                {t("courseSyllabus")}
              </h3>
            </div>
            <div className="divide-y divide-base-300 overflow-y-auto flex-grow">
              {course.lessons?.map((lesson: any, index: number) => {
                const isActive =
                  lesson.id === lessonId || lesson._id === lessonId;
                const isDone =
                  completedLessons.includes(lesson.id) ||
                  completedLessons.includes(lesson._id);
                return (
                  <Link
                    key={lesson.id || lesson._id}
                    href={`/${locale}/courses/${slug}/lessons/${lesson.id || lesson._id}`}
                    className={`p-4 block transition-all ${isActive
                      ? "bg-primary/5 border-l-4 border-primary font-bold"
                      : "hover:bg-base-200/40"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${isActive
                          ? "bg-primary text-primary-content animate-pulse"
                          : isDone
                            ? "bg-success text-success-content"
                            : "bg-base-300 text-base-content/60"
                          }`}
                      >
                        {isDone ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-grow">
                        <h4
                          className={`text-sm leading-snug ${isActive ? "text-primary" : "text-base-content"
                            }`}
                        >
                          {lesson.title}
                        </h4>
                        {lesson.duration && (
                          <span className="text-[10px] font-bold text-base-content/50 block mt-1">
                            {lesson.duration} {isAr ? "دقيقة" : "mins"}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── LOWER AREA: Tabs ── */}
        <div className="space-y-6">
          {/* Tab Selector */}
          <div className="flex border-b border-base-300/80 gap-6 overflow-x-auto">
            {[
              { id: "overview", label: t("overview"), count: null },
              { id: "reviews", label: t("reviews"), count: reviews.length },
              { id: "chat", label: t("chat"), count: chatMessages.length },
              { id: "cohort", label: t("cohort"), count: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 text-sm font-extrabold transition-all relative whitespace-nowrap ${activeTab === tab.id
                  ? "text-primary font-black border-b-2 border-primary"
                  : "text-base-content/60 hover:text-primary"
                  }`}
              >
                <span className="flex items-center gap-1.5">
                  {tab.label}
                  {tab.count !== null && (
                    <span className="badge badge-sm badge-neutral">
                      {tab.count}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          <div>
            {/* ── 1. OVERVIEW ── */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Lesson description */}
                  <div className="card bg-base-100 p-8 rounded-3xl border border-base-300/80 shadow-md">
                    <span className="badge badge-primary badge-outline text-xs font-bold uppercase tracking-wider mb-4">
                      {t("lessonDescription")}
                    </span>
                    <h2 className="text-2xl font-black text-base-content mb-4">
                      {currentLesson.title}
                    </h2>
                    <div className="prose max-w-none text-base-content/85 leading-relaxed font-medium">
                      {isLocked ? (
                        <div className="flex items-center gap-3 p-4 bg-base-200/50 rounded-2xl border border-base-300">
                          <Lock className="w-5 h-5 text-primary shrink-0 animate-bounce" />
                          <span className="text-xs font-bold text-base-content/70">
                            {t("unlockDesc")}
                          </span>
                        </div>
                      ) : (
                        content || t("noVideoDesc")
                      )}
                    </div>
                  </div>

                  {/* Downloadable Resources */}
                  {currentLesson?.resources &&
                    currentLesson.resources.length > 0 && (
                      <div className="card bg-base-100 p-8 rounded-3xl border border-base-300/80 shadow-md">
                        <h3 className="text-base font-black text-base-content mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          {isAr ? "الموارد المرفقة" : "Downloadable Resources"}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {currentLesson.resources.map(
                            (res: any, idx: number) => (
                              <a
                                key={idx}
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 bg-base-200/50 hover:bg-base-200 rounded-2xl border border-base-300 transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-content transition-all">
                                    {res.type === "pdf" ? (
                                      <FileText className="w-4 h-4" />
                                    ) : res.type === "code" ? (
                                      <Code className="w-4 h-4" />
                                    ) : (
                                      <FileVideo className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-base-content line-clamp-1">
                                      {res.name}
                                    </p>
                                    <p className="text-[9px] text-base-content/50 uppercase font-semibold">
                                      {res.type}
                                    </p>
                                  </div>
                                </div>
                                <span className="btn btn-xs btn-outline rounded-lg text-[9px] font-black">
                                  <Download className="w-3 h-3" />
                                </span>
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* ── BADGES PANEL ── */}
                  <div className="card bg-base-100 p-8 rounded-3xl border border-base-300/80 shadow-md">
                    <div className="flex items-center gap-2 mb-6">
                      <Trophy className="w-5 h-5 text-primary" />
                      <h3 className="text-base font-black text-base-content">
                        {isAr ? "شارات الإنجاز" : "Achievement Badges"}
                      </h3>
                      <span className="badge badge-primary badge-sm font-black ml-auto">
                        {unlockedBadgeIds.size}/{BADGE_DEFINITIONS.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {BADGE_DEFINITIONS.map((badge) => (
                        <BadgeCard
                          key={badge.id}
                          badge={badge}
                          unlocked={unlockedBadgeIds.has(badge.id)}
                          locale={locale}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Practice Assignments */}
                  {!isLocked && (
                    <div className="card bg-base-100 p-8 rounded-3xl border border-base-300/80 shadow-md space-y-4">
                      <h3 className="text-base font-black text-base-content flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-primary" />
                        {isAr ? "تسليم التكليف" : "Practice Assignments"}
                      </h3>
                      <p className="text-xs text-base-content/65 leading-relaxed font-semibold">
                        {isAr
                          ? "قم برفع ملف الحل (.zip أو .pdf) للحصول على تقييم."
                          : "Upload your completed files (.zip, .pdf) for coach evaluation."}
                      </p>

                      {assignmentStatus === "idle" && (
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-base-300 border-dashed rounded-3xl cursor-pointer bg-base-200/30 hover:bg-base-200/80 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <UploadCloud className="w-8 h-8 text-base-content/40 mb-2" />
                              <p className="text-xs font-extrabold text-base-content/75">
                                {isAr
                                  ? "اضغط لرفع الملف"
                                  : "Click to upload or drag & drop"}
                              </p>
                              <p className="text-[10px] text-base-content/45 mt-1">
                                ZIP, PDF (Max 15MB)
                              </p>
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept=".zip,.pdf"
                              onChange={handleAssignmentUpload}
                            />
                          </label>
                        </div>
                      )}

                      {assignmentStatus === "uploading" && (
                        <div className="p-4 bg-base-200/50 rounded-2xl border border-base-300 space-y-2 text-center">
                          <span className="loading loading-spinner text-primary" />
                          <p className="text-xs font-bold">
                            {isAr ? "جاري الرفع..." : "Uploading..."}
                          </p>
                          <progress
                            className="progress progress-primary w-full"
                            value={assignmentProgress}
                            max="100"
                          />
                        </div>
                      )}

                      {assignmentStatus === "success" && (
                        <div className="p-4 bg-success/10 text-success-content border border-success/20 rounded-2xl space-y-2 flex items-center gap-3">
                          <CheckCircle2 className="w-8 h-8 text-success shrink-0" />
                          <div>
                            <h4 className="text-xs font-black">
                              {isAr
                                ? "تم التسليم بنجاح!"
                                : "Submitted Successfully!"}
                            </h4>
                            <p className="text-[10px] opacity-75 font-semibold mt-0.5">
                              {assignmentFile} —{" "}
                              {isAr
                                ? "بانتظار المراجعة"
                                : "Pending instructor review"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Classroom Quizzes */}
                  {!isLocked &&
                    quiz &&
                    quiz.questions &&
                    quiz.questions.length > 0 && (
                      <div className="card bg-base-100 p-8 rounded-3xl border border-base-300/80 shadow-md space-y-6">
                        <div className="flex items-center justify-between border-b border-base-200 pb-3">
                          <h3 className="text-base font-black text-base-content flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                            {isAr ? "اختبار الدرس" : "Classroom Quizzes"}
                          </h3>
                          <span className="badge badge-secondary badge-sm text-[9px] font-black py-2 uppercase">
                            +50 XP
                          </span>
                        </div>

                        {quizError && (
                          <div className="alert alert-error text-xs font-bold rounded-2xl">
                            <span>{quizError}</span>
                          </div>
                        )}

                        {quizResult ? (
                          <div className="space-y-6 animate-fadeIn">
                            <div
                              className={`p-6 rounded-3xl text-center space-y-2 ${quizResult.passed
                                ? "bg-success/10 border border-success/20"
                                : "bg-error/10 border border-error/20"
                                }`}
                            >
                              <h4 className="text-xl font-black">
                                {quizResult.passed
                                  ? isAr
                                    ? "تهانينا! لقد نجحت"
                                    : "Congratulations! You Passed"
                                  : isAr
                                    ? "لم تجتز الاختبار"
                                    : "Not Passed"}
                              </h4>
                              <p className="text-3xl font-black">
                                {quizResult.score} / {quizResult.total}
                              </p>
                              <p className="text-xs font-bold opacity-80">
                                {quizResult.passed
                                  ? isAr
                                    ? `حصلت على ${quizResult.xpEarned} نقطة خبرة!`
                                    : `Earned +${quizResult.xpEarned} XP!`
                                  : isAr
                                    ? "تحتاج 70% للاجتياز."
                                    : "Score 70% to unlock XP."}
                              </p>
                            </div>

                            {quizResult.feedback?.map(
                              (fb: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={`p-4 rounded-2xl border space-y-1 ${fb.isCorrect
                                    ? "bg-success/5 border-success/30"
                                    : "bg-error/5 border-error/30"
                                    }`}
                                >
                                  <p className="text-xs font-bold text-base-content">
                                    {idx + 1}. {fb.questionText}
                                  </p>
                                  <p className="text-[11px] font-semibold">
                                    {isAr ? "إجابتك: " : "Your choice: "}
                                    <span className="font-extrabold">
                                      {quiz.questions[idx].options[
                                        fb.selected
                                      ] ||
                                        (isAr ? "لم تختر" : "None")}
                                    </span>
                                  </p>
                                  {!fb.isCorrect && (
                                    <p className="text-[11px] text-success font-semibold">
                                      {isAr
                                        ? "الإجابة الصحيحة: "
                                        : "Correct: "}
                                      <span className="font-extrabold">
                                        {
                                          quiz.questions[idx].options[
                                          fb.correct
                                          ]
                                        }
                                      </span>
                                    </p>
                                  )}
                                </div>
                              )
                            )}

                            <button
                              onClick={handleResetQuiz}
                              className="btn btn-outline btn-sm rounded-xl font-bold w-full"
                            >
                              {isAr ? "إعادة المحاولة" : "Reset & Try Again"}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {quiz.questions.map((q: any, qIdx: number) => (
                              <div key={qIdx} className="space-y-3">
                                <h4 className="text-xs font-black text-base-content/90">
                                  {qIdx + 1}. {q.questionText}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.options.map((opt: string, oIdx: number) => {
                                    const isSelected =
                                      quizAnswers[qIdx] === oIdx;
                                    return (
                                      <button
                                        key={oIdx}
                                        onClick={() =>
                                          handleSelectQuizOption(qIdx, oIdx)
                                        }
                                        className={`p-3 rounded-2xl border text-start text-xs font-extrabold transition-all cursor-pointer ${isSelected
                                          ? "bg-primary/5 border-primary text-primary"
                                          : "bg-base-200/50 border-base-300 hover:bg-base-200 text-base-content/80"
                                          }`}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}

                            <button
                              onClick={handleQuizSubmit}
                              disabled={isSubmittingQuiz}
                              className="btn btn-primary btn-sm w-full rounded-xl font-bold mt-4 cursor-pointer"
                            >
                              {isSubmittingQuiz ? (
                                <span className="loading loading-spinner loading-xs" />
                              ) : isAr ? (
                                "إرسال الإجابات"
                              ) : (
                                "Submit Quiz Answers"
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                </div>

                {/* Notebook */}
                <div className="card bg-base-100 p-6 rounded-3xl border border-base-300/80 shadow-md h-fit relative">
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      onClick={exportNotebook}
                      disabled={!offlineNotes.trim()}
                      className="btn btn-xs btn-ghost text-[10px] font-bold gap-1"
                      title="Export as Markdown"
                    >
                      <FileText className="w-3 h-3" /> {t("export")}
                    </button>
                    {saveStatus === "saving" && (
                      <span className="loading loading-spinner loading-xs text-primary" />
                    )}
                    {saveStatus === "saved" && (
                      <span className="text-[10px] font-bold text-success flex items-center gap-0.5">
                        <Save className="w-3 h-3" /> {t("saved")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="font-extrabold text-base text-base-content">
                        {t("notebookTitle")}
                      </h3>
                      <p className="text-[10px] font-medium text-base-content/60">
                        {t("notebookSubtitle")}
                      </p>
                    </div>
                  </div>

                  <textarea
                    value={offlineNotes}
                    onChange={handleNotesChange}
                    placeholder={t("notebookPlaceholder")}
                    rows={8}
                    className="textarea textarea-bordered w-full font-mono text-xs p-3 leading-relaxed resize-y focus:outline-none focus:border-primary bg-base-200/50"
                  />
                </div>
              </div>
            )}

            {/* ── 2. REVIEWS ── */}
            {activeTab === "reviews" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                  <div className="card bg-base-100 p-8 rounded-3xl border border-base-300 shadow-md">
                    <h3 className="text-xl font-extrabold text-base-content mb-6">
                      {t("userReviews")}
                    </h3>
                    {reviews.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.map((r: any) => (
                          <div
                            key={r.id || r._id}
                            className="border-b border-base-300 pb-6 last:border-b-0 last:pb-0 flex items-start gap-4"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-extrabold text-sm uppercase shrink-0 overflow-hidden">
                              {r.user?.avatar ? (
                                <img
                                  src={r.user.avatar}
                                  alt={r.user.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                r.user?.username?.[0] || "U"
                              )}
                            </div>
                            <div className="flex-grow space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-base-content">
                                  {r.user?.username || "Student"}
                                </span>
                                <span className="text-[10px] text-base-content/50 font-bold">
                                  {new Date(
                                    r.createdAt || Date.now()
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-warning text-warning" : "text-base-content/25"}`}
                                  />
                                ))}
                              </div>
                              <p className="text-sm text-base-content/80 font-medium leading-relaxed pt-1">
                                {r.comment || "No written review provided."}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-base-content/50 font-bold">
                        {t("noReviews")}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="card bg-base-100 p-6 rounded-3xl border border-base-300 shadow-md space-y-4">
                    <div className="text-center space-y-1">
                      <div className="text-5xl font-black text-base-content">
                        {averageRating}
                      </div>
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${s <= Math.round(Number(averageRating)) ? "fill-warning text-warning" : "text-base-content/20"}`}
                          />
                        ))}
                      </div>
                      <div className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider">
                        {t("ratingsCount", { count: totalReviews })}
                      </div>
                    </div>
                    <div className="space-y-2 text-xs font-semibold">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = starCounts[5 - stars];
                        const pct =
                          totalReviews > 0
                            ? (count / totalReviews) * 100
                            : 0;
                        return (
                          <div key={stars} className="flex items-center gap-3">
                            <span className="w-12 text-base-content/75 text-end">
                              {stars} {isAr ? "نجوم" : "Stars"}
                            </span>
                            <div className="flex-grow bg-base-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-primary h-full rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-8 text-base-content/50">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card bg-base-100 p-6 rounded-3xl border border-base-300 shadow-md">
                    <h4 className="font-extrabold text-base-content text-sm mb-4">
                      {t("rateCourse")}
                    </h4>
                    {reviewSuccess && (
                      <div className="alert alert-success text-xs font-bold mb-4">
                        {reviewSuccess}
                      </div>
                    )}
                    {reviewError && (
                      <div className="alert alert-error text-xs font-bold mb-4">
                        {reviewError}
                      </div>
                    )}
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-base-content/65">
                          {t("rating")}
                        </span>
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
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-base-content/60 uppercase">
                          {t("feedbackComment")}
                        </label>
                        <textarea
                          placeholder={t("feedbackPlaceholder")}
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
                        {submitReviewMutation.isPending
                          ? t("submitting")
                          : t("submitReview")}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* ── 3. CHAT ── */}
            {activeTab === "chat" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 card bg-base-100 rounded-3xl border border-base-300 shadow-md flex flex-col h-[550px] overflow-hidden">
                  <div className="p-4 bg-base-200/50 border-b border-base-300 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-3">
                    <div className="flex items-center gap-2">
                      <Hash className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-extrabold text-sm text-base-content">
                          {t("chatRoomTitle")}
                        </h3>
                        <p className="text-[10px] font-bold text-base-content/40 uppercase">
                          {t("chatRoomSubtitle")}
                        </p>
                      </div>
                    </div>
                    <div className="flex bg-base-300/50 p-1 rounded-xl gap-1 text-[10px] font-black">
                      {[
                        { key: "all", label: isAr ? "عام" : "Class Chat" },
                        {
                          key: "qa",
                          label: isAr ? "سؤال وجواب" : "Q&A Support",
                        },
                        {
                          key: "instructor",
                          label: isAr ? "المعلم" : "Instructors",
                        },
                      ].map((seg) => (
                        <button
                          key={seg.key}
                          onClick={() => setChatSegment(seg.key as any)}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${chatSegment === seg.key
                            ? "bg-primary text-primary-content"
                            : "text-base-content/65 hover:bg-base-200"
                            }`}
                        >
                          {seg.label}
                        </button>
                      ))}
                    </div>
                    <div className="badge badge-sm badge-neutral font-bold shrink-0">
                      {t("activeLogs", {
                        count: (chatMessages || []).filter((msg: any) => {
                          if (chatSegment === "qa")
                            return (
                              msg.language === "Q&A" ||
                              msg.content?.includes("?")
                            );
                          if (chatSegment === "instructor")
                            return (
                              msg.user?.role === "INSTRUCTOR" ||
                              msg.user?.role === "ADMIN" ||
                              msg.language === "Instructor"
                            );
                          return (
                            msg.language !== "Q&A" &&
                            msg.language !== "Instructor"
                          );
                        }).length,
                      })}
                    </div>
                  </div>

                  <div className="flex-grow overflow-y-auto p-6 space-y-6">
                    {(chatMessages || [])
                      .filter((msg: any) => {
                        if (chatSegment === "qa")
                          return (
                            msg.language === "Q&A" ||
                            msg.content?.includes("?")
                          );
                        if (chatSegment === "instructor")
                          return (
                            msg.user?.role === "INSTRUCTOR" ||
                            msg.user?.role === "ADMIN" ||
                            msg.language === "Instructor"
                          );
                        return (
                          msg.language !== "Q&A" &&
                          msg.language !== "Instructor"
                        );
                      })
                      .map((msg: any) => {
                        const isLiked = msg.likes?.includes(user?.sub);
                        return (
                          <div
                            key={msg.id || msg._id}
                            className="flex gap-4 items-start group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center font-bold text-sm uppercase shrink-0 overflow-hidden">
                              {msg.user?.avatar ? (
                                <img
                                  src={msg.user.avatar}
                                  alt={msg.user.username}
                                  className="w-full h-full object-cover rounded-xl"
                                />
                              ) : (
                                msg.user?.username?.[0] || "U"
                              )}
                            </div>
                            <div className="flex-grow space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-base-content">
                                    {msg.user?.username || "Developer"}
                                  </span>
                                  {msg.language && (
                                    <span className="badge badge-primary badge-outline text-[9px] font-bold uppercase tracking-wider">
                                      {msg.language}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-base-content/40 font-semibold">
                                  {new Date(msg.createdAt).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" }
                                  )}
                                </span>
                              </div>
                              <p className="text-sm text-base-content/90 font-medium leading-relaxed break-words whitespace-pre-wrap">
                                {msg.content}
                              </p>
                              {msg.codeSnippet && (
                                <div className="relative bg-base-300 rounded-xl p-4 font-mono text-xs text-base-content border border-base-300 overflow-x-auto max-w-full my-2">
                                  <div className="absolute top-2 right-3 text-[9px] font-bold text-base-content/50 uppercase select-none">
                                    {msg.language || "code"}
                                  </div>
                                  <pre className="mt-1">
                                    <code>{msg.codeSnippet}</code>
                                  </pre>
                                </div>
                              )}
                              <div className="flex items-center gap-4 pt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() =>
                                    likeMessageMutation.mutate(
                                      msg.id || msg._id
                                    )
                                  }
                                  className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${isLiked
                                    ? "text-primary"
                                    : "text-base-content/50 hover:text-primary"
                                    }`}
                                >
                                  <ThumbsUp
                                    className={`w-3.5 h-3.5 ${isLiked ? "fill-primary" : ""}`}
                                  />
                                  <span>
                                    {t("upvotes", {
                                      count: msg.likes?.length || 0,
                                    })}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {(chatMessages || []).length === 0 && (
                      <div className="h-full flex flex-col justify-center items-center text-center p-8 space-y-2 opacity-50">
                        <MessageSquare className="w-12 h-12 text-primary" />
                        <h4 className="font-bold">{t("noChatHistory")}</h4>
                        <p className="text-xs max-w-xs font-medium">
                          {t("noChatDesc")}
                        </p>
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={handleSendChatMessage}
                    className="p-4 bg-base-200/50 border-t border-base-300 space-y-3 shrink-0"
                  >
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder={t("chatPlaceholder")}
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        className="flex-grow input input-bordered input-sm rounded-xl focus:outline-none focus:border-primary text-xs"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCodeInput(!showCodeInput)}
                        className={`btn btn-sm rounded-xl flex items-center justify-center font-bold gap-1 px-3 ${showCodeInput ? "btn-primary text-white" : "btn-outline border-base-300"}`}
                      >
                        <Code className="w-4 h-4" />
                        <span className="hidden md:inline text-[10px]">
                          {t("snippet")}
                        </span>
                      </button>
                      <button
                        type="submit"
                        disabled={sendMessageMutation.isPending}
                        className="btn btn-primary btn-sm rounded-xl px-4"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {showCodeInput && (
                      <div className="flex flex-col gap-2 p-3 bg-base-300 rounded-xl border border-base-300">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-base-content/60 uppercase">
                            {t("pasteCode")}
                          </label>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-base-content/40 uppercase">
                              {t("stack")}
                            </span>
                            <select
                              value={chatLanguage}
                              onChange={(e) =>
                                setChatLanguage(e.target.value)
                              }
                              className="select select-bordered select-xs text-[10px] rounded-lg focus:outline-none"
                            >
                              {[
                                "General",
                                "Q&A",
                                "Instructor",
                                "JavaScript",
                                "TypeScript",
                                "HTML/CSS",
                                "Python",
                                "Go",
                              ].map((lang) => (
                                <option key={lang} value={lang}>
                                  {lang}
                                </option>
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

                <div className="card bg-base-100 p-6 rounded-3xl border border-base-300 shadow-md space-y-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    <h4 className="font-extrabold text-sm text-base-content">
                      {t("chatRules")}
                    </h4>
                  </div>
                  <ul className="text-xs text-base-content/85 space-y-2 list-disc pl-4 font-medium leading-relaxed">
                    <li>{t("chatRule1")}</li>
                    <li>{t("chatRule2")}</li>
                    <li>{t("chatRule3")}</li>
                  </ul>
                  <div className="pt-2 border-t border-base-300">
                    <span className="text-[10px] font-bold text-success flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />{" "}
                      {t("seededByMentors")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── 4. COHORT ── */}
            {activeTab === "cohort" && (
              <div className="max-w-xl mx-auto card bg-base-100 p-8 rounded-3xl border border-base-300 shadow-md space-y-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-extrabold text-lg text-base-content">
                      {t("cohortTitle")}
                    </h3>
                    <p className="text-xs font-semibold text-base-content/60">
                      {t("cohortSubtitle")}
                    </p>
                  </div>
                </div>

                {bookingMessage && (
                  <div className="p-3.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold leading-relaxed">
                    {bookingMessage}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-base-content/60 uppercase tracking-wider">
                    {t("selectDate")}
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[15, 16, 17, 18, 19].map((day) => (
                      <button
                        key={day}
                        onClick={() => {
                          setSelectedDay(day);
                          setBookingMessage(null);
                        }}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${selectedDay === day
                          ? "bg-primary text-primary-content border-primary shadow-md"
                          : "bg-base-200 hover:bg-base-300 border-base-300"
                          }`}
                      >
                        {day}th
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-base-content/60 uppercase tracking-wider">
                    {t("selectTime")}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["10:00 AM", "2:00 PM", "6:00 PM"].map((time) => (
                      <button
                        key={time}
                        onClick={() => {
                          setSelectedTime(time);
                          setBookingMessage(null);
                        }}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${selectedTime === time
                          ? "bg-primary text-primary-content border-primary shadow-md"
                          : "bg-base-200 hover:bg-base-300 border-base-300"
                          }`}
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
                  <Calendar className="w-4 h-4" /> {t("requestCohort")}
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
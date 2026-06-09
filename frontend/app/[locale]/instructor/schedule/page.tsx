'use client';

import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { 
  LayoutDashboard, BookOpen, Users, Calendar, Star, Video, 
  CreditCard, Settings, HelpCircle, Plus, MapPin, Globe, VideoOff, Save, Trash
} from 'lucide-react';

const NAV_MENU = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/instructor/dashboard' },
  { label: 'My Courses', icon: BookOpen, href: '/instructor/courses' },
  { label: 'Students', icon: Users, href: '/instructor/students' },
  { label: 'Schedule', icon: Calendar, href: '/instructor/schedule' },
  { label: 'Reviews', icon: Star, href: '/instructor/reviews' },
];
const NAV_OTHERS = [
  { label: 'Meetings', icon: Video, href: '/meetings' },
  { label: 'Payments', icon: CreditCard, href: '/instructor/payments' },
  { label: 'Settings', icon: Settings, href: '/settings' },
  { label: 'Help', icon: HelpCircle, href: '/help' },
];

export default function InstructorSchedulePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const qc = useQueryClient();

  // New Session states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [centerId, setCenterId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [capacity, setCapacity] = useState(15);
  const [roomUrl, setRoomUrl] = useState('');
  const [courseId, setCourseId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!authLoading && (!isAuthenticated || user?.role !== 'INSTRUCTOR')) {
    router.push(`/${locale}/login`);
  }

  // Load Schedule
  const { data: schedule = [], isLoading: scheduleLoading } = useQuery({
    queryKey: ['instructorSchedule'],
    queryFn: async () => {
      const { data } = await api.get('/instructor/schedule');
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'INSTRUCTOR'),
  });

  // Load Centers
  const { data: centers = [] } = useQuery({
    queryKey: ['instructorCenters'],
    queryFn: async () => {
      const { data } = await api.get('/instructor/centers');
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'INSTRUCTOR' && isOffline),
  });

  // Load instructor courses for session links
  const { data: myCourses = [] } = useQuery({
    queryKey: ['instructorCoursesOnly', user?.sub],
    queryFn: async () => {
      const { data } = await api.get('/courses', {
        params: { instructorId: user?.sub, showAll: 'true' },
      });
      return data.data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'INSTRUCTOR' && user?.sub),
  });

  // Default active center config
  useEffect(() => {
    if (isOffline && centers.length > 0 && !centerId) {
      setCenterId(centers[0].id || centers[0]._id);
    }
  }, [isOffline, centers, centerId]);

  const activeCenter = centers.find((c: any) => (c.id || c._id) === centerId);
  const classrooms = activeCenter?.classrooms || [];

  useEffect(() => {
    if (classrooms.length > 0 && !roomName) {
      setRoomName(classrooms[0].name);
      setCapacity(classrooms[0].capacity);
    }
  }, [classrooms, roomName]);

  const handleCenterChange = (id: string) => {
    setCenterId(id);
    const center = centers.find((c: any) => (c.id || c._id) === id);
    if (center?.classrooms?.length > 0) {
      setRoomName(center.classrooms[0].name);
      setCapacity(center.classrooms[0].capacity);
    }
  };

  const handleClassroomChange = (name: string) => {
    setRoomName(name);
    const room = classrooms.find((r: any) => r.name === name);
    if (room) {
      setCapacity(room.capacity);
    }
  };

  // Add Meeting Mutation
  const addMeetingMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/instructor/meetings', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instructorSchedule'] });
      // Reset form
      setTitle('');
      setDescription('');
      setStartAt('');
      setEndAt('');
      setIsOffline(false);
      setCenterId('');
      setRoomName('');
      setRoomUrl('');
      setCourseId('');
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to book slot');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !startAt) {
      setErrorMsg('Session Title and Start Time are required');
      return;
    }

    const payload: any = {
      title,
      description,
      startAt: new Date(startAt).toISOString(),
      endAt: endAt ? new Date(endAt).toISOString() : undefined,
      isOffline,
      courseId: courseId || null,
    };

    if (isOffline) {
      payload.centerId = centerId;
      payload.roomName = roomName;
      payload.capacity = Number(capacity);
    } else {
      payload.roomUrl = roomUrl || undefined;
    }

    addMeetingMutation.mutate(payload);
  };

  if (authLoading || scheduleLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-base-200">
        <Navbar />
        <div className="flex justify-center items-center flex-grow">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-base-200 text-base-content font-sans">
      <Navbar />

      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        
        {/* SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-1">
          <div className="bg-base-100 rounded-2xl border border-base-300 p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-black text-primary-content text-sm shrink-0">
              {user?.username?.[0]?.toUpperCase() ?? 'I'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-base-content truncate">{user?.username}</p>
              <p className="text-[10px] text-base-content/50 font-medium">Instructor</p>
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-300 p-3 flex flex-col gap-0.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-3 pt-1 pb-2">Menu</p>
            {NAV_MENU.map(({ label, icon: Icon, href }) => {
              const active = pathname?.includes(href);
              return (
                <Link key={href} href={`/${locale}${href}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${active
                    ? 'bg-primary text-primary-content shadow-sm shadow-primary/20'
                    : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                    }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />{label}
                </Link>
              );
            })}
            <p className="text-[9px] font-black uppercase tracking-widest text-base-content/30 px-3 pt-4 pb-2">Others</p>
            {NAV_OTHERS.map(({ label, icon: Icon, href }) => (
              <Link key={href} href={`/${locale}${href}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-base-content/70 hover:bg-base-200 hover:text-base-content transition-all duration-150"
              >
                <Icon className="w-4 h-4 shrink-0" />{label}
              </Link>
            ))}
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: SCHEDULE LIST */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-black text-base-content tracking-tight">Schedule</h1>
              <p className="text-xs text-base-content/50 font-medium mt-0.5">Manage virtual classroom webinars and local center meetups</p>
            </div>

            {/* Schedule list container */}
            <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-base-content mb-4">Upcoming Events</h2>
              
              {schedule.length > 0 ? (
                <div className="space-y-3">
                  {schedule.map((item: any) => (
                    <div key={item.id || item._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-base-200/50 hover:bg-base-200 rounded-2xl border border-base-300 transition-colors gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${item.isOffline ? 'bg-info/10 text-info' : 'bg-success/10 text-success'}`}>
                          {item.isOffline ? <MapPin className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-sm text-base-content truncate">{item.title}</p>
                          <p className="text-[10px] text-base-content/50 font-semibold mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(item.startAt).toLocaleString()}
                            </span>
                            {item.courseId?.title && (
                              <span className="badge badge-outline badge-xs font-bold">{item.courseId.title}</span>
                            )}
                          </p>
                          {item.isOffline ? (
                            <p className="text-[10px] text-info font-bold mt-1">
                              Physical Circle: {item.centerId?.name}, {item.roomName} (Cap: {item.capacity})
                            </p>
                          ) : (
                            item.roomUrl && (
                              <a href={item.roomUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-success font-bold hover:underline block mt-1">
                                Join Room Link
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-base-content/20 mx-auto mb-3" />
                  <p className="text-sm text-base-content/40 font-medium">No sessions scheduled.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: NEW SESSION FORM */}
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-black text-base-content tracking-tight opacity-0 lg:block hidden">Form</h2>

            <form onSubmit={handleSubmit} className="card bg-base-100 border border-base-300 shadow-sm rounded-3xl p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-black text-base-content">Schedule a Session</h3>

              {errorMsg && (
                <div className="alert alert-error text-[10px] font-bold py-2 rounded-xl text-error-content">
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="label text-[10px] font-bold text-base-content/40 uppercase tracking-wider">Session Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. NextJS Routing Live Circle"
                  className="input input-bordered input-sm w-full rounded-xl font-semibold text-xs focus:input-primary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Course link */}
              <div>
                <label className="label text-[10px] font-bold text-base-content/40 uppercase tracking-wider">Related Course Blueprint</label>
                <select 
                  className="select select-bordered select-sm w-full rounded-xl font-semibold text-xs focus:select-primary"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                >
                  <option value="">No Course link</option>
                  {myCourses.map((c: any) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Offline Toggle */}
              <div className="flex items-center justify-between p-3 bg-base-200/50 rounded-2xl border border-base-300">
                <div>
                  <p className="text-xs font-bold text-base-content">Physical Cohort</p>
                  <p className="text-[9px] text-base-content/40 font-semibold">Book a seat in local classroom centers</p>
                </div>
                <input 
                  type="checkbox" 
                  className="toggle toggle-primary toggle-sm"
                  checked={isOffline}
                  onChange={(e) => setIsOffline(e.target.checked)}
                />
              </div>

              {/* Physical Booking options */}
              {isOffline ? (
                <>
                  <div>
                    <label className="label text-[10px] font-bold text-base-content/40 uppercase tracking-wider">Select Center</label>
                    <select 
                      className="select select-bordered select-sm w-full rounded-xl font-semibold text-xs focus:select-primary"
                      value={centerId}
                      onChange={(e) => handleCenterChange(e.target.value)}
                      required
                    >
                      {centers.map((c: any) => (
                        <option key={c.id || c._id} value={c.id || c._id}>
                          {c.name} ({c.location})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label text-[10px] font-bold text-base-content/40 uppercase tracking-wider">Select Classroom Room</label>
                    <select 
                      className="select select-bordered select-sm w-full rounded-xl font-semibold text-xs focus:select-primary"
                      value={roomName}
                      onChange={(e) => handleClassroomChange(e.target.value)}
                      required
                    >
                      {classrooms.map((room: any) => (
                        <option key={room.name} value={room.name}>
                          {room.name} (Max Capacity: {room.capacity})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                /* Virtual link */
                <div>
                  <label className="label text-[10px] font-bold text-base-content/40 uppercase tracking-wider">Custom Meeting Video URL</label>
                  <input 
                    type="url" 
                    placeholder="https://meet.jit.si/my-session"
                    className="input input-bordered input-sm w-full rounded-xl font-semibold text-xs focus:input-primary"
                    value={roomUrl}
                    onChange={(e) => setRoomUrl(e.target.value)}
                  />
                </div>
              )}

              {/* Start Date */}
              <div>
                <label className="label text-[10px] font-bold text-base-content/40 uppercase tracking-wider">Start Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="input input-bordered input-sm w-full rounded-xl font-semibold text-xs focus:input-primary"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  required
                />
              </div>

              {/* End Date */}
              <div>
                <label className="label text-[10px] font-bold text-base-content/40 uppercase tracking-wider">End Date & Time (optional)</label>
                <input 
                  type="datetime-local" 
                  className="input input-bordered input-sm w-full rounded-xl font-semibold text-xs focus:input-primary"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-sm rounded-xl font-bold w-full mt-4 flex items-center gap-1.5"
                disabled={addMeetingMutation.isPending}
              >
                <Save className="w-4 h-4" /> {addMeetingMutation.isPending ? 'Scheduling...' : 'Schedule Session'}
              </button>
            </form>
          </div>

        </main>
      </div>
    </div>
  );
}

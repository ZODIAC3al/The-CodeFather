'use client';

import Navbar from '@/components/Navbar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';
import { Calendar as CalendarIcon, Video, Clock, Users, Plus, X, VideoOff } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Footer from '@/components/Footer';

// Provider pill toggle
const PROVIDERS = [
  { id: 'meet', label: 'Meet', color: 'bg-[#EA4335]' },
  { id: 'teams', label: 'Teams', color: 'bg-[#6264A7]' },
  { id: 'zoom', label: 'Zoom', color: 'bg-[#2D8CFF]' },
];

export default function Meetings() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const locale = useLocale();
  const t = useTranslations('meetings');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newCourseId, setNewCourseId] = useState('');
  const [newRoomUrl, setNewRoomUrl] = useState('');
  const [newAttendees, setNewAttendees] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('meet');
  const [addError, setAddError] = useState<string | null>(null);

  const { data: meetings, isLoading: isMeetingsLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const { data } = await api.get('/meetings');
      return data;
    },
  });

  const { data: courses } = useQuery({
    queryKey: ['myCourses'],
    queryFn: async () => {
      const { data } = await api.get('/courses');
      return data?.data || [];
    },
    enabled: isAuthenticated && user?.role !== 'STUDENT',
  });

  const createMeetingMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/meetings', {
        title: newTitle,
        description: newDesc,
        scheduledAt: new Date(newStart).toISOString(),
        courseId: newCourseId || undefined,
        roomUrl: newRoomUrl || undefined,
        provider: selectedProvider,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setShowAddModal(false);
      setNewTitle(''); setNewDesc(''); setNewStart(''); setNewEnd('');
      setNewCourseId(''); setNewRoomUrl(''); setNewAttendees('');
    },
    onError: (err: any) => {
      setAddError(err.response?.data?.message || 'Failed to schedule meeting');
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    createMeetingMutation.mutate();
  };

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">

        {/* Page header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <span className="badge badge-primary badge-outline text-xs font-bold uppercase tracking-wider mb-3">
              {t('virtualClassrooms')}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-base-content tracking-tight">
              {t('liveStudyCircles')}
            </h1>
            <p className="text-base-content/60 text-sm mt-2 font-medium">
              {t('pageSubtitle')}
            </p>
          </div>

          {isAuthenticated && user?.role !== 'STUDENT' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary rounded-full px-6 flex items-center gap-2 font-bold"
            >
              <Plus className="w-4 h-4" /> {t('scheduleSession')}
            </button>
          )}
        </div>

        {/* Meetings grid */}
        {isMeetingsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-base-100 h-64 rounded-3xl border border-base-300" />
            ))}
          </div>
        ) : !meetings?.length ? (
          <div className="bg-base-100 text-center py-20 px-4 rounded-3xl border border-base-300 max-w-md mx-auto">
            <VideoOff className="w-16 h-16 text-base-content/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-base-content mb-2">{t('noLiveSessions')}</h3>
            <p className="text-base-content/60 text-sm">{t('noSessionsDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map((meeting: any) => (
              <div key={meeting.id || meeting._id} className="bg-base-100 rounded-3xl border border-base-300 flex flex-col h-full relative overflow-hidden group hover:-translate-y-1 transition-transform duration-200 shadow-sm hover:shadow-md">
                <div className="absolute top-0 right-0 p-4">
                  <span className="badge badge-primary px-3 py-1 font-bold text-xs shadow-sm">
                    {meeting.status}
                  </span>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="font-bold text-lg text-base-content mb-2 pr-16 line-clamp-2">
                    {meeting.title}
                  </h3>
                  <p className="text-base-content/60 text-sm mb-6 line-clamp-2">{meeting.description}</p>
                  <div className="space-y-3 mt-auto text-base-content/85">
                    <div className="flex items-center text-sm font-medium">
                      <CalendarIcon className="w-4 h-4 mx-2 text-primary" />
                      {new Date(meeting.scheduledAt).toLocaleString(locale)}
                    </div>
                    {meeting.instructor && (
                      <div className="flex items-center text-sm font-medium">
                        <Users className="w-4 h-4 mx-2 text-primary" />
                        {t('host')}: {meeting.instructor.username}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 border-t border-base-300 bg-base-200/50">
                  <a
                    href={meeting.roomUrl || `https://meet.jit.si/${meeting.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-accent w-full flex items-center justify-center gap-2 rounded-xl text-sm font-bold"
                  >
                    <Video className="w-4 h-4" /> {t('joinRoom')}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Schedule Meeting Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">

            {/* LEFT — illustrative panel */}
            <div className="hidden lg:flex flex-col items-center justify-center bg-base-200 p-12 flex-1 relative overflow-hidden">
              {/* Decorative browser mockup */}
              <div className="w-full max-w-[280px] bg-base-100 rounded-2xl shadow-xl border border-base-300 overflow-hidden">
                {/* browser bar */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-base-300 bg-base-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-error/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
                  <div className="flex-1 mx-2 h-4 rounded-full bg-base-300" />
                </div>
                {/* avatar cards stacked */}
                <div className="relative p-6 pb-10 flex items-end gap-0">
                  <div className="w-36 h-44 bg-accent/10 rounded-2xl border-2 border-accent/20 flex items-end justify-center overflow-hidden">
                    <div className="w-20 h-24 rounded-full bg-accent/30 mb-0 flex items-center justify-center">
                      <svg viewBox="0 0 60 70" className="w-20 h-24" fill="none">
                        <ellipse cx="30" cy="22" rx="14" ry="14" fill="oklch(var(--a)/0.6)" />
                        <ellipse cx="30" cy="60" rx="22" ry="18" fill="oklch(var(--a)/0.4)" />
                      </svg>
                    </div>
                  </div>
                  <div className="w-28 h-36 bg-primary/10 rounded-2xl border-2 border-primary/20 flex items-end justify-center overflow-hidden absolute bottom-4 right-6 shadow-lg">
                    <div className="w-16 h-20 rounded-full bg-primary/30 flex items-center justify-center">
                      <svg viewBox="0 0 60 70" className="w-16 h-20" fill="none">
                        <ellipse cx="30" cy="22" rx="14" ry="14" fill="oklch(var(--p)/0.6)" />
                        <ellipse cx="30" cy="60" rx="22" ry="18" fill="oklch(var(--p)/0.4)" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-6 text-sm font-bold text-base-content/50 text-center">
                {t('noSessionsDesc')}
              </p>
            </div>

            {/* RIGHT — form */}
            <div className="flex-1 flex flex-col max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-base-300 flex justify-between items-center sticky top-0 bg-base-100 z-10">
                <div>
                  <h2 className="text-xl font-extrabold text-base-content">
                    {t('scheduleTitle')}
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-base-200 rounded-full transition-colors text-base-content"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
                {/* Provider toggles */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-base-content/70">{t('selectProvider')}</span>
                  <div className="join">
                    {PROVIDERS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProvider(p.id)}
                        className={`join-item btn btn-sm px-4 font-bold transition-all ${selectedProvider === p.id
                          ? 'btn-primary'
                          : 'btn-ghost border border-base-300'
                          }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {addError && (
                  <div className="p-3 bg-error/10 text-error rounded-xl text-sm font-bold">{addError}</div>
                )}

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/70">{t('titleLabel')}</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('titlePlaceholder')}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="input input-bordered w-full rounded-xl focus:input-primary"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/70">{t('aboutLabel')}</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="textarea textarea-bordered w-full rounded-xl focus:textarea-primary resize-none"
                  />
                </div>

                {/* Date + Timezone row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/70">{t('dateLabel')}</span>
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40 pointer-events-none" />
                      <input
                        type="date"
                        required
                        value={newStart.split('T')[0] || ''}
                        onChange={(e) => setNewStart(e.target.value + 'T' + (newStart.split('T')[1] || '09:00'))}
                        className="input input-bordered w-full rounded-xl pl-9 focus:input-primary text-sm"
                      />
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/70">{t('timezoneLabel')}</span>
                    </label>
                    <select className="select select-bordered w-full rounded-xl focus:select-primary text-sm">
                      <option>UTC+02:00 (Cairo)</option>
                      <option>UTC+00:00</option>
                      <option>UTC-05:00 (EST)</option>
                      <option>UTC+01:00 (CET)</option>
                    </select>
                  </div>
                </div>

                {/* Start + End + Attachment row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: t('startTimeLabel'), icon: Clock, type: 'time', val: newStart.split('T')[1] || '', setter: (v: string) => setNewStart((newStart.split('T')[0] || '') + 'T' + v) },
                    { label: t('endTimeLabel'), icon: Clock, type: 'time', val: newEnd, setter: setNewEnd },
                  ].map(({ label, icon: Icon, type, val, setter }) => (
                    <div key={label} className="form-control">
                      <label className="label">
                        <span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/70">{label}</span>
                      </label>
                      <div className="relative">
                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40 pointer-events-none" />
                        <input
                          type={type}
                          value={val}
                          onChange={(e) => setter(e.target.value)}
                          className="input input-bordered w-full rounded-xl pl-9 focus:input-primary text-sm"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/70">{t('attachmentLabel')}</span>
                    </label>
                    <label className="input input-bordered w-full rounded-xl flex items-center justify-between cursor-pointer hover:input-primary">
                      <span className="text-xs text-base-content/40">{t('uploadText')}</span>
                      <svg className="w-4 h-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <input type="file" className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-xs font-bold uppercase tracking-wider text-base-content/70">{t('attendeesLabel')}</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t('attendeesPlaceholder')}
                    value={newAttendees}
                    onChange={(e) => setNewAttendees(e.target.value)}
                    className="textarea textarea-bordered w-full rounded-xl focus:textarea-primary resize-none text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createMeetingMutation.isPending}
                  className="btn btn-accent w-full rounded-xl font-bold text-base disabled:opacity-50"
                >
                  {createMeetingMutation.isPending ? t('scheduling') : t('generateMeeting')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
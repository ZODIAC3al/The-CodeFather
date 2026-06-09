'use client';

import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { 
  LayoutDashboard, Users, BookOpen, Building2, Trophy, Activity, 
  CreditCard, Settings, HelpCircle, ShieldCheck, MapPin, Plus, Trash2, Save
} from 'lucide-react';

const NAV_MENU = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Courses', icon: BookOpen, href: '/admin/courses' },
  { label: 'Centers', icon: Building2, href: '/admin/centers' },
  { label: 'Leaderboard', icon: Trophy, href: '/admin/leaderboard' },
  { label: 'Analytics', icon: Activity, href: '/admin/analytics' },
];

const NAV_OTHERS = [
  { label: 'Payments', icon: CreditCard, href: '/payments' },
  { label: 'Settings', icon: Settings, href: '/settings' },
  { label: 'Help', icon: HelpCircle, href: '/help' },
];

export default function AdminCentersPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // New center states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [rooms, setRooms] = useState<Array<{ name: string; capacity: number }>>([{ name: 'Room 101', capacity: 15 }]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
    router.push(`/${locale}/login`);
  }

  // Load Centers
  const { data: centers = [], isLoading: centersLoading } = useQuery({
    queryKey: ['adminCenters'],
    queryFn: async () => {
      const { data } = await api.get('/admin/centers');
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'ADMIN'),
  });

  // Create Center Mutation
  const createCenterMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/admin/centers', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCenters'] });
      setName('');
      setLocation('');
      setRooms([{ name: 'Room 101', capacity: 15 }]);
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to create center');
    }
  });

  // Delete Center Mutation
  const deleteCenterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/centers/${id}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminCenters'] }),
  });

  const addRoomField = () => {
    setRooms([...rooms, { name: `Room ${rooms.length + 101}`, capacity: 15 }]);
  };

  const removeRoomField = (index: number) => {
    if (rooms.length === 1) return;
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const handleRoomChange = (index: number, field: string, val: any) => {
    const updated = rooms.map((r, i) => {
      if (i === index) {
        return { ...r, [field]: field === 'capacity' ? Number(val) : val };
      }
      return r;
    });
    setRooms(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !location.trim()) {
      setErrorMsg('Center Name and Physical Address are required');
      return;
    }

    const payload = {
      name,
      location,
      classrooms: rooms.filter(r => r.name.trim().length > 0 && r.capacity > 0),
    };

    createCenterMutation.mutate(payload);
  };

  if (authLoading || centersLoading) {
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
          <div className="bg-primary rounded-2xl p-4 mb-4 flex items-center gap-3 shadow-md shadow-primary/20">
            <div className="w-10 h-10 rounded-xl bg-primary-content/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary-content" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-primary-content truncate">{user?.username}</p>
              <p className="text-[10px] text-primary-content/60 font-medium">Super Admin</p>
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
          
          {/* CENTERS LIST */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-black text-base-content tracking-tight">Physical Centers</h1>
              <p className="text-xs text-base-content/50 font-medium mt-0.5">Manage learning locations and local study classrooms</p>
            </div>

            {/* List container */}
            <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-base-content mb-4 font-black">All Centers ({centers.length})</h2>
              
              {centers.length > 0 ? (
                <div className="space-y-4">
                  {centers.map((c: any) => (
                    <div key={c.id || c._id} className="p-4 bg-base-200/50 hover:bg-base-200 rounded-2xl border border-base-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-base-content leading-tight">{c.name}</p>
                          <p className="text-[10px] text-base-content/50 font-semibold mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {c.location}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {c.classrooms?.map((room: any, i: number) => (
                              <span key={i} className="badge badge-sm badge-outline font-bold text-[9px] uppercase tracking-wide">
                                {room.name} ({room.capacity} seats)
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteCenterMutation.mutate(c.id || c._id)}
                        className="btn btn-xs btn-error btn-outline rounded-lg flex items-center gap-1 font-bold"
                        disabled={deleteCenterMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Building2 className="w-12 h-12 text-base-content/25 mx-auto mb-3" />
                  <p className="text-sm text-base-content/40 font-medium">No centers configured.</p>
                </div>
              )}
            </div>
          </div>

          {/* CREATE CENTER FORM */}
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-black text-base-content tracking-tight opacity-0 lg:block hidden">Form</h2>

            <form onSubmit={handleSubmit} className="card bg-base-100 border border-base-300 shadow-sm rounded-3xl p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-black text-base-content">Add New Center</h3>

              {errorMsg && (
                <div className="alert alert-error text-[10px] font-bold py-2 rounded-xl text-error-content">
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Center Name */}
              <div>
                <label className="label text-[10px] font-bold text-base-content/40 uppercase tracking-wider">Center Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Downtown Tech Hub"
                  className="input input-bordered input-sm w-full rounded-xl font-semibold text-xs focus:input-primary"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="label text-[10px] font-bold text-base-content/40 uppercase tracking-wider">Physical Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. 128 Innovation Way, Sector 4"
                  className="input input-bordered input-sm w-full rounded-xl font-semibold text-xs focus:input-primary"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              {/* Classrooms */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-base-300 pb-2">
                  <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider">Classrooms/Rooms</span>
                  <button 
                    type="button" 
                    onClick={addRoomField} 
                    className="btn btn-xs btn-primary font-bold rounded-lg flex items-center gap-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                {rooms.map((room, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      placeholder="Room name" 
                      className="input input-bordered input-sm rounded-xl font-semibold text-xs flex-1"
                      value={room.name}
                      onChange={(e) => handleRoomChange(idx, 'name', e.target.value)}
                      required
                    />
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Cap" 
                      className="input input-bordered input-sm rounded-xl font-semibold text-xs w-16"
                      value={room.capacity}
                      onChange={(e) => handleRoomChange(idx, 'capacity', e.target.value)}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => removeRoomField(idx)} 
                      className="btn btn-xs btn-error btn-ghost text-error"
                      disabled={rooms.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-sm rounded-xl font-bold w-full mt-4 flex items-center gap-1.5"
                disabled={createCenterMutation.isPending}
              >
                <Save className="w-4 h-4" /> {createCenterMutation.isPending ? 'Creating...' : 'Save Center'}
              </button>
            </form>
          </div>

        </main>
      </div>
    </div>
  );
}

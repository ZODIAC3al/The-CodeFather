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
  CreditCard, Settings, HelpCircle, ShieldCheck, UserCheck, AlertTriangle
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

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'badge-primary',
  INSTRUCTOR: 'badge-secondary',
  STUDENT: 'badge-ghost',
};

export default function AdminUsersPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
    router.push(`/${locale}/login`);
  }

  // Load Users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return data ?? [];
    },
    enabled: !!(isAuthenticated && user?.role === 'ADMIN'),
  });

  // Role/Status update mutation
  const userUpdateMutation = useMutation({
    mutationFn: async ({ userId, payload }: { userId: string; payload: { role?: string; suspended?: boolean } }) => {
      const { data } = await api.patch(`/admin/users/${userId}/role`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  });

  const filteredUsers = users
    .filter((u: any) => roleFilter === 'ALL' || u.role === roleFilter)
    .filter((u: any) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return u.username.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    });

  if (authLoading || usersLoading) {
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
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-base-content tracking-tight">User Management</h1>
              <p className="text-xs text-base-content/50 font-medium mt-0.5">Edit system roles, suspend accounts, and view user sessions</p>
            </div>
            
            {/* Search filter input */}
            <input 
              type="text" 
              placeholder="Search user or email..."
              className="input input-sm input-bordered w-full sm:w-64 rounded-xl font-semibold text-xs focus:input-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table Container */}
          <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-base-300 flex flex-wrap items-center justify-between gap-3 bg-base-200/20">
              <h2 className="text-sm font-black text-base-content">All Registered Users ({filteredUsers.length})</h2>
              
              <div className="join">
                {['ALL', 'STUDENT', 'INSTRUCTOR', 'ADMIN'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`join-item btn btn-xs font-bold ${roleFilter === r ? 'btn-primary text-primary-content' : 'btn-ghost border border-base-300'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full text-sm">
                <thead>
                  <tr className="bg-base-200/50 text-[10px] uppercase tracking-wider text-base-content/40 font-black">
                    <th className="py-3 px-5">User</th>
                    <th className="py-3 px-5">Email</th>
                    <th className="py-3 px-5">Role</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-300">
                  {filteredUsers.map((u: any) => (
                    <tr key={u.id} className="hover:bg-base-200/30 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                            {u.avatar ? (
                              <img src={u.avatar} alt="" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              u.username?.[0]?.toUpperCase()
                            )}
                          </div>
                          <span className="font-bold text-base-content text-sm">{u.username}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-base-content/60 text-xs font-semibold">{u.email}</td>
                      <td className="py-3.5 px-5">
                        <span className={`badge badge-sm font-extrabold ${ROLE_BADGE[u.role] ?? 'badge-ghost'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`badge badge-sm font-extrabold ${u.suspended ? 'badge-error text-error-content animate-pulse' : 'badge-success text-success-content'}`}>
                          {u.suspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right flex items-center justify-end gap-2.5">
                        {/* Change Role dropdown select */}
                        <select
                          defaultValue={u.role}
                          onChange={(e) => userUpdateMutation.mutate({ userId: u.id || u._id, payload: { role: e.target.value } })}
                          className="select select-xs select-bordered rounded-lg font-bold focus:select-primary"
                          disabled={userUpdateMutation.isPending}
                        >
                          <option value="STUDENT">Student</option>
                          <option value="INSTRUCTOR">Instructor</option>
                          <option value="ADMIN">Admin</option>
                        </select>

                        {/* Suspend / Reactivate action button */}
                        <button
                          onClick={() => userUpdateMutation.mutate({ 
                            userId: u.id || u._id, 
                            payload: { suspended: !u.suspended } 
                          })}
                          className={`btn btn-xs font-bold rounded-lg ${u.suspended ? 'btn-success btn-outline' : 'btn-error btn-outline'}`}
                          disabled={userUpdateMutation.isPending}
                        >
                          {u.suspended ? 'Reactivate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-sm text-base-content/40 font-medium">No users match filter criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

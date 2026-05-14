'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Trash2, Clock, Users, RefreshCw } from 'lucide-react';

interface AppUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const STATUS_COLORS = {
  pending:  { bg: 'bg-amber-400/10',  border: 'border-amber-400/30',  text: 'text-amber-400'  },
  approved: { bg: 'bg-green-400/10',  border: 'border-green-400/30',  text: 'text-green-400'  },
  rejected: { bg: 'bg-red-400/10',    border: 'border-red-400/30',    text: 'text-red-400'    },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 403) { setError('Access denied — admins only'); return; }
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch { setError('Failed to load users'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: 'approved' | 'rejected') {
    setActing(id);
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    await load();
    setActing(null);
  }

  async function deleteUser(id: string) {
    if (!confirm('Delete this user permanently?')) return;
    setActing(id);
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await load();
    setActing(null);
  }

  const pending  = users.filter((u) => u.status === 'pending');
  const approved = users.filter((u) => u.status === 'approved');
  const rejected = users.filter((u) => u.status === 'rejected');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">User Management</h1>
          {pending.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-400 border border-amber-400/30">
              {pending.length} pending
            </span>
          )}
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-colors">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-400/10 border border-red-400/20 text-sm text-red-400">{error}</div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="h-16 rounded-xl bg-card border border-border animate-pulse" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No registered users yet. Share the <code className="text-primary">/register</code> link with your team.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending */}
          {pending.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Awaiting Approval ({pending.length})
              </h2>
              <div className="space-y-2">
                {pending.map((u) => <UserRow key={u.id} u={u} acting={acting} onStatus={setStatus} onDelete={deleteUser} />)}
              </div>
            </section>
          )}

          {/* Approved */}
          {approved.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-green-400 mb-2 flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" /> Approved ({approved.length})
              </h2>
              <div className="space-y-2">
                {approved.map((u) => <UserRow key={u.id} u={u} acting={acting} onStatus={setStatus} onDelete={deleteUser} />)}
              </div>
            </section>
          )}

          {/* Rejected */}
          {rejected.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-red-400 mb-2 flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5" /> Rejected ({rejected.length})
              </h2>
              <div className="space-y-2">
                {rejected.map((u) => <UserRow key={u.id} u={u} acting={acting} onStatus={setStatus} onDelete={deleteUser} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function UserRow({ u, acting, onStatus, onDelete }: {
  u: AppUser;
  acting: string | null;
  onStatus: (id: string, s: 'approved' | 'rejected') => void;
  onDelete: (id: string) => void;
}) {
  const busy = acting === u.id;
  const sc = STATUS_COLORS[u.status];
  const date = new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-primary">{u.name.charAt(0).toUpperCase()}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{u.name}</p>
        <p className="text-xs text-muted-foreground truncate">@{u.username}{u.email ? ` · ${u.email}` : ''}</p>
      </div>

      {/* Date */}
      <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">{date}</span>

      {/* Status badge */}
      <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border shrink-0 ${sc.bg} ${sc.border} ${sc.text}`}>
        {u.status}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {u.status !== 'approved' && (
          <button disabled={busy} onClick={() => onStatus(u.id, 'approved')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-green-400/10 hover:bg-green-400/20 text-green-400 border border-green-400/20 transition-colors disabled:opacity-40">
            <CheckCircle className="h-3.5 w-3.5" /> Approve
          </button>
        )}
        {u.status !== 'rejected' && (
          <button disabled={busy} onClick={() => onStatus(u.id, 'rejected')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/20 transition-colors disabled:opacity-40">
            <XCircle className="h-3.5 w-3.5" /> Reject
          </button>
        )}
        <button disabled={busy} onClick={() => onDelete(u.id)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

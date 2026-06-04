import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { UserPlus, Edit2, Trash2 } from 'lucide-react';
import { usersApi, UserOut, UserCreate } from '../api/services';
import { useAuth } from '../context/AuthContext';

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin':    return 'bg-purple-500 text-white';
    case 'operator': return 'bg-primary text-white';
    case 'analyst':  return 'bg-accent text-white';
    default:         return 'bg-muted text-foreground';
  }
};

const getStatusColor = (active: boolean) =>
  active
    ? 'border border-primary text-primary bg-primary/10'
    : 'border border-muted text-muted-foreground bg-muted/20';

const initials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export function Users() {
  const { user: me } = useAuth();
  const [users, setUsers]       = useState<UserOut[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]         = useState<UserCreate>({ username: '', email: '', password: '', role: 'viewer' });
  const [creating, setCreating] = useState(false);

  const load = () =>
    usersApi.list()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await usersApi.create(form);
      setUsers((prev) => [...prev, created]);
      setShowCreate(false);
      setForm({ username: '', email: '', password: '', role: 'viewer' });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    try {
      await usersApi.delete(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete user');
    }
  };

  const active    = users.filter((u) => u.is_active).length;
  const admins    = users.filter((u) => u.role === 'admin').length;
  const operators = users.filter((u) => u.role === 'operator').length;
  const isAdmin   = me?.role === 'admin';

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Users" subtitle="Real-time surveillance monitoring" />

      <div className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl text-foreground mb-1">User Management</h3>
            <p className="text-sm text-muted-foreground">Manage system users and access levels</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          )}
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
              <h3 className="text-lg text-foreground mb-4">Add User</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                {['username', 'email', 'password'].map((field) => (
                  <div key={field}>
                    <label className="block text-sm mb-1 text-foreground capitalize">{field} *</label>
                    <input
                      required
                      type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                      value={(form as Record<string, string>)[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      className="w-full px-3 py-2 bg-muted rounded-lg border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm mb-1 text-foreground">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted rounded-lg border border-border text-foreground text-sm"
                  >
                    {['viewer', 'operator', 'analyst', 'admin'].map((r) => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
                  <button type="submit" disabled={creating} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-60">
                    {creating ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">{error}</div>
        )}

        <div className="grid grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Users', value: users.length },
            { label: 'Active Users', value: active },
            { label: 'Administrators', value: admins },
            { label: 'Operators', value: operators },
          ].map(({ label, value }) => (
            <div key={label} className="bg-card rounded-xl p-6 border border-border">
              <p className="text-muted-foreground text-sm mb-2">{label}</p>
              <h3 className="text-3xl text-foreground">{loading ? '—' : value}</h3>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {['User', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-sm text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading users…</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground text-sm">No users found</td></tr>
                ) : users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm">
                          {initials(user.username)}
                        </div>
                        <span className="text-sm text-foreground">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-xs ${getStatusColor(user.is_active)}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-muted rounded transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4 text-foreground" />
                          </button>
                          {user.id !== me?.id && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-2 hover:bg-destructive/20 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Eye, CheckCircle2, Filter, Plus } from 'lucide-react';
import { incidentsApi, IncidentOut, IncidentCreate } from '../api/services';

const getSeverityStyles = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical': return 'bg-destructive text-white';
    case 'high':     return 'bg-orange-500 text-white';
    case 'medium':   return 'bg-accent text-white';
    case 'low':      return 'bg-primary text-white';
    default:         return 'bg-muted text-foreground';
  }
};

const getStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':        return 'border border-destructive text-destructive bg-destructive/10';
    case 'in_progress': return 'border border-accent text-accent bg-accent/10';
    case 'resolved':    return 'border border-primary text-primary bg-primary/10';
    default:            return 'border border-muted text-muted-foreground';
  }
};

const formatStatus = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function Incidents() {
  const [incidents, setIncidents] = useState<IncidentOut[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle]   = useState('');
  const [newSeverity, setNewSeverity] = useState('medium');
  const [newType, setNewType]     = useState('');
  const [creating, setCreating]   = useState(false);

  const load = () =>
    incidentsApi.list({ limit: 50 })
      .then(setIncidents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

  useEffect(() => { 
  load(); 
  // Poll every 5 seconds for new incidents
  const interval = setInterval(load, 5000);
  return () => clearInterval(interval);
}, []);

  const handleResolve = async (id: number) => {
    try {
      await incidentsApi.resolve(id);
      setIncidents((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'resolved' } : i))
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to resolve');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const data: IncidentCreate = {
        title: newTitle,
        severity: newSeverity,
        incident_type: newType || undefined,
      };
      const created = await incidentsApi.create(data);
      setIncidents((prev) => [created, ...prev]);
      setShowCreate(false);
      setNewTitle(''); setNewSeverity('medium'); setNewType('');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Incidents" subtitle="Real-time surveillance monitoring" />

      <div className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl text-foreground mb-1">Incident Management</h3>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading…' : `${incidents.length} incidents`}
            </p>
          </div>
          <div className="flex gap-3">
           
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              Create Incident
            </button>
          </div>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
              <h3 className="text-lg text-foreground mb-4">Create Incident</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1 text-foreground">Title *</label>
                  <input
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-muted rounded-lg border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Incident title"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-foreground">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-muted rounded-lg border border-border text-foreground text-sm focus:outline-none"
                  >
                    {['low', 'medium', 'high', 'critical'].map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-foreground">Type</label>
                  <input
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-muted rounded-lg border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. Unauthorized Access"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors"
                  >
                    {creating ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {['Incident ID', 'Date & Time', 'Severity', 'Camera Source', 'Type', 'Status', 'Assigned To', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-sm text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading incidents…</td>
                  </tr>
                ) : incidents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground text-sm">No incidents found</td>
                  </tr>
                ) : incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground">{incident.incident_code}</td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {new Date(incident.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${getSeverityStyles(incident.severity)}`}>
                        {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {incident.camera ? `${incident.camera.name}${incident.camera.zone ? ` - ${incident.camera.zone}` : ''}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{incident.incident_type ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-xs ${getStatusStyles(incident.status)}`}>
                        {formatStatus(incident.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {incident.assigned_user?.username ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-muted rounded transition-colors" title="View">
                          <Eye className="w-4 h-4 text-foreground" />
                        </button>
                        {incident.status !== 'resolved' && (
                          <button
                            onClick={() => handleResolve(incident.id)}
                            className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded flex items-center gap-1.5 text-xs transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Resolve
                          </button>
                        )}
                      </div>
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

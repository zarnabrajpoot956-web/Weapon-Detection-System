import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { AlertTriangle, Camera, Activity, CheckCircle2, Camera as CameraIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { analyticsApi, DashboardStats, WeeklyIncident } from '../api/services';
import { camerasApi, CameraOut } from '../api/services';

// ── 1. ADD THE LIVE CAMERA STREAM COMPONENT HERE (BEFORE THE MAIN DASHBOARD) ──
function LiveCameraStream({ camera }: { camera: CameraOut }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [camera.id]);

  if (!camera.is_active) {
    return (
      <div className="flex flex-col items-center justify-center h-32 bg-muted/40 rounded-lg border border-border">
        <CameraIcon className="w-10 h-10 text-muted-foreground/30 mb-1" />
        <span className="text-xs text-muted-foreground">Camera Offline</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-32 bg-muted/30 rounded-lg border border-border text-center p-3">
        <AlertTriangle className="w-8 h-8 text-destructive/70 mb-1.5" />
        <span className="text-xs text-muted-foreground">Feed Offline</span>
      </div>
    );
  }

  // Points to the FastAPI backend proxy endpoint
 const env = (import.meta as any).env;
  const backendUrl = env?.VITE_API_URL || 'http://localhost:8000';
  const liveProxyUrl = `${backendUrl}/api/cameras/${camera.id}/stream`;

  return (
    <div className="relative w-full h-32 bg-black rounded-lg overflow-hidden border border-border">
      <img
        src={liveProxyUrl}
        alt={camera.name}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

// ── 2. YOUR MAIN DASHBOARD COMPONENT ──
export function Dashboard() {
  const [stats, setStats]       = useState<DashboardStats | null>(null);
  const [weekly, setWeekly]     = useState<WeeklyIncident[]>([]);
  const [cameras, setCameras]   = useState<CameraOut[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    Promise.all([
      analyticsApi.dashboard(),
      analyticsApi.weeklyIncidents(1),
      camerasApi.list(),
    ])
      .then(([s, w, c]) => {
        setStats(s);
        // Convert day labels to short weekday names
        setWeekly(w.map((r) => ({
          ...r,
          day: new Date(r.day).toLocaleDateString('en-US', { weekday: 'short' }),
        })));
        setCameras(c);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  const activeCameras = cameras.filter((c) => c.is_active);

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Dashboard" subtitle="Real-time surveillance monitoring" />

      <div className="flex-1 p-8 overflow-auto">
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total Incidents</p>
                <h3 className="text-3xl text-foreground">{stats?.total_incidents ?? '—'}</h3>
                <p className="text-sm text-primary mt-1">
                  {stats?.incident_change_pct !== undefined
                    ? `${stats.incident_change_pct > 0 ? '+' : ''}${stats.incident_change_pct}%`
                    : ''}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Active Cameras</p>
                <h3 className="text-3xl text-foreground">
                  {stats ? `${stats.active_cameras}/${stats.total_cameras}` : '—'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats ? `${stats.camera_utilization}%` : ''}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Camera className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Alerts Today</p>
                <h3 className="text-3xl text-foreground">{stats?.alerts_today ?? '—'}</h3>
              </div>
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Resolved Cases</p>
                <h3 className="text-3xl text-foreground">{stats?.resolved_cases ?? '—'}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats ? `${stats.resolution_rate}%` : ''}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-foreground">Live Camera Feeds</h3>
              <span className="px-3 py-1 bg-destructive rounded-full text-xs text-white">LIVE</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(activeCameras.length ? activeCameras : cameras).slice(0, 4).map((camera) => (
                <div key={camera.id} className="bg-muted rounded-lg p-4 relative">
                  {camera.is_active && (
                    <div className="absolute top-3 right-3 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                  )}
                  
                  {/* ── 3. REPLACED STATIC ICON CONTAINER WITH THE LIVE FEED HERE ── */}
                  <div className="mb-3">
                    <LiveCameraStream camera={camera} />
                  </div>

                  <div className="bg-card/50 rounded px-3 py-1.5 border border-border">
                    <p className="text-xs text-foreground mb-0.5">{camera.name}</p>
                    <p className="text-xs text-muted-foreground">{camera.zone ?? camera.location ?? 'No zone'}</p>
                  </div>
                </div>
              ))}
              {cameras.length === 0 && (
                <div className="col-span-2 flex items-center justify-center h-40 text-muted-foreground text-sm">
                  No cameras configured
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-lg text-foreground mb-6">Incidents This Week</h3>
            {weekly.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Bar dataKey="incidents" fill="#2E8B57" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                No incident data this week
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { analyticsApi } from '../api/services';

const COLORS = ['#2E8B57', '#E07B39', '#e53e3e', '#805ad5'];

export function Analytics() {
  const [weekly,       setWeekly]       = useState<{ day: string; incidents: number; resolved: number }[]>([]);
  const [hourly,       setHourly]       = useState<{ hour: string; count: number }[]>([]);
  const [distribution, setDistribution] = useState<{ type: string; count: number }[]>([]);
  const [byZone,       setByZone]       = useState<{ zone: string; count: number }[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  useEffect(() => {
    Promise.all([
      analyticsApi.weeklyIncidents(4),
      analyticsApi.hourlyActivity(),
      analyticsApi.incidentDistribution(),
      analyticsApi.activityByZone(),
    ])
      .then(([w, h, d, z]) => {
        setWeekly(w.map((r) => ({
          ...r,
          day: new Date(r.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        })));
        setHourly(h);
        setDistribution(d);
        setByZone(z);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading analytics…</p>
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

  const noData = (
    <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
      No data available yet
    </div>
  );

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Analytics" subtitle="Advanced analytics and reporting" />

      <div className="flex-1 p-8 overflow-auto space-y-6">
        {/* Incident trend */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-lg text-foreground mb-6">Incident Trend (Last 4 Weeks)</h3>
          {weekly.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="incidents" stroke="#2E8B57" fill="#2E8B57" fillOpacity={0.2} />
                <Area type="monotone" dataKey="resolved"  stroke="#E07B39" fill="#E07B39" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : noData}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Hourly activity */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-lg text-foreground mb-6">Hourly Activity Pattern</h3>
            {hourly.some((h) => h.count > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={hourly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" stroke="#6b7280" tick={{ fontSize: 11 }} interval={3} />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#2E8B57" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : noData}
          </div>

          {/* Incident distribution */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="text-lg text-foreground mb-6">Incident Distribution</h3>
            {distribution.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={distribution} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={(e) => e.type}>
                    {distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : noData}
          </div>
        </div>

        {/* Activity by zone */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-lg text-foreground mb-6">Activity by Zone</h3>
          {byZone.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byZone}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="zone" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="count" fill="#2E8B57" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : noData}
        </div>
      </div>
    </div>
  );
}

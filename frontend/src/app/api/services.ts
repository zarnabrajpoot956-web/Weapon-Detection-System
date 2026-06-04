import { api } from './client';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface UserMe {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface UserOut {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface UserUpdate {
  email?: string;
  role?: string;
  is_active?: boolean;
  password?: string;
}

export interface DashboardStats {
  total_incidents: number;
  total_cameras: number;
  active_cameras: number;
  alerts_today: number;
  resolved_cases: number;
  total_detections: number;
  incident_change_pct: number;
  camera_utilization: number;
  resolution_rate: number;
}

export interface WeeklyIncident {
  day: string;
  incidents: number;
  resolved: number;
}

export interface IncidentOut {
  id: number;
  incident_code: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  incident_type: string | null;
  camera_id: number | null;
  detection_id: number | null;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  camera: { id: number; name: string; zone: string | null } | null;
  assigned_user: { id: number; username: string } | null;
}

export interface IncidentCreate {
  title: string;
  description?: string;
  severity?: string;
  incident_type?: string;
  camera_id?: number;
  assigned_to?: number;
}

export interface IncidentUpdate {
  title?: string;
  description?: string;
  severity?: string;
  status?: string;
  incident_type?: string;
  assigned_to?: number;
}

export interface RecordingOut {
  id: number;
  camera_id: number;
  file_path: string;
  file_size: number | null;
  duration: number | null;
  started_at: string;
  ended_at: string | null;
  has_alert: boolean;
  label_tags: string | null;
  camera: { id: number; name: string; zone: string | null } | null;
}

export interface CameraOut {
  id: number;
  name: string;
  location: string | null;
  zone: string | null;
  rtsp_url: string | null;
  is_active: boolean;
  added_at: string;
}

export interface AlertOut {
  id: number;
  detection_id: number | null;
  camera_id: number | null;
  severity: string;
  message: string;
  is_read: boolean;
  sent_at: string;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (username: string, password: string) => {
    const form = new URLSearchParams({ username, password });
    return api.postForm<AuthToken>('/api/auth/login', form);
  },
  me: () => api.get<UserMe>('/api/auth/me'),
  register: (data: UserCreate) => api.post<UserMe>('/api/auth/register', data),
};

// ── Analytics ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  dashboard: () => api.get<DashboardStats>('/api/analytics/dashboard'),
  weeklyIncidents: (weeks = 1) =>
    api.get<WeeklyIncident[]>(`/api/analytics/weekly-incidents?weeks=${weeks}`),
  hourlyActivity: () => api.get<{ hour: string; count: number }[]>('/api/analytics/hourly-activity'),
  incidentDistribution: () =>
    api.get<{ type: string; count: number }[]>('/api/analytics/incident-distribution'),
  activityByZone: () =>
    api.get<{ zone: string; count: number }[]>('/api/analytics/activity-by-zone'),
  threatTrends: (hours = 24) =>
    api.get<{ hour: string; low: number; medium: number; high: number; critical: number }[]>(
      `/api/analytics/threat-trends?hours=${hours}`
    ),
  detectionStats: () =>
    api.get<{ total: number; by_label: { label: string; count: number }[] }>(
      '/api/analytics/detection-stats'
    ),
};

// ── Incidents ────────────────────────────────────────────────────────────────

export const incidentsApi = {
  list: (params?: { status?: string; severity?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.status)   q.set('status',   params.status);
    if (params?.severity) q.set('severity', params.severity);
    if (params?.limit)    q.set('limit',    String(params.limit));
    if (params?.offset)   q.set('offset',   String(params.offset));
    return api.get<IncidentOut[]>(`/api/incidents/?${q}`);
  },
  stats: () => api.get<Record<string, unknown>>('/api/incidents/stats'),
  get:    (id: number) => api.get<IncidentOut>(`/api/incidents/${id}`),
  create: (data: IncidentCreate) => api.post<IncidentOut>('/api/incidents/', data),
  update: (id: number, data: IncidentUpdate) => api.put<IncidentOut>(`/api/incidents/${id}`, data),
  resolve: (id: number) => api.put<{ detail: string }>(`/api/incidents/${id}/resolve`),
  delete:  (id: number) => api.delete<{ detail: string }>(`/api/incidents/${id}`),
};

// ── Recordings ───────────────────────────────────────────────────────────────

export const recordingsApi = {
  list: (params?: { camera_id?: number; has_alert?: boolean; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.camera_id !== undefined) q.set('camera_id', String(params.camera_id));
    if (params?.has_alert !== undefined) q.set('has_alert', String(params.has_alert));
    if (params?.limit)                   q.set('limit',     String(params.limit));
    return api.get<RecordingOut[]>(`/api/recordings/?${q}`);
  },
  get:    (id: number) => api.get<RecordingOut>(`/api/recordings/${id}`),
  delete: (id: number) => api.delete<{ detail: string }>(`/api/recordings/${id}`),
};

// ── Cameras ───────────────────────────────────────────────────────────────────

export const camerasApi = {
  list: () => api.get<CameraOut[]>('/api/cameras/'),
  get:  (id: number) => api.get<CameraOut>(`/api/cameras/${id}`),
};

// ── Alerts ───────────────────────────────────────────────────────────────────

export const alertsApi = {
  list:  () => api.get<AlertOut[]>('/api/alerts/'),
  read:  (id: number) => api.put<AlertOut>(`/api/alerts/${id}/read`),
  clear: () => api.delete<{ detail: string }>('/api/alerts/'),
};

// ── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  list:   () => api.get<UserOut[]>('/api/users/'),
  get:    (id: number) => api.get<UserOut>(`/api/users/${id}`),
  create: (data: UserCreate) => api.post<UserOut>('/api/users/', data),
  update: (id: number, data: UserUpdate) => api.put<UserOut>(`/api/users/${id}`, data),
  delete: (id: number) => api.delete<{ detail: string }>(`/api/users/${id}`),
};

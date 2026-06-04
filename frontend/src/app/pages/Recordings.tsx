import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Video, Download, Eye, X, AlertTriangle } from 'lucide-react';
import { recordingsApi, RecordingOut } from '../api/services';

const getSeverityColor = (hasAlert: boolean) =>
  hasAlert
    ? 'border-destructive text-destructive bg-destructive/10'
    : 'border-primary text-primary bg-primary/10';

const formatDuration = (seconds: number | null) => {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
};

export function Recordings() {
  const [recordings, setRecordings] = useState<RecordingOut[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [activeVideo, setActiveVideo] = useState<RecordingOut | null>(null);
  const [videoUrl, setVideoUrl]       = useState<string>('');
  const [videoLoading, setVideoLoading] = useState(false);

  const backendUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    recordingsApi.list({ limit: 50 })
      .then((data) => setRecordings(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = (recId: number) => {
    window.open(`${backendUrl}/api/recordings/${recId}/download`, '_blank');
  };

  const handleViewClip = async (rec: RecordingOut) => {
    setActiveVideo(rec);
    setVideoLoading(true);
    setVideoUrl('');

    const downloadUrl = `${backendUrl}/api/recordings/${rec.id}/download`;

    try {
      // Follow any redirect (e.g. fallback to test video) and get the final URL
      const res = await fetch(downloadUrl, { method: 'GET', redirect: 'follow' });
      setVideoUrl(res.url);
    } catch {
      // If fetch itself fails, point the video tag directly at the endpoint
      setVideoUrl(downloadUrl);
    } finally {
      setVideoLoading(false);
    }
  };

  const handleClose = () => {
    setActiveVideo(null);
    setVideoUrl('');
  };

  return (
    <div className="flex-1 flex flex-col relative">
      <Header title="Recordings" subtitle="Real-time surveillance monitoring" />

      <div className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl text-foreground mb-1">Archived Recordings</h3>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading…' : `${recordings.length} recordings available`}
            </p>
          </div>
          <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center gap-2 transition-colors">
            <Download className="w-4 h-4" />
            Export All
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse">
            Loading recordings…
          </div>
        ) : recordings.length === 0 ? (
          <div className="flex items-center justify-center h-64 bg-card rounded-xl border border-border text-muted-foreground text-sm">
            No recordings found
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {recordings.map((rec) => (
              <div
                key={rec.id}
                className={`bg-card rounded-xl border overflow-hidden transition-all duration-200 ${
                  rec.has_alert ? 'border-destructive/50 ring-1 ring-destructive/20' : 'border-border'
                }`}
              >
                <div className="relative">
                  <span className={`absolute top-3 left-3 px-2 py-1 rounded text-xs border font-semibold tracking-wider z-10 ${getSeverityColor(rec.has_alert)}`}>
                    {rec.has_alert ? '🚨 ALERT TRIGGERED' : 'NORMAL'}
                  </span>

                  <div className="bg-muted h-48 flex flex-col items-center justify-center relative">
                    {rec.has_alert ? (
                      <div className="flex flex-col items-center">
                        <AlertTriangle className="w-16 h-16 text-destructive animate-pulse" />
                        {rec.label_tags && (
                          <span className="text-xs bg-destructive text-white px-2 py-0.5 rounded-full font-medium mt-1">
                            {rec.label_tags} Detected
                          </span>
                        )}
                      </div>
                    ) : (
                      <Video className="w-16 h-16 text-muted-foreground/50" />
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-foreground/90 rounded text-xs text-white font-mono">
                    {formatDuration(rec.duration)}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Recording ID</p>
                    <p className="text-sm text-foreground font-mono">REC-{String(rec.id).padStart(3, '0')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Timestamp</p>
                    <p className="text-sm text-foreground">
                      {rec.started_at ? new Date(rec.started_at).toLocaleString() : 'No timestamp'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Location</p>
                    <p className="text-sm text-foreground">
                      {rec.camera
                        ? `${rec.camera.name}${rec.camera.zone ? ` - ${rec.camera.zone}` : ''}`
                        : '—'}
                    </p>
                  </div>
                  {rec.label_tags && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Detected Objects</p>
                      <p className="text-sm text-destructive font-medium capitalize">{rec.label_tags}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleViewClip(rec)}
                      className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View Clip
                    </button>
                    <button
                      onClick={() => handleDownload(rec.id)}
                      className="p-2 hover:bg-muted border border-border rounded-lg transition-colors"
                      title="Download Clip"
                    >
                      <Download className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Video Modal ── */}
      {activeVideo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-3xl rounded-xl border border-border overflow-hidden relative shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h4 className="text-md font-semibold text-foreground">
                  Viewing Recording: REC-{String(activeVideo.id).padStart(3, '0')}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {activeVideo.started_at
                    ? new Date(activeVideo.started_at).toLocaleString()
                    : 'No timestamp'}{' '}
                  | Camera: {activeVideo.camera ? activeVideo.camera.name : 'Unknown'}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Video player */}
            <div className="bg-black aspect-video flex items-center justify-center">
              {videoLoading ? (
                <p className="text-white text-sm animate-pulse">Loading video…</p>
              ) : videoUrl ? (
                <video
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full max-h-[60vh] object-contain"
                  onError={(e) => console.error("[DIAGNOSTIC] Video playback error:", e)}
                />
              ) : (
                <p className="text-white/50 text-sm">Video unavailable</p>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-muted/30 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                File size: {activeVideo.file_size ? `${activeVideo.file_size.toFixed(2)} MB` : 'Unknown'}
              </span>
              <button
                onClick={() => handleDownload(activeVideo.id)}
                className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center gap-1.5 transition-colors text-xs font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Download Video
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
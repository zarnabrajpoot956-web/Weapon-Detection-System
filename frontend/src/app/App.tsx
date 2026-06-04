import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Recordings } from './pages/Recordings';
import { Incidents } from './pages/Incidents';
import { Users } from './pages/Users';
import { Analytics } from './pages/Analytics';
import { Sidebar } from './components/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="size-full flex bg-background">
      <Sidebar />
      {children}
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex-1 flex items-center justify-center text-muted-foreground animate-pulse">Loading…</div>;
  if (!user)   return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"      element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard"  element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/recordings" element={<ProtectedRoute><AppLayout><Recordings /></AppLayout></ProtectedRoute>} />
        <Route path="/incidents"  element={<ProtectedRoute><AppLayout><Incidents /></AppLayout></ProtectedRoute>} />
        <Route path="/analytics"  element={<ProtectedRoute><AppLayout><Analytics /></AppLayout></ProtectedRoute>} />
        <Route path="/users"      element={<ProtectedRoute><AppLayout><Users /></AppLayout></ProtectedRoute>} />
        <Route path="*"           element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

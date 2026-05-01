import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { AppShell } from "@/components/layout/AppShell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import SiteReport from "./pages/SiteReport";
import MyQuotes from "./pages/MyQuotes";
import MySiteReports from "./pages/MySiteReports";
import Scaffolders from "./pages/Scaffolders";
import Regions from "./pages/Regions";
import NotificationsPage from "./pages/NotificationsPage";
import AuditLog from "./pages/AuditLog";
import SettingsPage from "./pages/SettingsPage";
import OwnerOnboarding from "./pages/OwnerOnboarding";
import OwnerJobHome from "./pages/OwnerJobHome";
import InviteRedeem from "./pages/InviteRedeem";
import NotFound from "./pages/NotFound";
import AdminSettings from "./pages/AdminSettings";

const queryClient = new QueryClient();

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && role && !roles.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function OwnerRedirect() {
  const { role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (role === "owner") return <Navigate to="/my-job" replace />;
  return <Dashboard />;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  if (!user) {
    return (
      <Routes>
        <Route path="/invite/:token" element={<InviteRedeem />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<ProtectedRoute><OwnerRedirect /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
        <Route path="/jobs/:id/report" element={<ProtectedRoute><SiteReport /></ProtectedRoute>} />
        <Route path="/my-job" element={<ProtectedRoute roles={["owner"]}><OwnerJobHome /></ProtectedRoute>} />
        <Route path="/new-job" element={<ProtectedRoute roles={["owner", "admin"]}><OwnerOnboarding /></ProtectedRoute>} />
        <Route path="/onboarding/:jobId" element={<ProtectedRoute><OwnerOnboarding /></ProtectedRoute>} />
        <Route path="/invite/:token" element={<InviteRedeem />} />
        <Route path="/my-quotes" element={<ProtectedRoute roles={["scaffolder"]}><MyQuotes /></ProtectedRoute>} />
        <Route path="/site-reports" element={<ProtectedRoute roles={["engineer"]}><MySiteReports /></ProtectedRoute>} />
        <Route path="/scaffolders" element={<ProtectedRoute roles={["admin"]}><Scaffolders /></ProtectedRoute>} />
        <Route path="/regions" element={<ProtectedRoute roles={["admin"]}><Regions /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute roles={["admin"]}><AuditLog /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute roles={["admin"]}><AdminSettings /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

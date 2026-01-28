import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { InvoicesProvider } from "@/hooks/useInvoices";
import Index from "./pages/Index";
import Reports from "./pages/Reports";
import ReportBuilder from "./pages/ReportBuilder";
import ReportTemplates from "./pages/ReportTemplates";
import Productivity from "./pages/Productivity";

import Settings from "./pages/Settings";
import AIPage from "./pages/AIPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InvoicesProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/new" element={<ReportBuilder />} />
              <Route path="/reports/templates" element={<ReportTemplates />} />
              <Route path="/reports/:id" element={<ReportBuilder />} />
              <Route path="/productivity" element={<Productivity />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/:tab" element={<Settings />} />
              <Route path="/ai" element={<AIPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </InvoicesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

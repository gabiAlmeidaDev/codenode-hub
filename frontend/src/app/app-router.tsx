import { Routes, Route, Navigate } from "react-router-dom";

import DashboardPage from "@/pages/dashboard/dashboard-page";
import PipelinePage from "@/pages/pipeline/pipeline-page";
import LeadDetailPage from "@/pages/leads/lead-detail-page";
import LeadsPage from "@/pages/leads/leads-page";            // <<< novo
import SettingsPage from "@/pages/settings/settings-page";   // <<< novo

import AppLayout from "@/app/app-layout";

export default function AppRouter() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/leads" element={<LeadsPage />} />          {/* lista de leads */}
        <Route path="/leads/:id" element={<LeadDetailPage />} /> {/* detalhe */}
        <Route path="/settings" element={<SettingsPage />} />    {/* settings */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

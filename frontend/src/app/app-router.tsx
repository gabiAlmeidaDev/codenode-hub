import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/app/app-layout";

import DashboardPage from "@/pages/dashboard/dashboard-page";
import PipelinePage from "@/pages/pipeline/pipeline-page";
import LeadsPage from "@/pages/leads/leads-page";
import LeadDetailPage from "@/pages/leads/lead-detail-page";
import SettingsPage from "@/pages/settings/settings-page";
import FinancePage from "@/pages/finance/finance-page";

export default function AppRouter() {
  console.log('AppRouter renderizando...');
  
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

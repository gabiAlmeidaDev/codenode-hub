
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './app-layout'
import DashboardPage from '@/pages/dashboard/dashboard-page'
import PipelinePage from '@/pages/pipeline/pipeline-page'
import LeadsPage from '@/pages/leads/leads-page'
import LeadDetailPage from '@/pages/leads/lead-detail-page'
import SettingsPage from '@/pages/settings/settings-page'

export default function AppRouter() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PipelinePage from './pages/PipelinePage'
import LeadsPage from './pages/LeadsPage'
import OutreachPage from './pages/OutreachPage'
import SettingsPage from './pages/SettingsPage'
import GmailPage from './pages/GmailPage'
import CalendarPage from './pages/CalendarPage'
import DrivePage from './pages/DrivePage'
import LeadScoringPage from './pages/LeadScoringPage'
import AIInsightsPage from './pages/AIInsightsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/pipeline" element={<PipelinePage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/outreach" element={<OutreachPage />} />
                <Route path="/gmail" element={<GmailPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/drive" element={<DrivePage />} />
                <Route path="/lead-scoring" element={<LeadScoringPage />} />
                <Route path="/ai-insights" element={<AIInsightsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  )
}

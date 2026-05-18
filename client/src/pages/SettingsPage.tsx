import { useState, useEffect } from 'react'
import { Settings, Key, Mail, Calendar, HardDrive, CheckCircle, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'

interface GoogleStatus {
  gmail: boolean
  calendar: boolean
  drive: boolean
}

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      toast.success('Google account connected!')
    } else if (searchParams.get('connected') === 'false') {
      toast.error('Failed to connect Google account')
    }
  }, [searchParams])

  useEffect(() => {
    api.get<GoogleStatus>('/google/status')
      .then(r => setGoogleStatus(r.data))
      .catch(() => setGoogleStatus({ gmail: false, calendar: false, drive: false }))
      .finally(() => setLoading(false))
  }, [])

  const handleConnectGoogle = () => {
    const stored = localStorage.getItem('auth-storage')
    let token = ''
    if (stored) {
      try {
        const { state } = JSON.parse(stored)
        token = state?.token || ''
      } catch {}
    }
    window.location.href = `/api/google/auth?token=${token}`
  }

  const refreshStatus = async () => {
    setLoading(true)
    try {
      const r = await api.get<GoogleStatus>('/google/status')
      setGoogleStatus(r.data)
      toast.success('Status refreshed')
    } catch {
      toast.error('Failed to refresh status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Account */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Account</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
            <p className="text-sm text-gray-900 dark:text-white">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* AI Configuration */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <Key className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">AI Configuration</h2>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Anthropic Claude API</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Using claude-sonnet-4-20250514</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Configured via .env
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Set <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">ANTHROPIC_API_KEY</code> in{' '}
            <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">server/.env</code> to enable AI features.
            Get your key at{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">
              console.anthropic.com
            </a>
          </p>
        </div>
      </div>

      {/* Google Integrations */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">Google Integrations</h2>
          <button
            onClick={refreshStatus}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking status...
            </div>
          ) : (
            <>
              {[
                { key: 'gmail' as const, label: 'Gmail', description: 'Send and read emails', icon: Mail },
                { key: 'calendar' as const, label: 'Google Calendar', description: 'Schedule and view meetings', icon: Calendar },
                { key: 'drive' as const, label: 'Google Drive', description: 'Search and link files', icon: HardDrive },
              ].map(({ key, label, description, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>
                    </div>
                  </div>
                  {googleStatus?.[key] ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" /> Connected
                    </span>
                  ) : (
                    <button
                      onClick={handleConnectGoogle}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 text-xs font-medium rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Connect
                    </button>
                  )}
                </div>
              ))}

              {!googleStatus?.gmail && (
                <div className="mt-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1">Setup required</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Set <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">GOOGLE_CLIENT_ID</code>,{' '}
                    <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">GOOGLE_CLIENT_SECRET</code>, and{' '}
                    <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">GOOGLE_REDIRECT_URI</code> in{' '}
                    <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">server/.env</code>, then click Connect.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* How to get credentials */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Setup Instructions</h2>
        </div>
        <div className="px-6 py-5 space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">1. Anthropic API Key</p>
            <p className="text-xs">Go to <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">console.anthropic.com</a> → API Keys → Create key. Add to <code className="font-mono">server/.env</code></p>
          </div>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">2. Google OAuth</p>
            <ol className="text-xs space-y-1 list-decimal list-inside">
              <li>Go to Google Cloud Console → Create project</li>
              <li>Enable Gmail API, Calendar API, Drive API</li>
              <li>OAuth consent screen → External → Add scopes</li>
              <li>Credentials → Create OAuth 2.0 Client ID (Web app)</li>
              <li>Add <code className="font-mono">http://localhost:3001/api/google/callback</code> as redirect URI</li>
              <li>Copy Client ID and Secret to <code className="font-mono">server/.env</code></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

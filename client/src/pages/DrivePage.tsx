import { useEffect, useState } from 'react'
import { HardDrive, RefreshCw, FileText, Image, Film, Archive, ExternalLink, Loader2 } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime: string
  webViewLink?: string
  iconLink?: string
}

interface DriveStatus {
  connected: boolean
  email?: string
  authUrl?: string
  storageUsed?: string
  storageTotal?: string
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.includes('image')) return <Image className="w-4 h-4 text-green-500" />
  if (mimeType.includes('video')) return <Film className="w-4 h-4 text-purple-500" />
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return <Archive className="w-4 h-4 text-yellow-500" />
  return <FileText className="w-4 h-4 text-blue-500" />
}

export default function DrivePage() {
  const [status, setStatus] = useState<DriveStatus | null>(null)
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const res = await api.get<DriveStatus>('/drive/status')
      setStatus(res.data)
      if (res.data.connected) fetchFiles()
    } catch {
      toast.error('Failed to check Drive status')
    } finally {
      setLoading(false)
    }
  }

  const fetchFiles = async () => {
    setRefreshing(true)
    try {
      const res = await api.get<DriveFile[]>('/drive/files')
      setFiles(res.data)
    } catch {
      toast.error('Failed to fetch files')
    } finally {
      setRefreshing(false)
    }
  }

  const handleConnect = () => {
    const stored = localStorage.getItem('auth-storage')
    let token = ''
    if (stored) {
      try { const { state } = JSON.parse(stored); token = state?.token || '' } catch {}
    }
    window.location.href = `/api/google/auth?token=${token}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    )
  }

  if (!status?.connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 py-20">
        <div className="w-16 h-16 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
          <HardDrive className="w-8 h-8 text-yellow-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Connect Google Drive</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Connect Google Drive to access sales documents, proposals, and contracts from within the CRM.
          </p>
        </div>
        <button
          onClick={handleConnect}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-colors"
        >
          <HardDrive className="w-5 h-5" /> Connect Drive
        </button>
      </div>
    )
  }

  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Connected as <strong>{status.email}</strong>
            {status.storageUsed && <span className="text-gray-400 dark:text-gray-500"> · {status.storageUsed} / {status.storageTotal}</span>}
          </span>
        </div>
        <button
          onClick={fetchFiles}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search files..."
        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{filtered.length} files</span>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">No files found</div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {filtered.map(file => (
              <div key={file.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 group">
                <FileIcon mimeType={file.mimeType} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(file.modifiedTime).toLocaleDateString()}
                    {file.size && ` · ${file.size}`}
                  </p>
                </div>
                {file.webViewLink && (
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-brand-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

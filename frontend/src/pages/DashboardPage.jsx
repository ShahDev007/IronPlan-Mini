import Dashboard from '../components/Dashboard'

export default function DashboardPage({ report, loading }) {
  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="px-6 py-3 bg-white border-b border-slate-200 flex-shrink-0">
        <h1 className="text-base font-semibold text-slate-800">Capital Planning Dashboard</h1>
        <p className="text-xs text-slate-500">
          Replacement cost analysis and condition breakdown
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !report ? (
          <div className="flex items-center justify-center h-64 text-sm text-slate-400">
            No report data available.
          </div>
        ) : (
          <Dashboard report={report} />
        )}
      </div>
    </div>
  )
}

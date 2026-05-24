const NAV = [
  {
    id: 'floorplan',
    label: 'Floor Plan',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 20H5a2 2 0 01-2-2V6a2 2 0 012-2h4m6 16h4a2 2 0 002-2V6a2 2 0 00-2-2h-4m-6 16V4m6 16V4M9 4h6" />
      </svg>
    ),
  },
  {
    id: 'dashboard',
    label: 'Capital Planning',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

export default function Sidebar({ view, onViewChange, report }) {
  const criticalCount = report?.critical_count ?? 0
  const totalCost = report
    ? Number(report.total_replacement_cost).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      })
    : '—'

  return (
    <aside className="w-60 flex-shrink-0 bg-slate-900 text-slate-100 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd"
                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z"
                clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide text-white">IronPlan</p>
            <p className="text-xs text-slate-400 leading-none">Mini</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500 uppercase tracking-widest font-medium">
          Lincoln County Jail
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              view === item.id
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Summary stats */}
      <div className="px-4 py-4 border-t border-slate-700 space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">Facility Summary</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Total Equipment</span>
            <span className="text-xs font-semibold text-white">{report?.total_equipment ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Critical Items</span>
            <span className={`text-xs font-semibold ${criticalCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {report ? criticalCount : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Replacement Cost</span>
            <span className="text-xs font-semibold text-white">{totalCost}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

import ConditionBadge from './ConditionBadge'

function fmt(cost) {
  if (cost == null) return '—'
  return Number(cost).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  )
}

export default function EquipmentPanel({ roomName, items, conditionFilter }) {
  const filtered = conditionFilter
    ? items.filter((e) => e.condition_score === conditionFilter)
    : items

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white">
        <h2 className="text-sm font-semibold text-slate-800 truncate">
          {roomName ?? 'Select a room'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
          {conditionFilter ? ' (filtered)' : ''}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {!roomName && <EmptyState message="Click a room on the floor plan to view its equipment." />}
        {roomName && filtered.length === 0 && (
          <EmptyState message="No equipment matches the current filter." />
        )}
        {filtered.map((eq) => (
          <div key={eq.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-800 leading-snug">{eq.name}</p>
              <ConditionBadge score={eq.condition_score} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5 capitalize">{eq.type.replace(/_/g, ' ')}</p>
            <div className="flex items-center gap-4 mt-2">
              {eq.replacement_cost && (
                <span className="text-xs text-slate-600">
                  <span className="text-slate-400">Cost </span>{fmt(eq.replacement_cost)}
                </span>
              )}
              {eq.last_inspected && (
                <span className="text-xs text-slate-600">
                  <span className="text-slate-400">Inspected </span>
                  {new Date(eq.last_inspected).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
              )}
            </div>
            {eq.manufacturer && (
              <p className="text-xs text-slate-400 mt-1">{eq.manufacturer}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

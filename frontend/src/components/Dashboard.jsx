import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const STAT_CARDS = [
  { key: 'total_equipment',   label: 'Total Equipment',    color: 'text-slate-700',  bg: 'bg-slate-50',  border: 'border-slate-200' },
  { key: 'critical_count',    label: 'Critical',           color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
  { key: 'poor_count',        label: 'Poor',               color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { key: 'fair_count',        label: 'Fair',               color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { key: 'good_count',        label: 'Good',               color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
  { key: 'excellent_count',   label: 'Excellent',          color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200' },
]

function fmt(val) {
  return Number(val).toLocaleString('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  })
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-800 mb-1">{d.room_name}</p>
      <p className="text-slate-600">Replacement Cost: <span className="font-medium">{fmt(d.replacement_cost)}</span></p>
      <p className="text-slate-600">Equipment: <span className="font-medium">{d.equipment_count}</span></p>
      <p className="text-red-600">Critical: <span className="font-medium">{d.critical_count}</span></p>
    </div>
  )
}

export default function Dashboard({ report }) {
  if (!report) return null

  const chartData = report.by_room
    .filter((r) => Number(r.replacement_cost) > 0)
    .sort((a, b) => Number(b.replacement_cost) - Number(a.replacement_cost))

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Condition Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAT_CARDS.map((card) => (
            <div
              key={card.key}
              className={`rounded-lg border p-4 ${card.bg} ${card.border}`}
            >
              <p className="text-xs text-slate-500 font-medium mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>
                {report[card.key] ?? '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Cost summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <p className="text-xs text-slate-500 font-medium mb-1">Total Replacement Cost</p>
          <p className="text-3xl font-bold text-slate-800">{fmt(report.total_replacement_cost)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
          <p className="text-xs text-slate-500 font-medium mb-1">Critical Items Cost (Score ≤ 2)</p>
          <p className="text-3xl font-bold text-red-600">{fmt(report.critical_replacement_cost)}</p>
        </div>
      </div>

      {/* Bar chart */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Replacement Cost by Room
        </h2>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          {chartData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No cost data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 4, right: 16, left: 16, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="room_name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  width={55}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="replacement_cost" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.room_id}
                      fill={entry.critical_count > 0 ? '#ef4444' : '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Has critical items
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> No critical items
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

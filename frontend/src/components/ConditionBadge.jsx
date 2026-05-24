const CONDITION = {
  1: { label: 'Critical',   cls: 'bg-red-100 text-red-700 ring-red-200' },
  2: { label: 'Poor',       cls: 'bg-orange-100 text-orange-700 ring-orange-200' },
  3: { label: 'Fair',       cls: 'bg-yellow-100 text-yellow-700 ring-yellow-200' },
  4: { label: 'Good',       cls: 'bg-green-100 text-green-700 ring-green-200' },
  5: { label: 'Excellent',  cls: 'bg-emerald-100 text-emerald-700 ring-emerald-200' },
}

export default function ConditionBadge({ score }) {
  const meta = CONDITION[score] ?? { label: `Score ${score}`, cls: 'bg-slate-100 text-slate-600 ring-slate-200' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ring-1 ring-inset ${meta.cls}`}>
      {meta.label}
    </span>
  )
}

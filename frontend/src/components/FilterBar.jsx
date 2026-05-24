const FILTERS = [
  { value: null,  label: 'All' },
  { value: 1,     label: 'Critical' },
  { value: 2,     label: 'Poor' },
  { value: 3,     label: 'Fair' },
  { value: 4,     label: 'Good' },
  { value: 5,     label: 'Excellent' },
]

export default function FilterBar({ active, onChange }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-slate-500 font-medium mr-1">Filter:</span>
      {FILTERS.map((f) => (
        <button
          key={String(f.value)}
          onClick={() => onChange(f.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            active === f.value
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

import { useMemo } from 'react'

// Static SVG layout — each entry maps a known room name to its floor plan position.
// room_name values here must match exactly what the seed data inserts into the DB.
const ROOM_SHAPES = [
  // ── Entrance zone ────────────────────────────────────────────────────────
  {
    name: 'Sally Port',
    type: 'sally_port',
    x: 30, y: 28, w: 160, h: 95,
    fill: '#0f5132',
    labelY: 68,
  },
  {
    name: 'Intake',
    type: 'intake',
    x: 210, y: 28, w: 190, h: 95,
    fill: '#78350f',
    labelY: 68,
  },
  // ── Central hub ──────────────────────────────────────────────────────────
  {
    name: 'Control Room',
    type: 'control',
    x: 420, y: 28, w: 195, h: 190,
    fill: '#1e3a8a',
    labelY: 118,
  },
  // ── Cell blocks ──────────────────────────────────────────────────────────
  {
    name: 'Cell Block A',
    type: 'cell_block',
    x: 30, y: 145, w: 230, h: 265,
    fill: '#1e293b',
    labelY: 278,
  },
  {
    name: 'Cell Block B',
    type: 'cell_block',
    x: 635, y: 28, w: 225, h: 265,
    fill: '#1e293b',
    labelY: 160,
  },
  // ── Support rooms ─────────────────────────────────────────────────────────
  {
    name: 'Medical',
    type: 'medical',
    x: 30, y: 432, w: 200, h: 108,
    fill: '#14532d',
    labelY: 488,
  },
  {
    name: 'Visitation',
    type: 'visitation',
    x: 250, y: 240, w: 360, h: 160,
    fill: '#4c1d95',
    labelY: 322,
  },
]

// Thin corridors connecting major zones — purely decorative.
const CORRIDORS = [
  { x: 190, y: 60, w: 20, h: 30 },   // Sally Port → Intake
  { x: 400, y: 60, w: 20, h: 30 },   // Intake → Control Room
  { x: 615, y: 110, w: 20, h: 50 },  // Control Room → Cell Block B
  { x: 420, y: 218, w: 195, h: 22 }, // Control Room → Visitation
  { x: 120, y: 410, w: 40, h: 22 },  // Cell Block A → Medical
]

// Cell grid rendered inside each cell block to give it a realistic look.
function CellGrid({ x, y, w, h }) {
  const cellW = 28
  const cellH = 22
  const cols = Math.floor((w - 20) / cellW)
  const rows = Math.floor((h - 40) / cellH)
  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={x + 10 + c * cellW}
          y={y + 30 + r * cellH}
          width={cellW - 3}
          height={cellH - 3}
          rx={1}
          fill="none"
          stroke="#334155"
          strokeWidth={0.8}
        />
      )
    }
  }
  return <>{cells}</>
}

export default function FloorPlan({ equipment, selectedRoomId, onRoomSelect }) {
  // Build a map: roomName → { roomId, hasCritical }
  const roomMeta = useMemo(() => {
    const map = {}
    for (const eq of equipment) {
      const key = eq.room_name
      if (!map[key]) {
        map[key] = { roomId: eq.room_id, hasCritical: false, count: 0 }
      }
      map[key].count += 1
      if (eq.condition_score <= 2) map[key].hasCritical = true
    }
    return map
  }, [equipment])

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 890 560"
        className="w-full h-auto"
        style={{ maxHeight: '520px' }}
        aria-label="Jail wing floor plan"
      >
        {/* Background */}
        <rect x={0} y={0} width={890} height={560} fill="#0f172a" rx={8} />

        {/* Grid lines (blueprint feel) */}
        {Array.from({ length: 18 }, (_, i) => (
          <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={560}
            stroke="#1e293b" strokeWidth={0.5} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 50} x2={890} y2={i * 50}
            stroke="#1e293b" strokeWidth={0.5} />
        ))}

        {/* Corridors */}
        {CORRIDORS.map((c, i) => (
          <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h}
            fill="#334155" rx={2} />
        ))}

        {/* Rooms */}
        {ROOM_SHAPES.map((room) => {
          const meta = roomMeta[room.name]
          const roomId = meta?.roomId
          const isSelected = roomId && roomId === selectedRoomId
          const hasCritical = meta?.hasCritical
          const isClickable = !!roomId

          return (
            <g
              key={room.name}
              onClick={() => isClickable && onRoomSelect(roomId)}
              style={{ cursor: isClickable ? 'pointer' : 'default' }}
              role="button"
              aria-label={room.name}
            >
              {/* Room fill */}
              <rect
                x={room.x} y={room.y} width={room.w} height={room.h}
                fill={room.fill}
                rx={4}
                opacity={isSelected ? 1 : 0.85}
                className="transition-opacity duration-150"
              />

              {/* Hover / selected border */}
              <rect
                x={room.x} y={room.y} width={room.w} height={room.h}
                fill="transparent"
                rx={4}
                stroke={isSelected ? '#60a5fa' : '#475569'}
                strokeWidth={isSelected ? 2.5 : 1}
                className="hover:stroke-slate-300 transition-colors duration-150"
              />

              {/* Cell grid inside cell blocks */}
              {room.type === 'cell_block' && (
                <CellGrid x={room.x} y={room.y} w={room.w} h={room.h} />
              )}

              {/* Room label */}
              <text
                x={room.x + room.w / 2}
                y={room.labelY}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize={12}
                fontWeight={600}
                fontFamily="Inter, system-ui, sans-serif"
                letterSpacing={0.3}
              >
                {room.name}
              </text>

              {/* Equipment count badge */}
              {meta && (
                <text
                  x={room.x + room.w / 2}
                  y={room.labelY + 16}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={10}
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {meta.count} item{meta.count !== 1 ? 's' : ''}
                </text>
              )}

              {/* Critical indicator dot */}
              {hasCritical && (
                <circle
                  cx={room.x + room.w - 12}
                  cy={room.y + 12}
                  r={5}
                  fill="#ef4444"
                >
                  <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Selected highlight overlay */}
              {isSelected && (
                <rect
                  x={room.x} y={room.y} width={room.w} height={room.h}
                  fill="#60a5fa"
                  fillOpacity={0.08}
                  rx={4}
                />
              )}
            </g>
          )
        })}

        {/* Legend */}
        <g transform="translate(30, 530)">
          <circle cx={6} cy={6} r={5} fill="#ef4444" />
          <text x={16} y={10} fill="#94a3b8" fontSize={10} fontFamily="Inter, system-ui, sans-serif">
            Critical equipment
          </text>
          <rect x={120} y={1} width={10} height={10} fill="#60a5fa" fillOpacity={0.3}
            stroke="#60a5fa" strokeWidth={1.5} rx={1} />
          <text x={134} y={10} fill="#94a3b8" fontSize={10} fontFamily="Inter, system-ui, sans-serif">
            Selected room
          </text>
        </g>
      </svg>
    </div>
  )
}

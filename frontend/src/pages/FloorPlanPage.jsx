import { useMemo } from 'react'
import FloorPlan from '../components/FloorPlan'
import EquipmentPanel from '../components/EquipmentPanel'
import FilterBar from '../components/FilterBar'
import CsvUpload from '../components/CsvUpload'

export default function FloorPlanPage({
  equipment,
  selectedRoomId,
  onRoomSelect,
  conditionFilter,
  onConditionFilter,
  loading,
  onUploadSuccess,
}) {
  // Derive selected room's name and its equipment list from the flat equipment array.
  const selectedRoom = useMemo(() => {
    if (!selectedRoomId) return null
    const first = equipment.find((e) => e.room_id === selectedRoomId)
    return first ? { id: selectedRoomId, name: first.room_name } : null
  }, [selectedRoomId, equipment])

  const roomEquipment = useMemo(
    () => (selectedRoomId ? equipment.filter((e) => e.room_id === selectedRoomId) : []),
    [selectedRoomId, equipment]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-slate-800">Wing A — Floor Plan</h1>
          <p className="text-xs text-slate-500">Click a room to view its equipment</p>
        </div>
        <FilterBar active={conditionFilter} onChange={onConditionFilter} />
      </div>

      {/* Main content: floor plan + side panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Floor plan area */}
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-5">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <FloorPlan
              equipment={equipment}
              selectedRoomId={selectedRoomId}
              onRoomSelect={onRoomSelect}
            />
          )}

          {/* CSV Upload */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3">
              Import Equipment CSV
            </p>
            <CsvUpload onSuccess={onUploadSuccess} />
          </div>
        </div>

        {/* Equipment side panel */}
        <aside className="w-80 flex-shrink-0 border-l border-slate-200 bg-white overflow-hidden flex flex-col">
          <EquipmentPanel
            roomName={selectedRoom?.name}
            items={roomEquipment}
            conditionFilter={conditionFilter}
          />
        </aside>
      </div>
    </div>
  )
}

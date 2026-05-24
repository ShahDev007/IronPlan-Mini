import { useState, useEffect } from 'react'
import { fetchFacilityEquipment, fetchFacilityReport } from './api'
import Sidebar from './components/Sidebar'
import FloorPlanPage from './pages/FloorPlanPage'
import DashboardPage from './pages/DashboardPage'

const FACILITY_ID = import.meta.env.VITE_FACILITY_ID

export default function App() {
  const [view, setView] = useState('floorplan')
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [equipment, setEquipment] = useState([])
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [conditionFilter, setConditionFilter] = useState(null)

  const loadData = () => {
    if (!FACILITY_ID) {
      setError('VITE_FACILITY_ID is not set. Add it to your .env.local file.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    Promise.all([
      fetchFacilityEquipment(FACILITY_ID),
      fetchFacilityReport(FACILITY_ID),
    ])
      .then(([eq, rpt]) => {
        setEquipment(eq)
        setReport(rpt)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar view={view} onViewChange={setView} report={report} />
      <main className="flex-1 overflow-auto">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6 max-w-md text-sm">
              <p className="font-semibold mb-1">Connection Error</p>
              <p>{error}</p>
            </div>
          </div>
        ) : view === 'floorplan' ? (
          <FloorPlanPage
            equipment={equipment}
            selectedRoomId={selectedRoomId}
            onRoomSelect={setSelectedRoomId}
            conditionFilter={conditionFilter}
            onConditionFilter={setConditionFilter}
            loading={loading}
            onUploadSuccess={loadData}
          />
        ) : (
          <DashboardPage report={report} loading={loading} />
        )}
      </main>
    </div>
  )
}

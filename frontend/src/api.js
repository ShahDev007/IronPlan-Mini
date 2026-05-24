const BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${body}`)
  }
  return res.json()
}

export const fetchFacilityEquipment = (facilityId) =>
  request(`/facilities/${facilityId}/equipment`)

export const fetchFacilityReport = (facilityId) =>
  request(`/facilities/${facilityId}/report`)

export const fetchRoomEquipment = (roomId) =>
  request(`/rooms/${roomId}/equipment`)

export async function uploadEquipmentCsv(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/equipment/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status}: ${body}`)
  }
  return res.json()
}

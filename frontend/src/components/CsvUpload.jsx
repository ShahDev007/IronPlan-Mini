import { useRef, useState } from 'react'
import { uploadEquipmentCsv } from '../api'

export default function CsvUpload({ onSuccess }) {
  const inputRef = useRef(null)
  const [status, setStatus] = useState(null) // null | 'uploading' | 'success' | 'error'
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleFile = async (file) => {
    if (!file) return
    setStatus('uploading')
    setResult(null)
    setErrorMsg('')

    try {
      const data = await uploadEquipmentCsv(file)
      setResult(data)
      setStatus('success')
      if (onSuccess) onSuccess()
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  const handleChange = (e) => handleFile(e.target.files[0])

  const handleDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
        <svg className="w-6 h-6 text-slate-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-xs text-slate-500">
          {status === 'uploading' ? 'Uploading…' : 'Drop CSV or click to browse'}
        </p>
      </div>

      {/* Success result */}
      {status === 'success' && result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800 space-y-1">
          <p className="font-semibold">Upload complete</p>
          <p>{result.rows_inserted} inserted · {result.rows_skipped} skipped</p>
          {result.errors?.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-green-700">
              {result.errors.map((e, i) => <li key={i}>⚠ {e}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
          <p className="font-semibold">Upload failed</p>
          <p>{errorMsg}</p>
        </div>
      )}
    </div>
  )
}

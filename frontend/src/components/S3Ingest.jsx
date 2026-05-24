import { useState } from 'react'
import { ingestFromS3 } from '../api'

export default function S3Ingest({ onSuccess }) {
  const [s3Key, setS3Key] = useState('')
  const [status, setStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleIngest = async () => {
    const key = s3Key.trim()
    if (!key) return
    setStatus('loading')
    setResult(null)
    setErrorMsg('')
    try {
      const data = await ingestFromS3(key)
      setResult(data)
      setStatus('success')
      if (onSuccess) onSuccess()
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={s3Key}
          onChange={(e) => setS3Key(e.target.value)}
          placeholder="S3 key, e.g. uploads/lincoln_county.csv"
          className="flex-1 text-xs border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && handleIngest()}
        />
        <button
          onClick={handleIngest}
          disabled={status === 'loading' || !s3Key.trim()}
          className="px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'loading' ? 'Importing…' : 'Import'}
        </button>
      </div>

      {status === 'success' && result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800 space-y-1">
          <p className="font-semibold">Import complete</p>
          <p>{result.rows_inserted} inserted · {result.rows_skipped} skipped</p>
          {result.errors?.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-green-700">
              {result.errors.map((e, i) => <li key={i}>⚠ {e}</li>)}
            </ul>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
          <p className="font-semibold">Import failed</p>
          <p>{errorMsg}</p>
        </div>
      )}
    </div>
  )
}

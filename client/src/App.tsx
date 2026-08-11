import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

interface HealthResponse {
  status: string
  service: string
}

function App() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [healthData, setHealthData] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async () => {
    setLoading(true)
    setError(null)
    setHealthData(null)
    try {
      const res = await fetch('/api/health')
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`)
      }
      const data: HealthResponse = await res.json()
      setHealthData(data)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to check health status')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section id="center">

        <div className="d-flex flex-column align-items-center gap-2 mb-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={checkHealth}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Check System'}
          </button>

          {loading && (
            <div className="alert alert-info py-2 px-3 m-0" role="status">
              Loading...
            </div>
          )}

          {error && (
            <div className="alert alert-danger py-2 px-3 m-0" role="alert">
              Error: {error}
            </div>
          )}

          {healthData && (
            <div className="alert alert-success py-2 px-3 m-0" role="alert">
              Success: {healthData.status} ({healthData.service})
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default App

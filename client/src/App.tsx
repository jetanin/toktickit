import { useState } from 'react'
import './App.css'

interface HealthResponse {
  status: string
  service: string
}

interface Category {
  id: number
  name: string
}

function App() {
  const [loading, setLoading] = useState(false)
  const [healthData, setHealthData] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  const checkHealth = async () => {
    setLoading(true)
    setError(null)
    setHealthData(null)
    setCategories([])
    try {
      const [healthRes, categoriesRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/categories'),
      ])

      if (!healthRes.ok) {
        throw new Error(`Unable to connect to the server. Please try again later. Status: ${healthRes.status}`)
      }
      if (!categoriesRes.ok) {
        throw new Error(`Unable to fetch categories. Status: ${categoriesRes.status}`)
      }

      const healthJson: HealthResponse = await healthRes.json()
      const categoriesJson: Category[] = await categoriesRes.json()

      setHealthData(healthJson)
      setCategories(categoriesJson)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Unable to connect to TokTickIT API')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section id="center">

        <div className="d-flex flex-column align-items-center gap-2 mb-3">
          <h1>TokTickIT IT Service Desk</h1>
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

          {categories.length > 0 && (
            <div className="card w-100" style={{ maxWidth: '400px' }}>
              <div className="card-header">
                <strong>Categories</strong>
              </div>
              <ul className="list-group list-group-flush">
                {categories.map((cat) => (
                  <li key={cat.id} className="list-group-item">
                    {cat.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default App

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../../src/App'

const mockCategories = [
  { id: 1, name: 'Account and Access' },
  { id: 2, name: 'Hardware' },
  { id: 3, name: 'Software' },
  { id: 4, name: 'Network' },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

function mockFetchSuccess() {
  vi.spyOn(globalThis, 'fetch').mockImplementation((input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (url.includes('/api/health')) {
      return Promise.resolve(new Response(
        JSON.stringify({ status: 'ok', service: 'TokTickIT API' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ))
    }
    if (url.includes('/api/categories')) {
      return Promise.resolve(new Response(
        JSON.stringify(mockCategories),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ))
    }
    return Promise.reject(new Error('Unknown endpoint'))
  })
}

describe('App – Categories', () => {
  it('displays all categories returned by the API', async () => {
    mockFetchSuccess()

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /check system/i }))

    await waitFor(() => {
      for (const cat of mockCategories) {
        expect(screen.getByText(cat.name)).toBeInTheDocument()
      }
    })
  })

  it('shows an error message when the categories API fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url.includes('/api/health')) {
        return Promise.resolve(new Response(
          JSON.stringify({ status: 'ok', service: 'TokTickIT API' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ))
      }
      // categories returns 500
      return Promise.resolve(new Response('Internal Server Error', { status: 500 }))
    })

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /check system/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/unable to fetch categories/i)
    })
  })

  it('shows an error when a network error occurs', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /check system/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to fetch/i)
    })
  })
})

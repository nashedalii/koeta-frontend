const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.token ?? null
  } catch {
    return null
  }
}

async function parseResponse(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    try {
      return await res.json()
    } catch (err) {
      console.error('Failed to parse JSON response:', err)
      return null
    }
  }
  return null
}

async function getErrorMessage(res: Response): Promise<string> {
  try {
    const contentType = res.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json()
      if (data?.message) return data.message
    }
  } catch {
    // ignore parse error
  }
  return res.statusText || 'Terjadi kesalahan'
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getToken()

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  const method = options.method?.toUpperCase() ?? 'GET'

  const config: RequestInit = {
    ...options,
    method,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  // Jangan kirim body untuk GET
  if (method === 'GET') {
    delete config.body
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config)

    if (res.status === 401) {
      localStorage.removeItem('auth')
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
      return null
    }

    if (res.status === 403) {
      throw new Error('Akses ditolak')
    }

    if (!res.ok) {
      const message = await getErrorMessage(res)
      throw new Error(message)
    }

    return await parseResponse(res)

  } catch (err) {
    if (err instanceof Error && err.message === 'Akses ditolak') throw err
    console.error(`apiFetch error [${method} ${endpoint}]:`, err)
    throw err
  }
}

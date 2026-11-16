export class HttpError<T = unknown> extends Error {
  readonly response: { status: number; data: T }

  constructor(
    response: { status: number; data: T },
    url: string,
  ) {
    super(`HTTP ${response.status}: ${url}`)
    this.name = 'HttpError'
    this.response = response
  }
}

export function isHttpError<T = unknown>(error: unknown): error is HttpError<T> {
  return error instanceof HttpError
}

interface RequestOptions {
  responseType?: 'text'
  signal?: AbortSignal
}

interface ClientOptions {
  baseURL?: string
  timeout?: number
}

export function createHttpClient({
  baseURL = import.meta.env.VITE_API_URL || '',
  timeout = 30_000,
}: ClientOptions = {}) {
  async function request<T>(
    method: 'GET' | 'POST', path: string, body?: BodyInit, options: RequestOptions = {},
  ): Promise<{ data: T }> {
    const url = new URL(`${baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, window.location.origin)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeout)
    const signal = options.signal ? AbortSignal.any([controller.signal, options.signal]) : controller.signal
    try {
      const response = await fetch(url, { method, body, credentials: 'include', signal })
      const text = await response.text()
      // Preserve text/empty responses used by support-email and legacy POST endpoints.
      let data: unknown = text
      if (text && options.responseType !== 'text') {
        try {
          data = JSON.parse(text)
        } catch (error) {
          // Legacy endpoints may return plain text; malformed JSON successes must surface.
          if (!(error instanceof SyntaxError) ||
            (response.ok && response.headers.get('content-type')?.includes('json'))) throw error
        }
      }
      if (!response.ok) throw new HttpError({ status: response.status, data }, url.href)
      return { data: data as T }
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    get: <T = unknown>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
    post: <T = unknown>(path: string, body?: BodyInit, options?: RequestOptions) => request<T>('POST', path, body, options),
  }
}

const client = createHttpClient()

export default client

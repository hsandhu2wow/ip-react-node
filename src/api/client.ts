import axios from 'axios'

/**
 * Axios instance with base URL from VITE_API_URL env var.
 * Dev: Vite proxy forwards /api → http://127.0.0.1:8080
 * Production: /api is served by the Python backend on the same origin.
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // send session cookie with every request
  timeout: 30_000,
})

export default client

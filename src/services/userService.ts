type RegisteredUser = {
  email: string
  role?: 'teacher' | 'student'
  livros?: string[]
}

const GOOGLE_FILE_ID = (import.meta.env.VITE_GOOGLE_FILE_ID as string) || ''
const GOOGLE_API_KEY = (import.meta.env.VITE_GOOGLE_API_KEY as string) || ''
const BOOK_ID = (import.meta.env.VITE_BOOK_ID as string) || ''

const buildGoogleDriveUrl = (fileId?: string, apiKey?: string) => {
  if (!fileId || !apiKey) return null
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${encodeURIComponent(apiKey)}`
}

const extractUsersFromData = (data: any): any[] => {
  if (!data) return []
  if (data.usuarios && Array.isArray(data.usuarios)) return data.usuarios

  if (BOOK_ID && data[BOOK_ID] && Array.isArray(data[BOOK_ID].usuarios)) return data[BOOK_ID].usuarios

  if (BOOK_ID && data.books && data.books[BOOK_ID] && Array.isArray(data.books[BOOK_ID].usuarios)) return data.books[BOOK_ID].usuarios

  if (Array.isArray(data)) return data

  for (const val of Object.values(data)) {
    if (val && typeof val === 'object' && Array.isArray((val as any).usuarios)) return (val as any).usuarios
  }

  return []
}

const loadRemoteUsers = async (): Promise<any[]> => {
  // Require Google Drive file id and api key — no fallback allowed
  const driveUrl = buildGoogleDriveUrl(GOOGLE_FILE_ID, GOOGLE_API_KEY)
  if (!driveUrl) throw new Error('missing Google Drive file id or api key')

  const url = `${driveUrl}&_=${Date.now()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('remote fetch failed (google drive)')

  const data = await res.json()
  return extractUsersFromData(data)
}

export const findUserByEmail = async (email: string): Promise<RegisteredUser | undefined> => {
  const normalizedEmail = (email || '').trim().toLowerCase()
  if (!normalizedEmail) return undefined

  const users: any[] = await loadRemoteUsers()
  if (!users || users.length === 0) return undefined

  if (users.length && typeof users[0] === 'object') {
    const u = (users as any[]).find((user) => (user.email || '').toLowerCase() === normalizedEmail)
    return u as RegisteredUser | undefined
  }

  const found = (users as string[]).find((u) => typeof u === 'string' && u.toLowerCase() === normalizedEmail)
  if (found) return { email: found, role: 'student', livros: [] }
  return undefined
}

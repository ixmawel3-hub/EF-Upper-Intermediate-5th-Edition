import type { Book } from '../models/book'

export const getBooks = async (): Promise<Book[]> => {
  // Dynamically discover PDFs placed under src/assets/books using Vite's glob
  const modules = import.meta.glob('../assets/books/*.pdf', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

  return Object.entries(modules).map(([path, url]) => {
    const parts = path.split('/')
    const filename = parts[parts.length - 1]
    const title = filename.replace(/[-_]/g, ' ').replace(/\.pdf$/i, '')
    return {
      id: filename,
      title,
      url
    }
  })
}

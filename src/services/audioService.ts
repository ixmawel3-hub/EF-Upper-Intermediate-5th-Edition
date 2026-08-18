import type { AudioTrack } from '../models/audio'

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

const audioFiles = import.meta.glob('../assets/audio/**/*.{mp3,m4a,ogg,wav}', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

export function getAudioTracks(bookTitle: string): AudioTrack[] {
  const normalizedBook = normalize(bookTitle)

  return Object.entries(audioFiles)
    .map(([path, url]) => {
      const parts = path.split('/')
      const filename = parts.at(-1) ?? ''
      const unit = parts.at(-2) ?? ''
      const audioBook = parts.at(-3) ?? ''

      return {
        id: path,
        title: filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
        unit,
        url,
        matchesBook: normalize(audioBook) === normalizedBook
      }
    })
    .filter((track) => track.matchesBook)
    .sort((a, b) => a.unit.localeCompare(b.unit, undefined, { numeric: true }) || a.title.localeCompare(b.title, undefined, { numeric: true }))
    .map(({ matchesBook: _, ...track }) => track)
}

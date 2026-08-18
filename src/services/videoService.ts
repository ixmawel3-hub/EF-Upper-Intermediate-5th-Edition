import type { VideoTrack } from '../models/video'

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

const videoFiles = import.meta.glob('../assets/video/**/*.{mp4,webm,ogg,m4v}', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

export function getVideoTracks(bookTitle: string): VideoTrack[] {
  const normalizedBook = normalize(bookTitle)

  return Object.entries(videoFiles)
    .map(([path, url]) => {
      const parts = path.split('/')
      const filename = parts.at(-1) ?? ''
      const book = parts[3] ?? ''
      const group = parts[4] ?? ''
      const isEpisode = normalize(group) === 'episodes' || normalize(group) === 'files'

      return {
        id: path,
        title: filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
        group,
        unit: isEpisode ? parts[5] : undefined,
        url,
        matchesBook: normalize(book) === normalizedBook
      }
    })
    .filter((track) => track.matchesBook)
    .sort((a, b) => a.group.localeCompare(b.group) || (a.unit ?? '').localeCompare(b.unit ?? '', undefined, { numeric: true }) || a.title.localeCompare(b.title, undefined, { numeric: true }))
    .map(({ matchesBook: _, ...track }) => track)
}

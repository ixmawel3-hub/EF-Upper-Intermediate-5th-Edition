const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

const subtitleFiles = import.meta.glob('../assets/**/*.vtt', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

function basenameFromUrl(url: string) {
  try {
    const u = new URL(url, location.href)
    const parts = u.pathname.split('/')
    const name = parts.at(-1) ?? ''
    return name.replace(/\.[^.]+$/, '')
  } catch {
    // fallback for relative paths
    const parts = url.split('/')
    const name = parts.at(-1) ?? ''
    return name.replace(/\.[^.]+$/, '')
  }
}

export function findSubtitleForMediaUrl(mediaUrlOrPath: string): string | null {
  // mediaUrlOrPath can be either the served URL (e.g. /assets/xxx.mp3) or the module path key from import.meta.glob (e.g. '../assets/audio/.../1.2.mp3')
  // Prefer subtitles in the same source folder as the module path when available.
  const entries = Object.entries(subtitleFiles).map(([path, url]) => {
    const rel = path.replace(/^.*assets\//, '')
    const dir = rel.includes('/') ? rel.substring(0, rel.lastIndexOf('/')) : ''
    const filename = rel.includes('/') ? rel.substring(rel.lastIndexOf('/') + 1) : rel
    const name = filename.replace(/\.[^.]+$/, '')
    return { path, url, rel, dir, name }
  })

  const normalizePath = (s: string) => s.replace(/\\/g, '/').replace(/^(?:\.\.\/)+/, '').toLowerCase()

  const tryFromModulePath = (mp: string) => {
    if (!mp.includes('assets')) return null
    const rel = mp.replace(/^.*assets\//, '')
    const dir = rel.includes('/') ? rel.substring(0, rel.lastIndexOf('/')) : ''
    const filename = rel.includes('/') ? rel.substring(rel.lastIndexOf('/') + 1) : rel
    const name = filename.replace(/\.[^.]+$/, '')
    const normalized = normalize(name)
    const same = entries.find((e) => normalize(e.name) === normalized && normalizePath(e.dir) === normalizePath(dir))
    return same ? same.url : null
  }

  // if caller passed a module path (import.meta.glob key), try to resolve by that
  const modAttempt = tryFromModulePath(mediaUrlOrPath)
  if (modAttempt) return modAttempt

  // otherwise try to parse as a served URL
  const basename = basenameFromUrl(mediaUrlOrPath)
  const normalized = normalize(basename)
  const relFromUrl = (url: string) => {
    try {
      const u = new URL(url, location.href)
      const p = u.pathname
      const idx = p.indexOf('/assets/')
      if (idx === -1) return null
      return p.slice(idx + '/assets/'.length)
    } catch {
      return null
    }
  }

  const mediaRel = relFromUrl(mediaUrlOrPath)
  const mediaDir = mediaRel ? mediaRel.substring(0, Math.max(0, mediaRel.lastIndexOf('/'))) : null

  if (mediaDir) {
    const same = entries.find((e) => normalize(e.name) === normalized && normalizePath(e.dir) === normalizePath(mediaDir))
    if (same) return same.url
  }

  const any = entries.find((e) => normalize(e.name) === normalized)
  return any ? any.url : null
}

export function findSubtitleForName(name: string): string | null {
  const normalized = normalize(name)

  for (const path in subtitleFiles) {
    const parts = path.split('/')
    const filename = parts.at(-1) ?? ''
    const nm = filename.replace(/\.[^.]+$/, '')
    if (normalize(nm) === normalized) return subtitleFiles[path]
  }

  return null
}

export default { findSubtitleForMediaUrl, findSubtitleForName }

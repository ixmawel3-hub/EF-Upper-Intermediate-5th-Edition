import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Divider, Drawer, FormControl, IconButton, InputLabel, List, ListItemButton, ListItemIcon, ListItemText, MenuItem, Select, Slider, Stack, Tooltip, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption'
import type { AudioTrack } from '../models/audio'
import { getAudioTracks } from '../services/audioService'
import { findSubtitleForMediaUrl, findSubtitleForName } from '../services/subtitleService'

type Props = { bookTitle: string; onClose: () => void }

const formatTime = (seconds: number) => Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}` : '0:00'

export default function AudioPanel({ bookTitle, onClose }: Props) {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('sm'))
  const tracks = useMemo(() => getAudioTracks(bookTitle), [bookTitle])
  const units = useMemo(() => [...new Set(tracks.map((track) => track.unit))], [tracks])
  const [unit, setUnit] = useState(units[0] ?? '')
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [rate, setRate] = useState(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [captionsEnabled, setCaptionsEnabled] = useState(false)
  const [captionText, setCaptionText] = useState('')
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null)
  const [cues, setCues] = useState<Array<{start: number; end: number; text: string}>>([])
  const unitTracks = tracks.filter((track) => track.unit === unit)

  useEffect(() => {
    setCaptionText('')
    setSubtitleUrl(null)
    if (!selectedTrack) return
    const found = findSubtitleForMediaUrl(selectedTrack.id ?? selectedTrack.url) ?? findSubtitleForName(selectedTrack.title)
    setSubtitleUrl(found)
  }, [selectedTrack])

  useEffect(() => {
    setCues([])
    if (!subtitleUrl) return
    let cancelled = false
    const parseTimestamp = (s: string) => {
      const t = s.trim().replace(',', '.')
      const parts = t.split(':').map((p) => Number(p))
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
      if (parts.length === 2) return parts[0] * 60 + parts[1]
      return 0
    }

    fetch(subtitleUrl)
      .then((r) => r.text())
      .then((txt) => {
        if (cancelled) return
        const lines = txt.replace(/\r/g, '').split('\n')
        const out: Array<{start: number; end: number; text: string}> = []
        let i = 0
        while (i < lines.length) {
          if (!lines[i].trim()) { i++; continue }
          // optional id
          if (!lines[i].includes('-->')) i++
          if (i >= lines.length) break
          const timingLine = lines[i]
          const m = timingLine.match(/(\d{1,2}:\d{2}:\d{2}[\.,]\d+|\d{1,2}:\d{2}[\.,]\d+)\s*-->\s*(\d{1,2}:\d{2}:\d{2}[\.,]\d+|\d{1,2}:\d{2}[\.,]\d+)/)
          if (!m) { i++; continue }
          const start = parseTimestamp(m[1])
          const end = parseTimestamp(m[2])
          i++
          const textLines: string[] = []
          while (i < lines.length && lines[i].trim()) { textLines.push(lines[i]); i++ }
          out.push({ start, end, text: textLines.join('\n') })
        }
        setCues(out)
      })
      .catch(() => {
        setCues([])
      })
    return () => { cancelled = true }
  }, [subtitleUrl])

  useEffect(() => {
    if (!captionsEnabled) setCaptionText('')
  }, [captionsEnabled])

  const renderCaptionText = (text: string) => {
    if (!text) return null

    type Token = { type: 'text'; content: string } | { type: 'open'; tag: string } | { type: 'close'; tag: string }

    const tokenize = (s: string): Token[] => {
      const tokens: Token[] = []
      const tagRe = /<\/?[a-zA-Z0-9]+(?:\s+[^>]*)?>/g
      let last = 0
      let m: RegExpExecArray | null
      while ((m = tagRe.exec(s)) !== null) {
        if (m.index > last) tokens.push({ type: 'text', content: s.slice(last, m.index) })
        const tag = m[0]
        const close = tag.startsWith('</')
        if (close) {
          const name = tag.replace(/<\//, '').replace(/>/, '').trim().split(/\s+/)[0]
          tokens.push({ type: 'close', tag: name.toLowerCase() })
        } else {
          const name = tag.replace(/</, '').replace(/>/, '').trim().split(/\s+/)[0]
          tokens.push({ type: 'open', tag: name.toLowerCase() })
        }
        last = m.index + m[0].length
      }
      if (last < s.length) tokens.push({ type: 'text', content: s.slice(last) })
      return tokens
    }

    const buildNodes = (tokens: Token[]): any[] => {
      const stack: Array<{ tag: string; children: any[] }> = [{ tag: '__root__', children: [] }]
      for (const t of tokens) {
        if (t.type === 'text') {
          stack[stack.length - 1].children.push(t.content)
        } else if (t.type === 'open') {
          stack.push({ tag: t.tag, children: [] })
        } else if (t.type === 'close') {
          // pop until matching tag
          let node = stack.pop()
          if (!node) continue
          // if tags mismatch, just append and continue
          if (node.tag !== t.tag) {
            // try to find matching opening tag
            let found = false
            for (let i = stack.length - 1; i >= 0; i--) {
              if (stack[i].tag === t.tag) {
                // unwind
                const toCombine = stack.splice(i)
                node = toCombine.shift()!
                // append remaining as text
                for (const rem of toCombine) {
                  node.children.push(...rem.children)
                }
                found = true
                break
              }
            }
            if (!found) {
              // no matching open, treat as text
              stack[stack.length - 1].children.push(`</${t.tag}>`)
              continue
            }
          }
          const elem = renderTag(node.tag, node.children)
          stack[stack.length - 1].children.push(elem)
        }
      }
      return stack[0].children
    }

    const renderTag = (tag: string, children: any[]) => {
      const key = Math.random().toString(36).slice(2, 9)
      switch (tag) {
        case 'b': return <strong key={key}>{children}</strong>
        case 'i': return <em key={key}>{children}</em>
        case 'u': return <u key={key}>{children}</u>
        case 'v': return <span key={key} className="v">{children}</span>
        default: return <span key={key}>{children}</span>
      }
    }

    // process per-line to preserve breaks
    const lines = text.split('\n')
    return (
      <>
        {lines.map((line, idx) => {
          const tokens = tokenize(line)
          const nodes = buildNodes(tokens)
          return <span key={idx}>{nodes}{idx < lines.length - 1 && <br />}</span>
        })}
      </>
    )
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const tts = audio.textTracks
    for (let i = 0; i < tts.length; i++) {
      try { tts[i].mode = captionsEnabled ? 'showing' : 'disabled' } catch {}
    }
  }, [captionsEnabled, subtitleUrl, selectedTrack])

  useEffect(() => { setUnit(units[0] ?? ''); setSelectedTrack(null) }, [bookTitle, units])
  useEffect(() => { const audio = audioRef.current; if (audio) { audio.volume = volume; audio.playbackRate = rate } }, [volume, rate, selectedTrack])

  const selectTrack = (track: AudioTrack) => { setSelectedTrack(track); setCurrentTime(0); setDuration(0); setIsPlaying(true) }
  const togglePlayback = async () => { const audio = audioRef.current; if (!audio || !selectedTrack) return; if (audio.paused) await audio.play(); else audio.pause() }

  return (
    <Drawer variant="persistent" open anchor={compact ? 'bottom' : 'right'} onClose={onClose} slotProps={{ paper: { sx: { width: compact ? '100%' : 360, height: compact ? '62dvh' : '100%', display: 'flex', borderTopLeftRadius: compact ? 16 : 0, borderTopRightRadius: compact ? 16 : 0 } } }}>
      <Stack sx={{ height: '100%' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box><Typography variant="h6">Audio</Typography><Typography variant="caption" color="text.secondary">{bookTitle}</Typography></Box>
          <IconButton onClick={onClose} aria-label="Close audio menu"><CloseIcon /></IconButton>
        </Box>
        <Divider />
        {units.length ? <>
          <FormControl size="small" sx={{ m: 2 }}><InputLabel id="audio-unit-label">Unit</InputLabel><Select labelId="audio-unit-label" label="Unit" value={unit} onChange={(event) => setUnit(event.target.value)} MenuProps={{ disablePortal: true }}>{units.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl>
          <List dense disablePadding sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
            {unitTracks.map((track) => <ListItemButton key={track.id} selected={selectedTrack?.id === track.id} onClick={() => selectTrack(track)} sx={{ borderRadius: 1 }}><ListItemIcon sx={{ minWidth: 32 }}><PlayArrowIcon fontSize="small" /></ListItemIcon><ListItemText primary={<Typography variant="body2" noWrap>{track.title}</Typography>} /></ListItemButton>)}
          </List>
        </> : <Typography color="text.secondary" sx={{ p: 2 }}>No audio files found for this book.</Typography>}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          {captionText && captionsEnabled && <Box sx={{ mb: 1, p: 1, bgcolor: 'rgba(0,0,0,0.75)', color: '#fff', borderRadius: 1 }}>{renderCaptionText(captionText)}</Box>}
          <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', mb: 1 }}>{selectedTrack?.title ?? 'Select an audio track'}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Typography variant="caption">{formatTime(currentTime)}</Typography><Slider size="small" min={0} max={duration || 0} step={0.1} value={currentTime} disabled={!selectedTrack} onChange={(_, value) => { const time = value as number; if (audioRef.current) audioRef.current.currentTime = time; setCurrentTime(time) }} /><Typography variant="caption">{formatTime(duration)}</Typography></Stack>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 1 }}>
            <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
              <span>
                <IconButton color="primary" onClick={togglePlayback} disabled={!selectedTrack}>{isPlaying ? <PauseIcon /> : <PlayArrowIcon />}</IconButton>
              </span>
            </Tooltip>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select value={rate} onChange={(event) => setRate(Number(event.target.value))} MenuProps={{ disablePortal: true }}>{[0.5, 0.75, 1, 1.25, 1.5, 2].map((value) => <MenuItem key={value} value={value}>{value}x</MenuItem>)}</Select>
            </FormControl>
            <VolumeUpIcon fontSize="small" />
            <Slider size="small" min={0} max={1} step={0.05} value={volume} onChange={(_, value) => setVolume(value as number)} sx={{ flex: 1 }} />
            <Tooltip title={captionsEnabled ? 'Disable captions' : 'Enable captions'}>
              <span>
                <IconButton onClick={() => setCaptionsEnabled((s) => !s)} disabled={!selectedTrack} aria-label="Toggle captions">
                  <ClosedCaptionIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
          <audio style={{ display: 'none' }} ref={audioRef} src={selectedTrack?.url} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} onTimeUpdate={(event) => {
              const t = event.currentTarget.currentTime
              setCurrentTime(t)
              if (!captionsEnabled || cues.length === 0) return
              const active = cues.find((c) => t >= c.start && t <= c.end)
              setCaptionText(active ? active.text : '')
            }} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} autoPlay={isPlaying}>
            {subtitleUrl && <track kind="subtitles" src={subtitleUrl} srcLang="en" />}
          </audio>
        </Box>
      </Stack>
    </Drawer>
  )
}

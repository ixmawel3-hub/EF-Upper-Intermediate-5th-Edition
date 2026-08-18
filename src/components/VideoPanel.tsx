import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Divider, Drawer, FormControl, IconButton, InputLabel, List, ListItemButton, ListItemIcon, ListItemText, MenuItem, Select, Slider, Stack, Tooltip, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption'
import type { VideoTrack } from '../models/video'
import { getVideoTracks } from '../services/videoService'
import { findSubtitleForMediaUrl, findSubtitleForName } from '../services/subtitleService'

type Props = { bookTitle: string; onClose: () => void }
const formatTime = (seconds: number) => Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}` : '0:00'

export default function VideoPanel({ bookTitle, onClose }: Props) {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('sm'))
  const tracks = useMemo(() => getVideoTracks(bookTitle), [bookTitle])
  const groups = useMemo(() => [...new Set(tracks.map((track) => track.group))], [tracks])
  const [group, setGroup] = useState(groups[0] ?? '')
  const [unit, setUnit] = useState('')
  const [selectedTrack, setSelectedTrack] = useState<VideoTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [rate, setRate] = useState(1)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const playerRef = useRef<HTMLDivElement | null>(null)
  const [captionsEnabled, setCaptionsEnabled] = useState(false)
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null)
  const groupTracks = tracks.filter((track) => track.group === group)
  const units = [...new Set(groupTracks.map((track) => track.unit).filter(Boolean) as string[])]
  const visibleTracks = units.length ? groupTracks.filter((track) => track.unit === unit) : groupTracks

  useEffect(() => { setGroup(groups[0] ?? ''); setSelectedTrack(null) }, [bookTitle, groups])
  useEffect(() => { setUnit(units[0] ?? ''); setSelectedTrack(null) }, [group])
  useEffect(() => { const video = videoRef.current; if (video) { video.volume = volume; video.playbackRate = rate } }, [volume, rate, selectedTrack])
  const selectTrack = (track: VideoTrack) => { setSelectedTrack(track); setCurrentTime(0); setDuration(0); setIsPlaying(true) }
  const togglePlayback = async () => { const video = videoRef.current; if (!video || !selectedTrack) return; if (video.paused) await video.play(); else video.pause() }
  const toggleFullscreen = () => { const player = playerRef.current; if (!player) return; if (!document.fullscreenElement) player.requestFullscreen().catch(() => {}); else document.exitFullscreen().catch(() => {}) }

  useEffect(() => {
    setSubtitleUrl(null)
    setCaptionsEnabled(false)
    if (!selectedTrack) return
    const found = findSubtitleForMediaUrl(selectedTrack.id ?? selectedTrack.url) ?? findSubtitleForName(selectedTrack.title)
    setSubtitleUrl(found)
  }, [selectedTrack])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const tts = video.textTracks
    for (let i = 0; i < tts.length; i++) {
      try { tts[i].mode = captionsEnabled ? 'showing' : 'disabled' } catch {}
    }
  }, [captionsEnabled, subtitleUrl, selectedTrack])

  return (
    <Drawer variant="persistent" open anchor={compact ? 'bottom' : 'right'} onClose={onClose} slotProps={{ paper: { sx: { width: compact ? '100%' : 420, height: compact ? '76dvh' : '100%', display: 'flex', borderTopLeftRadius: compact ? 16 : 0, borderTopRightRadius: compact ? 16 : 0 } } }}>
      <Stack sx={{ height: '100%' }}>
        <Box sx={{ p: { xs: 1, sm: 2 }, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}><Box><Typography variant="h6">Video</Typography><Typography variant="caption" color="text.secondary">{bookTitle}</Typography></Box><IconButton onClick={onClose} aria-label="Close video menu"><CloseIcon /></IconButton></Box>
        <Divider />
        {groups.length ? <><Stack direction="row" spacing={1} sx={{ p: { xs: 1, sm: 2 }, pb: { xs: 0.5, sm: 1 } }}><FormControl size="small" fullWidth><InputLabel id="video-group-label">Group</InputLabel><Select labelId="video-group-label" label="Group" value={group} onChange={(event) => setGroup(event.target.value)} MenuProps={{ disablePortal: true }}>{groups.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl>{units.length > 0 && <FormControl size="small" sx={{ minWidth: 105 }}><InputLabel id="video-episode-label">Unit</InputLabel><Select labelId="video-episode-label" label="Episode" value={unit} onChange={(event) => setUnit(event.target.value)} MenuProps={{ disablePortal: true }}>{units.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</Select></FormControl>}</Stack><List dense disablePadding sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1 }}>{visibleTracks.map((track) => <ListItemButton key={track.id} selected={selectedTrack?.id === track.id} onClick={() => selectTrack(track)} sx={{ borderRadius: 1 }}><ListItemIcon sx={{ minWidth: 32 }}><PlayArrowIcon fontSize="small" /></ListItemIcon><ListItemText primary={<Typography variant="body2" noWrap>{track.title}</Typography>} /></ListItemButton>)}</List></> : <Typography color="text.secondary" sx={{ p: 2 }}>No video files found for this book.</Typography>}
        <Box ref={playerRef} sx={{ p: { xs: 1, sm: 2 }, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper', '&:fullscreen': { bgcolor: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, p: 4, color: '#000', '& .MuiTypography-root': { color: '#000' }, '& .MuiListItemText-root': { color: '#000' }, '& .MuiMenu-paper': { bgcolor: '#fff', color: '#000' }, '& .MuiMenuItem-root': { color: '#000' }, '& .MuiSelect-select': { color: '#000' }, '& .MuiInputBase-input': { color: '#000' }, '& .MuiSvgIcon-root': { color: '#000' }, '& .video-controls-container': { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, '& .MuiStack-root': { mt: 0 } }, '& .video-timeline': { flex: 1, display: 'flex', alignItems: 'center' }, '& .video-controls-row': { flex: '0 0 auto', display: 'flex', alignItems: 'center' } }, '&:fullscreen video': { maxHeight: 'calc(100vh - 150px)', bgcolor: '#fff' } }}>
          {selectedTrack ? <Box component="video" ref={videoRef} src={selectedTrack.url} autoPlay onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} sx={{ display: 'block', width: '100%', height: { xs: 132, sm: 'auto' }, aspectRatio: { xs: 'auto', sm: '16/9' }, bgcolor: '#000', objectFit: 'contain' }}>
            {subtitleUrl && <track kind="subtitles" src={subtitleUrl} srcLang="en" />}
          </Box> : <Box sx={{ height: { xs: 132, sm: 'auto' }, aspectRatio: { xs: 'auto', sm: '16/9' }, display: 'grid', placeItems: 'center', bgcolor: 'grey.900', color: 'grey.300' }}>Select a video</Box>}
          <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', mt: { xs: 0.5, sm: 1 } }}>{selectedTrack?.title ?? 'No video selected'}</Typography>
          <Stack className="video-controls-container" direction="column" spacing={1} sx={{ mt: { xs: 0.5, sm: 1 }, width: '100%' }}>
            <Stack className="video-timeline" direction="row" spacing={1} sx={{ alignItems: 'center', width: '100%' }}>
              <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
                <span>
                  <IconButton color="primary" onClick={togglePlayback} disabled={!selectedTrack} sx={{ mr: 0.5 }}>
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                  </IconButton>
                </span>
              </Tooltip>
              <Typography variant="caption">{formatTime(currentTime)}</Typography>
              <Slider size="small" min={0} max={duration || 0} step={0.1} value={currentTime} disabled={!selectedTrack} onChange={(_, value) => { const time = value as number; if (videoRef.current) videoRef.current.currentTime = time; setCurrentTime(time) }} sx={{ flex: 1, mx: 1 }} />
              <Typography variant="caption">{formatTime(duration)}</Typography>
            </Stack>
            <Stack className="video-controls-row" direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: { xs: 'nowrap', sm: 'nowrap' }, overflowX: { xs: 'auto', sm: 'visible' } }}>
              <FormControl size="small" sx={{ minWidth: { xs: 64, sm: 80 } }}><Select value={rate} onChange={(event) => setRate(Number(event.target.value))} MenuProps={{ disablePortal: true }}>{[0.5, 0.75, 1, 1.25, 1.5, 2].map((value) => <MenuItem key={value} value={value}>{value}x</MenuItem>)}</Select></FormControl>
              <VolumeUpIcon fontSize="small" />
              <Slider size="small" min={0} max={1} step={0.05} value={volume} onChange={(_, value) => setVolume(value as number)} sx={{ flex: 1, minWidth: { xs: 64, sm: 120 }, maxWidth: { xs: 'none', sm: 220 } }} />
              <Tooltip title={captionsEnabled ? 'Disable captions' : 'Enable captions'}>
                <span>
                  <IconButton onClick={() => setCaptionsEnabled((s) => !s)} disabled={!selectedTrack} aria-label="Toggle captions">
                    <ClosedCaptionIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Fullscreen"><span><IconButton onClick={toggleFullscreen} disabled={!selectedTrack}><FullscreenIcon /></IconButton></span></Tooltip>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Drawer>
  )
}

import { FormControl, IconButton, MenuItem, Select, Stack, TextField, Tooltip, Typography } from '@mui/material'
import AudiotrackIcon from '@mui/icons-material/Audiotrack'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import RemoveIcon from '@mui/icons-material/Remove'
import AddIcon from '@mui/icons-material/Add'
import VideocamIcon from '@mui/icons-material/Videocam'
type Props = {
  page: number
  numPages: number | null
  scale: number
  pagesPerView: 1 | 2
  onNext: () => void
  onPrev: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onSetPage: (n: number) => void
  onPagesPerViewChange: (pages: 1 | 2) => void
  onToggleAudio: () => void
  audioOpen: boolean
  onToggleVideo: () => void
  videoOpen: boolean
  compact: boolean
  onToggleFull: () => void
}

export default function Controls({
  page,
  numPages,
  scale,
  pagesPerView,
  onNext,
  onPrev,
  onZoomIn,
  onZoomOut,
  onSetPage,
  onPagesPerViewChange,
  onToggleAudio,
  audioOpen,
  onToggleVideo,
  videoOpen,
  compact,
  onToggleFull
}: Props) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 0.5, sm: 0.5 }, p: 1, overflowX: { xs: 'hidden', sm: 'auto' }, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', position: 'sticky', top: 49, zIndex: 10, scrollbarWidth: 'thin' }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: { xs: 'space-between', sm: 'flex-start' }, gap: { xs: 0, sm: 0.5 }, width: { xs: '100%', sm: 'auto' }, minWidth: 0, flexShrink: 0 }}>
        <Tooltip title="Previous page"><span><IconButton onClick={onPrev} disabled={page <= 1} aria-label="Previous"><NavigateBeforeIcon /></IconButton></span></Tooltip>
        <Tooltip title="Next page"><span><IconButton onClick={onNext} disabled={numPages !== null && page >= numPages} aria-label="Next"><NavigateNextIcon /></IconButton></span></Tooltip>
        <TextField size="small" label="Page" value={page - 1} slotProps={{ htmlInput: { inputMode: 'numeric', list: 'pdf-pages', 'aria-label': 'Select or type page, starting at zero' } }} onChange={(event) => {
          const value = event.target.value.trim()
            if (value === '') {
              onSetPage(1)
              return
            }

            const selectedPage = Number(value)
            if (Number.isInteger(selectedPage)) onSetPage(selectedPage + 1)
        }} disabled={numPages === null} sx={{ width: { xs: 'clamp(88px, 27vw, 108px)', sm: 105 }, flex: '0 0 auto' }} />
        <Typography variant="body2" sx={{ mr: { xs: 0, sm: 1 }, flexShrink: 0, whiteSpace: 'nowrap' }}>of {numPages !== null ? numPages - 1 : '--'}</Typography>
          <FormControl size="small" sx={{ minWidth: { xs: 'clamp(88px, 28vw, 105px)', sm: 120 }, flexShrink: 0 }}>
          <Select
            value={pagesPerView}
            onChange={(event) => onPagesPerViewChange(Number(event.target.value) as 1 | 2)}
            aria-label="Pages per view"
            MenuProps={{ disablePortal: true }}
          >
            <MenuItem value={1}>1 page</MenuItem>
            {!compact && <MenuItem value={2}>2 pages</MenuItem>}
          </Select>
        </FormControl>
      </Stack>
      <datalist id="pdf-pages">
          {Array.from({ length: numPages ?? 0 }, (_, index) => index).map((pageNumber) => (
            <option key={pageNumber} value={pageNumber}>
              {pageNumber}
            </option>
          ))}
      </datalist>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: { xs: 'space-between', sm: 'flex-start' }, gap: { xs: 0, sm: 0.5 }, width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}>
        <Tooltip title="Zoom out"><IconButton onClick={onZoomOut}><RemoveIcon /></IconButton></Tooltip>
        <Typography variant="body2" sx={{ minWidth: 42, whiteSpace: 'nowrap' }}>{Math.round(scale * 100)}%</Typography>
        <Tooltip title="Zoom in"><IconButton onClick={onZoomIn}><AddIcon /></IconButton></Tooltip>
        <Tooltip title="Audio library"><IconButton color={audioOpen ? 'primary' : 'default'} onClick={onToggleAudio}><AudiotrackIcon /></IconButton></Tooltip>
        <Tooltip title="Video library"><IconButton color={videoOpen ? 'primary' : 'default'} onClick={onToggleVideo}><VideocamIcon /></IconButton></Tooltip>
        <Tooltip title="Fullscreen"><IconButton onClick={onToggleFull}><FullscreenIcon /></IconButton></Tooltip>
      </Stack>
    </Stack>
  )
}

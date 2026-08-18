import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, AppBar, Box, Button, CircularProgress, IconButton, Stack, Toolbar, Tooltip, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LogoutIcon from '@mui/icons-material/Logout'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import AudioPanel from './AudioPanel'
import Controls from './Controls'
import VideoPanel from './VideoPanel'

// Resolve worker relative to the app base so it works on GitHub Pages
pdfjs.GlobalWorkerOptions.workerSrc = import.meta.env.BASE_URL + 'pdf.worker.min.mjs'

type Props = {
  src: string
  title?: string
  onClose?: () => void
  onLogoff?: () => void
}

export default function PdfViewer({ src, title, onClose, onLogoff }: Props) {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('sm'))
  const file = useMemo(() => ({ url: src }), [src])
  const [numPages, setNumPages] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [scale, setScale] = useState(1)
  const [pagesPerView, setPagesPerView] = useState<1 | 2>(1)
  const [audioOpen, setAudioOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageWidth, setPageWidth] = useState(0)
  const [pageRatio, setPageRatio] = useState(0.75)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const docAreaRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const measure = () => {
      const availableWidth = Math.max(0, (docAreaRef.current?.clientWidth ?? window.innerWidth) - (compact ? 16 : 32))
      const availableHeight = window.innerHeight - (compact ? 128 : 150)
      const widthPerPage = (availableWidth - (pagesPerView - 1) * 16) / pagesPerView
      const fitWidth = Math.min(widthPerPage, availableHeight * pageRatio)
      setPageWidth(Math.max(0, fitWidth))
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (docAreaRef.current) ro.observe(docAreaRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [compact, pageRatio, pagesPerView])

  useEffect(() => {
    if (compact) setPagesPerView(1)
  }, [compact])

  const onDocumentLoadSuccess = useCallback((doc: { numPages: number }) => {
    setNumPages(doc.numPages)
    setPage(1)
    setError(null)
  }, [])

  const onDocumentLoadError = useCallback((err: any) => {
    console.error('Document load error', err)
    setError(String(err?.message ?? err))
  }, [])
  const onDocumentSourceError = useCallback((err: any) => {
    console.error('Document source error', err)
    setError(String(err?.message ?? err))
  }, [])

  useEffect(() => {
    setPage(1)
    setScale(1)
    setNumPages(null)
  }, [src])

  const next = () => setPage((p) => (numPages ? Math.min(numPages, p + pagesPerView) : p + pagesPerView))
  const prev = () => setPage((p) => Math.max(1, p - pagesPerView))
  const zoomIn = () => setScale((s) => Math.min(3, s + 0.25))
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.25))
  const setPageSafe = (n: number) => {
    if (!numPages) return setPage(1)
    const v = Math.max(1, Math.min(numPages, Math.floor(n)))
    setPage(v)
  }

  const onPageLoadSuccess = (loadedPage: any) => {
    const viewport = loadedPage.getViewport({ scale: 1 })
    setPageRatio(viewport.width / viewport.height)
  }

  const toggleFull = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {})
    else document.exitFullscreen().catch(() => {})
  }

  return (
    <Box className="pdf-viewer" ref={containerRef} sx={{ minHeight: '100%', bgcolor: 'background.default', '&:fullscreen': { height: '100%', overflowY: 'auto' } }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ top: 0, borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar variant="dense" sx={{ minHeight: { xs: 48, sm: 56 }, px: { xs: 1, sm: 2 }, justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="h6" noWrap sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</Typography>
          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => onClose?.()} color="inherit" size="small"><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Back to Bookshelf</Box></Button>
            <Tooltip title="Logoff"><IconButton onClick={() => onLogoff?.()} aria-label="Logoff" color="inherit" size="small"><LogoutIcon fontSize="small" /></IconButton></Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>
      <Controls
        page={page}
        numPages={numPages}
        scale={scale}
        pagesPerView={pagesPerView}
        onNext={next}
        onPrev={prev}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onSetPage={setPageSafe}
        onPagesPerViewChange={setPagesPerView}
        onToggleAudio={() => {
          setAudioOpen((isOpen) => !isOpen)
          setVideoOpen(false)
        }}
        audioOpen={audioOpen}
        onToggleVideo={() => {
          setVideoOpen((isOpen) => !isOpen)
          setAudioOpen(false)
        }}
        videoOpen={videoOpen}
        compact={compact}
        onToggleFull={toggleFull}
      />

      <Box className="viewer-content">
        <Box className="document-area" ref={docAreaRef} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', p: { xs: 1, sm: 2 }, overflowX: 'auto', bgcolor: 'grey.100' }}>
          {error ? (
            <Alert severity="error">Erro ao carregar PDF: {error}</Alert>
          ) : (
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                onSourceError={onDocumentSourceError}
                loading={<CircularProgress />}>
                <Box className={pagesPerView === 2 ? 'page-spread' : undefined} sx={pagesPerView === 2 ? { display: 'flex', alignItems: 'flex-start', gap: 2 } : undefined}>
                  <Page
                    pageNumber={page}
                    width={pageWidth > 0 ? pageWidth * scale : undefined}
                    onLoadSuccess={onPageLoadSuccess}
                  />
                  {pagesPerView === 2 && numPages !== null && page < numPages && (
                    <Page
                      pageNumber={page + 1}
                      width={pageWidth > 0 ? pageWidth * scale : undefined}
                    />
                  )}
                </Box>
              </Document>
          )}
        </Box>
        {audioOpen && <AudioPanel bookTitle={title ?? ''} onClose={() => setAudioOpen(false)} />}
        {videoOpen && <VideoPanel bookTitle={title ?? ''} onClose={() => setVideoOpen(false)} />}
      </Box>
    </Box>
  )
}

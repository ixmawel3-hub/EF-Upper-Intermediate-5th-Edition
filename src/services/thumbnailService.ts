import { pdfjs } from 'react-pdf'

// Resolve worker using Vite-friendly URL to the installed pdfjs-dist package
// Use Vite's `import.meta.env.BASE_URL` so the worker path works on GitHub Pages
pdfjs.GlobalWorkerOptions.workerSrc = import.meta.env.BASE_URL + 'pdf.worker.min.mjs'

export async function generateThumbnail(url: string, width = 200): Promise<string> {
  try {
    console.debug('[thumbnail] loading', url)
    const loadingTask = pdfjs.getDocument(url)
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1 })
    const targetScale = width / viewport.width
    const scaledViewport = page.getViewport({ scale: targetScale })

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = Math.floor(scaledViewport.width)
    canvas.height = Math.floor(scaledViewport.height)

    const renderTask: any = page.render({
      canvas,
      canvasContext: context,
      viewport: scaledViewport
    })
    await renderTask.promise
    const dataUrl = canvas.toDataURL('image/png')
    // cleanup
    try { pdf.destroy() } catch {}
    return dataUrl
  } catch (err) {
    console.error('Thumbnail generation failed', err)
    return ''
  }
}

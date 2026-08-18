import { useEffect, useState } from 'react'
import { Box, Card, CardActionArea, CardContent, CircularProgress, Grid, Typography } from '@mui/material'
import type { Book } from '../models/book'
import { getBooks } from '../services/bookService'
import { generateThumbnail } from '../services/thumbnailService'

type Props = {
  onSelect: (b: Book) => void
  allowedBookFilenames: string[]
}

export default function Bookshelf({ onSelect, allowedBookFilenames }: Props) {
  const [books, setBooks] = useState<Book[]>([])
  const [thumbs, setThumbs] = useState<Record<string, string>>({})

  useEffect(() => {
    let mounted = true
    getBooks().then((bs) => {
      console.debug('[bookshelf] discovered books', bs)
      if (!mounted) return
      const permittedBooks = Array.isArray(allowedBookFilenames) && allowedBookFilenames.includes('*')
        ? bs
        : bs.filter((book) => Array.isArray(allowedBookFilenames) && allowedBookFilenames.includes(book.id))
      setBooks(permittedBooks)
      // generate thumbnails in background
      permittedBooks.forEach(async (b) => {
        try {
          const t = await generateThumbnail(b.url, 240)
          setThumbs((s) => ({ ...s, [b.id]: t }))
        } catch (err) {
          console.error('[bookshelf] thumbnail error', b, err)
        }
      })
    }).catch(err => console.error('[bookshelf] getBooks error', err))
    return () => {
      mounted = false
    }
  }, [allowedBookFilenames])

  return (
    <Grid container spacing={3} sx={{ overflowY: 'auto', maxHeight: 'calc(100dvh - 120px)', px: { xs: 1, sm: 0 } }}>
      {books.map((b) => (
        <Grid key={b.id} size={{ xs: 6, sm: 4, md: 3 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardActionArea onClick={() => onSelect(b)} sx={{ height: '100%', alignItems: 'stretch' }}>
              <Box sx={{ aspectRatio: '0.72', bgcolor: 'grey.100', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                {thumbs[b.id] ? <Box component="img" src={thumbs[b.id]} alt={b.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <CircularProgress size={28} />}
              </Box>
              <CardContent sx={{ py: 1.5 }}><Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'center' }}>{b.title}</Typography></CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

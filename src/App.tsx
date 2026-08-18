import { useState, useEffect } from 'react'
import { Box, Container, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import Bookshelf from './components/Bookshelf'
import Login from './components/Login'
import PdfViewer from './components/PdfViewer'
import type { Book } from './models/book'
import { findUserByEmail } from './services/userService'
import { getBooks } from './services/bookService'
const loggedInUserStorageKey = 'english-bookshelf.logged-in-user'

export default function App() {
  const [selected, setSelected] = useState<Book | null>(null)
  const [allowedBookFilenames, setAllowedBookFilenames] = useState<string[] | null>(null)

  const handleLogin = async (email: string) => {
    const user = await findUserByEmail(email)
    if (!user) return 'not-found' as const

    localStorage.setItem(loggedInUserStorageKey, user.email)

    // teacher gets full access
    if (user.role === 'teacher') {
      setAllowedBookFilenames(['*'])
      return 'success' as const
    }

    // student: compute allowed books (exclude teacher materials)
    try {
      const books = await getBooks()
      const permitted = books.filter((b) => !b.title.toLowerCase().includes('teacher'))
      setAllowedBookFilenames(permitted.map((b) => b.id))
      return 'success' as const
    } catch (err) {
      // fall back to no access
      console.error('[app] error computing book permissions', err)
      setAllowedBookFilenames([])
      return 'success' as const
    }
  }

  const handleLogoff = () => {
    localStorage.removeItem(loggedInUserStorageKey)
    setSelected(null)
    setAllowedBookFilenames(null)
  }

  // On app start: if a user is saved and is a student, replace the optimistic '*'
  // with the correct allowed list that excludes teacher materials.
  useEffect(() => {
    const savedEmail = localStorage.getItem(loggedInUserStorageKey)
    if (!savedEmail) return

    let mounted = true
    ;(async () => {
      try {
        const user = await findUserByEmail(savedEmail)
        if (!mounted || !user) return
        if (user.role === 'teacher') {
          setAllowedBookFilenames(['*'])
          return
        }
        const books = await getBooks()
        if (!mounted) return
        const permitted = books.filter((b) => !b.title.toLowerCase().includes('teacher'))
        setAllowedBookFilenames(permitted.map((b) => b.id))
      } catch (err) {
        console.error('[app] getBooks error', err)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <Box sx={{ height: '100dvh', overflow: 'hidden' }}>
      {allowedBookFilenames === null ? (
        <Login onLogin={handleLogin} />
      ) : selected ? (
        <Box component="main" className="viewer-area" sx={{ height: '100%', overflowY: 'auto' }}>
          <PdfViewer src={selected.url} title={selected.title} onClose={() => setSelected(null)} onLogoff={handleLogoff} />
        </Box>
      ) : (
        <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h4" component="h1">English File Upper Intermediate - 5th Edition</Typography>
            <Tooltip title="Logoff"><IconButton onClick={handleLogoff} aria-label="Logoff"><LogoutIcon /></IconButton></Tooltip>
          </Stack>
          <Bookshelf onSelect={setSelected} allowedBookFilenames={allowedBookFilenames} />
        </Container>
      )}
    </Box>
  )
}


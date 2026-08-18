import { useState, type FormEvent } from 'react'
import { Alert, Box, Button, TextField } from '@mui/material'

type Props = {
  onLogin: (email: string) => Promise<'not-found' | 'success'>
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'not-found' | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = await onLogin(email)
    setStatus(result === 'success' ? null : result)
  }

  return (
    <Box component="main" sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Box component="form" onSubmit={handleSubmit} sx={{ width: 'min(100%, 360px)', display: 'grid', gap: 1.5 }}>
        <Box component="img"
          src={import.meta.env.BASE_URL + 'icon.png'}
          alt="English Bookshelf"
          sx={{ width: 240, height: 240, mx: 'auto', mb: 1 }}
        />
        <p style={{ textAlign: 'center', fontWeight: 600, color: '#022272' }}>English File Upper Intermediate - 5th Edition</p>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoFocus
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': { borderColor: '#022272' },
            },
            '& .MuiInputLabel-root.Mui-focused': { color: '#022272' }
          }}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          sx={{ backgroundColor: '#022272', color: '#fff', '&:hover': { backgroundColor: '#021a5a' } }}
        >
          Login
        </Button>
        {status === 'not-found' && <Alert severity="error">O usuário não está cadastrado.</Alert>}
        <Button
          component="a"
          href="https://ixmawel3-hub.github.io/EnglishBooks/"
          rel="noopener noreferrer"
          variant="contained"
          size="large"
          sx={{ backgroundColor: '#fff', color: '#022272' }}
        >
          Choose another book
        </Button>
      </Box>
    </Box>
  )
}
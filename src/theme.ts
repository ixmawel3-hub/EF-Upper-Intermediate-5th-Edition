import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#022272' },
    secondary: { main: '#008a9a' },
    background: { default: '#f5f6fa', paper: '#ffffff' }
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h6: { fontWeight: 700 }
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 8, '& .MuiSvgIcon-root': { fontSize: '0.8em' } } } },
    MuiSvgIcon: { styleOverrides: { root: { fontSize: '0.8em' } } }
  }
})

export default theme

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode removido intencionalmente: en desarrollo monta/desmonta dos veces,
// lo que llama socket.disconnect() y desactiva el auto-reconect de socket.io.
createRoot(document.getElementById('root')!).render(<App />)

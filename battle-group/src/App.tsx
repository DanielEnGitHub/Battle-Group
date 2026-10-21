import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PlayerPage from './pages/PlayerPage'
import AdminPage from './pages/AdminPage'
import BackgroundShapes from './components/shared/BackgroundShapes'

export default function App() {
  return (
    <BrowserRouter>
      <BackgroundShapes />
      <main className="screen flex flex-col">
        <Routes>
          <Route path="/"      element={<PlayerPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

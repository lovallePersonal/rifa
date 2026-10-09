import { Navigate, Route, Routes } from 'react-router-dom'
import PublicView from './pages/PublicView'
import AdminView from './pages/AdminView'

// Routes: '/' -> public raffle view, '/admin' -> admin panel, else redirect to '/'.
// BrowserRouter is provided by main.tsx.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicView />} />
      <Route path="/admin" element={<AdminView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

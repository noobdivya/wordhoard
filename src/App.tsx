import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { BrowsePage } from './pages/BrowsePage'
import { EntryPage } from './pages/EntryPage'
import { HomePage } from './pages/HomePage'
import { ListsPage } from './pages/ListsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="word/:word" element={<EntryPage />} />
        <Route path="lists/:level?" element={<ListsPage />} />
        <Route path="browse/:letter?" element={<BrowsePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

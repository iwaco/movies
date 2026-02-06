import { Routes, Route } from 'react-router'
import { VideoListPage } from './pages/VideoListPage'
import { VideoDetailPage } from './pages/VideoDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<VideoListPage />} />
      <Route path="/videos/:id" element={<VideoDetailPage />} />
    </Routes>
  )
}

export default App

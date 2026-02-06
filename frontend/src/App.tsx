import { Routes, Route } from 'react-router'
import { VideoListPage } from './pages/VideoListPage'
import { VideoDetailPage } from './pages/VideoDetailPage'
import { ThemeToggle } from './components/ThemeToggle'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-[#0F0F23] dark:via-[#161638] dark:to-[#1E1B4B] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Routes>
        <Route path="/" element={<VideoListPage />} />
        <Route path="/videos/:id" element={<VideoDetailPage />} />
      </Routes>
    </div>
  )
}

export default App

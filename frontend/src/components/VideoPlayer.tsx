import { useEffect, useState } from 'react'
import type { VideoFormat } from '../types/video'

interface VideoPlayerProps {
  formats: VideoFormat[]
}

export function VideoPlayer({ formats }: VideoPlayerProps) {
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(formats[0] ?? null)

  useEffect(() => {
    setSelectedFormat(formats[0] ?? null)
  }, [formats])

  if (formats.length === 0 || !selectedFormat) return null

  return (
    <div>
      <div className="mb-2">
        <label htmlFor="format-select" className="mr-2 text-gray-700 dark:text-gray-300">画質</label>
        <select
          id="format-select"
          value={selectedFormat.id}
          onChange={(e) => {
            const format = formats.find((f) => f.id === Number(e.target.value))
            if (format) setSelectedFormat(format)
          }}
          className="px-3 py-1.5 rounded-lg bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/15 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all duration-200 cursor-pointer"
        >
          {formats.map((format) => (
            <option key={format.id} value={format.id}>
              {format.name}
            </option>
          ))}
        </select>
      </div>
      <video key={selectedFormat.id} controls className="w-full rounded-xl">
        <source src={`/media${selectedFormat.file_path}`} type="video/mp4" />
      </video>
    </div>
  )
}

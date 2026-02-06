import { useState } from 'react'
import type { VideoFormat } from '../types/video'

interface VideoPlayerProps {
  formats: VideoFormat[]
}

export function VideoPlayer({ formats }: VideoPlayerProps) {
  const [selectedFormat, setSelectedFormat] = useState(formats[0])

  return (
    <div>
      <div className="mb-2">
        <label htmlFor="format-select" className="mr-2">画質</label>
        <select
          id="format-select"
          value={selectedFormat.name}
          onChange={(e) => {
            const format = formats.find((f) => f.name === e.target.value)
            if (format) setSelectedFormat(format)
          }}
          className="border rounded px-2 py-1"
        >
          {formats.map((format) => (
            <option key={format.id} value={format.name}>
              {format.name}
            </option>
          ))}
        </select>
      </div>
      <video key={selectedFormat.id} controls className="w-full">
        <source src={`/media${selectedFormat.file_path}`} type="video/mp4" />
      </video>
    </div>
  )
}

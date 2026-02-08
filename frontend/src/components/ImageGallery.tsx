import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { fetchVideoPictures } from '../api/client'

interface ImageGalleryProps {
  videoId: string
}

export function ImageGallery({ videoId }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  const { data: pictures, isLoading, isError } = useQuery({
    queryKey: ['pictures', videoId],
    queryFn: () => fetchVideoPictures(videoId),
  })

  if (isLoading || isError || !pictures || pictures.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">画像</h2>
      <div className="grid grid-cols-4 gap-2">
        {pictures.map((pic, index) => (
          <img
            key={pic}
            src={`/media${pic}`}
            alt={`Picture ${index + 1}`}
            className="w-full aspect-video object-cover cursor-pointer rounded-lg hover:opacity-90 transition-opacity duration-200"
            onClick={() => setLightboxIndex(index)}
          />
        ))}
      </div>
      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={pictures.map((pic) => ({ src: `/media${pic}` }))}
      />
    </div>
  )
}

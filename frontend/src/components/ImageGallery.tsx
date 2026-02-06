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

  const { data: pictures } = useQuery({
    queryKey: ['pictures', videoId],
    queryFn: () => fetchVideoPictures(videoId),
  })

  if (!pictures) return null

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {pictures.map((pic, index) => (
          <img
            key={pic}
            src={`/media${pic}`}
            alt={`Picture ${index + 1}`}
            className="w-full aspect-video object-cover cursor-pointer rounded"
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

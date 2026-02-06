import { Link } from 'react-router'
import type { Video } from '../types/video'
import { FavoriteButton } from './FavoriteButton'

interface VideoCardProps {
  video: Video
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <div className="border rounded overflow-hidden shadow-sm">
      <Link to={`/videos/${video.id}`}>
        <img
          src={`/media${video.jpg}`}
          alt={video.title}
          className="w-full aspect-video object-cover"
        />
      </Link>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <Link to={`/videos/${video.id}`} className="font-semibold hover:underline">
            {video.title}
          </Link>
          <FavoriteButton videoId={video.id} isFavorite={video.is_favorite} />
        </div>
        <div className="text-sm text-gray-600 mt-1">
          {video.actors.map((a) => (
            <span key={a.id} className="mr-2">{a.name}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {video.tags.map((t) => (
            <span key={t.id} className="text-xs bg-gray-200 rounded px-2 py-0.5">
              {t.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

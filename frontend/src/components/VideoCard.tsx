import { Link } from 'react-router'
import type { Video } from '../types/video'
import { FavoriteButton } from './FavoriteButton'

interface VideoCardProps {
  video: Video
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <div className="rounded-xl overflow-hidden bg-white/70 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20 hover:bg-white/80 dark:hover:bg-white/15 transition-all duration-200 cursor-pointer">
      <Link to={`/videos/${video.id}`}>
        <img
          src={`/media${video.jpg}`}
          alt={video.title}
          className="w-full aspect-video object-cover"
        />
      </Link>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <Link to={`/videos/${video.id}`} className="font-semibold text-gray-900 dark:text-gray-100 hover:underline">
            {video.title}
          </Link>
          <FavoriteButton videoId={video.id} isFavorite={video.is_favorite} />
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {video.actors.map((a) => (
            <span key={a.id} className="mr-2">{a.name}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {video.tags.map((t) => (
            <span key={t.id} className="text-xs bg-white/50 dark:bg-white/10 rounded px-2 py-0.5 text-gray-700 dark:text-gray-300">
              {t.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

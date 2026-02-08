import { Link, useSearchParams } from 'react-router'
import type { Video } from '../types/video'
import { FavoriteButton } from './FavoriteButton'

interface VideoCardProps {
  video: Video
}

function buildToggleUrl(searchParams: URLSearchParams, key: string, value: string): string {
  const params = new URLSearchParams(searchParams)
  const current = params.getAll(key)
  params.delete(key)
  if (current.includes(value)) {
    for (const v of current) {
      if (v !== value) params.append(key, v)
    }
  } else {
    for (const v of current) {
      params.append(key, v)
    }
    params.append(key, value)
  }
  params.delete('page')
  return `/?${params.toString()}`
}

export function VideoCard({ video }: VideoCardProps) {
  const [searchParams] = useSearchParams()
  const selectedTags = searchParams.getAll('tag')
  const selectedActors = searchParams.getAll('actor')

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
        <div className="text-sm mt-1 flex flex-wrap gap-1">
          {video.actors.map((a) => {
            const isSelected = selectedActors.includes(a.name)
            return (
              <Link
                key={a.id}
                to={buildToggleUrl(searchParams, 'actor', a.name)}
                className={`rounded px-1.5 py-0.5 transition-colors duration-200 ${
                  isSelected
                    ? 'bg-rose-500/80 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {a.name}
              </Link>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {video.tags.map((t) => {
            const isSelected = selectedTags.includes(t.name)
            return (
              <Link
                key={t.id}
                to={buildToggleUrl(searchParams, 'tag', t.name)}
                className={`text-xs rounded px-2 py-0.5 transition-colors duration-200 ${
                  isSelected
                    ? 'bg-rose-500/80 text-white'
                    : 'bg-white/50 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-white/20'
                }`}
              >
                {t.name}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

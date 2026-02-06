import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchVideo } from '../api/client'
import { VideoPlayer } from '../components/VideoPlayer'
import { ImageGallery } from '../components/ImageGallery'
import { FavoriteButton } from '../components/FavoriteButton'

export function VideoDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: video } = useQuery({
    queryKey: ['video', id],
    queryFn: () => fetchVideo(id!),
    enabled: !!id,
  })

  if (!video) return null

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <VideoPlayer formats={video.formats} />
      </div>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{video.title}</h1>
          <FavoriteButton videoId={video.id} isFavorite={video.is_favorite} />
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{video.date}</p>
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-rose-500 dark:text-rose-400 hover:underline"
        >
          外部リンク
        </a>
      </div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">出演者</h2>
        <div className="flex flex-wrap gap-2">
          {video.actors.map((actor) => (
            <span key={actor.id} className="bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1 text-gray-800 dark:text-gray-200">
              {actor.name}
            </span>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">タグ</h2>
        <div className="flex flex-wrap gap-2">
          {video.tags.map((tag) => (
            <span key={tag.id} className="bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
              {tag.name}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">画像</h2>
        <ImageGallery videoId={video.id} />
      </div>
    </div>
  )
}

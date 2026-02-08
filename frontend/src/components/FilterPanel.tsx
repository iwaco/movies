import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { fetchTags, fetchActors } from '../api/client'
import { TagCloud } from './TagCloud'

export function FilterPanel() {
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  })

  const { data: actors } = useQuery({
    queryKey: ['actors'],
    queryFn: fetchActors,
  })

  const selectedTags = searchParams.getAll('tag')
  const selectedActors = searchParams.getAll('actor')

  const handleTagToggle = (name: string) => {
    const params = new URLSearchParams(searchParams)
    params.delete('tag')
    const current = selectedTags.includes(name)
      ? selectedTags.filter((t) => t !== name)
      : [...selectedTags, name]
    for (const tag of current) {
      params.append('tag', tag)
    }
    params.delete('page')
    setSearchParams(params)
  }

  const handleTagClear = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('tag')
    params.delete('page')
    setSearchParams(params)
  }

  const handleActorToggle = (name: string) => {
    const params = new URLSearchParams(searchParams)
    params.delete('actor')
    const current = selectedActors.includes(name)
      ? selectedActors.filter((a) => a !== name)
      : [...selectedActors, name]
    for (const actor of current) {
      params.append('actor', actor)
    }
    params.delete('page')
    setSearchParams(params)
  }

  const handleActorClear = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('actor')
    params.delete('page')
    setSearchParams(params)
  }

  const hasVideo = searchParams.get('has_video') !== 'false'

  const handleCloudToggle = () => {
    const params = new URLSearchParams(searchParams)
    if (hasVideo) {
      params.set('has_video', 'false')
    } else {
      params.delete('has_video')
    }
    params.delete('page')
    setSearchParams(params)
  }

  const minRating = Number(searchParams.get('min_rating') || '0')

  const handleStarFilterClick = (star: number) => {
    const params = new URLSearchParams(searchParams)
    if (star === minRating) {
      params.delete('min_rating')
    } else {
      params.set('min_rating', String(star))
    }
    params.delete('page')
    setSearchParams(params)
  }

  return (
    <div className="space-y-3">
      {tags && (
        <TagCloud
          label="タグ"
          items={tags}
          selectedItems={selectedTags}
          onToggle={handleTagToggle}
          onClear={handleTagClear}
        />
      )}
      {actors && (
        <TagCloud
          label="出演者"
          items={actors}
          selectedItems={selectedActors}
          onToggle={handleActorToggle}
          onClear={handleActorClear}
        />
      )}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCloudToggle}
          aria-label={hasVideo ? '動画のみ表示中' : '全て表示中'}
          className={`p-1.5 rounded-lg border transition-all duration-200 ${
            hasVideo
              ? 'bg-white/60 dark:bg-white/10 border-white/30 dark:border-white/15 text-gray-900 dark:text-gray-100'
              : 'bg-rose-500/20 border-rose-500/50 text-rose-600 dark:text-rose-400'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
            />
          </svg>
        </button>
        <div role="group" aria-label="星フィルタ" className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleStarFilterClick(star)}
              aria-label={`★${star}フィルタ`}
              aria-pressed={star <= minRating}
              className="p-0.5 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={star <= minRating ? '#facc15' : 'none'}
                stroke={star <= minRating ? '#facc15' : 'currentColor'}
                strokeWidth={1.5}
                className="w-5 h-5 text-gray-400 dark:text-gray-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { fetchTags, fetchActors } from '../api/client'

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

  const handleTagChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('tag', value)
    } else {
      params.delete('tag')
    }
    params.delete('page')
    setSearchParams(params)
  }

  const handleActorChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('actor', value)
    } else {
      params.delete('actor')
    }
    params.delete('page')
    setSearchParams(params)
  }

  const hasVideo = searchParams.get('has_video') !== 'false'

  const handleHasVideoChange = (checked: boolean) => {
    const params = new URLSearchParams(searchParams)
    if (checked) {
      params.delete('has_video')
    } else {
      params.set('has_video', 'false')
    }
    params.delete('page')
    setSearchParams(params)
  }

  const selectClassName = "px-3 py-1.5 rounded-lg bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/15 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all duration-200 cursor-pointer ml-2"

  return (
    <div className="flex gap-4">
      <div>
        <label htmlFor="tag-filter" className="text-gray-700 dark:text-gray-300">タグ</label>
        <select
          id="tag-filter"
          value={searchParams.get('tag') || ''}
          onChange={(e) => handleTagChange(e.target.value)}
          className={selectClassName}
        >
          <option value="">すべて</option>
          {tags?.map((tag) => (
            <option key={tag.id} value={tag.name}>
              {tag.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="actor-filter" className="text-gray-700 dark:text-gray-300">出演者</label>
        <select
          id="actor-filter"
          value={searchParams.get('actor') || ''}
          onChange={(e) => handleActorChange(e.target.value)}
          className={selectClassName}
        >
          <option value="">すべて</option>
          {actors?.map((actor) => (
            <option key={actor.id} value={actor.name}>
              {actor.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center">
        <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            id="has-video-filter"
            checked={hasVideo}
            onChange={(e) => handleHasVideoChange(e.target.checked)}
            className="w-4 h-4 rounded border-white/30 dark:border-white/15 text-rose-500 focus:ring-rose-500/50"
          />
          動画のみ
        </label>
      </div>
    </div>
  )
}

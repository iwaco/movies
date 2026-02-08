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

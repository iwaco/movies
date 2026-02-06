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

  return (
    <div className="flex gap-4">
      <div>
        <label htmlFor="tag-filter">タグ</label>
        <select
          id="tag-filter"
          value={searchParams.get('tag') || ''}
          onChange={(e) => handleTagChange(e.target.value)}
          className="border rounded px-2 py-1 ml-2"
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
        <label htmlFor="actor-filter">出演者</label>
        <select
          id="actor-filter"
          value={searchParams.get('actor') || ''}
          onChange={(e) => handleActorChange(e.target.value)}
          className="border rounded px-2 py-1 ml-2"
        >
          <option value="">すべて</option>
          {actors?.map((actor) => (
            <option key={actor.id} value={actor.name}>
              {actor.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

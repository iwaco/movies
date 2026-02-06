import { useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchVideos } from '../api/client'
import { VideoCard } from '../components/VideoCard'
import { SearchBar } from '../components/SearchBar'
import { FilterPanel } from '../components/FilterPanel'
import { Pagination } from '../components/Pagination'

export function VideoListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') || '1')
  const q = searchParams.get('q') || ''
  const tag = searchParams.get('tag') || ''
  const actor = searchParams.get('actor') || ''

  const { data } = useQuery({
    queryKey: ['videos', page, q, tag, actor],
    queryFn: () => fetchVideos({ page, q, tag, actor }),
  })

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(newPage))
    setSearchParams(params)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4">
        <SearchBar />
      </div>
      <div className="mb-4">
        <FilterPanel />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data?.data.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
      {data && (
        <Pagination
          page={data.page}
          totalPages={data.total_pages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}

import { http, HttpResponse } from 'msw'
import type { Video, Tag, Actor, PaginatedResponse } from '../../types/video'

export const mockVideos: Video[] = [
  {
    id: 'video-1',
    title: 'Test Video 1',
    url: 'https://example.com/video1',
    date: '2024-01-15',
    jpg: '/videos/video1/thumb.jpg',
    pictures_dir: '/videos/video1/pictures',
    actors: [{ id: 1, name: 'Actor A' }],
    tags: [{ id: 1, name: 'Tag1' }],
    formats: [
      { id: 1, name: '720p', file_path: '/videos/video1/720p.mp4' },
      { id: 2, name: '1080p', file_path: '/videos/video1/1080p.mp4' },
    ],
    is_favorite: false,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'video-2',
    title: 'Test Video 2',
    url: 'https://example.com/video2',
    date: '2024-02-20',
    jpg: '/videos/video2/thumb.jpg',
    pictures_dir: '/videos/video2/pictures',
    actors: [{ id: 2, name: 'Actor B' }],
    tags: [{ id: 2, name: 'Tag2' }],
    formats: [
      { id: 3, name: '720p', file_path: '/videos/video2/720p.mp4' },
    ],
    is_favorite: true,
    created_at: '2024-02-20T00:00:00Z',
    updated_at: '2024-02-20T00:00:00Z',
  },
]

export const mockTags: Tag[] = [
  { id: 1, name: 'Tag1' },
  { id: 2, name: 'Tag2' },
  { id: 3, name: 'Tag3' },
]

export const mockActors: Actor[] = [
  { id: 1, name: 'Actor A' },
  { id: 2, name: 'Actor B' },
  { id: 3, name: 'Actor C' },
]

export const handlers = [
  http.get('/api/v1/videos', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || '1')
    const perPage = Number(url.searchParams.get('per_page') || '20')
    const q = url.searchParams.get('q') || ''
    const tag = url.searchParams.get('tag') || ''
    const actor = url.searchParams.get('actor') || ''

    let filtered = [...mockVideos]
    if (q) {
      filtered = filtered.filter((v) =>
        v.title.toLowerCase().includes(q.toLowerCase())
      )
    }
    if (tag) {
      filtered = filtered.filter((v) =>
        v.tags.some((t) => t.name === tag)
      )
    }
    if (actor) {
      filtered = filtered.filter((v) =>
        v.actors.some((a) => a.name === actor)
      )
    }

    const response: PaginatedResponse<Video> = {
      data: filtered,
      total: filtered.length,
      page,
      per_page: perPage,
      total_pages: Math.ceil(filtered.length / perPage),
    }
    return HttpResponse.json(response)
  }),

  http.get('/api/v1/videos/:id', ({ params }) => {
    const video = mockVideos.find((v) => v.id === params.id)
    if (!video) {
      return HttpResponse.json({ error: 'not found' }, { status: 404 })
    }
    return HttpResponse.json(video)
  }),

  http.get('/api/v1/videos/:id/pictures', () => {
    return HttpResponse.json({
      pictures: ['/pictures/pic1.jpg', '/pictures/pic2.jpg', '/pictures/pic3.jpg'],
    })
  }),

  http.get('/api/v1/favorites', () => {
    const favorites = mockVideos.filter((v) => v.is_favorite)
    const response: PaginatedResponse<Video> = {
      data: favorites,
      total: favorites.length,
      page: 1,
      per_page: 20,
      total_pages: 1,
    }
    return HttpResponse.json(response)
  }),

  http.post('/api/v1/favorites', () => {
    return HttpResponse.json(null, { status: 201 })
  }),

  http.delete('/api/v1/favorites/:videoId', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/v1/tags', () => {
    return HttpResponse.json({ tags: mockTags })
  }),

  http.get('/api/v1/actors', () => {
    return HttpResponse.json({ actors: mockActors })
  }),
]

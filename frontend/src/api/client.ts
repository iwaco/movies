import type { Video, Tag, Actor, PaginatedResponse } from '../types/video'

export interface FetchVideosParams {
  page?: number;
  per_page?: number;
  q?: string;
  tags?: string[];
  actors?: string[];
  has_video?: boolean;
  min_rating?: number;
}

export async function fetchVideos(params: FetchVideosParams = {}): Promise<PaginatedResponse<Video>> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.per_page) searchParams.set('per_page', String(params.per_page))
  if (params.q) searchParams.set('q', params.q)
  if (params.tags) {
    for (const tag of params.tags) {
      searchParams.append('tag', tag)
    }
  }
  if (params.actors) {
    for (const actor of params.actors) {
      searchParams.append('actor', actor)
    }
  }
  if (params.has_video === true) searchParams.set('has_video', 'true')
  if (params.has_video === false) searchParams.set('has_video', 'false')
  if (params.min_rating) searchParams.set('min_rating', String(params.min_rating))

  const res = await fetch(`/api/v1/videos?${searchParams.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch videos')
  return res.json()
}

export async function fetchVideo(id: string): Promise<Video> {
  const res = await fetch(`/api/v1/videos/${id}`)
  if (!res.ok) throw new Error('Failed to fetch video')
  return res.json()
}

export async function fetchVideoPictures(id: string): Promise<string[]> {
  const res = await fetch(`/api/v1/videos/${id}/pictures`)
  if (!res.ok) throw new Error('Failed to fetch pictures')
  const data = await res.json()
  return data.pictures ?? []
}

export async function setRating(videoId: string, rating: number): Promise<void> {
  const res = await fetch(`/api/v1/ratings/${videoId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
  })
  if (!res.ok) throw new Error('Failed to set rating')
}

export async function removeRating(videoId: string): Promise<void> {
  const res = await fetch(`/api/v1/ratings/${videoId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to remove rating')
}

export async function fetchTags(): Promise<Tag[]> {
  const res = await fetch('/api/v1/tags')
  if (!res.ok) throw new Error('Failed to fetch tags')
  const data = await res.json()
  return data.tags
}

export async function fetchActors(): Promise<Actor[]> {
  const res = await fetch('/api/v1/actors')
  if (!res.ok) throw new Error('Failed to fetch actors')
  const data = await res.json()
  return data.actors
}

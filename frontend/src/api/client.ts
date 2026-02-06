import type { Video, Tag, Actor, PaginatedResponse } from '../types/video'

export interface FetchVideosParams {
  page?: number;
  per_page?: number;
  q?: string;
  tag?: string;
  actor?: string;
}

export async function fetchVideos(params: FetchVideosParams = {}): Promise<PaginatedResponse<Video>> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.per_page) searchParams.set('per_page', String(params.per_page))
  if (params.q) searchParams.set('q', params.q)
  if (params.tag) searchParams.set('tag', params.tag)
  if (params.actor) searchParams.set('actor', params.actor)

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
  return data.pictures
}

export async function fetchFavorites(): Promise<PaginatedResponse<Video>> {
  const res = await fetch('/api/v1/favorites')
  if (!res.ok) throw new Error('Failed to fetch favorites')
  return res.json()
}

export async function addFavorite(videoId: string): Promise<void> {
  const res = await fetch('/api/v1/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video_id: videoId }),
  })
  if (!res.ok) throw new Error('Failed to add favorite')
}

export async function removeFavorite(videoId: string): Promise<void> {
  const res = await fetch(`/api/v1/favorites/${videoId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to remove favorite')
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

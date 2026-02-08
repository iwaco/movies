import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VideoCard } from './VideoCard'
import type { Video } from '../types/video'

const mockVideo: Video = {
  id: 'video-1',
  title: 'Test Video 1',
  url: 'https://example.com/video1',
  date: '2024-01-15',
  jpg: '/videos/video1/thumb.jpg',
  pictures_dir: '/videos/video1/pictures',
  actors: [{ id: 1, name: 'Actor A' }],
  tags: [{ id: 1, name: 'Tag1' }, { id: 2, name: 'Tag2' }],
  formats: [{ id: 1, name: '720p', file_path: '/videos/video1/720p.mp4' }],
  rating: 0,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
}

function renderWithProviders(ui: React.ReactElement, initialEntries: string[] = ['/']) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('VideoCard', () => {
  it('renders video title', () => {
    renderWithProviders(<VideoCard video={mockVideo} />)
    expect(screen.getByText('Test Video 1')).toBeInTheDocument()
  })

  it('renders thumbnail image with correct src', () => {
    renderWithProviders(<VideoCard video={mockVideo} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', '/media/videos/video1/thumb.jpg')
  })

  it('renders actor names as clickable links', () => {
    renderWithProviders(<VideoCard video={mockVideo} />)
    const actorLink = screen.getByRole('link', { name: 'Actor A' })
    expect(actorLink).toBeInTheDocument()
  })

  it('renders tags as clickable links', () => {
    renderWithProviders(<VideoCard video={mockVideo} />)
    const tagLink = screen.getByRole('link', { name: 'Tag1' })
    expect(tagLink).toBeInTheDocument()
  })

  it('clicking a tag adds it to existing filters', () => {
    // Start with actor=Actor A, clicking Tag1 should preserve actor param
    renderWithProviders(<VideoCard video={mockVideo} />, ['/?actor=Actor+A'])
    const tagLink = screen.getByRole('link', { name: 'Tag1' })
    const href = tagLink.getAttribute('href')!
    const params = new URLSearchParams(href.replace('/?', ''))
    expect(params.getAll('tag')).toContain('Tag1')
    expect(params.getAll('actor')).toContain('Actor A')
  })

  it('clicking a selected tag removes it from filters', () => {
    renderWithProviders(<VideoCard video={mockVideo} />, ['/?tag=Tag1&tag=Tag2'])
    const tag1Link = screen.getByRole('link', { name: 'Tag1' })
    const href = tag1Link.getAttribute('href')!
    const params = new URLSearchParams(href.replace('/?', ''))
    expect(params.getAll('tag')).not.toContain('Tag1')
    expect(params.getAll('tag')).toContain('Tag2')
  })

  it('highlights tags that are currently selected in URL', () => {
    renderWithProviders(<VideoCard video={mockVideo} />, ['/?tag=Tag1'])
    const tag1Link = screen.getByRole('link', { name: 'Tag1' })
    expect(tag1Link.className).toMatch(/bg-rose-500/)
    const tag2Link = screen.getByRole('link', { name: 'Tag2' })
    expect(tag2Link.className).not.toMatch(/bg-rose-500/)
  })

  it('highlights actors that are currently selected in URL', () => {
    renderWithProviders(<VideoCard video={mockVideo} />, ['/?actor=Actor+A'])
    const actorLink = screen.getByRole('link', { name: 'Actor A' })
    expect(actorLink.className).toMatch(/bg-rose-500/)
  })

  it('has a link to video detail page', () => {
    renderWithProviders(<VideoCard video={mockVideo} />)
    const links = screen.getAllByRole('link')
    expect(links.some((link) => link.getAttribute('href') === '/videos/video-1')).toBe(true)
  })

  it('contains StarRating', () => {
    renderWithProviders(<VideoCard video={mockVideo} />)
    expect(screen.getByRole('group', { name: '評価' })).toBeInTheDocument()
  })
})

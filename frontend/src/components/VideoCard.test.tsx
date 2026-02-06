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
  tags: [{ id: 1, name: 'Tag1' }],
  formats: [{ id: 1, name: '720p', file_path: '/videos/video1/720p.mp4' }],
  is_favorite: false,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
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

  it('renders actor names', () => {
    renderWithProviders(<VideoCard video={mockVideo} />)
    expect(screen.getByText('Actor A')).toBeInTheDocument()
  })

  it('renders tags', () => {
    renderWithProviders(<VideoCard video={mockVideo} />)
    expect(screen.getByText('Tag1')).toBeInTheDocument()
  })

  it('has a link to video detail page', () => {
    renderWithProviders(<VideoCard video={mockVideo} />)
    const links = screen.getAllByRole('link')
    expect(links.some((link) => link.getAttribute('href') === '/videos/video-1')).toBe(true)
  })

  it('contains FavoriteButton', () => {
    renderWithProviders(<VideoCard video={mockVideo} />)
    expect(screen.getByRole('button', { name: /お気に入り/ })).toBeInTheDocument()
  })
})

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VideoDetailPage } from './VideoDetailPage'

function renderWithProviders(videoId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/videos/${videoId}`]}>
        <Routes>
          <Route path="/videos/:id" element={<VideoDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('VideoDetailPage', () => {
  it('renders video title', async () => {
    renderWithProviders('video-1')
    await waitFor(() => {
      expect(screen.getByText('Test Video 1')).toBeInTheDocument()
    })
  })

  it('renders actor names', async () => {
    renderWithProviders('video-1')
    await waitFor(() => {
      expect(screen.getByText('Actor A')).toBeInTheDocument()
    })
  })

  it('renders tags', async () => {
    renderWithProviders('video-1')
    await waitFor(() => {
      expect(screen.getByText('Tag1')).toBeInTheDocument()
    })
  })

  it('renders video player', async () => {
    renderWithProviders('video-1')
    await waitFor(() => {
      const video = document.querySelector('video')
      expect(video).toBeInTheDocument()
    })
  })

  it('renders video date', async () => {
    renderWithProviders('video-1')
    await waitFor(() => {
      expect(screen.getByText('2024-01-15')).toBeInTheDocument()
    })
  })

  it('renders external URL link', async () => {
    renderWithProviders('video-1')
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /外部リンク/ })
      expect(link).toHaveAttribute('href', 'https://example.com/video1')
    })
  })

  it('renders image heading when video has pictures', async () => {
    renderWithProviders('video-1')
    await waitFor(() => {
      expect(screen.getByText('画像')).toBeInTheDocument()
    })
  })

  it('does not render image heading when video has no pictures', async () => {
    renderWithProviders('video-2')
    await waitFor(() => {
      expect(screen.getByText('Test Video 2')).toBeInTheDocument()
    })
    expect(screen.queryByText('画像')).not.toBeInTheDocument()
  })
})

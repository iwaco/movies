import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '../test/mocks/server'
import { ImageGallery } from './ImageGallery'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('ImageGallery', () => {
  it('renders images from API', async () => {
    renderWithProviders(<ImageGallery videoId="video-1" />)
    await waitFor(() => {
      const images = screen.getAllByRole('img')
      expect(images).toHaveLength(3)
    })
  })

  it('renders images with correct src paths', async () => {
    renderWithProviders(<ImageGallery videoId="video-1" />)
    await waitFor(() => {
      const images = screen.getAllByRole('img')
      expect(images[0]).toHaveAttribute('src', '/media/pictures/pic1.jpg')
      expect(images[1]).toHaveAttribute('src', '/media/pictures/pic2.jpg')
      expect(images[2]).toHaveAttribute('src', '/media/pictures/pic3.jpg')
    })
  })

  it('renders heading when pictures exist', async () => {
    renderWithProviders(<ImageGallery videoId="video-1" />)
    await waitFor(() => {
      expect(screen.getByText('画像')).toBeInTheDocument()
    })
  })

  it('renders nothing for empty picture array', async () => {
    const { container } = renderWithProviders(<ImageGallery videoId="video-2" />)
    // Wait for query to settle, then verify nothing is rendered
    await waitFor(() => {
      expect(container.querySelector('img')).toBeNull()
    })
    expect(screen.queryByText('画像')).not.toBeInTheDocument()
  })

  it('renders nothing when API returns null pictures', async () => {
    server.use(
      http.get('/api/v1/videos/:id/pictures', () => {
        return HttpResponse.json({ pictures: null })
      })
    )
    const { container } = renderWithProviders(<ImageGallery videoId="video-1" />)
    await waitFor(() => {
      expect(container.querySelector('img')).toBeNull()
    })
    expect(screen.queryByText('画像')).not.toBeInTheDocument()
  })

  it('does not crash on API error', async () => {
    server.use(
      http.get('/api/v1/videos/:id/pictures', () => {
        return HttpResponse.json({ error: 'server error' }, { status: 500 })
      })
    )
    const { container } = renderWithProviders(<ImageGallery videoId="video-1" />)
    // Should not crash; wait a bit and ensure no images rendered
    await waitFor(() => {
      expect(container.querySelector('img')).toBeNull()
    })
  })
})

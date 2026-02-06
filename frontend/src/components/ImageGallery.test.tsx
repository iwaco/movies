import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
})

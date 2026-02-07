import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VideoListPage } from './VideoListPage'

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

describe('VideoListPage', () => {
  it('renders video list from API', async () => {
    renderWithProviders(<VideoListPage />)
    await waitFor(() => {
      expect(screen.getByText('Test Video 1')).toBeInTheDocument()
      expect(screen.getByText('Test Video 2')).toBeInTheDocument()
    })
  })

  it('renders search bar', async () => {
    renderWithProviders(<VideoListPage />)
    expect(screen.getByPlaceholderText('検索...')).toBeInTheDocument()
  })

  it('renders pagination', async () => {
    renderWithProviders(<VideoListPage />)
    await waitFor(() => {
      expect(screen.getByText('1 / 1')).toBeInTheDocument()
    })
  })

  it('filters out videos without formats by default', async () => {
    renderWithProviders(<VideoListPage />)
    await waitFor(() => {
      expect(screen.getByText('Test Video 1')).toBeInTheDocument()
      expect(screen.getByText('Test Video 2')).toBeInTheDocument()
    })
    expect(screen.queryByText('Test Video 3 No Format')).not.toBeInTheDocument()
  })
})

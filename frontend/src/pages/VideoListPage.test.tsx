import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VideoListPage } from './VideoListPage'

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
      const pageButton = screen.getByRole('button', { name: '1' })
      expect(pageButton).toHaveAttribute('aria-current', 'page')
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

  it('shows empty state message when no videos match filters', async () => {
    // Use a tag that no video has to get 0 results
    renderWithProviders(<VideoListPage />, ['/?tag=NonExistentTag'])
    await waitFor(() => {
      expect(screen.getByText('条件に一致する動画が見つかりませんでした')).toBeInTheDocument()
    })
  })
})

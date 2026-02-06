import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FavoriteButton } from './FavoriteButton'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('FavoriteButton', () => {
  it('renders unfavorited state', () => {
    renderWithProviders(<FavoriteButton videoId="video-1" isFavorite={false} />)
    const button = screen.getByRole('button', { name: /お気に入りに追加/ })
    expect(button).toBeInTheDocument()
  })

  it('renders favorited state', () => {
    renderWithProviders(<FavoriteButton videoId="video-1" isFavorite={true} />)
    const button = screen.getByRole('button', { name: /お気に入りから削除/ })
    expect(button).toBeInTheDocument()
  })

  it('toggles favorite on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FavoriteButton videoId="video-1" isFavorite={false} />)
    const button = screen.getByRole('button', { name: /お気に入りに追加/ })
    await user.click(button)
    expect(screen.getByRole('button', { name: /お気に入りから削除/ })).toBeInTheDocument()
  })
})

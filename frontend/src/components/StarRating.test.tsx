import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StarRating } from './StarRating'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('StarRating', () => {
  it('renders 5 star buttons', () => {
    renderWithProviders(<StarRating videoId="video-1" rating={0} />)
    const group = screen.getByRole('group', { name: '評価' })
    expect(group).toBeInTheDocument()
    const buttons = screen.getAllByRole('button', { name: /★/ })
    expect(buttons).toHaveLength(5)
  })

  it('renders unrated state with empty stars', () => {
    renderWithProviders(<StarRating videoId="video-1" rating={0} />)
    const buttons = screen.getAllByRole('button', { name: /★/ })
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('★'))
    })
  })

  it('renders rated state with filled stars', () => {
    renderWithProviders(<StarRating videoId="video-1" rating={3} />)
    const buttons = screen.getAllByRole('button', { name: /★/ })
    // First 3 should be filled (aria-pressed="true")
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'true')
    expect(buttons[2]).toHaveAttribute('aria-pressed', 'true')
    // Last 2 should be empty
    expect(buttons[3]).toHaveAttribute('aria-pressed', 'false')
    expect(buttons[4]).toHaveAttribute('aria-pressed', 'false')
  })

  it('sets rating on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StarRating videoId="video-1" rating={0} />)
    const buttons = screen.getAllByRole('button', { name: /★/ })
    await user.click(buttons[2]) // Click star 3
    // After optimistic update, first 3 stars should be pressed
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'true')
    expect(buttons[2]).toHaveAttribute('aria-pressed', 'true')
  })

  it('removes rating when clicking same star', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StarRating videoId="video-1" rating={3} />)
    const buttons = screen.getAllByRole('button', { name: /★/ })
    await user.click(buttons[2]) // Click star 3 again to remove
    // All stars should be unpressed
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('aria-pressed', 'false')
    })
  })

  it('stops event propagation on click', async () => {
    const user = userEvent.setup()
    let parentClicked = false
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <div onClick={() => { parentClicked = true }}>
          <StarRating videoId="video-1" rating={0} />
        </div>
      </QueryClientProvider>
    )
    const buttons = screen.getAllByRole('button', { name: /★/ })
    await user.click(buttons[0])
    expect(parentClicked).toBe(false)
  })
})

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FilterPanel } from './FilterPanel'

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

describe('FilterPanel', () => {
  it('renders tag items from API as tag cloud buttons', async () => {
    renderWithProviders(<FilterPanel />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Tag1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Tag2' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Tag3' })).toBeInTheDocument()
    })
  })

  it('renders actor items from API as tag cloud buttons', async () => {
    renderWithProviders(<FilterPanel />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Actor A' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Actor B' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Actor C' })).toBeInTheDocument()
    })
  })

  it('allows toggling a tag selection', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FilterPanel />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Tag1' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'Tag1' }))
    // After clicking, the button should have selected style
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Tag1' }).className).toMatch(/bg-rose-500/)
    })
  })

  it('allows toggling an actor selection', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FilterPanel />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Actor A' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'Actor A' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Actor A' }).className).toMatch(/bg-rose-500/)
    })
  })

  it('renders cloud toggle button with default state', () => {
    renderWithProviders(<FilterPanel />)
    const cloudButton = screen.getByRole('button', { name: '動画のみ表示中' })
    expect(cloudButton).toBeInTheDocument()
  })

  it('toggles cloud button to show all', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FilterPanel />)
    const cloudButton = screen.getByRole('button', { name: '動画のみ表示中' })
    await user.click(cloudButton)
    expect(screen.getByRole('button', { name: '全て表示中' })).toBeInTheDocument()
  })

  it('renders star filter buttons', () => {
    renderWithProviders(<FilterPanel />)
    const starFilter = screen.getByRole('group', { name: '星フィルタ' })
    expect(starFilter).toBeInTheDocument()
    const buttons = screen.getAllByRole('button', { name: /★\dフィルタ/ })
    expect(buttons).toHaveLength(5)
  })

  it('star filter buttons are unpressed by default', () => {
    renderWithProviders(<FilterPanel />)
    const buttons = screen.getAllByRole('button', { name: /★\dフィルタ/ })
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('aria-pressed', 'false')
    })
  })
})

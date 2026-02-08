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

  it('renders has-video checkbox checked by default', () => {
    renderWithProviders(<FilterPanel />)
    const checkbox = screen.getByLabelText('動画のみ')
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).toBeChecked()
  })

  it('allows toggling has-video filter off', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FilterPanel />)
    const checkbox = screen.getByLabelText('動画のみ')
    expect(checkbox).toBeChecked()
    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })
})

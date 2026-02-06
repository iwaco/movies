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
  it('renders tag filter options from API', async () => {
    renderWithProviders(<FilterPanel />)
    await waitFor(() => {
      expect(screen.getByText('Tag1')).toBeInTheDocument()
      expect(screen.getByText('Tag2')).toBeInTheDocument()
      expect(screen.getByText('Tag3')).toBeInTheDocument()
    })
  })

  it('renders actor filter options from API', async () => {
    renderWithProviders(<FilterPanel />)
    await waitFor(() => {
      expect(screen.getByText('Actor A')).toBeInTheDocument()
      expect(screen.getByText('Actor B')).toBeInTheDocument()
      expect(screen.getByText('Actor C')).toBeInTheDocument()
    })
  })

  it('allows selecting a tag filter', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FilterPanel />)
    await waitFor(() => {
      expect(screen.getByText('Tag1')).toBeInTheDocument()
    })
    const tagSelect = screen.getByLabelText('タグ')
    await user.selectOptions(tagSelect, 'Tag1')
    expect(tagSelect).toHaveValue('Tag1')
  })

  it('allows selecting an actor filter', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FilterPanel />)
    await waitFor(() => {
      expect(screen.getByText('Actor A')).toBeInTheDocument()
    })
    const actorSelect = screen.getByLabelText('出演者')
    await user.selectOptions(actorSelect, 'Actor A')
    expect(actorSelect).toHaveValue('Actor A')
  })
})

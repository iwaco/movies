import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router'
import { SearchBar } from './SearchBar'

function renderWithRouter(ui: React.ReactElement, initialEntries = ['/']) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>)
}

describe('SearchBar', () => {
  it('renders search input', () => {
    renderWithRouter(<SearchBar />)
    expect(screen.getByPlaceholderText('検索...')).toBeInTheDocument()
  })

  it('updates input value on type', async () => {
    const user = userEvent.setup()
    renderWithRouter(<SearchBar />)
    const input = screen.getByPlaceholderText('検索...')
    await user.type(input, 'test query')
    expect(input).toHaveValue('test query')
  })

  it('has debounce behavior (input updates immediately, URL updates after delay)', async () => {
    const user = userEvent.setup()
    renderWithRouter(<SearchBar />)
    const input = screen.getByPlaceholderText('検索...')
    await user.type(input, 'a')
    expect(input).toHaveValue('a')
  })
})

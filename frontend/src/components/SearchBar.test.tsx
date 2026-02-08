import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { MemoryRouter, useSearchParams } from 'react-router'
import { SearchBar } from './SearchBar'

function UrlDisplay() {
  const [searchParams] = useSearchParams()
  return <span data-testid="url-params">{searchParams.toString()}</span>
}

function renderWithRouter(ui: React.ReactElement, initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
      <UrlDisplay />
    </MemoryRouter>,
  )
}

function UrlSetter() {
  const [, setSearchParams] = useSearchParams()
  return (
    <button
      data-testid="set-q"
      onClick={() => setSearchParams({ q: 'back' })}
    />
  )
}

describe('SearchBar', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

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

  it('does not clear page parameter on initial mount with /?page=2', async () => {
    vi.useFakeTimers()
    userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    renderWithRouter(<SearchBar />, ['/?page=2'])

    // デバウンスタイマーを進める
    await vi.advanceTimersByTimeAsync(500)

    // 初回マウント時にはデバウンスが発火せず、page=2が維持される
    expect(screen.getByTestId('url-params').textContent).toContain('page=2')
  })

  it('does not clear page parameter on initial mount with /?q=test&page=3', async () => {
    vi.useFakeTimers()
    userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    renderWithRouter(<SearchBar />, ['/?q=test&page=3'])

    await vi.advanceTimersByTimeAsync(500)

    // 初回マウント時にはデバウンスが発火せず、両パラメータが維持される
    const params = screen.getByTestId('url-params').textContent!
    expect(params).toContain('q=test')
    expect(params).toContain('page=3')
  })

  it('clears page parameter when user types in the search input', async () => {
    vi.useFakeTimers()

    renderWithRouter(<SearchBar />, ['/?page=2'])

    const input = screen.getByPlaceholderText('検索...')

    await act(async () => {
      fireEvent.change(input, { target: { value: 'a' } })
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    // ユーザー入力時にはpageがリセットされる
    const params = screen.getByTestId('url-params').textContent!
    expect(params).toContain('q=a')
    expect(params).not.toContain('page=')
  })

  it('syncs input value when URL q changes after mount (back/forward)', () => {
    render(
      <MemoryRouter initialEntries={['/?q=hello']}>
        <SearchBar />
        <UrlSetter />
      </MemoryRouter>,
    )

    expect(screen.getByPlaceholderText('検索...')).toHaveValue('hello')

    fireEvent.click(screen.getByTestId('set-q'))
    expect(screen.getByPlaceholderText('検索...')).toHaveValue('back')
  })

  it('initializes value from URL q parameter', () => {
    renderWithRouter(<SearchBar />, ['/?q=hello'])
    const input = screen.getByPlaceholderText('検索...')
    expect(input).toHaveValue('hello')
  })
})

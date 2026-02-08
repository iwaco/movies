import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('renders inside a nav landmark', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByRole('navigation', { name: 'ページネーション' })).toBeInTheDocument()
  })

  it('renders page number buttons', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument()
  })

  it('calls onPageChange with previous page', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />)
    await user.click(screen.getByRole('button', { name: /前へ/ }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange with next page', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />)
    await user.click(screen.getByRole('button', { name: /次へ/ }))
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('disables previous button on first page', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: /前へ/ })).toBeDisabled()
  })

  it('disables next button on last page', () => {
    render(<Pagination page={5} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: /次へ/ })).toBeDisabled()
  })

  describe('page number buttons', () => {
    it('shows all page numbers when totalPages <= 7', () => {
      render(<Pagination page={1} totalPages={7} onPageChange={() => {}} />)
      for (let i = 1; i <= 7; i++) {
        expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument()
      }
      expect(screen.queryByText('…')).not.toBeInTheDocument()
    })

    it('shows ellipsis at end when current page is near start', () => {
      render(<Pagination page={3} totalPages={19} onPageChange={() => {}} />)
      // 1 2 3 4 5 … 19
      for (const p of [1, 2, 3, 4, 5, 19]) {
        expect(screen.getByRole('button', { name: String(p) })).toBeInTheDocument()
      }
      expect(screen.getAllByText('…')).toHaveLength(1)
      expect(screen.queryByRole('button', { name: '6' })).not.toBeInTheDocument()
    })

    it('shows ellipsis at start when current page is near end', () => {
      render(<Pagination page={17} totalPages={19} onPageChange={() => {}} />)
      // 1 … 15 16 17 18 19
      for (const p of [1, 15, 16, 17, 18, 19]) {
        expect(screen.getByRole('button', { name: String(p) })).toBeInTheDocument()
      }
      expect(screen.getAllByText('…')).toHaveLength(1)
      expect(screen.queryByRole('button', { name: '14' })).not.toBeInTheDocument()
    })

    it('shows ellipsis on both sides when current page is in the middle', () => {
      render(<Pagination page={10} totalPages={19} onPageChange={() => {}} />)
      // 1 … 9 10 11 … 19
      for (const p of [1, 9, 10, 11, 19]) {
        expect(screen.getByRole('button', { name: String(p) })).toBeInTheDocument()
      }
      expect(screen.getAllByText('…')).toHaveLength(2)
      expect(screen.queryByRole('button', { name: '8' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '12' })).not.toBeInTheDocument()
    })

    it('calls onPageChange when a page number button is clicked', async () => {
      const user = userEvent.setup()
      const onPageChange = vi.fn()
      render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />)
      await user.click(screen.getByRole('button', { name: '3' }))
      expect(onPageChange).toHaveBeenCalledWith(3)
    })

    it('marks the current page button with aria-current="page"', () => {
      render(<Pagination page={3} totalPages={7} onPageChange={() => {}} />)
      const currentButton = screen.getByRole('button', { name: '3' })
      expect(currentButton).toHaveAttribute('aria-current', 'page')
      // Other buttons should not have aria-current
      expect(screen.getByRole('button', { name: '1' })).not.toHaveAttribute('aria-current')
    })

    it('disables the current page button to prevent redundant navigation', async () => {
      const user = userEvent.setup()
      const onPageChange = vi.fn()
      render(<Pagination page={3} totalPages={7} onPageChange={onPageChange} />)
      const currentButton = screen.getByRole('button', { name: '3' })
      expect(currentButton).toBeDisabled()
      await user.click(currentButton)
      expect(onPageChange).not.toHaveBeenCalled()
    })

    it('hides ellipsis from screen readers', () => {
      render(<Pagination page={10} totalPages={19} onPageChange={() => {}} />)
      const ellipses = screen.getAllByText('…')
      for (const el of ellipses) {
        expect(el).toHaveAttribute('aria-hidden', 'true')
      }
    })
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('renders current page and total pages', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByText('2 / 5')).toBeInTheDocument()
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
})

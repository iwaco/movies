import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { TagCloud } from './TagCloud'

const items = [
  { id: 1, name: 'Tag1' },
  { id: 2, name: 'Tag2' },
  { id: 3, name: 'Tag3' },
]

describe('TagCloud', () => {
  it('renders all items as buttons', () => {
    render(
      <TagCloud
        label="タグ"
        items={items}
        selectedItems={[]}
        onToggle={() => {}}
        onClear={() => {}}
      />
    )
    expect(screen.getByText('Tag1')).toBeInTheDocument()
    expect(screen.getByText('Tag2')).toBeInTheDocument()
    expect(screen.getByText('Tag3')).toBeInTheDocument()
  })

  it('renders label in header', () => {
    render(
      <TagCloud
        label="タグ"
        items={items}
        selectedItems={[]}
        onToggle={() => {}}
        onClear={() => {}}
      />
    )
    expect(screen.getByText('タグ')).toBeInTheDocument()
  })

  it('applies selected style to selected items', () => {
    render(
      <TagCloud
        label="タグ"
        items={items}
        selectedItems={['Tag1']}
        onToggle={() => {}}
        onClear={() => {}}
      />
    )
    const tag1Button = screen.getByRole('button', { name: 'Tag1' })
    expect(tag1Button.className).toMatch(/bg-rose-500/)
    const tag2Button = screen.getByRole('button', { name: 'Tag2' })
    expect(tag2Button.className).not.toMatch(/bg-rose-500/)
  })

  it('calls onToggle when item is clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(
      <TagCloud
        label="タグ"
        items={items}
        selectedItems={[]}
        onToggle={onToggle}
        onClear={() => {}}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Tag2' }))
    expect(onToggle).toHaveBeenCalledWith('Tag2')
  })

  it('shows selection count badge when items are selected', () => {
    render(
      <TagCloud
        label="タグ"
        items={items}
        selectedItems={['Tag1', 'Tag2']}
        onToggle={() => {}}
        onClear={() => {}}
      />
    )
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('does not show badge when no items selected', () => {
    render(
      <TagCloud
        label="タグ"
        items={items}
        selectedItems={[]}
        onToggle={() => {}}
        onClear={() => {}}
      />
    )
    expect(screen.queryByTestId('selection-count')).not.toBeInTheDocument()
  })

  it('toggles accordion open/close on header click', async () => {
    const user = userEvent.setup()
    render(
      <TagCloud
        label="タグ"
        items={items}
        selectedItems={[]}
        onToggle={() => {}}
        onClear={() => {}}
      />
    )
    // Initially closed
    const content = screen.getByTestId('accordion-content')
    expect(content.className).toMatch(/grid-rows-\[0fr\]/)

    // Click header to open
    await user.click(screen.getByTestId('accordion-header'))
    expect(content.className).toMatch(/grid-rows-\[1fr\]/)
  })

  it('shows clear button only when items are selected', async () => {
    const { rerender } = render(
      <TagCloud
        label="タグ"
        items={items}
        selectedItems={[]}
        onToggle={() => {}}
        onClear={() => {}}
      />
    )
    expect(screen.queryByRole('button', { name: 'クリア' })).not.toBeInTheDocument()

    rerender(
      <TagCloud
        label="タグ"
        items={items}
        selectedItems={['Tag1']}
        onToggle={() => {}}
        onClear={() => {}}
      />
    )
    expect(screen.getByRole('button', { name: 'クリア' })).toBeInTheDocument()
  })

  it('calls onClear when clear button is clicked', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    render(
      <TagCloud
        label="タグ"
        items={items}
        selectedItems={['Tag1']}
        onToggle={() => {}}
        onClear={onClear}
      />
    )
    await user.click(screen.getByRole('button', { name: 'クリア' }))
    expect(onClear).toHaveBeenCalled()
  })
})

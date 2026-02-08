import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { VideoPlayer } from './VideoPlayer'
import type { VideoFormat } from '../types/video'

const mockFormats: VideoFormat[] = [
  { id: 1, name: '720p', file_path: '/videos/video1/720p.mp4' },
  { id: 2, name: '1080p', file_path: '/videos/video1/1080p.mp4' },
]

describe('VideoPlayer', () => {
  it('renders video element', () => {
    render(<VideoPlayer formats={mockFormats} />)
    const video = document.querySelector('video')
    expect(video).toBeInTheDocument()
  })

  it('renders format select with options', () => {
    render(<VideoPlayer formats={mockFormats} />)
    expect(screen.getByLabelText('画質')).toBeInTheDocument()
    expect(screen.getByText('720p')).toBeInTheDocument()
    expect(screen.getByText('1080p')).toBeInTheDocument()
  })

  it('sets video source based on selected format', () => {
    render(<VideoPlayer formats={mockFormats} />)
    const video = document.querySelector('video source') as HTMLSourceElement
    expect(video.src).toContain('/media/videos/video1/720p.mp4')
  })

  it('changes video source when format is changed', async () => {
    const user = userEvent.setup()
    render(<VideoPlayer formats={mockFormats} />)
    const select = screen.getByLabelText('画質')
    await user.selectOptions(select, '1080p')
    const video = document.querySelector('video source') as HTMLSourceElement
    expect(video.src).toContain('/media/videos/video1/1080p.mp4')
  })

  it('renders nothing when formats is empty', () => {
    const { container } = render(<VideoPlayer formats={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('updates video source when formats prop changes', () => {
    const newFormats: VideoFormat[] = [
      { id: 10, name: '480p', file_path: '/videos/video2/480p.mp4' },
    ]
    const { rerender } = render(<VideoPlayer formats={mockFormats} />)
    rerender(<VideoPlayer formats={newFormats} />)
    const source = document.querySelector('video source') as HTMLSourceElement
    expect(source.src).toContain('/media/videos/video2/480p.mp4')
  })
})

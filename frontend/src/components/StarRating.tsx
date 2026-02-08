import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { setRating, removeRating } from '../api/client'

interface StarRatingProps {
  videoId: string
  rating: number
}

export function StarRating({ videoId, rating: initialRating }: StarRatingProps) {
  const [rating, setRatingState] = useState(initialRating)
  const [hoverRating, setHoverRating] = useState(0)

  const setMutation = useMutation({
    mutationFn: (newRating: number) => setRating(videoId, newRating),
    onError: () => setRatingState(initialRating),
  })

  const removeMutation = useMutation({
    mutationFn: () => removeRating(videoId),
    onError: () => setRatingState(initialRating),
  })

  const handleClick = (e: React.MouseEvent, star: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (star === rating) {
      setRatingState(0)
      removeMutation.mutate()
    } else {
      setRatingState(star)
      setMutation.mutate(star)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div
      role="group"
      aria-label="評価"
      className="flex"
      onMouseLeave={() => setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={(e) => handleClick(e, star)}
          onMouseEnter={() => setHoverRating(star)}
          aria-label={`★${star}`}
          aria-pressed={star <= rating}
          className="p-0.5 focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={star <= displayRating ? '#facc15' : 'none'}
            stroke={star <= displayRating ? '#facc15' : 'currentColor'}
            strokeWidth={1.5}
            className="w-5 h-5 dark:text-gray-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        </button>
      ))}
    </div>
  )
}

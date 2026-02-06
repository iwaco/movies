import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { addFavorite, removeFavorite } from '../api/client'

interface FavoriteButtonProps {
  videoId: string
  isFavorite: boolean
}

export function FavoriteButton({ videoId, isFavorite: initialFavorite }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite)

  const addMutation = useMutation({
    mutationFn: () => addFavorite(videoId),
    onMutate: () => setIsFavorite(true),
    onError: () => setIsFavorite(false),
  })

  const removeMutation = useMutation({
    mutationFn: () => removeFavorite(videoId),
    onMutate: () => setIsFavorite(false),
    onError: () => setIsFavorite(true),
  })

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isFavorite) {
      removeMutation.mutate()
    } else {
      addMutation.mutate()
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
      className="p-1"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isFavorite ? 'red' : 'none'}
        stroke={isFavorite ? 'red' : 'currentColor'}
        strokeWidth={2}
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  )
}

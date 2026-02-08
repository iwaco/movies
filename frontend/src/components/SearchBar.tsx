import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'

export function SearchBar() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') || '')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev)
        if (value) {
          params.set('q', value)
        } else {
          params.delete('q')
        }
        params.delete('page')
        return params
      })
    }, 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value, setSearchParams])

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="検索..."
      className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/15 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all duration-200"
    />
  )
}

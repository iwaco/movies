import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'

export function SearchBar() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') || '')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const setSearchParamsRef = useRef(setSearchParams)
  const isUserInputRef = useRef(false)

  useEffect(() => {
    setSearchParamsRef.current = setSearchParams
  }, [setSearchParams])

  // URL側のqパラメータ変化にvalueを同期（ブラウザバック等）
  const urlQ = searchParams.get('q') || ''
  useEffect(() => {
    setValue(urlQ)
  }, [urlQ])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!isUserInputRef.current) return

    timerRef.current = setTimeout(() => {
      isUserInputRef.current = false
      setSearchParamsRef.current((prev) => {
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
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isUserInputRef.current = true
    setValue(e.target.value)
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder="検索..."
      className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/15 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all duration-200"
    />
  )
}

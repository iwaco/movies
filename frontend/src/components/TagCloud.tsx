import { useState } from 'react'

interface TagCloudProps {
  label: string
  items: { id: number; name: string }[]
  selectedItems: string[]
  onToggle: (name: string) => void
  onClear: () => void
}

export function TagCloud({ label, items, selectedItems, onToggle, onClear }: TagCloudProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        data-testid="accordion-header"
        className="flex items-center gap-2 w-full text-left py-1 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-gray-700 dark:text-gray-300 font-medium">{label}</span>
        {selectedItems.length > 0 && (
          <span
            data-testid="selection-count"
            className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-rose-500 rounded-full"
          >
            {selectedItems.length}
          </span>
        )}
        <svg
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ml-auto ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        data-testid="accordion-content"
        className={`grid transition-[grid-template-rows] duration-200 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] invisible'}`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap gap-2 pt-2 pb-1">
            {items.map((item) => {
              const isSelected = selectedItems.includes(item.name)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggle(item.name)}
                  className={`px-3 py-1 rounded-full text-sm transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500/80 text-white'
                      : 'bg-white/60 dark:bg-white/10 backdrop-blur-md text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-white/20'
                  }`}
                >
                  {item.name}
                </button>
              )
            })}
            {selectedItems.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="px-3 py-1 rounded-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200 cursor-pointer"
              >
                クリア
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center gap-4 justify-center py-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-4 py-1.5 rounded-lg bg-white/60 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/10 text-gray-900 dark:text-gray-100 hover:bg-white/80 dark:hover:bg-white/20 disabled:opacity-50 transition-colors duration-200 cursor-pointer"
      >
        前へ
      </button>
      <span className="text-gray-900 dark:text-gray-100">{page} / {totalPages}</span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-4 py-1.5 rounded-lg bg-white/60 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/10 text-gray-900 dark:text-gray-100 hover:bg-white/80 dark:hover:bg-white/20 disabled:opacity-50 transition-colors duration-200 cursor-pointer"
      >
        次へ
      </button>
    </div>
  )
}

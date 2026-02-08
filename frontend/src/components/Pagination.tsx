interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function getPageNumbers(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5, '…', totalPages]
  }

  if (page >= totalPages - 3) {
    return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, '…', page - 1, page, page + 1, '…', totalPages]
}

const buttonBase =
  'px-4 py-1.5 rounded-lg backdrop-blur-sm border transition-colors duration-200 cursor-pointer'
const buttonNormal =
  `${buttonBase} bg-white/60 dark:bg-white/10 border-white/30 dark:border-white/10 text-gray-900 dark:text-gray-100 hover:bg-white/80 dark:hover:bg-white/20 disabled:opacity-50`
const buttonActive =
  `${buttonBase} bg-blue-500 border-blue-500 text-white`

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <nav aria-label="ページネーション" className="flex items-center gap-2 justify-center py-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={buttonNormal}
      >
        前へ
      </button>
      {pageNumbers.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} aria-hidden="true" className="px-2 text-gray-900 dark:text-gray-100">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            disabled={p === page}
            aria-current={p === page ? 'page' : undefined}
            className={p === page ? buttonActive : buttonNormal}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={buttonNormal}
      >
        次へ
      </button>
    </nav>
  )
}

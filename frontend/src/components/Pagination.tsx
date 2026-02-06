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
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        前へ
      </button>
      <span>{page} / {totalPages}</span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        次へ
      </button>
    </div>
  )
}

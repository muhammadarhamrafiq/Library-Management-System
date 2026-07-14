export interface Book {
  id: number
  title: string
  author: string
  isbn: string | null
  description: string | null
  price: number | null
  publisher: string | null
  published_year: number | null
  total_copies: number
  available_copies: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface BookCreate {
  title: string
  author: string
  isbn?: string | null
  description?: string | null
  price?: number | null
  publisher?: string | null
  published_year?: number | null
  total_copies: number
}

export type BookUpdate = Partial<BookCreate>

export interface BookListParams {
  search_query?: string
  author?: string
  title?: string
  publisher?: string
  published_year?: number
  isbn?: string
  available?: boolean
  sortBy?: string
  sortOrder?: "asc" | "desc"
  skip?: number
  limit?: number
}

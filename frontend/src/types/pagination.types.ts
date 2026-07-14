export interface PaginatedResponse<T> {
  data: T[]
  total: number
  skip: number
  limit: number
  page: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

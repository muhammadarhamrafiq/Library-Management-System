import { api } from "./axios"
import type { Book, BookCreate, BookListParams, BookUpdate } from "@/types/book.types"
import type { PaginatedResponse } from "@/types/pagination.types"

export const booksApi = {
  // list_books returns a full pagination envelope, not a bare array
  list: (params?: BookListParams) =>
    api
      .get<PaginatedResponse<Book>>("/books", { params })
      .then((res) => res.data),

  // also paginated — router only exposes search_query, skip/limit default
  // server-side (0/10) since they aren't accepted as query params here
  listDeleted: (search_query?: string) =>
    api
      .get<PaginatedResponse<Book>>("/books/deleted", { params: { search_query } })
      .then((res) => res.data),

  getDeleted: (bookId: number) =>
    api.get<Book>(`/books/deleted/${bookId}`).then((res) => res.data),

  getById: (bookId: number) => api.get<Book>(`/books/${bookId}`).then((res) => res.data),

  create: (data: BookCreate) => api.post<Book>("/books", data).then((res) => res.data),

  update: (bookId: number, data: BookUpdate) =>
    api.put<Book>(`/books/${bookId}`, data).then((res) => res.data),

  delete: (bookId: number) =>
    api.delete<{ message: string }>(`/books/${bookId}`).then((res) => res.data),

  restore: (bookId: number) =>
    api.post<Book>(`/books/${bookId}/restore`).then((res) => res.data),
}

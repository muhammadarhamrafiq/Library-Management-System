import { z } from "zod"

export const bookFormSchema = z.object({
  title: z.string().min(2, "Enter a title"),
  author: z.string().min(2, "Enter an author"),
  isbn: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().optional().or(z.literal("")),
  price: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === "") return null
      const parsed = typeof value === "number" ? value : Number(value)
      return Number.isNaN(parsed) ? null : parsed
    }),
  publisher: z.string().trim().optional().or(z.literal("")),
  published_year: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === "") return null
      const parsed = typeof value === "number" ? value : Number(value)
      return Number.isNaN(parsed) ? null : parsed
    }),
  total_copies: z
    .union([z.string(), z.number()])
    .refine((value) => value !== "", { message: "Enter total copies" })
    .transform((value) => Number(value)),
})

export type BookFormValues = z.infer<typeof bookFormSchema>

export const borrowBookSchema = z.object({
  book_id: z.number().int().positive(),
})
export type BorrowBookFormValues = z.infer<typeof borrowBookSchema>
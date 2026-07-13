import { createBrowserRouter } from "react-router-dom"

import { ProtectedRoute } from "./ProtectedRoute"
import { RoleGuard } from "./RoleGuard"
import { RootRedirect } from "./RootRedirect"

import LoginPage from "@/pages/public/LoginPage"
import RegisterPage from "@/pages/public/RegisterPage"
import RegisterVerifyPage from "@/pages/public/RegisterVerifyPage"
import ForgotPasswordPage from "@/pages/public/ForgotPasswordPage"
import ForgotPasswordVerifyPage from "@/pages/public/ForgotPasswordVerifyPage"
import ForgotPasswordResetPage from "@/pages/public/ForgotPasswordResetPage"
import BooksCatalogPage from "@/pages/public/BooksCatalogPage"
import BookDetailPage from "@/pages/public/BookDetailPage"

import DashboardPage from "@/pages/shared/DashboardPage"
import ProfilePage from "@/pages/shared/ProfilePage"

import MyLoansPage from "@/pages/member/MyLoansPage"

import ManageBooksPage from "@/pages/librarian/ManageBooksPage"
import DeletedBooksPage from "@/pages/librarian/DeletedBooksPage"
import ManageLoansPage from "@/pages/librarian/ManageLoansPage"

import ManageUsersPage from "@/pages/admin/ManageUsersPage"

import NotFoundPage from "@/pages/NotFoundPage"
import UnauthorizedPage from "@/pages/UnauthorizedPage"

export const router = createBrowserRouter([
  { path: "/", element: <RootRedirect /> },

  // --- Public ---
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/register/verify", element: <RegisterVerifyPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/forgot-password/verify", element: <ForgotPasswordVerifyPage /> },
  { path: "/forgot-password/reset", element: <ForgotPasswordResetPage /> },
  { path: "/books", element: <BooksCatalogPage /> },
  { path: "/books/:id", element: <BookDetailPage /> },

  // --- Authenticated (any role) ---
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/profile", element: <ProfilePage /> },

      // Member only
      {
        element: <RoleGuard allowedRoles={["member"]} />,
        children: [{ path: "/my-loans", element: <MyLoansPage /> }],
      },

      // Librarian + admin
      {
        element: <RoleGuard allowedRoles={["librarian", "admin"]} />,
        children: [
          { path: "/manage/books", element: <ManageBooksPage /> },
          { path: "/manage/books/deleted", element: <DeletedBooksPage /> },
          { path: "/manage/loans", element: <ManageLoansPage /> },
        ],
      },

      // Admin only
      {
        element: <RoleGuard allowedRoles={["admin"]} />,
        children: [{ path: "/manage/users", element: <ManageUsersPage /> }],
      },
    ],
  },

  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "*", element: <NotFoundPage /> },
])

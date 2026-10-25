import { lazy, Suspense } from "react"
import { BrowserRouter, Route, Routes } from "react-router"
import { AppLayout } from "@/components/layout/app-layout"
import { AlertsSkeleton } from "@/features/alerts/components/alerts-skeleton"
import TodayPage from "@/pages/today-page"
import NotFoundPage from "@/pages/not-found-page"

const HistoryPage = lazy(() => import("@/pages/history-page"))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<TodayPage />} />
          <Route
            path="history"
            element={
              <Suspense fallback={<AlertsSkeleton />}>
                <HistoryPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

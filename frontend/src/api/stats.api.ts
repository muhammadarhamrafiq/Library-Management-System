import { api } from "./axios"
import type { DailyStatistics } from "@/types/stats.types"

// get_daily_stats() lazily creates today's row if it doesn't exist yet,
// so this always resolves with real data (not null) once the request succeeds.
export const statsApi = {
  getDaily: () => api.get<DailyStatistics>("/stats/daily").then((res) => res.data),
}

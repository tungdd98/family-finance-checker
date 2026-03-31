// src/lib/server-queries.ts
// Server-only cached query layer. Do NOT import this from client components.
import { unstable_cache } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  getActiveGoldAssets,
  getAllGoldAssets,
  getExternalGoldPrices,
} from "@/lib/services/gold";
import { getSavingsAccounts } from "@/lib/services/savings";
import { getGoal, getCashFlow, getMonthlyActual } from "@/lib/services/goals";
import { getSettings } from "@/lib/services/settings";
import { getNotificationsAction } from "@/app/actions/notifications";

export { getExternalGoldPrices };

export function cachedGetActiveGoldAssets(userId: string) {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      return getActiveGoldAssets(supabase, userId);
    },
    [`gold-assets-${userId}`],
    { tags: [`user-${userId}`], revalidate: 30 }
  )();
}

export function cachedGetAllGoldAssets(userId: string) {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      return getAllGoldAssets(supabase, userId);
    },
    [`gold-assets-all-${userId}`],
    { tags: [`user-${userId}`], revalidate: 30 }
  )();
}

export function cachedGetSavingsAccounts(userId: string) {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      return getSavingsAccounts(supabase, userId);
    },
    [`savings-${userId}`],
    { tags: [`user-${userId}`], revalidate: 30 }
  )();
}

export function cachedGetGoal(userId: string) {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      return getGoal(supabase, userId);
    },
    [`goal-${userId}`],
    { tags: [`user-${userId}`], revalidate: 30 }
  )();
}

export function cachedGetCashFlow(userId: string) {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      return getCashFlow(supabase, userId);
    },
    [`cashflow-${userId}`],
    { tags: [`user-${userId}`], revalidate: 30 }
  )();
}

export function cachedGetMonthlyActual(
  userId: string,
  year: number,
  month: number
) {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      return getMonthlyActual(supabase, userId, year, month);
    },
    [`monthly-${userId}-${year}-${month}`],
    { tags: [`user-${userId}`], revalidate: 30 }
  )();
}

export function cachedGetSettings(userId: string) {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      return getSettings(supabase, userId);
    },
    [`settings-${userId}`],
    { tags: [`user-${userId}`], revalidate: 30 }
  )();
}

export { getNotificationsAction };

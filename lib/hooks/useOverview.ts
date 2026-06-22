import { useQuery, useQueries } from "@tanstack/react-query";
import { api } from "../api";
import type { YearOverview, MonthOverview } from "../types";

export function useYearOverview(householdId: number | null, year: number) {
  return useQuery<YearOverview>({
    queryKey: ["overview", "year", householdId, year],
    queryFn: async () => {
      const res = await api.get(
        `/api/v1/households/${householdId}/year/${year}`,
      );
      return res.data;
    },
    enabled: householdId != null,
  });
}

export function useMonthOverview(
  householdId: number | null,
  year: number,
  month: number,
) {
  return useQuery<MonthOverview>({
    queryKey: ["overview", "month", householdId, year, month],
    queryFn: async () => {
      const res = await api.get(
        `/api/v1/households/${householdId}/year/${year}/month/${month}`,
      );
      return res.data;
    },
    enabled: householdId != null,
  });
}

/** Fetches all 12 month overviews in parallel and returns per-month total_debt. */
export function useYearMonthlyDebt(householdId: number | null, year: number) {
  const results = useQueries({
    queries: Array.from({ length: 12 }, (_, i) => ({
      queryKey: ["overview", "month", householdId, year, i + 1],
      queryFn: async () => {
        const res = await api.get(
          `/api/v1/households/${householdId}/year/${year}/month/${i + 1}`,
        );
        return res.data as MonthOverview;
      },
      enabled: householdId != null,
    })),
  });

  return {
    data: results.map((r) => r.data?.total_debt ?? 0),
    isLoading: results.some((r) => r.isLoading),
  };
}

/** Fetches all 12 month overviews in parallel and returns per-month portfolio_value. */
export function useYearMonthlyPortfolio(
  householdId: number | null,
  year: number,
) {
  const results = useQueries({
    queries: Array.from({ length: 12 }, (_, i) => ({
      queryKey: ["overview", "month", householdId, year, i + 1],
      queryFn: async () => {
        const res = await api.get(
          `/api/v1/households/${householdId}/year/${year}/month/${i + 1}`,
        );
        return res.data as MonthOverview;
      },
      enabled: householdId != null,
    })),
  });

  return {
    data: results.map((r) => r.data?.portfolio_value ?? 0),
    isLoading: results.some((r) => r.isLoading),
  };
}

/** Fetches year overviews for all households and sums them up. */
export function useAllHouseholdsYearOverview(
  householdIds: number[],
  year: number,
) {
  const results = useQueries({
    queries: householdIds.map((id) => ({
      queryKey: ["overview", "year", id, year],
      queryFn: async () => {
        const res = await api.get(`/api/v1/households/${id}/year/${year}`);
        return res.data as YearOverview;
      },
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const perHousehold = isLoading
    ? []
    : householdIds.map((id, i) => ({
        id,
        overview: results[i].data ?? null,
      }));
  const data = isLoading
    ? null
    : {
        total_income: results.reduce(
          (sum, r) => sum + (r.data?.total_income ?? 0),
          0,
        ),
        total_expenses: results.reduce(
          (sum, r) => sum + (r.data?.total_expenses ?? 0),
          0,
        ),
        net_savings: results.reduce(
          (sum, r) => sum + (r.data?.net_savings ?? 0),
          0,
        ),
        portfolio_value: results.reduce(
          (sum, r) => sum + (r.data?.portfolio_value ?? 0),
          0,
        ),
        total_debt: results.reduce(
          (sum, r) => sum + (r.data?.total_debt ?? 0),
          0,
        ),
        net_worth: results.reduce(
          (sum, r) => sum + (r.data?.net_worth ?? 0),
          0,
        ),
      };

  return { data, perHousehold, isLoading };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Household } from "../types";

export function useHouseholds() {
  return useQuery<Household[]>({
    queryKey: ["households"],
    queryFn: async () => {
      const res = await api.get("/api/v1/households/");
      return res.data;
    },
  });
}

export function useCreateHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      currency,
    }: {
      name: string;
      currency: string;
    }) => {
      const res = await api.post("/api/v1/households/", { name, currency });
      return res.data as Household;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["households"] });
    },
  });
}

export function useRenameHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await api.put(`/api/v1/households/${id}`, { name });
      return res.data as Household;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["households"] });
    },
  });
}

// Generate (or regenerate) an invite token for a household
export function useGenerateInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (householdId: number) => {
      const res = await api.post(`/api/v1/households/${householdId}/invite`);
      return res.data as Household;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["households"] });
    },
  });
}

// Look up a household by invite token (public – no auth needed)
export function useHouseholdByToken(token: string | null) {
  return useQuery<Household>({
    queryKey: ["household-invite", token],
    queryFn: async () => {
      const res = await api.get(`/api/v1/households/join/${token}`);
      return res.data as Household;
    },
    enabled: !!token,
    retry: false,
  });
}

// Join a household via an invite token
export function useJoinHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await api.post(`/api/v1/households/join/${token}`);
      return res.data as Household;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["households"] });
    },
  });
}

// Delete a household entirely
export function useDeleteHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/households/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["households"] });
    },
  });
}

// Leave a household (remove current user; other members stay)
export function useLeaveHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/households/${id}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["households"] });
    },
  });
}

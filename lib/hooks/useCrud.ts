import { useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "../api";

// ─── URL Helpers ──────────────────────────────────────────────────────────────

type Entity = "income" | "expense" | "asset" | "liability";

function listUrl(hid: number, y: number, m: number, entity: Entity): string {
  return `/api/v1/households/${hid}/year/${y}/month/${m}/${entity}/`;
}

function detailUrl(
  hid: number,
  y: number,
  m: number,
  entity: Entity,
  id: number,
): string {
  return `/api/v1/households/${hid}/year/${y}/month/${m}/${entity}/${id}`;
}

// ─── Shared invalidation hook ─────────────────────────────────────────────────

function useInvalidate(hid: number, year: number, month: number) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["overview", "month", hid, year, month] });
    qc.invalidateQueries({ queryKey: ["overview", "year", hid, year] });
  };
}

// ─── Shared body types ────────────────────────────────────────────────────────

interface SimpleFields {
  title: string;
  amount: number;
}

export interface AssetFields {
  title: string;
  ticker?: string | null;
  amount?: number | null;
  bought_price?: number | null;
  current_price?: number | null;
}

// ─── Income ───────────────────────────────────────────────────────────────────

export function useCreateIncome(hid: number, year: number, month: number) {
  const invalidate = useInvalidate(hid, year, month);
  return useMutation({
    mutationFn: (body: SimpleFields) =>
      api.post(listUrl(hid, year, month, "income"), body),
    onSuccess: invalidate,
  });
}

export function useUpdateIncome(hid: number, year: number, month: number) {
  const invalidate = useInvalidate(hid, year, month);
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number } & SimpleFields) =>
      api.put(detailUrl(hid, year, month, "income", id), body),
    onSuccess: invalidate,
  });
}

export function useDeleteIncome(hid: number, year: number, month: number) {
  const invalidate = useInvalidate(hid, year, month);
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(detailUrl(hid, year, month, "income", id)),
    onSuccess: invalidate,
  });
}

// ─── Expense ──────────────────────────────────────────────────────────────────

export function useCreateExpense(hid: number, year: number, month: number) {
  const invalidate = useInvalidate(hid, year, month);
  return useMutation({
    mutationFn: (body: SimpleFields) =>
      api.post(listUrl(hid, year, month, "expense"), body),
    onSuccess: invalidate,
  });
}

export function useUpdateExpense(hid: number, year: number, month: number) {
  const invalidate = useInvalidate(hid, year, month);
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number } & SimpleFields) =>
      api.put(detailUrl(hid, year, month, "expense", id), body),
    onSuccess: invalidate,
  });
}

export function useDeleteExpense(hid: number, year: number, month: number) {
  const invalidate = useInvalidate(hid, year, month);
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(detailUrl(hid, year, month, "expense", id)),
    onSuccess: invalidate,
  });
}

// ─── Asset ────────────────────────────────────────────────────────────────────

export function useCreateAsset(hid: number, year: number, month: number) {
  const invalidate = useInvalidate(hid, year, month);
  return useMutation({
    mutationFn: (body: AssetFields) =>
      api.post(listUrl(hid, year, month, "asset"), body),
    onSuccess: invalidate,
  });
}

export function useUpdateAsset(hid: number, year: number, month: number) {
  const invalidate = useInvalidate(hid, year, month);
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number } & AssetFields) =>
      api.put(detailUrl(hid, year, month, "asset", id), body),
    onSuccess: invalidate,
  });
}

export function useDeleteAsset(hid: number, year: number, month: number) {
  const invalidate = useInvalidate(hid, year, month);
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(detailUrl(hid, year, month, "asset", id)),
    onSuccess: invalidate,
  });
}

// ─── Liability ────────────────────────────────────────────────────────────────

export function useCreateLiability(hid: number, year: number, month: number) {
  const invalidate = useInvalidate(hid, year, month);
  return useMutation({
    mutationFn: (body: SimpleFields) =>
      api.post(listUrl(hid, year, month, "liability"), body),
    onSuccess: invalidate,
  });
}

export function useUpdateLiability(hid: number, year: number, month: number) {
  const invalidate = useInvalidate(hid, year, month);
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number } & SimpleFields) =>
      api.put(detailUrl(hid, year, month, "liability", id), body),
    onSuccess: invalidate,
  });
}

export function useDeleteLiability(hid: number, year: number, month: number) {
  const invalidate = useInvalidate(hid, year, month);
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(detailUrl(hid, year, month, "liability", id)),
    onSuccess: invalidate,
  });
}

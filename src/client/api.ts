import type {
  BomNode,
  FilterOptions,
  Part,
  PartDetail,
  PartFilters,
} from "./types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const payload = (await response.json()) as T | { error: string };

  if (!response.ok) {
    throw new Error(
      "error" in (payload as { error?: string })
        ? (payload as { error: string }).error
        : "The request failed.",
    );
  }

  return payload as T;
}

export function getParts(
  filters: PartFilters,
  limit: number,
  signal?: AbortSignal,
): Promise<{ data: Part[]; count: number }> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  params.set("limit", String(limit));

  return request(
    `/api/parts?${params.toString()}`,
    signal ? { signal } : undefined,
  );
}

export function getFilterOptions(signal?: AbortSignal): Promise<FilterOptions> {
  return request("/api/parts/options", signal ? { signal } : undefined);
}

export function getPart(id: string, signal?: AbortSignal): Promise<PartDetail> {
  return request(
    `/api/parts/${encodeURIComponent(id)}`,
    signal ? { signal } : undefined,
  );
}

export function confirmPart(id: string): Promise<PartDetail> {
  return request(`/api/parts/${encodeURIComponent(id)}/confirm`, {
    method: "POST",
  });
}

export function getBomNodes(
  id: string,
  signal?: AbortSignal,
): Promise<{ data: BomNode[] }> {
  return request(
    `/api/parts/${encodeURIComponent(id)}/bom`,
    signal ? { signal } : undefined,
  );
}

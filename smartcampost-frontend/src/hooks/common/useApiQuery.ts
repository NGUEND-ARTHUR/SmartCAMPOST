import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useApiClient } from "./useApiClient";

type QueryKey = readonly unknown[];

export function useFetchList<TData = unknown>(
  key: QueryKey,
  url: string,
  params?: Record<string, unknown>,
  options?: Omit<
    UseQueryOptions<TData, AxiosError, TData, QueryKey>,
    "queryKey" | "queryFn"
  >
) {
  const client = useApiClient();
  return useQuery<TData, AxiosError>({
    queryKey: key,
    queryFn: async () => {
      const { data } = await client.get<TData>(url, { params });
      return data;
    },
    ...options,
  });
}

export function useFetchOne<TData = unknown>(
  key: QueryKey,
  url: string,
  options?: Omit<
    UseQueryOptions<TData, AxiosError, TData, QueryKey>,
    "queryKey" | "queryFn"
  >
) {
  const client = useApiClient();
  return useQuery<TData, AxiosError>({
    queryKey: key,
    queryFn: async () => {
      const { data } = await client.get<TData>(url);
      return data;
    },
    ...options,
  });
}

export function useCreate<TBody = unknown, TData = unknown>(
  url: string,
  options?: UseMutationOptions<TData, AxiosError, TBody>
) {
  const client = useApiClient();
  return useMutation<TData, AxiosError, TBody>({
    mutationFn: async (body: TBody) => {
      const { data } = await client.post<TData>(url, body);
      return data;
    },
    ...options,
  });
}

export function useUpdate<TBody = unknown, TData = unknown>(
  url: string,
  options?: UseMutationOptions<TData, AxiosError, TBody>
) {
  const client = useApiClient();
  return useMutation<TData, AxiosError, TBody>({
    mutationFn: async (body: TBody) => {
      const { data } = await client.patch<TData>(url, body);
      return data;
    },
    ...options,
  });
}

export function useDelete<TData = unknown>(
  url: string,
  options?: UseMutationOptions<TData, AxiosError, void>
) {
  const client = useApiClient();
  return useMutation<TData, AxiosError, void>({
    mutationFn: async () => {
      const { data } = await client.delete<TData>(url);
      return data;
    },
    ...options,
  });
}



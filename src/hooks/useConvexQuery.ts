import { useQuery, useMutation, useAction } from 'convex/react';
import type { FunctionReference } from 'convex/server';

/**
 * Simple hook pattern for Convex queries with loading states
 *
 * Usage:
 *   const { data, isLoading, error } = useConvexQuery(
 *     api.your.queryFunction,
 *     { param: value }
 *   );
 */

export function useConvexQuery<T, Args extends Record<string, unknown>>(
  query: FunctionReference<"query", Args, T>,
  args: Args,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  const result = useQuery(
    query,
    args,
    {
      ...(options?.enabled !== undefined && { enabled: options.enabled }),
      ...(options?.refetchInterval && { refetchInterval: options.refetchInterval }),
    }
  );

  return {
    data: result.data ?? null,
    isLoading: result.isLoading,
    error: result.error,
  };
}

/**
 * Simple hook pattern for Convex mutations with loading states
 *
 * Usage:
 *   const { mutate, isLoading, error } = useConvexMutation(
 *     api.your.mutationFunction
 *   );
 *
 *   await mutate({ param: value });
 */

export function useConvexMutation<T, Args extends Record<string, unknown>>(
  mutation: FunctionReference<"mutation", Args, T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: unknown) => void;
  }
) {
  const [optimisticData, setOptimisticData] = React.useState<T | null>(null);

  const result = useMutation(mutation, {
    optimisticUpdate: optimisticData
      ? (localCtx, globalCtx) => {
          return {
              [mutation]: optimisticData as any,
            };
        }
      : undefined,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  const mutate = React.useCallback(
    async (args: Args) => {
      setOptimisticData(null);
      const data = await result.mutate(args);
      return data;
    },
    [result.mutate]
  );

  return {
    mutate,
    isLoading: result.isLoading,
    error: result.error,
    isSuccess: result.status === 'success',
    optimisticData,
  };
}

/**
 * Simple hook pattern for Convex actions
 *
 * Usage:
 *   const { run, isLoading, error } = useConvexAction(
 *     api.your.actionFunction
 *   );
 *
 *   await run({ param: value });
 */

export function useConvexAction<T, Args extends Record<string, unknown>>(
  action: FunctionReference<"action", Args, T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: unknown) => void;
  }
) {
  const result = useAction(action, {
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  const run = React.useCallback(
    async (args: Args) => {
      return await result(args);
    },
    [result]
  );

  return {
    run,
    isLoading: result.isLoading,
    error: result.error,
    data: result.data,
  };
}

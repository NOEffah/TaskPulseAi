// src/features/tasks/api/use-bulk-update-tasks.ts

import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";

// This type is for your bulk-update endpoint
type ResponseType = InferResponseType<typeof client.api.tasks["bulk-update"]["$post"]>;
type RequestType = InferRequestType<typeof client.api.tasks["bulk-update"]["$post"]>;

export const useBulkUpdateTasks = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    ResponseType,
    Error,
    RequestType
  >({
    mutationFn: async ({ json }) => {
      const response = await client.api.tasks["bulk-update"]["$post"]({ json });

      if (!response.ok) {
        throw new Error(`Bulk updating tasks failed`);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Tasks updated successfully");
      // Invalidate relevant queries to refetch data after the update
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      // You may also want to invalidate related queries, like for projects
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => {
      toast.error(`Error updating tasks`);
    },
  });

  return mutation;
};
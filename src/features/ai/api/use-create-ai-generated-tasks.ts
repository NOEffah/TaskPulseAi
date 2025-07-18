// src/features/ai/api/use-create-ai-generated-tasks.ts (or similar file)
// This file would be a client component (implicitly or explicitly with "use client")

import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc";

// Define the response type for your /api/ai/generate-tasks endpoint
// Assuming it returns an array of enriched tasks (Task & { assignee: Member })
// You might need to adjust the path based on your actual Hono client setup.
// For example, if client.api.ai maps to /api/ai, then:
type ResponseType = InferResponseType<typeof client.api.ai["generate-tasks"]["$post"]>;
type RequestType = InferRequestType<typeof client.api.ai["generate-tasks"]["$post"]>;

export const useGenerateTasksAI = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    ResponseType,
    Error, // Type of the error that can be thrown by mutationFn
    RequestType // Type of the variables passed to mutateFn
  >({
    mutationFn: async ({ json }) => { // Change 'form' to 'json' because your API expects JSON body
      // Ensure the path here matches how your Hono client is configured
      // If client.api.ai.generate-tasks maps to /api/ai/generate-tasks:
      const response = await client.api.ai["generate-tasks"]["$post"]({ json });

      if (!response.ok) {
        // Parse the error message from the response if available
        const errorData = await response.json();
        throw new Error(errorData.error || `AI task generation failed: ${response.statusText}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success("AI tasks generated successfully ✅");
      // Invalidate queries that fetch tasks or projects to reflect new tasks
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] }); // If project task count might change
      // You might also invalidate members if projectIds on members are affected
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (error) => {
      // Display the specific error message from the thrown error
      toast.error(`Error generating AI tasks: ${error.message}`);
    },
  });

  return mutation;
};
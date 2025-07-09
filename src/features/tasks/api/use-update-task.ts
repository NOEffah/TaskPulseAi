import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc"; 
import { useQueryClient } from "@tanstack/react-query";	


type ResponseType = InferResponseType<typeof client.api.tasks[":taskId"]["$patch"], 201>;
type RequestType = InferRequestType<typeof client.api.tasks[":taskId"]["$patch"]>;

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
  ResponseType, 
  Error, 
  RequestType
  >({
    mutationFn: async ({ json, param }) => {
      const response = await client.api.tasks[":taskId"]["$patch"]({ json, param });

      if(!response.ok) {
        throw new Error(`Updating task failed`);
      }
      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Task updated ✅");


      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", data.$id] });

    },
    onError: () => {
      toast.error(`Error updating task`);
    },
  });

  return mutation;
};

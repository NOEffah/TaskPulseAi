import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc"; 
import { useQueryClient } from "@tanstack/react-query";	

type ResponseType = InferResponseType<typeof client.api.tasks["$post"], 201>;
type RequestType = InferRequestType<typeof client.api.tasks["$post"]>;

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
  ResponseType, 
  Error, 
  RequestType
  >({
    mutationFn: async ({ json }) => {
      const response = await client.api.tasks["$post"]({ json });

      if(!response.ok) {
        throw new Error(`Creating task failed`);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Task created ✅");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });

    },
    onError: () => {
      toast.error(`Error creating task`);
    },
  });

  return mutation;
};

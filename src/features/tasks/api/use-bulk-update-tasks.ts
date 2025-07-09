import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc"; 
import { useQueryClient } from "@tanstack/react-query";	


type ResponseType = InferResponseType<typeof client.api.tasks["bulk-update"]["$post"], 201>;
type RequestType = InferRequestType<typeof client.api.tasks["bulk-update"]["$post"]>;

export const useBulkUpdateTask = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
  ResponseType, 
  Error, 
  RequestType
  >({
    mutationFn: async ({ json }) => {
      const response = await client.api.tasks["bulk-update"]["$post"]({ json });

      if(!response.ok) {
        throw new Error(`Updating tasks failed`);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Tasks updated ✅");

      queryClient.invalidateQueries({ queryKey: ["tasks"] });

    },
    onError: () => {
      toast.error(`Error updating tasks`);
    },
  });

  return mutation;
};

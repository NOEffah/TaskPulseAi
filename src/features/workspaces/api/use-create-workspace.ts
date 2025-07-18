import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc"; // ✅ this import is essential
import { useQueryClient } from "@tanstack/react-query";	

type ResponseType = InferResponseType<typeof client.api.workspaces["$post"]>;
type RequestType = InferRequestType<typeof client.api.workspaces["$post"]>;

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
  ResponseType, 
  Error, 
  RequestType
  >({
    mutationFn: async ({ form }) => {
      const response = await client.api.workspaces["$post"]({ form });

      if(!response.ok) {
        throw new Error(`Creating workspace failed: ${response.statusText}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Workspace created ✅");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });

    },
    onError: () => {
      toast.error(`Error creating workspace`);
    },
  });

  return mutation;
};

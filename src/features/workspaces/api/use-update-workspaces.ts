import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc"; // ✅ this import is essential
import { useQueryClient } from "@tanstack/react-query";	
import { useRouter } from "next/navigation";

type ResponseType = InferResponseType<typeof client.api.workspaces[":workspaceId"]["$patch"], 200>;
type RequestType = InferRequestType<typeof client.api.workspaces[":workspaceId"]["$patch"]>;

export const useUpdateWorkspace = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation<
  ResponseType, 
  Error, 
  RequestType
  >({
    mutationFn: async ({ form, param }) => {
      const response = await client.api.workspaces[":workspaceId"]["$patch"]({ form, param });

      if(!response.ok) {
        throw new Error(`Updating workspace failed: ${response.statusText}`);
      }
      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Workspace Updated ✅");
      router.refresh();
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", data.$id]})
    },
    onError: () => {
      toast.error(`Error updating workspace`);
    },
  });

  return mutation;
};

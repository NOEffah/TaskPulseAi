import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc"; 
import { useQueryClient } from "@tanstack/react-query";	

type ResponseType = InferResponseType<typeof client.api.members[":memberId"]["$delete"], 200>;
type RequestType = InferRequestType<typeof client.api.members[":memberId"]["$delete"]>;

export const useDeleteMember = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
  ResponseType, 
  Error, 
  RequestType
  >({
    mutationFn: async ({ param }) => {
      const response = await client.api.members[":memberId"]["$delete"]({ param });

      if(!response.ok) {
        throw new Error(`Deleting member failed: ${response.statusText}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Member Deleted ✅");
      queryClient.invalidateQueries({ queryKey: ["members"] });

    },
    onError: () => {
      toast.error(`Error deleting member`);
    },
  });

  return mutation;
};

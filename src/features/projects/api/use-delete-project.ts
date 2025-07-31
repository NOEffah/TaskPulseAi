import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc"; 
import { useQueryClient } from "@tanstack/react-query";	


type ResponseType = InferResponseType<typeof client.api.projects[":projectId"]["$delete"], 200>;
type RequestType = InferRequestType<typeof client.api.projects[":projectId"]["$delete"]>;

export const useDeleteProject = () => {
  
  const queryClient = useQueryClient();

  const mutation = useMutation<
  ResponseType, 
  Error, 
  RequestType
  >({
    mutationFn: async ({  param }) => {
      const response = await client.api.projects[":projectId"]["$delete"]({ param });

      if(!response.ok) {
        throw new Error(`Deleting project failed: ${response.statusText}`);
      }
      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Project deleted ✅");
      
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", data.$id] });
    },
    onError: () => {
      toast.error(`Error deleting project`);
    },
  });

  return mutation;
};

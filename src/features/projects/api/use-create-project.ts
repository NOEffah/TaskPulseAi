import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { client } from "@/lib/rpc"; 
import { useQueryClient } from "@tanstack/react-query";	

type ResponseType = InferResponseType<typeof client.api.projects["$post"], 200>;
type RequestType = InferRequestType<typeof client.api.projects["$post"]>;

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
  ResponseType, 
  Error, 
  RequestType
  >({
    mutationFn: async ({ form }) => {
      const response = await client.api.projects["$post"]({ form });

      if(!response.ok) {
        throw new Error(`Creating project failed: ${response.statusText}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Project created ✅");
      queryClient.invalidateQueries({ queryKey: ["projects"] });

    },
    onError: () => {
      toast.error(`Error creating project`);
    },
  });

  return mutation;
};

import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/rpc";

type AnalyticsResponse = {
  members: {
    name: string;
    completedTasks: number;
    totalTasks: number;
    pendingTasks: number;
  }[];
  projects: {
    total: number;
    completed: number;
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
  };
};

export const useGetWorkspaceAnalytics = ({ workspaceId }: { workspaceId: string }) => {
  return useQuery({
    queryKey: ["workspace-analytics", workspaceId],
    queryFn: async () => {
      const response = await client.api.analytics.workspaces[":workspaceId"].$get({
        param: { workspaceId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch workspace analytics");
      }

      const { data } = await response.json();
      return data as AnalyticsResponse;
    },
    enabled: !!workspaceId,
  });
};

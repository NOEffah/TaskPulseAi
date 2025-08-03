"use client";

import { useGetMembers } from "@/features/members/api/use-get-member";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import { useGetWorkspaceAnalytics } from "@/features/workspaces/api/use-get-workspace-analytics";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

export const WorkspaceIdClient = () => {

    const workspaceId = useWorkspaceId();

    const {data: analytics, isLoading: isLoadingAnalytics} = useGetWorkspaceAnalytics({workspaceId});
    const {data: tasks, isLoading: isLoadingTasks} = useGetTasks({workspaceId});
    const {data: projects, isLoading: isLoadingProjects} = useGetProjects({workspaceId});
    const {data: members, isLoading: isLoadingMembers} = useGetMembers({workspaceId});


    
    
    return (
        <div>
            Workspace Id
        </div>
    );
}
"use client";

import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";
import { TaskViewSwitcher } from "@/features/tasks/components/task-view-switcher";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useGetProject } from "@/features/projects/api/use-get-project";


export const ProjectIdClient = () => {   
    const projectId = useProjectId(); 
    const { data, isLoading } =useGetProject({projectId});
    
    return (
        <div className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-2">
                <ProjectAvatar 
                name={initialValues.name}
                image={initialValues.imageUrl}
                className="size-8"
                />
                <p className="text-lg font-semibold">{initialValues.name}</p>
            </div>
            <div>
                <Button 
                variant="secondary"
                size="sm"
                asChild
                >
                    <Link href={`/workspaces/${initialValues.workspaceId}/projects/${initialValues.$id}/settings`}>
                    <PencilIcon className="size-4 mr-2" />
                    Edit Project
                    </Link>
                </Button>
            </div>
        </div>
        <TaskViewSwitcher hideProjectFilter  projectId={initialValues.$id}/>
    </div>
    )
}
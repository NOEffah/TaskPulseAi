import { Project } from "@/features/projects/types";

import { TaskPriority, TaskStatus } from "../types";  
import { cn } from "@/lib/utils";
import { MemberAvartar } from "@/features/members/components/member-avartar";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useRouter } from "next/navigation";

interface EventCardProps {  
title: string;  
assignee: any;  
project: Project;  
status: TaskStatus;  
id: string; 
priority: TaskPriority;
};  

const statusColorMap: Record<TaskStatus, string> = {
    [TaskStatus.BACKLOG]: "border-l-pink-500",
    [TaskStatus.DONE]: "border-l-emerald-500",
    [TaskStatus.IN_REVIEW]: "border-l-blue-500",
    [TaskStatus.IN_PROGRESS]: "border-l-yellow-500",
    [TaskStatus.TODO]: "border-l-red-500",
}
 

export const EventCard = ({ 
    title,
    assignee,
    project,
    priority,
    id,
    status 
}: EventCardProps) => {  
    const workspaceId = useWorkspaceId();
    const router = useRouter();
    

    const onClick = (
        e: React.MouseEvent<HTMLDivElement>

    ) => {
        e.stopPropagation();

        router.push(`/worskpaces/${workspaceId}/tasks/${id}`)
    }

    return (
        <div className="px-2">
            <div className={cn("p-1.5 text-xs bg-white text-primary border rounded-md border-l-4 flex flex-col gap-y-1.5 cursor-pointer hover:opacity-75 transition", statusColorMap[status])
            }>
                <p>{title}</p>
                <div 
                onClick={onClick}
                className="flex items-center gap-1">
                    <MemberAvartar 
                        name={assignee?.name} fallbackClassName={""}                    />
                    <div className="size-1 rounded-full bg-neutral-300"/>
                    <ProjectAvatar
                    name={project?.name}
                    image={project?.imageUrl}
                    />
                    </div>
                     <Badge className="text-xs" variant={priority}>{priority}</Badge>

            </div>

        </div>
    )

}  
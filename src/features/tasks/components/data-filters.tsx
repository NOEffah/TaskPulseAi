import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetMembers } from "@/features/members/api/use-get-member";

import { DatePicker } from "@/components/date-picker";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FolderIcon, ListCheckIcon,  User2Icon } from "lucide-react";
import { TaskPriority, TaskStatus } from "../types";
import { useTaskFilters } from "../hooks/use-task-filters";


interface DataFiltersProps {
    hideProjectFilter?: boolean;
}

export const DataFilters = ({ hideProjectFilter }: DataFiltersProps) => {
    const workspaceId = useWorkspaceId();
    const { data: projects, isLoading: isLoadingProjects   } = useGetProjects({workspaceId,});
    const { data: members, isLoading: isLoadingMembers } = useGetMembers({workspaceId,})
    
    const isLoading = isLoadingProjects || isLoadingMembers;

    const projectOptions = projects?.documents.map((project) => ({
        value: project.$id,
        label: project.name,
    })) || [];

    const memberOptions = members?.documents.map((member) => ({
        value: member.$id,
        label: member.name,
    })) || [];

    const [{
        status,
        priority,
        assigneeId,
        projectId,
        dueDate,
    },setFilters ] = useTaskFilters();

    const onStatusChange = (value: string) => {
        setFilters({ status: value === "all" ? null : value as TaskStatus });
    }

    const onPriorityChange = (value: string) => {
        setFilters({ priority: value === "all" ? null : value as TaskPriority }); 
    }

    const onAssigneeChange = (value: string) => {
        setFilters({ assigneeId: value === "all" ? null : value as string });
    }
    
    const onProjectChange = (value: string) => {
        setFilters({ projectId: value === "all" ? null : value as string });
    }


    if( isLoading ) return null;


    return (
        <div className="flex flex-col lg:flex-row gap-y-4">
            <Select
                defaultValue={status ?? undefined}
                onValueChange={(value) => onStatusChange(value)}
                >
                    <SelectTrigger className="w-full lg:w-auto h-8">
                        <div className="flex items-center pr-2 gap-x-2">
                            <ListCheckIcon className="size-4 mr-2"/>
                            <SelectValue placeholder="All Statuses" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectSeparator />
                        <SelectItem value={TaskStatus.BACKLOG}>Backlog</SelectItem>
                        <SelectItem value={TaskStatus.TODO}>Todo</SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
                        <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                    </SelectContent>
            </Select>

            <Select
                defaultValue={priority ?? undefined}
                onValueChange={(value) => onPriorityChange(value)}
                >
                    <SelectTrigger className="w-full lg:w-auto h-8">
                        <div className="flex items-center pr-2 gap-x-2">
                            <ListCheckIcon className="size-4 mr-2"/>
                            <SelectValue placeholder="All Priorities" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectSeparator />
                        <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                        <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={TaskPriority.HIGH}>High</SelectItem> 
                        <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                    </SelectContent>
            </Select>

            <Select
                defaultValue={assigneeId ?? undefined}
                onValueChange={(value) => onAssigneeChange(value)}
                >
                    <SelectTrigger className="w-full lg:w-auto h-8">
                        <div className="flex items-center pr-2 gap-x-2">
                            <User2Icon className="size-4 mr-2"/>
                            <SelectValue placeholder="Owners" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Owners</SelectItem>
                        <SelectSeparator />
                        {memberOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
            </Select>

            {!hideProjectFilter && (
            <Select
                defaultValue={projectId ?? undefined}
                onValueChange={(value) => onProjectChange(value)}
                disabled={hideProjectFilter}
            >
                <SelectTrigger className="w-full lg:w-auto h-8">
                    <div className="flex items-center pr-2 gap-x-2">
                        <FolderIcon className="size-4 mr-2"/>
                        <SelectValue placeholder="Projects" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    <SelectSeparator />
                    {projectOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            )}
            
            <DatePicker
                placeholder="Due Date"
                className="w-full lg:w-auto h-8"
                value={dueDate ? new Date(dueDate) : undefined}
                onChange={(date) => setFilters({ dueDate: date ? date.toISOString() : null })}
            />
            

        </div>
    );
}
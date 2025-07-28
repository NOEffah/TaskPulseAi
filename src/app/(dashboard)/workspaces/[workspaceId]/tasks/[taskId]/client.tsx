"use client";

import { useGetTask } from "@/features/tasks/api/use-get-task";
import { useTaskId } from "@/features/tasks/hooks/use-task-id";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { TaskBreadcrumbs } from "@/features/tasks/components/task-breadcrumbs";
import { Separator } from "@radix-ui/react-select";
import { TaskOverview } from "@/features/tasks/components/task-overview";
import { TaskDescription } from "@/features/tasks/components/task-description";

export const TaskIdClient = () => {
        const taskId = useTaskId();
    const { data, isLoading } = useGetTask({ taskId });

    if (isLoading){
        return <PageLoader />
    }

    if (!data) {
        return <PageError message="Task not found" />
    }
    return (
        <div className="flex flex-col">
            <TaskBreadcrumbs project={data.project} task={data} />
            <Separator />

            <div className="grid gid-cols-1 lg:grid-cols-2 gap-4">
                <TaskOverview task={data} />
                <TaskDescription task={data}/>

            </div>
        </div>
    )
}
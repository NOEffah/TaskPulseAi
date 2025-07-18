"use client"

import { useQueryState } from "nuqs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
 } from "@/components/ui/tabs"
import { Loader, PlusIcon } from "lucide-react"
import { useCreateTaskModal } from "../hooks/use-create-task-modal"
import { useGetTasks } from "../api/use-get-tasks"
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id"
import { DataFilters } from "./data-filters"
import { useTaskFilters } from "../hooks/use-task-filters"
import { DataTable } from "./data-table"
import { columns } from "./columns"; 
import { DataKanban } from "./data-kanban"
import { useCallback } from "react"
import { TaskStatus } from "../types"
import { useBulkUpdateTask } from "../api/use-bulk-update-tasks"
import { DataCalendar } from "./data-calendar"
import { useEffect } from "react";

interface TaskViewSwitcherProps {
  hideProjectFilter?: boolean;
  projectId?: string;
}

export const TaskViewSwitcher = ({
  hideProjectFilter
}: TaskViewSwitcherProps) => {
  const [{
          status,
          priority,
          assigneeId,
          projectId,
          dueDate,
      } ] = useTaskFilters();

  const[ view, setView ] = useQueryState("task-view", {
    defaultValue: "table",
  })
  const workspaceId = useWorkspaceId();
  const { mutate: bulkUpdate } = useBulkUpdateTask();
  const [, setFilters] = useTaskFilters();

  const { 
    data: tasks,
     isLoading: isLoadingTasks } 
     = useGetTasks({ 
      workspaceId,
      projectId,
      assigneeId,
      status, 
      priority,
      dueDate,
    })
  const { open } = useCreateTaskModal();


  const onKanbanChange = useCallback((
    tasks: { $id: string; status: TaskStatus; position: number}[]
  ) => {
    bulkUpdate({
      json: {tasks},
    })

  }, [bulkUpdate]);

  useEffect(() => {
  if (hideProjectFilter && projectId) {
    setFilters({ projectId });
  }
}, [hideProjectFilter, projectId, setFilters]);

  
  

  return(
    <Tabs
    defaultValue={view}
    onValueChange={setView}
     className="flex-1 w-full border rounded-lg">
      <div className="h full flex flex-col overflow-auto p-4 ">
      <div className="flex flex-col gap-y-2 lg:flex-row justify-between items-center">
        <TabsList className="w-full lg:w-auto">
          <TabsTrigger
          className="h-8 w-full lg:w-auto"
          value="table"
          >
            Table
          </TabsTrigger>

          <TabsTrigger
          className="h-8 w-full lg:w-auto"
          value="kanban"
          >
            Kanban
          </TabsTrigger>

          <TabsTrigger
          className="h-8 w-full lg:w-auto"
          value="calendar"
          >
            Calendar
          </TabsTrigger>

        </TabsList>

        <Button
        onClick={open}
        size="sm"
        className="w-full lg:w-auto"
        >
          <PlusIcon className="size-4 mr-2"/>
          New
        </Button>        
      </div>
      <Separator className="my-4" />
        <DataFilters hideProjectFilter={hideProjectFilter}/>
        <Separator className="my-4" />
        {isLoadingTasks ? (
          <div className="w-full border rounded-lg h-[200px] p-4 flex flex-cols items-center justify-center">
            <Loader className="size-5 animate-spin text-muted-foreground" />
          </div>
        ): (
      <>
        <TabsContent
        value="table"
        className="mt-0">
          <DataTable columns={columns} data={tasks?.documents ?? []}/>
        </TabsContent>
        <TabsContent
        value="kanban"
        className="mt-0">
          <DataKanban 
          onChange={onKanbanChange}
          data={tasks?.documents ?? []}/>
        </TabsContent>
        <TabsContent
        value="calendar"
        className="mt-0 h-full pb-4">
          <DataCalendar 
          data={tasks?.documents ?? []}
          />
        </TabsContent>
        </>
        )}
      </div>
        
    </Tabs>
  )
}
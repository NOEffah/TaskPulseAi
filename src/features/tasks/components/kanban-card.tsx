import { MoreHorizontal } from "lucide-react";
import { Task } from "../types";
import { TaskActions } from "./task-actions";
import { Separator } from "@/components/ui/separator";
import { MemberAvartar } from "@/features/members/components/member-avartar";
import { TaskDate } from "./task-date";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { Badge } from "@/components/ui/badge";

interface KanbanCardProps {
  task: Task;
}

export const KanbanCard = ({ task }: KanbanCardProps) => {
  return (
    <div className="bg-white p-2.5 mb-1.5 rounded shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-x-2">
        <p className="text-sm line-clamp-2">{task.name}</p>
        <TaskActions id={task.$id} projectId={task.projectId}>
          <MoreHorizontal className="h-4 w-4 stroke-1 shrink-0 text-neutral-700 hover:opacity-75 transition" />
        </TaskActions>
      </div>

      <Separator />

      <div className="flex items-center gap-x-1.5">
        <MemberAvartar
          name={task.assignee?.name ?? ""}
          fallbackClassName="text-[10px]"
        />
        <div className="h-1 w-1 rounded-full bg-neutral-300" />
        <TaskDate value={task.dueDate} className="text-xs" />
      </div>

      {/* Priority Badge */}
      

      <div className="flex items-center gap-x-1.5">
        <ProjectAvatar
          name={task.project?.name}
          image={task.project?.imageUrl}
          fallbackClassName="text-[10px]"
        />
        <span className="text-xs font-medium">{task.project?.name}</span>
        <div className="flex justify-end">
        <Badge variant={task.priority}>{task.priority}</Badge>
      </div>
      </div>
    </div>
  );
};

import { useState } from "react";
import { PencilIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Task } from "../types";
import { useUpdateTask } from "../api/use-update-task";

interface TaskDescriptionProps {
    task: Task;
}

export const TaskDescription = ({ task }: TaskDescriptionProps) => {
    const [isEditing, setIsEditing] = useState(false);
    // Initialize value with task.description or an empty string for better handling
    const [value, setValue] = useState(task.description || "");

    const { mutate, isPending } = useUpdateTask();

    const handleSave = () => {
        // Ensure all required fields from the task are included in the mutation
        mutate({
            json: {
                ...task,
                description: value,
                dueDate: new Date(task.dueDate), 
            },
            param: { taskId: task.$id }
        });
    };

    return (
        <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">Overview</p>
                <Button onClick={() => setIsEditing((prev) => !prev)} size="sm" variant="secondary">
                    {isEditing ? (
                        <XIcon className="size-4 mr-2" />
                    ) : (
                        <PencilIcon className="size-4 mr-2" /> // Corrected margin from mr-4 to mr-2 for consistency
                    )}
                    {isEditing ? "Cancel" : "Edit"}
                </Button>
            </div>
            <Separator className="my-4" />
            {isEditing ? (
                <div className="flex flex-col gap-y-4">
                    <Textarea
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Add a description"
                        className="resize-none h-32"
                        rows={4}
                        disabled={isPending}
                    />
                    <Button
                        size={"sm"}
                        disabled={isPending}
                        onClick={handleSave}
                        className="w-fit ml-auto"
                    >
                        {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            ) : (
                <div>
                    {task.description ? (
                        <p>{task.description}</p> // Render description in a <p> tag for proper formatting
                    ) : (
                        <span className="text-muted-foreground">
                            No description set
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
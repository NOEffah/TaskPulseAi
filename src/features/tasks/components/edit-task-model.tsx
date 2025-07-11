"use client";

import { ResponsiveModal } from "@/components/responsive-model";

import { useEditTaskModal } from "../hooks/use-edit-task-model";
import { EditTaskFormWrapper } from "./edit-task-form-wrapper";

export const EditTaskModal = () => {
    const { taskId, close } = useEditTaskModal()
    
    return (
    <ResponsiveModal open={!!taskId} onOpenChange={close}>
        { taskId && (
            <EditTaskFormWrapper
            id={taskId}
             onCancel={close}
             />
            )}
        </ResponsiveModal>
    );
};
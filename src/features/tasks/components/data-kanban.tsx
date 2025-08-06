// src/components/DataKanban.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
    DragDropContext,
    Droppable,
    Draggable,
    type DropResult,
} from "@hello-pangea/dnd"
import { KanbanColumnHeader } from "./kanban-column-header";
import { KanbanCard } from "./kanban-card";
import { Task, TaskStatus, } from "../types";
// Import the new hook
import { useBulkUpdateTasks } from "../api/use-bulk-update-tasks"; 

const boards: TaskStatus[] = [
    TaskStatus.BACKLOG,
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.IN_REVIEW,
    TaskStatus.DONE,
]

type TaskState = {
    [key in TaskStatus]: Task[];
}

interface DataKanbanProps {
    data: Task[];
}

export const DataKanban = ({ data }: DataKanbanProps) => {
    const [tasks, setTasks ] = useState<TaskState>(() => {
        const initialTasks: TaskState = {
            [TaskStatus.BACKLOG]: [],
            [TaskStatus.TODO]: [],
            [TaskStatus.IN_PROGRESS]: [],
            [TaskStatus.IN_REVIEW]: [],
            [TaskStatus.DONE]: [],
        };

        data.forEach((task) => {
            initialTasks[task.status].push(task);
        })

        Object.keys(initialTasks).forEach((status) =>{
            initialTasks[status as TaskStatus].sort((a, b) => a.position - b.position)
        });

        return initialTasks;
    })

    // Use the new bulk update hook
    const bulkUpdateTasks = useBulkUpdateTasks();

    // Use a separate effect to sync external data prop with internal state
    useEffect(() => {
        const newTasks: TaskState = {
            [TaskStatus.BACKLOG]: [],
            [TaskStatus.TODO]: [],
            [TaskStatus.IN_PROGRESS]: [],
            [TaskStatus.IN_REVIEW]: [],
            [TaskStatus.DONE]: [],
        };

        data.forEach((task) => {
            newTasks[task.status].push(task);
        })

        Object.keys(newTasks).forEach((status) =>{
            newTasks[status as TaskStatus].sort((a, b) => a.position - b.position)
        });

        setTasks(newTasks)
    }, [data]);

    const onDragEnd = useCallback((result: DropResult) => {
        if (!result.destination) return;

        const {source, destination} = result;
        const sourceStatus = source.droppableId as TaskStatus;
        const destStatus = destination.droppableId as TaskStatus;

        let updatesPayload: { $id: string; status: TaskStatus; position: number;}[] = [];

        setTasks((prevTasks) => {
            const newTasks = { ...prevTasks };

            // Safely remove task from the source column
            const sourceColumn = [...newTasks[sourceStatus]];
            const [movedTask] = sourceColumn.splice(source.index, 1);

            if (!movedTask) {
                console.error("No task found at source index");
                return prevTasks;
            }

            const updatedMovedTask =
                sourceStatus !== destStatus
                    ? { ...movedTask, status: destStatus }
                    : movedTask;

            // update the source column
            newTasks[sourceStatus] = sourceColumn;

            // Add the task to the destination
            const destColumn = [...newTasks[destStatus]];
            destColumn.splice(destination.index, 0, updatedMovedTask);
            newTasks[destStatus] = destColumn;

            // prepare minimal update payloads
            updatesPayload = [];

            // update moved task's position and status
            updatesPayload.push({
                $id: updatedMovedTask.$id,
                status: destStatus,
                position: destination.index, // Use index for simplicity here
            });

            // update positions for affected tasks in the destination column
            newTasks[destStatus].forEach((task, index) => {
                // If it's a new task or its position has changed
                if (task.$id !== updatedMovedTask.$id || task.position !== index) {
                    updatesPayload.push({
                        $id: task.$id,
                        status: destStatus,
                        position: index,
                    });
                }
            });

            // update positions for tasks in the source column if it's a different column
            if (sourceStatus !== destStatus) {
                newTasks[sourceStatus].forEach((task, index) => {
                    if (task && task.position !== index) {
                        updatesPayload.push({
                            $id: task.$id,
                            status: sourceStatus,
                            position: index,
                        });
                    }
                });
            }
            
            return newTasks;
        });

        // Use the new mutation hook to send the updates to the server
        if (updatesPayload.length > 0) {
            bulkUpdateTasks.mutate({ json: { tasks: updatesPayload } });
        }
    }, [bulkUpdateTasks]);
    
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex overflow-x-auto">
                {boards.map((board) => {
                    return (
                        <div key={board} className="flex-1 mx-2 bg-muted p-1.5 rounded-md min-w-[200px]">
                            <KanbanColumnHeader 
                            board={board}
                            taskCount={tasks[board].length}
                            />
                            <Droppable 
                            droppableId={board}>
                                {(provided) =>(
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="min-h-[200px] py-1.5">
                                        {tasks[board].map((task, index) =>(
                                            <Draggable
                                            key={task.$id}
                                            draggableId={task.$id}
                                            index={index}
                                            >
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}>
                                                            <KanbanCard task={task} />
                                                    </div>
                                                )}

                                            </Draggable>

                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    )
                })}
            </div>
        </DragDropContext>
    )
}
import { Models } from "node-appwrite";

export enum TaskStatus {  
    BACKLOG = "BACKLOG",  
    TODO= "TODO",  
    IN_PROGRESS = "IN_PROGRESS",  
    IN_REVIEW = "IN_REVIEW",  
    DONE = "DONE"  
};  

export enum TaskPriority {  
    LOW = "LOW",  
    MEDIUM = "MEDIUM",  
    HIGH = "HIGH",  
    URGENT = "URGENT"  
};

export type Task = Models.Document & {  
    name: string;  
    status: TaskStatus;  
    workspaceId: string;
    assigneeId: string;  
    projectId: string;  
    position: number;  
    dueDate: string;  
    priority: TaskPriority;  
    description?: string;

}  




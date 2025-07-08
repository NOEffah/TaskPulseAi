import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";  
import { TaskStatus } from "../types"; 
import { TaskPriority } from "../types";

export const useTaskFilters = () => {
    return useQueryStates({  
        projectId: parseAsString, 
        status: parseAsStringEnum (Object.values (TaskStatus)),  
        assigneeId: parseAsString,  
        search: parseAsString,  
        dueDate: parseAsString, 
        priority: parseAsStringEnum(Object.values(TaskPriority)), 
});  
}
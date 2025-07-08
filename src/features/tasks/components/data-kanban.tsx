import React, { useCallback, useEffect, useState } from "react";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from "@hello-pangea/dnd"

import { Task } from "../types";


interface DataKanbanProps {
    data: Task[];
}

export const DataKanban = ({
    data,
}: DataKanbanProps) => {
    return (
        <div>
            Data Kanban
        </div>
    )
}
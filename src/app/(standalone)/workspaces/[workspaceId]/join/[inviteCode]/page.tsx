import { getCurrentUser } from "@/features/auth/queries";

import { redirect } from "next/navigation";
import { WorkspaceIdJoinClient } from "./client";


const WorkspaceIdJoinPage = async () => {
    const user = getCurrentUser;
    if(!user) redirect("/sign-in")
  
    return <WorkspaceIdJoinClient />
}

export default WorkspaceIdJoinPage;

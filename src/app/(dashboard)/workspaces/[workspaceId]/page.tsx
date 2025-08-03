import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";
import { WorkspaceIdClient } from "./client";

const WorkspaceIdPage = async ({ }) => {
  const user = await getCurrentUser();
    
    if (!user) {
      redirect("/sign-in");
    }

  return <WorkspaceIdClient />
}

export default WorkspaceIdPage;

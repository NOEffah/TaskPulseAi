export const dynamic = 'force-dynamic';
import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";

const WorkspaceCreatePage = async () => {
  const user = await getCurrentUser();
    
    if (!user) {
      redirect("/sign-in");
    }
  return (
    <div className="w-full lg:max-w-xl">
        <CreateWorkspaceForm />
    </div>
  )
}

export default WorkspaceCreatePage;

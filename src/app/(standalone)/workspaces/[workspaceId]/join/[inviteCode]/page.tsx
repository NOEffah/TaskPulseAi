import { getCurrentUser } from "@/features/auth/queries";
import { JoinWorkspaceForm } from "@/features/workspaces/components/join-workspace-form";
import { getWorkspaceInfo } from "@/features/workspaces/queries";
import { redirect } from "next/navigation";

interface WorkspaceIdJoinPageProps{
    params: {
        workspaceId: string;

    }
}

const WorkspaceIdJoinPage = async ({
    params,
}
    : WorkspaceIdJoinPageProps
) => {
    const user = getCurrentUser;
    if(!user) redirect("/sign-in")
        const initialValues = await getWorkspaceInfo({
    workspaceId: params.workspaceId})

    if(!initialValues){
        redirect("/")
    }

    return (
        <div>
            <JoinWorkspaceForm initialValues={initialValues}
        />
        </div>
    )
}

export default WorkspaceIdJoinPage;

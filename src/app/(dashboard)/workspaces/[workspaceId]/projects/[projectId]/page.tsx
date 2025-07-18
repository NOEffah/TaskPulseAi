import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/queries";
import { getProject } from "@/features/projects/queries";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";
import Link from "next/link";
import { TaskViewSwitcher } from "@/features/tasks/components/task-view-switcher";

interface ProjectIdPageProps {
    params: { projectId: string}
}

const ProjectIdPage = async ({
    params,
}: ProjectIdPageProps) => {
    const user = getCurrentUser();
    if (!user) {
        redirect("/sign-in");
    }

    const initialValues = await getProject({
        projectId: params.projectId,
    });

    if( !initialValues) {
        throw new Error("Project not found");
    }

  return (
    <div className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-2">
                <ProjectAvatar 
                name={initialValues.name}
                image={initialValues.image}
                className="size-8"
                />
                <p className="text-lg font-semibold">{initialValues.name}</p>
            </div>
            <div>
                <Button 
                variant="secondary"
                size="sm"
                asChild
                >
                    <Link href={`/workspaces/${initialValues.workspaceId}/projects/${initialValues.$id}/settings`}>
                    <PencilIcon className="size-4 mr-2" />
                    Edit Project
                    </Link>
                </Button>
            </div>
        </div>
        <TaskViewSwitcher hideProjectFilter projectId={initialValues.$id} />
    </div>
  )
}

export default ProjectIdPage;
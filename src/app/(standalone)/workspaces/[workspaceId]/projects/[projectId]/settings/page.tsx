 import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/queries";

import { ProjectIdSettingsClient } from "./client";




const ProjectIdSettingsPage = async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in"); 
  

  return <ProjectIdSettingsClient />;
}

export default ProjectIdSettingsPage;
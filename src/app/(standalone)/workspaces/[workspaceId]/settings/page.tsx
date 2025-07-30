import { redirect } from "next/navigation";  
import { getCurrentUser } from "@/features/auth/queries";  

import { WorkspaceIdSettingsClient } from "./client";


const WorkspaceIdSettingsPage = async () => {
 
const user = await getCurrentUser();  

if (!user) redirect("/sign-in");  


return <WorkspaceIdSettingsClient />

};

export default WorkspaceIdSettingsPage;  
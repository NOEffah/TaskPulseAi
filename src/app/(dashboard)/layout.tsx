import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { CreateProjectModal } from "@/features/projects/components/create-project-model";
import { CreateTaskModal } from "@/features/tasks/components/create-task-model";
import { EditTaskModal } from "@/features/tasks/components/edit-task-model";
import { CreateWorkspaceModal } from "@/features/workspaces/components/create-workspace-model";

interface DashboardLayoutProps {  
children: React.ReactNode;  
};  
  
const DashboardLayout = ({ children }: DashboardLayoutProps) =>{
    return (
    <div className="min-h-screen"> 

    <CreateWorkspaceModal />
    <CreateProjectModal />
    <CreateTaskModal />
    <EditTaskModal />

    <div className="flex w-full h-full">
        <div className="fixed left-0 top-0 hidden lg:block w-[265px] h-full overflow-y-auto">
            <Sidebar />
        </div>
        <div className="lg:pl-[264px] w-full">
            <div className="mx-auto max-w-screen-2xl h-full">
                <Navbar />
                <main className="h-full py-8 px-6 flex flex-col">
                {children}
                </main>
            </div> 
        </div>
        
    </div>
    </div> 
    );  
};  
  
export default DashboardLayout;  

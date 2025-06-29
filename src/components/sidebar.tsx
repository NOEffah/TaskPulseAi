import Image from "next/image";
import Link from "next/link";
import { Separator } from "./ui/separator";
import { Navigation } from "./navigation";
import { WorkspaceSwitcher } from "./workspace-switcher";
import  Projects  from "@/components/projects"

export const Sidebar = () => {
    return (
        <aside className="h-full bg-neutral-100 p-4 w-full">  
        <Link href="/">
        <Image src="/taskpulseailogo.svg" alt="logo" width={170} height={58} />  
        </Link>
        <Separator className="my-4" />
        <WorkspaceSwitcher />
        <Separator />
        <Navigation />
        
        <Projects  />
        </aside>  
    );
}
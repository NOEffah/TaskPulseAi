import  Link  from "next/link";
import Image from "next/image";
import { UserButton } from "@/features/auth/components/user-button";

interface StandloneLayoutProps {  
    children: React. ReactNode;  
};  

const StandloneLayout = ({ children }: StandloneLayoutProps) => {
    return (
    <main className="bg-neutral-100 min-h-screen">
        <div className="max-auto max-w-screen-2xl p-4">
            <nav className="flex justify-between item-center h-[73px]">
                <Link href="/">
                <Image src="/taskpulseailogo.svg" alt="logo" height={100} width={200}/>
                </Link>
                <UserButton />
            </nav>
        <div className="flex flex-col items-center justify-center py-4">
            {children}
        </div>
        </div>
    </main> ) 
};  

export default StandloneLayout;  
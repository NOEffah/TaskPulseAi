import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MemberAvartarProps {
    name?: string;
    className?: string;
    fallbackClassName: string;
};

export const MemberAvartar = ({
    name,
    className,
    fallbackClassName
}: MemberAvartarProps) => {
    
    return(
        <Avatar className={cn("size-10 transition border border-neutral-300 rounded-full", className)}>
        <AvatarFallback 
        className={cn("bg-neutral-200 font-medium text-neutal-500 flex items-center justify-center",
            fallbackClassName
        )}>
            {name?.charAt(0).toUpperCase()}
        </AvatarFallback>
        </Avatar>
    )
};
"use client"

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@radix-ui/react-separator";
import Link from "next/link";
import { useJoinWorkspace } from "../api/use-join-workspace";
import { useInviteCode } from "../hooks/use-invite-code";
import { useWorkspaceId } from "../hooks/use-workspace-id";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface JoinWorkspaceFormProps{
    initialValues: {
        name: string;
    }
}
export const JoinWorkspaceForm = ({
    initialValues,
}: JoinWorkspaceFormProps) => {
    const inviteCode = useInviteCode();
    const { mutate, isPending } = useJoinWorkspace();
    const workspaceId = useWorkspaceId()
    const router = useRouter();
    const [speciality, setSpeciality] = useState("");


    const onSubmit = () => {
        mutate({
        param: { workspaceId },
        json: { code: inviteCode, speciality },
        }, {
        onSuccess: ({ data }) => {
            router.push(`/workspaces/${data.$id}`);
        },
        });

    };

    return(
        <Card className="w-full h-full border-none shadow-none">
            <CardHeader className="p-7">
                <CardTitle className="text-xl font-bold">
                    Join workspace
                </CardTitle>
                <CardDescription>
                    You&apos;ve been invited to join <strong>{initialValues.name}</strong>
                </CardDescription>
            </CardHeader>
            <div className="px-7">
                <Separator />
            </div>
            <Input
                type="text"
                placeholder="Enter your speciality"
                className="mb-4"
                value={speciality}
                onChange={(e) => setSpeciality(e.target.value)}
                required
                />

            <CardContent className="P-7">
                <div className="flex flex-col lg:flex-row items-center gap-2-y justify-between">
                    <Button 
                    className="w-full lg:w-fit"
                    variant="secondary"
                    type="button"
                    asChild
                    >
                        <Link href="/">
                        Cancel
                        </Link>
                    </Button>

                    <Button 
                    className="w-full lg:w-fit"
                    size="lg"
                    type="button"
                    onClick={onSubmit}
                    disabled={isPending}
                    >
                        Join Workshop
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
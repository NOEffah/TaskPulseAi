// src/features/projects/components/create-project-form.tsx

"use client";
import { z } from "zod";
import { useRef, useState } from "react";
import { createProjectSchema } from "../schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateProject } from "../api/use-create-project";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Member } from "@/features/members/types"; // Import the correct Member type
// Removed the old generateTasksWithAI import, now using the hook:
import { useGenerateTasksAI } from "@/features/ai/api/use-create-ai-generated-tasks";

interface CreateProjectFormProps {
  onCancel?: () => void;
}

// Strip workspaceId from validation (you add it manually)
const schemaWithoutWorkspaceId = createProjectSchema.omit({ workspaceId: true });

export const CreateProjectForm = ({ onCancel }: CreateProjectFormProps) => {
  const workspaceId = useWorkspaceId();
  // Hook for creating the project
  const { mutate, isPending } = useCreateProject();
  // Hook for generating AI tasks
  const { mutate: generateTasks, isPending: isGeneratingTasks } = useGenerateTasksAI();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [aiTaskGen, setAiTaskGen] = useState(false);
  const [taskGenPrompt, setTaskGenPrompt] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);


  const form = useForm<z.infer<typeof schemaWithoutWorkspaceId>>({
    resolver: zodResolver(schemaWithoutWorkspaceId),
    defaultValues: {
      name: "",
      image: undefined,
    },
  });

  // Fetch workspace members
  const { data: members, isLoading: isLoadingMembers } = useQuery<Member[]>({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []; // Ensure workspaceId exists
      const res = await fetch(`/api/members?workspaceId=${workspaceId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch workspace members");
      }
      const json = await res.json();
      return json.data.documents; // ✅ <-- nested under data.documents
    },
    enabled: !!workspaceId, // Only run query if workspaceId is available
  });


  const onSubmit = (values: z.infer<typeof schemaWithoutWorkspaceId>) => {
    // Filter the full 'members' array to get the selected ones
    const membersForProject = members?.filter(member =>
      selectedMemberIds.includes(member.$id)
    ) || [];

    const finalValues = {
      ...values,
      image: values.image instanceof File ? values.image : undefined,
      workspaceId: workspaceId,
      members: membersForProject.map(m => m.$id), // Only pass IDs to createProject, as your schema expects string[]
    };

    mutate(
      { form: finalValues },
      {
        onSuccess: async ({ data: createdProject }) => { // Rename data to createdProject for clarity
          form.reset();

          // ✅ Send prompt to AI if enabled
          if (aiTaskGen && taskGenPrompt.trim()) {
            // 🔥 Build the members array with id, name + speciality for AI
            const enrichedMembersForAI = membersForProject.map((member) => ({
              id: member.$id, // Include ID here for potential backend use
              name: member.name,
              speciality: member.speciality,
            }));

            // --- START CHANGE ---
            // Call the useGenerateTasksAI mutation
            generateTasks({
              json: { // Pass the payload as 'json' as required by the mutationFn
                projectId: createdProject.$id,
                prompt: taskGenPrompt,
                members: enrichedMembersForAI,
              },
            }, {
              onSuccess: () => {
                // Navigate after AI tasks are successfully generated
                router.push(`/workspaces/${workspaceId}/projects/${createdProject.$id}`);
              },
              onError: (error) => {
                // Handle AI generation error (e.g., show a toast, but still navigate)
                console.error("AI Task Generation Error:", error);
                // Still navigate even if AI generation failed to allow manual task creation
                router.push(`/workspaces/${workspaceId}/projects/${createdProject.$id}`);
              }
            });
            // --- END CHANGE ---

          } else {
            // If AI task generation is not enabled, just navigate
            router.push(`/workspaces/${workspaceId}/projects/${createdProject.$id}`);
          }
        },
        // onError for useCreateProject is handled by the hook's default, but can be overridden here
      }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("image", file);
    }
  };

  // Combine loading states for the submit button
  const isSubmitting = isPending || isGeneratingTasks;

  return (
    <Card className="w-full h-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold">Create a new project</CardTitle>
      </CardHeader>

      <div className="px-7">
        <Separator />
      </div>

      <CardContent className="p-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <div className="flex flex-col gap-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter project name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <div className="flex flex-col gap-y-2">
                    <div className="flex items-center gap-x-5">
                      {field.value ? (
                        <div className="size-[72px] relative rounded-md overflow-hidden">
                          <Image
                            className="object-cover"
                            src={
                              field.value instanceof File
                                ? URL.createObjectURL(field.value)
                                : field.value
                            }
                            alt="Logo"
                            width={100}
                            height={100}
                          />
                        </div>
                      ) : (
                        <Avatar className="size-[72px]">
                          <AvatarFallback>
                            <ImageIcon className="size-[36px] text-neutral-400" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex flex-col">
                        <p className="text-sm">Project Icon</p>
                        <p className="text-sm text-muted-foreground">
                          JPG, PNG, SVG or JPEG, max 10mb
                        </p>

                        <input
                          className="hidden"
                          type="file"
                          accept=".jpeg, .png, .svg, .jpg"
                          ref={inputRef}
                          onChange={handleImageChange}
                          disabled={isSubmitting}
                        />
                        {field.value ? (
                          <Button
                            type="button"
                            disabled={isSubmitting}
                            variant="destructive"
                            size="xs"
                            className="w-fit mt-2"
                            onClick={() => {
                              field.onChange(null);
                              if (inputRef.current) {
                                inputRef.current.value = "";
                              }
                            }}
                          >
                            Remove Image
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            disabled={isSubmitting}
                            variant="teritary"
                            size="xs"
                            className="w-fit mt-2"
                            onClick={() => inputRef.current?.click()}
                          >
                            Upload Image
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              />

            </div>

            <div>
              <FormLabel>Project Members</FormLabel>
              {isLoadingMembers && <p>Loading members...</p>}
              {!isLoadingMembers && members && members.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {members.map((member: Member) => (
                    <Button
                      key={member.$id}
                      type="button"
                      variant={selectedMemberIds.includes(member.$id) ? "primary" : "outline"}
                      onClick={() =>
                        setSelectedMemberIds((prev) =>
                          prev.includes(member.$id)
                            ? prev.filter((id) => id !== member.$id)
                            : [...prev, member.$id]
                        )
                      }
                      disabled={isSubmitting} 
                    >
                      {member.name}
                    </Button>
                  ))}
                </div>
              ) : (
                !isLoadingMembers && <p className="text-sm text-muted-foreground">No members found in this workspace.</p>
              )}
            </div>

            {/* AI Task Generator */}
            <div className="border rounded-md mt-6">
              <div className="flex items-center gap-3 py-2 px-3">
                <Bot className="text-muted-foreground flex-shrink-0" />
                <div className="space-y-0.5 me-auto">
                  <Label htmlFor="ai_generate" className="block text-sm">
                    AI Task Generator
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically create tasks by providing a simple prompt.
                  </p>
                </div>
                <Switch
                  id="ai_generate"
                  checked={aiTaskGen}
                  onCheckedChange={setAiTaskGen}
                  disabled={isSubmitting}
                />
              </div>

              {aiTaskGen && (
                <Textarea
                  autoFocus
                  placeholder="Tell me about your project. What you want to accomplish?"
                  className="border-none"
                  value={taskGenPrompt}
                  onChange={(e) => setTaskGenPrompt(e.currentTarget.value)}
                  disabled={isSubmitting} 
                />
              )}
            </div>


            <Separator className="py-1" />
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onCancel}
                disabled={isSubmitting} 
                className={cn(!onCancel && "invisible")}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={isSubmitting}> {/* Use combined loading state */}
                {isSubmitting ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

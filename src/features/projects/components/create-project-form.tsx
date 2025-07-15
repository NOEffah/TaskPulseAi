"use client";
import { z } from "zod";
import { useRef } from "react";
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
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot } from "lucide-react";

interface CreateProjectFormProps {
  onCancel?: () => void;
}

// Strip workspaceId from validation (you add it manually)
const schemaWithoutWorkspaceId = createProjectSchema.omit({ workspaceId: true });

export const CreateProjectForm = ({ onCancel }: CreateProjectFormProps) => {
  const workspaceId = useWorkspaceId();
  const { mutate, isPending } = useCreateProject();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [aiTaskGen, setAiTaskGen] = useState(false);
  const [taskGenPrompt, setTaskGenPrompt] = useState("");

  const form = useForm<z.infer<typeof schemaWithoutWorkspaceId>>({
    resolver: zodResolver(schemaWithoutWorkspaceId),
    defaultValues: {
      name: "",
      image: undefined,
    },
  });

  const onSubmit = (values: z.infer<typeof schemaWithoutWorkspaceId>) => {
  const finalValues = {
    ...values,
    image: values.image instanceof File ? values.image : undefined,
    workspaceId: workspaceId,
  };

  mutate(
    { form: finalValues },
    {
      onSuccess: async ({ data }) => {
        form.reset();

        // ✅ Send prompt to AI if enabled
        if (aiTaskGen && taskGenPrompt.trim()) {
            try {
              await fetch("/api/ai/generate-tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  projectId: data.$id,
                  prompt: taskGenPrompt,
                }),
              });
            } catch (error) {
              console.error("AI task generation failed", error);
            }
          }
        router.push(`/workspaces/${workspaceId}/projects/${data.$id}`);
      },
    }
  );
};


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("image", file);
    }
  };



  

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
                          disabled={isPending}
                        />
                        {field.value ? (
                          <Button
                            type="button"
                            disabled={isPending}
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
                            disabled={isPending}
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
                />
              </div>

              {aiTaskGen && (
                <Textarea
                  autoFocus
                  placeholder="Tell me about your project. What you want to accomplish?"
                  className="border-none"
                  value={taskGenPrompt}
                  onChange={(e) => setTaskGenPrompt(e.currentTarget.value)}
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
                disabled={isPending}
                className={cn(!onCancel && "invisible")}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={isPending}>
                Create Project
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

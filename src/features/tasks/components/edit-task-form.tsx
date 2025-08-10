"use client";
import { z } from "zod";

import { createTaskSchema } from "../schemas";
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

import { cn } from "@/lib/utils";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { DatePicker } from "@/components/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { SelectValue } from "@radix-ui/react-select";
import { MemberAvartar } from "@/features/members/components/member-avartar";
import { TaskPriority, TaskStatus } from "../types";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { Controller } from "react-hook-form";
import { Sparkles } from "lucide-react"; // for AI icon
import { Task } from "../types";
import { useUpdateTask } from "../api/use-update-task";

interface EditTaskFormProps {
  onCancel?: () => void;
  projectOptions: { id: string, name: string, imageUrl: string }[];
  memberOptions: { id: string, name: string, }[];  
  initialValues: Task,
}


export const EditTaskForm = ({ onCancel, projectOptions, memberOptions,initialValues }: EditTaskFormProps) => {
  const workspaceId = useWorkspaceId();
  const { mutate, isPending } = useUpdateTask();

  const schemaWithoutWorkspaceId = createTaskSchema.omit({ workspaceId: true, description: true });
  

  const form = useForm<z.infer<typeof schemaWithoutWorkspaceId>>({
    resolver: zodResolver(schemaWithoutWorkspaceId),
    defaultValues: {
      ...initialValues,
      dueDate: initialValues.dueDate ? new Date(initialValues.dueDate) : undefined,
    },
  });

  const onSubmit = (values: z.infer<typeof schemaWithoutWorkspaceId>) => {
    console.log("Clicked")
    if (!workspaceId) return;
    mutate({
      json: {
        ...values,
        workspaceId, 
        },
        param: {
          taskId: initialValues.$id,
        },
},
      {
        onSuccess: () => {
          form.reset();
          onCancel?.();
        },
      }
    );
  };



const handlePredictDeadline = () => {
  const predictedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days later
  form.setValue("dueDate", predictedDate);
};


  return (
    <Card className="w-full h-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold">Edit a task</CardTitle>
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
                    <FormLabel>Task Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter task name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Controller
              control={form.control}
              name="dueDate"
              render={({ field }) => (
              <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Due Date</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handlePredictDeadline}
                      className="text-xs flex items-center gap-1 bg-orange-400 text-white hover:bg-orange-500 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <Sparkles className="h-4 w-4" />
                      Predict
                    </Button>
                  </div>
                  <FormControl>
                    <DatePicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Owner</FormLabel>
                    </div>
                    <Select defaultValue={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                      </FormControl>
                      <FormMessage />
                      <SelectContent>
                        {memberOptions.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-x-2">
                              <MemberAvartar className="size-6" name={member.name} fallbackClassName="" />
                              {member.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                    defaultValue={field.value} 
                    onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <FormMessage />
                      <SelectContent>
                      <SelectItem value={TaskStatus.TODO}>
                          Todo 
                        </SelectItem>
                        <SelectItem value={TaskStatus.BACKLOG}>
                          Backlog
                        </SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>
                          In Progress
                        </SelectItem>
                        <SelectItem value={TaskStatus.IN_REVIEW}>
                          In Review   
                        </SelectItem>
                        <SelectItem value={TaskStatus.DONE}>
                          Done
                        </SelectItem>
                      </SelectContent>
                        
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Priority</FormLabel>
                      </div>
                    <Select 
                    defaultValue={field.value} 
                    onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Priority" />
                        </SelectTrigger>
                      </FormControl>
                      <FormMessage />
                      <SelectContent>
                      <SelectItem className="bg-cyan-100 text-cyan-900" value={TaskPriority.LOW}>
                        Low
                      </SelectItem>
                      <SelectItem className="bg-yellow-100 text-yellow-900" value={TaskPriority.MEDIUM}>
                        Medium
                      </SelectItem>
                      <SelectItem className="bg-red-100 text-red-900" value={TaskPriority.HIGH}>
                        High
                      </SelectItem>
                      <SelectItem className="bg-violet-100 text-violet-900" value={TaskPriority.URGENT}>
                        Urgent
                      </SelectItem>

                      </SelectContent>
                        
                    </Select>
                  </FormItem>
                  
                )}
              />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select 
                    defaultValue={field.value} 
                    onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <FormMessage />
                      <SelectContent>
                        {projectOptions.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center gap-x-2">
                              
                              <ProjectAvatar 
                              className="size-6"
                              name={project.name}
                              image={project.imageUrl}
                              />
                              {project.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />


              </div>

            <Separator />
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
                Save Changes
              </Button>
            </div>
            
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

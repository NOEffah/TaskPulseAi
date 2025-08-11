// src/features/analytics/server/analytics-service.ts
import { Databases, Query } from "node-appwrite";
import { DATABASE_ID, PROJECTS_ID, TASKS_ID, MEMBERS_ID } from "@/config";
import { Project } from "@/features/projects/types";
import { Member } from "@/features/members/types";
import { Task, TaskStatus } from "@/features/tasks/types";
import { createAdminClient } from "@/lib/appwrite";
import { console } from "inspector";


export const getWorkspaceAnalytics = async (databases: Databases, workspaceId: string) => {
const { users } = await createAdminClient();

  const projects = await databases.listDocuments<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        [Query.equal("workspaceid", workspaceId)]
      );

  const membersResponse = await databases.listDocuments<Member>(
  DATABASE_ID,
  MEMBERS_ID,
  [Query.equal("workspaceid", workspaceId)]
);

const members = await Promise.all(
  membersResponse.documents.map(async (member) => {
    try {
      const user = await users.get(member.userid);
      return {
        ...member,
        name: user.name,
      };
    } catch (err) {
        console.log(err)
      return {
        ...member,
        name: "Unknown",
      };
    }
  })
);

  const projectIds = projects.documents.map(p => p.$id);
  const allTasks = projectIds.length > 0 ? await databases.listDocuments<Task>(
    DATABASE_ID,
    TASKS_ID,
    [Query.equal("workspaceId", workspaceId), Query.equal("projectId", projectIds), Query.limit(100)]
  ) : { documents: [], total: 0 };

  const totalProjects = projects.total;
  const completedProjects = projects.documents.filter(p => p.status === "COMPLETED").length;

  const totalTasks = allTasks.total;
  const completedTasks = allTasks.documents.filter(t => t.status === TaskStatus.DONE).length;

  const memberAnalytics = members.map(member => {
    const memberTasks = allTasks.documents.filter(task => task.assigneeId === member.$id);
    const memberCompletedTasks = memberTasks.filter(task => task.status === TaskStatus.DONE);
    const memberPendingTasks = memberTasks.filter(task => task.status !== TaskStatus.DONE);

    return {
      name: member.name,
      completedTasks: memberCompletedTasks.length,
      pendingTasks: memberPendingTasks.length,
      totalTasks: memberTasks.length
    };
  });

  return {
    projects: {
      total: totalProjects,
      completed: completedProjects,
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
    },
    members: memberAnalytics,
  };
};
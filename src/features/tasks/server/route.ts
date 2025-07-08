import { sessionMiddleware } from '@/lib/session-middleware';
import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { createTaskSchema } from '../schemas';
import { getMember } from '@/features/members/utils';
import { DATABASE_ID, MEMBERS_ID, PROJECTS_ID, TASKS_ID } from '@/config';
import { Query } from 'node-appwrite';
import { ID } from 'node-appwrite';
import { getTasksQuerySchema } from '../schemas';
import { createAdminClient } from '@/lib/appwrite';
import { Project } from '@/features/projects/types';
import { Task } from '../types';

const app = new Hono()
.delete(
    "/:taskId",
    sessionMiddleware,
    async (c) => {
        const user = c.get("user")
        const databases = c.get("databases");
        const { taskId } = c.req.param();

        const task = await databases.getDocument<Task>(
            DATABASE_ID,
            TASKS_ID,
            taskId,
        );

        const member = await getMember({
            databases,
            workspaceId: task.workspaceId,
            userId: user.$id,
        })

        if(!member){
            return c.json({ error: "Unauthorized"}, 401)
        }
        await databases.deleteDocument(
            DATABASE_ID,
            TASKS_ID,
            taskId
        );

        return c.json({ data: { $id: task.$id}})
        
    }
)
.get(
    '/',
    sessionMiddleware,
    validator('query', (value, c) => {
    const result = getTasksQuerySchema.safeParse(value);
    if (!result.success) {
      return c.json({ errors: result.error.flatten() }, 400);
    }
    return result.data; // parsed query params
    }),
    async (c) => {
        const { users } = await createAdminClient();
        const databases = c.get("databases");
        const user = c.get("user");
        const {
        workspaceId,
        projectId,
        status,
        search,
        dueDate,
        priority,
        assigneeId
        } = c.req.valid('query');
    
        const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
        });
    
        if (!member) {
        return c.json({ error: 'Unauthorized' }, 404);
        }
    
        const query = [
            Query.equal('workspaceId', workspaceId),
            Query.orderDesc('$createdAt'),
        ]

        if( projectId) {
            query.push(Query.equal('projectId', projectId))
        }
        if (status) {
            query.push(Query.equal('status', status));
        }
        if (search) {
            query.push(Query.search('name', search));
        }
        if (dueDate) {
            query.push(Query.equal('dueDate', new Date(dueDate).toISOString()));
        }
        if (priority) {
            query.push(Query.equal('priority', priority));
        }
        if (assigneeId) {
            query.push(Query.equal('assigneeId', assigneeId));
        }

        const tasks = await databases.listDocuments<Task>(
            DATABASE_ID,
            TASKS_ID,
            query,
        );

        const projectIds = tasks.documents.map((task) => task.projectId);
        const assigneeIds = tasks.documents.map((task) => task.assigneeId);

        const projects = await databases.listDocuments<Project>(
            DATABASE_ID,
            PROJECTS_ID,
            projectIds.length > 0
                ? [Query.contains('$id', projectIds)] : []
        );

        const members = await databases.listDocuments(
            DATABASE_ID,
            MEMBERS_ID,
            assigneeIds.length > 0
                ? [Query.contains('$id', assigneeIds)] : []
        );

        const assignees = await Promise.all(
            members.documents.map(async (member) => {
                const user = await users.get(member["userid"])

                return {
                    ...member,
                    name: user.name,
                    email: user.email
                }
            })
            );


        const populatedTasks = tasks.documents.map((task) => {
            const project = projects.documents.find(
                (project) => project.$id === task.projectId,
            );

            const assignee = assignees.find(
                (assignee) => assignee.$id === task.assigneeId,
            );

        return {
            ...task,
            project,
            assignee,
        };
        })

        return c.json({
            data: {
                ...tasks,
                documents: populatedTasks,
            },
        },200);
})
.post(
  '/',
  sessionMiddleware,
  validator('json', (value, c) => {
    const result = createTaskSchema.safeParse(value);
    if (!result.success) {
      return c.json({ errors: result.error.flatten() }, 400);
    }
    return result.data; 
  }),
  async (c) => {
    const user = c.get("user")
    const databases = c.get("databases");
    const{
        name,
        status,
        priority,
        workspaceId,    
        projectId,
        dueDate,
        assigneeId,
        description
    } = c.req.valid('json');

    const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
    })

    if (!member){
        return c.json({ error: 'Member not found' }, 404);
    }

    const highestPositionTask = await databases.listDocuments(
        DATABASE_ID,
        TASKS_ID,
        [
            Query.equal('status', status),
            Query.equal('workspaceId', workspaceId),
            Query.orderAsc("position"),
            Query.equal('priority', priority),
            Query.limit(1),
        ],
    );

    const newPosition =
        highestPositionTask.documents.length > 0
            ? highestPositionTask.documents[0].position + 1000
            : 1000;
    
    const task = await databases.createDocument(
        DATABASE_ID,
        TASKS_ID,
        ID.unique(),
        {
            name,
            status,
            priority,
            description,
            workspaceId,
            projectId,
            dueDate: dueDate ? dueDate.toISOString() : null,
            assigneeId,
            position: newPosition,
        }
    );

    return c.json({ data: task }, 201);
  }
)
.patch(
  '/:taskId',
  sessionMiddleware,
  validator('json', (value, c) => {
    const result = createTaskSchema.safeParse(value);
    if (!result.success) {
      return c.json({ errors: result.error.flatten() }, 400);
    }
    return result.data; 
  }),
  async (c) => {
    const user = c.get("user")
    const databases = c.get("databases");
    const{
        name,
        status,
        priority,
        description,    
        projectId,
        dueDate,
        assigneeId,
        workspaceId,
    } = c.req.valid('json');

    const { taskId } = c.req.param()

    const existingTask = await databases.getDocument<Task>(
        DATABASE_ID,
        TASKS_ID,
        taskId,
    )

    const member = await getMember({
        databases,
        workspaceId: existingTask.workspaceId,
        userId: user.$id,
    })

    if (!member){
        return c.json({ error: 'Member not found' }, 404);
    }

    const task = await databases.updateDocument<Task>(
        DATABASE_ID,
        TASKS_ID,
        taskId,
        {
            name,
            status,
            priority,
            description,
            projectId,
            dueDate: dueDate ? dueDate.toISOString() : null,
            assigneeId,
            workspaceId,
        }
    );

    return c.json({ data: task }, 201);
  }
)
.get(
    "/:taskId",
    sessionMiddleware,
    async (c) => {
        const currentUser = c.get("user");
        const databases = c.get("databases")
        const { users } = await createAdminClient();
        const { taskId } = c.req.param();

        const task = await databases.getDocument<Task>(
            DATABASE_ID,
            TASKS_ID,
            taskId,
        )

        const currentMember = await getMember({
            databases,
            workspaceId: task.workspaceId,
            userId: currentUser.$id,
        })

        if (!currentMember){
            return c.json({ erroe: "Unathorized"}, 401)
        }

        const project = await databases.getDocument<Project>(
            DATABASE_ID,
            PROJECTS_ID,
            task.projectId,
        );

        const member = await databases.getDocument(
            DATABASE_ID,
            MEMBERS_ID,
            task.assigneeId,
        )

        const user = await users.get(member.userid)

        const assignee = {
            ...member,
            name: user.name,
            emeail: user.email,
        }

        return c.json({
            data: {
                ...task,
                project,
                assignee,
            }
        })
    }

)

export default app;

"use client";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { SparklesIcon } from "lucide-react";
import { useState } from "react";
import { useGetWorkspaceAnalytics } from "@/features/analytics/api/use-get-analytics-workspace";


export default function AnalyticsPage() {
    const workspaceId = useWorkspaceId();
    const { data: analytics, isLoading, error, isFetching } = useGetWorkspaceAnalytics({ workspaceId });
    const [aiInsight, setAiInsight] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);

    const handleGetAiInsights = async () => {
        setIsAiLoading(true);
        await new Promise((res) => setTimeout(res, 1000));
        setAiInsight("Based on recent trends, project completion rates have increased by 15% in the last month.");
        setIsAiLoading(false);
    };

    // The key change is here:
    // This will prevent the component from trying to render without a valid workspaceId.
    // It will show a loading state until the ID is available,
    // which in turn allows the useQuery hook to start fetching the data.
    if (!workspaceId) {
        return <PageLoader />;
    }

    if (isLoading || isFetching) {
        return <PageLoader />;
    }

    if (error || !analytics || !analytics.projects || !analytics.tasks || !analytics.members) {
        return <PageError message="Failed to load analytics data" />;
    }

    const { members, projects, tasks } = analytics;

    const totalProjects = projects.total;
    const completedProjects = projects.completed;
    const projectsProgress = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

    const totalTasks = tasks.total;
    const completedTasks = tasks.completed;
    const tasksProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const memberTaskData = members.map(member => ({
        name: member.name,
        completedTasks: member.completedTasks,
        totalTasks: member.totalTasks
    }));

    return (
        <div className="space-y-6 p-4">
            <h1 className="text-3xl font-bold">Workspace Analytics</h1>
            <Separator />
            
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-medium">AI Insights</CardTitle>
                    <Button
                        onClick={handleGetAiInsights}
                        disabled={isAiLoading}
                        variant="ghost"
                        size="sm"
                    >
                        {isAiLoading ? "Generating..." : "Generate AI Insights"}
                        <SparklesIcon className="ml-2 h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{aiInsight || "Click the button to get AI-powered insights on your projects."}</p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Projects Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                {completedProjects} / {totalProjects} Projects Completed
                            </span>
                            <Badge variant="secondary">
                                {projectsProgress.toFixed(0)}%
                            </Badge>
                        </div>
                        <Progress value={projectsProgress} className="mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Tasks Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                {completedTasks} / {totalTasks} Tasks Completed
                            </span>
                            <Badge variant="secondary">
                                {tasksProgress.toFixed(0)}%
                            </Badge>
                        </div>
                        <Progress value={tasksProgress} className="mt-2" />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Member Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={memberTaskData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="name" 
                                textAnchor="end" 
                                className="text-center"
                                />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="completedTasks" fill="#8884d8" name="Completed Tasks" />
                            <Bar dataKey="totalTasks" fill="#82ca9d" name="Total Tasks" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
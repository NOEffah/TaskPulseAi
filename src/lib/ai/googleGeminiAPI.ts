export const generateTasksWithGemini = async (
  userPrompt: string,
  members: { name: string; speciality: string }[]
) => {
  // 🔧 1. Generate today's date in ISO format
  const startDate = new Date().toISOString().split("T")[0]; // e.g., "2025-07-31"

  // 🔧 2. Add the start date instruction in the system prompt
  const systemPrompt = `

You are an AI task planner. Given a project description and a list of team members with their specialities, generate a list of tasks. Assign each task to the most suitable member based on their speciality.

Today's date is ${startDate}. Use this as the project start date. Estimate realistic due dates for each task based on task complexity and urgency.

For each task, also assign a priority level: "low", "medium", "high", or "urgent", based on the urgency and importance of the task as implied by the project description. Use your reasoning to determine the appropriate level — do not default to a single value.

Return the result as a JSON array like this:

[
  {
    "name": "Design homepage",
    "description": "Create a clean UI for landing page",
    "status": "backlog",
    "priority": "high",
    "dueDate": "2025-08-01",
    "assigneeName": "Alice Johnson"
  },
  ...
]

Only include names from the given member list. Respond ONLY with the JSON array.

`;

  const memberList = members
    .map((m) => `- ${m.name}: ${m.speciality}`)
    .join("\n");

  const fullPrompt = `
${systemPrompt.trim()}

Project description:
${userPrompt.trim()}

Team members:
${memberList}
  `;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
      }),
    }
  );

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text;
};



export interface InsightsData {
  projects: {
    total: number;
    completed: number;
  };
  tasks: {
    total: number;
    completed: number;
  };
  members: {
    name: string;
    completedTasks: number;
    totalTasks: number;
  }[];
}

export const generateInsightsWithGemini = async (insightsData: InsightsData) => {
  const dataPrompt = JSON.stringify(insightsData, null, 2);

  // Extract member names from insightsData to emphasize them
  const memberNames = insightsData.members.map(m => m.name).join(", ");


  const systemPrompt = `
You are an AI-powered analytics assistant for a project management tool.

You will analyze the provided JSON data, which includes key metrics on projects, tasks, and member performance. 

IMPORTANT:
- Always use the EXACT member names as they appear in the JSON (names: ${memberNames}).
-Always refer to members by their names exactly as provided in the JSON data.
-Never summarize them collectively—always name them individually when discussing performance.
- Never create generic labels like "Member 1", "Member A", or similar. 
- Do not rename or shorten any member names.

Provide a clear, insightful report with the following JSON structure:

{
  "title": "AI-Powered Workspace Insights",
  "summary": "High-level summary of the workspace's overall health and performance. Highlight key achievements or areas of concern.",
  "performanceMetrics": "List each top-performing member by their exact name from the JSON (e.g., 'Kofi Mensah - completed all assigned tasks'). Also list members with moderate or low completion rates, again using exact names. Do not use generic terms like 'members' or 'team members'—always substitute the real name."
  "futureProjections": "Based on current trends, estimate time to complete all remaining tasks and suggest improvements such as task prioritization or workload balancing."
}

Ensure your response is valid JSON and contains only the JSON object, nothing else.
  `;

  const fullPrompt = `${systemPrompt.trim()}\n\nJSON Data:\n${dataPrompt}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    const data = await response.json();

    let aiResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (aiResponseText) {
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = aiResponseText.match(jsonRegex);
      aiResponseText = match && match[1] ? match[1].trim() : aiResponseText.trim();
    }

    return aiResponseText;
  } catch (error) {
    console.error("Error calling Gemini API for insights:", error);
    return null;
  }
};

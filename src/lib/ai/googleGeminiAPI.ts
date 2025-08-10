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

  const systemPrompt = `
You are an AI-powered analytics assistant for a project management tool. Your role is to analyze workspace data and generate a comprehensive, actionable insights report.

Analyze the provided JSON data, which includes key metrics on projects, tasks, and member performance. Provide a clear, insightful report with the following structure:

{
  "title": "AI-Powered Workspace Insights",
  "summary": "Provide a high-level summary of the workspace's overall health and performance. Highlight key achievements or areas of concern.",
  "performanceMetrics": "Based on the data, identify top-performing members (who completed the most tasks), and note any members with low task completion rates. Also, mention the overall project and task completion rates.",
  "futureProjections": "Based on the current trends, provide an estimate for the time it will take to complete all remaining tasks. Offer suggestions for improvement, such as task prioritization or workload balancing among team members."
}

Ensure your response is valid JSON and directly contains only the JSON object.
  `;

  const fullPrompt = `${systemPrompt.trim()}\n\n${dataPrompt}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json", // ✅ Keep this
          },
        }),
      }
    );

    const data = await response.json();

    // 1. Get the raw text from the API response
    let aiResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    // 2. Check if the text is wrapped in markdown, and if so, extract the content
    if (aiResponseText) {
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = aiResponseText.match(jsonRegex);

      if (match && match[1]) {
        aiResponseText = match[1].trim();
      } else {
        // If no markdown is found, use the text as is.
        // This is a safety net in case the AI provides pure JSON.
        aiResponseText = aiResponseText.trim();
      }
    }

    // 3. Return the cleaned-up string.
    // The server route will then parse this string with JSON.parse().
    return aiResponseText;

  } catch (error) {
    console.error("Error calling Gemini API for insights:", error);
    return null;
  }
};
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

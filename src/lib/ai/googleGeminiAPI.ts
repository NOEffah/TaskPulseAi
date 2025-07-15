export const generateTasksWithGemini = async (userPrompt: string) => {
  const systemPrompt = `
You are an AI task planner. Given a project description, return an array of task objects in JSON format like this:

[
  {
    "name": "Design homepage",
    "description": "Create a clean UI for landing page",
    "status": "backlog",
    "priority": "high",
    "dueDate": "2025-08-01"
  },
  ...
]

Respond ONLY with the JSON array. Do not add any explanation or extra text.
`;

  const fullPrompt = `${systemPrompt.trim()}\n\n${userPrompt.trim()}`;

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

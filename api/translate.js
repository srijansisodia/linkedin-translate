export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { input, tone } = req.body;

  const toneGuide = {
    default:   "Thoughtful and reflective professional",
    hustle:    "Aggressive hustle-culture motivator",
    zen:       "Calm mindful guru",
    corporate: "Corporate strategist using buzzwords",
  };

  const prompt = `Convert this real-life incident into a cliché LinkedIn post.
Tone: ${toneGuide[tone] || toneGuide.default}
Input: ${input}
Make it dramatic, insightful, and add relevant hashtags. Keep it under 300 words.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return res.status(200).json({ output: `Gemini error: ${JSON.stringify(data.error)}` });
    }
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text || "Something went wrong";
    res.status(200).json({ output });
  } catch (err) {
    res.status(200).json({ output: `Server error: ${err.message}` });
  }
}

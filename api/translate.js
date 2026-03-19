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

  const prompt = `Convert this real-life incident into a single cliché LinkedIn post.
Tone: ${toneGuide[tone] || toneGuide.default}
Input: ${input}

Rules:
- Write exactly ONE post, no options or alternatives
- Plain text only — no markdown, no bold, no asterisks, no backslashes
- Use real # symbols for hashtags (e.g. #Growth not \\#Growth)
- Keep it under 200 words
- End with 4-6 relevant hashtags on a new line

Return a JSON object with a single field: { "post": "..." }`;

  console.log(`[translate] called — tone: ${tone}, input length: ${input?.length}`);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );
    const data = await response.json();
    if (!response.ok) {
      console.error(`[translate] Gemini error ${response.status}:`, JSON.stringify(data.error));
      return res.status(200).json({ output: `Gemini error: ${JSON.stringify(data.error)}` });
    }
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(raw);
    const output = parsed.post || "Something went wrong";
    console.log(`[translate] success — output length: ${output.length}`);
    res.status(200).json({ output });
  } catch (err) {
    res.status(200).json({ output: `Server error: ${err.message}` });
  }
}

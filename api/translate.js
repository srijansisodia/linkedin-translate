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

  // ── Try Groq first ──────────────────────────────────────────────────────────
  if (process.env.GROQ_API_KEY) {
    try {
      console.log(`[translate] trying Groq — tone: ${tone}, input length: ${input?.length}`);

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.8,
          max_tokens: 512
        })
      });

      const groqData = await groqRes.json();

      if (groqRes.ok) {
        const raw = groqData.choices?.[0]?.message?.content;
        const parsed = JSON.parse(raw);
        const output = parsed.post || "Something went wrong";
        console.log(`[translate] Groq success — output length: ${output.length}`);
        return res.status(200).json({ output, provider: "groq" });
      }

      console.warn(`[translate] Groq failed (${groqRes.status}), falling back to Gemini:`, JSON.stringify(groqData.error));
    } catch (err) {
      console.warn(`[translate] Groq threw error, falling back to Gemini:`, err.message);
    }
  }

  // ── Fall back to Gemini ─────────────────────────────────────────────────────
  try {
    console.log(`[translate] trying Gemini — tone: ${tone}, input length: ${input?.length}`);

    const geminiRes = await fetch(
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

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error(`[translate] Gemini error ${geminiRes.status}:`, JSON.stringify(geminiData.error));
      return res.status(200).json({ output: `Error: ${geminiData.error?.message || "Both providers failed"}` });
    }

    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(raw);
    const output = parsed.post || "Something went wrong";
    console.log(`[translate] Gemini success — output length: ${output.length}`);
    res.status(200).json({ output, provider: "gemini" });

  } catch (err) {
    res.status(200).json({ output: `Server error: ${err.message}` });
  }
}

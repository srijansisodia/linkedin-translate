export default async function handler(req, res) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    const data = await response.json();
    const names = data.models?.map(m => m.name) || data;
    res.status(200).json(names);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

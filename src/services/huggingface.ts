const HF_TOKEN = import.meta.env.VITE_HUGGING_FACE_API_KEY || "";

export async function hfAnalyzeSentiment(text: string): Promise<string> {
  if (!HF_TOKEN) throw new Error("HF_TOKEN_MISSING");
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english",
      {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        method: "POST",
        body: JSON.stringify({ inputs: text }),
      }
    );
    if (!response.ok) throw new Error(`HF_API_ERROR: ${response.status}`);
    const result = await response.json();
    if (Array.isArray(result) && result[0]) {
      const top = result[0].reduce((prev: any, current: any) => (prev.score > current.score) ? prev : current);
      return top.label;
    }
    return "NEUTRAL";
  } catch (error) {
    console.error("HF Sentiment Error:", error);
    throw error;
  }
}

export async function hfSummarize(text: string): Promise<string> {
  if (!HF_TOKEN) throw new Error("HF_TOKEN_MISSING");
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        method: "POST",
        body: JSON.stringify({ inputs: text }),
      }
    );
    if (!response.ok) throw new Error(`HF_API_ERROR: ${response.status}`);
    const result = await response.json();
    if (Array.isArray(result) && result[0]?.summary_text) {
      return result[0].summary_text;
    }
    throw new Error("HF_INVALID_RESPONSE");
  } catch (error) {
    console.error("HF Summarization Error:", error);
    throw error;
  }
}

export async function hfExtractKeywords(text: string): Promise<string[]> {
  if (!HF_TOKEN) throw new Error("HF_TOKEN_MISSING");
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/ml6team/keyphrase-extraction-distilbert-inspec",
      {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        method: "POST",
        body: JSON.stringify({ inputs: text }),
      }
    );
    if (!response.ok) throw new Error(`HF_API_ERROR: ${response.status}`);
    const result = await response.json();
    if (Array.isArray(result)) {
      return result.map((k: any) => k.word.toLowerCase().trim()).filter((v, i, a) => a.indexOf(v) === i);
    }
    return [];
  } catch (error) {
    console.error("HF Keyword Extraction Error:", error);
    throw error;
  }
}

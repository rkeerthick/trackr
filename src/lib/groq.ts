import Groq from "groq-sdk";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const FAST_MODEL  = "llama3-8b-8192";       // low-latency tasks
export const SMART_MODEL = "llama-3.3-70b-versatile"; // reasoning tasks

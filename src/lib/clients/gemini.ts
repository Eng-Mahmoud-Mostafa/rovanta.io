import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireEnv } from "@/lib/env";

export function createGeminiClient() {
  return new GoogleGenerativeAI(requireEnv("GEMINI_API_KEY"));
}

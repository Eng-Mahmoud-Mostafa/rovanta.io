import { NextResponse } from "next/server";
import { recommendAutomation } from "@/lib/ai/recommendations";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { problem?: string };
    const problem = body.problem?.trim();

    if (!problem) {
      return NextResponse.json({ error: "Describe the business problem first." }, { status: 400 });
    }

    const recommendation = await recommendAutomation(problem);
    return NextResponse.json({ recommendation });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate recommendation." },
      { status: 500 }
    );
  }
}

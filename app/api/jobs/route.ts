import { NextRequest, NextResponse } from "next/server";
import { POST as searchJobs } from "./search/route";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";
  const platformsParam = searchParams.get("platforms");
  const platforms = platformsParam
    ? platformsParam.split(",").filter(Boolean)
    : ["greenhouse", "lever", "workable", "wellfound"];

  // Re-route to searchJobs handler with synthetic request
  const searchRequest = new NextRequest(
    new URL("/api/jobs/search", request.url).toString(),
    {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({
        platforms,
        forceRefresh,
      }),
    }
  );

  return searchJobs(searchRequest);
}

export async function POST(request: NextRequest) {
  return searchJobs(request);
}

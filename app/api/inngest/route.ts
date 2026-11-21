// ==============================================================================
// app/api/inngest/route.ts
// Next.js Route Handler for Inngest Workflows
// ==============================================================================

import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  automatedApplicationWorkflow,
  resumeApplicationWorkflow,
} from "@/lib/inngest/functions/application-flow";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [automatedApplicationWorkflow, resumeApplicationWorkflow],
});

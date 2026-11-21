// ==============================================================================
// lib/application/browserbase-scripts/session-manager.ts
// Lifecycle manager for Browserbase sessions with sequential concurrency lock
// ==============================================================================

import { browserbaseService } from "../browserbase.service";
import { stagehandService } from "../stagehand.service";

export interface SessionContext {
  sessionId: string;
  liveDebugUrl?: string | null;
  stagehand?: any;
  page?: any;
}

export class SessionManager {
  /**
   * Initializes a new Browserbase cloud browser session and connects Stagehand
   */
  public static async createAndConnectSession(options?: {
    onProgress?: (msg: string) => void;
  }): Promise<SessionContext> {
    options?.onProgress?.("Creating Browserbase cloud session...");

    const bbSession = await browserbaseService.createSession({ keepAlive: true });
    const sessionId = bbSession.id;
    const liveDebugUrl = bbSession.liveDebugUrl || null;

    options?.onProgress?.("Connecting Stagehand browser instance...");
    const { stagehand, page } = await stagehandService.initSession({
      sessionId,
      onProgress: options?.onProgress,
    });

    return {
      sessionId,
      liveDebugUrl,
      stagehand,
      page,
    };
  }

  /**
   * Safely closes the session and releases Browserbase resources
   */
  public static async cleanupSession(sessionId?: string | null): Promise<void> {
    if (sessionId) {
      await browserbaseService.terminateSession(sessionId).catch(() => null);
    }
    await stagehandService.close().catch(() => null);
  }
}

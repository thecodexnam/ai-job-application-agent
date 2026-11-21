// ==============================================================================
// lib/application/browserbase.service.ts
// Secure backend service for creating and managing Browserbase sessions
// ==============================================================================

import { Browserbase } from "@browserbasehq/sdk";

export interface BrowserbaseSessionInfo {
  id: string;
  connectUrl?: string;
  liveDebugUrl?: string;
  status: string;
  createdAt: string;
}

export class BrowserbaseService {
  private client: Browserbase | null = null;
  private apiKey: string;
  private projectId: string;

  constructor() {
    this.apiKey = process.env.BROWSERBASE_API_KEY || "";
    this.projectId = process.env.BROWSERBASE_PROJECT_ID || "";

    if (this.apiKey) {
      this.client = new Browserbase({
        apiKey: this.apiKey,
      });
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.projectId);
  }

  /**
   * Creates an active Browserbase cloud browser session.
   */
  public async createSession(options?: {
    keepAlive?: boolean;
    timeout?: number;
  }): Promise<BrowserbaseSessionInfo> {
    if (!this.isConfigured()) {
      throw new Error(
        "Browserbase is not configured. Please add BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID to your environment variables."
      );
    }

    try {
      // 1. If SDK is available, create via official SDK
      if (this.client) {
        const session = await this.client.sessions.create({
          projectId: this.projectId,
          keepAlive: options?.keepAlive ?? false,
        });

        const liveUrls = await this.getLiveUrls(session.id);

        return {
          id: session.id,
          connectUrl: (session as any).connectUrl || undefined,
          liveDebugUrl: liveUrls?.debuggerFullscreenUrl || liveUrls?.wsUrl || undefined,
          status: session.status || "RUNNING",
          createdAt: session.createdAt || new Date().toISOString(),
        };
      }

      // 2. Direct REST fallback
      const resp = await fetch("https://api.browserbase.com/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bb-api-key": this.apiKey,
        },
        body: JSON.stringify({
          projectId: this.projectId,
          keepAlive: options?.keepAlive ?? false,
        }),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Browserbase session creation failed (${resp.status}): ${errorText}`);
      }

      const data = await resp.json();
      return {
        id: data.id,
        connectUrl: data.connectUrl,
        liveDebugUrl: data.debuggerFullscreenUrl,
        status: data.status || "RUNNING",
        createdAt: data.createdAt || new Date().toISOString(),
      };
    } catch (err: any) {
      console.error("[BrowserbaseService] Error creating session:", err.message);
      throw err;
    }
  }

  /**
   * Retrieves live debugging / inspector URLs for a session.
   */
  public async getLiveUrls(sessionId: string): Promise<{
    debuggerFullscreenUrl?: string;
    wsUrl?: string;
    pages?: Array<{ id: string; url: string; title: string; faviconUrl?: string }>;
  } | null> {
    if (!this.isConfigured() || !sessionId) return null;

    try {
      if (this.client) {
        const live: any = await this.client.sessions.debug(sessionId).catch(() => null);
        return {
          debuggerFullscreenUrl: live?.debuggerFullscreenUrl,
          wsUrl: live?.wsUrl,
          pages: live?.pages,
        };
      }

      const resp = await fetch(`https://api.browserbase.com/v1/sessions/${sessionId}/live-urls`, {
        headers: { "x-bb-api-key": this.apiKey },
      });

      if (resp.ok) {
        return await resp.json();
      }
      return null;
    } catch (err) {
      console.warn("[BrowserbaseService] Could not fetch live debug URL:", err);
      return null;
    }
  }

  /**
   * Safely terminates a Browserbase session to free cloud resources.
   */
  public async terminateSession(sessionId: string): Promise<void> {
    if (!this.isConfigured() || !sessionId) return;

    try {
      if (this.client) {
        await this.client.sessions.update(sessionId, {
          status: "REQUEST_RELEASE",
          projectId: this.projectId,
        });
        return;
      }

      await fetch(`https://api.browserbase.com/v1/sessions/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bb-api-key": this.apiKey,
        },
        body: JSON.stringify({
          status: "REQUEST_RELEASE",
          projectId: this.projectId,
        }),
      });
    } catch (err) {
      console.warn(`[BrowserbaseService] Error terminating session ${sessionId}:`, err);
    }
  }
}

export const browserbaseService = new BrowserbaseService();

export interface ValidatedJobUrl {
  ok: true;
  url: string;
}

export interface InvalidJobUrl {
  ok: false;
  error: string;
}

export function validateJobApplicationUrl(
  raw: string | null | undefined
): ValidatedJobUrl | InvalidJobUrl {
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return { ok: false, error: "A job application URL is required." };
  }

  const trimmed = raw.trim();
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  const withProtocol = hasScheme ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return { ok: false, error: "The job application URL is invalid." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http and https job application URLs are supported." };
  }

  if (!parsed.hostname || parsed.hostname === "localhost") {
    if (process.env.APPLICATION_AUTOMATION_MODE === "mock") {
      return { ok: true, url: parsed.toString() };
    }
  }

  return { ok: true, url: parsed.toString() };
}

export function isMockAutomationEnabled(): boolean {
  return process.env.APPLICATION_AUTOMATION_MODE === "mock";
}

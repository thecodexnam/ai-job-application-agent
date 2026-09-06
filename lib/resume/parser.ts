import {
  ParsedResumeData,
  ResumePersonalInfo,
  ResumeSkillItem,
  ResumeWorkExperience,
  ResumeEducation,
  ResumeProject,
  ResumeCertification,
  ResumeAdditionalInfo,
} from "@/types/resume";

/**
 * Parses raw resume text into structured ParsedResumeData.
 * Tries LLM (Gemini or OpenAI) if API keys are available, otherwise falls back to
 * high-precision heuristic NLP & regex extraction.
 */
export async function parseResumeText(rawText: string): Promise<ParsedResumeData> {
  if (!rawText || rawText.trim().length === 0) {
    throw new Error("Resume content is empty or unreadable.");
  }

  // 1. Try Gemini if GEMINI_API_KEY is available
  if (process.env.GEMINI_API_KEY) {
    try {
      const geminiResult = await parseWithGemini(rawText, process.env.GEMINI_API_KEY);
      if (geminiResult) return geminiResult;
    } catch (err) {
      console.warn("Gemini parsing failed, falling back to heuristic parser:", err);
    }
  }

  // 2. Try OpenAI if OPENAI_API_KEY is available
  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiResult = await parseWithOpenAI(rawText, process.env.OPENAI_API_KEY);
      if (openaiResult) return openaiResult;
    } catch (err) {
      console.warn("OpenAI parsing failed, falling back to heuristic parser:", err);
    }
  }

  // 3. Fallback: Resilient internal section-based parser
  return parseWithHeuristics(rawText);
}

import { GoogleGenAI } from "@google/genai";

/**
 * Gemini LLM structured parsing using official @google/genai SDK
 */
async function parseWithGemini(text: string, apiKey: string): Promise<ParsedResumeData | null> {
  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert resume parsing AI. Extract and structure all information from the resume below into valid JSON matching this exact structure:
{
  "personal_info": {
    "full_name": "...",
    "email": "...",
    "phone": "...",
    "location": "...",
    "headline": "...",
    "linkedin_url": "...",
    "github_url": "...",
    "portfolio_url": "...",
    "other_links": [{"label": "...", "url": "..."}]
  },
  "summary": "...",
  "skills": [
    {
      "name": "...",
      "category": "Technical Skills" | "Programming Languages" | "Frameworks & Libraries" | "Tools & Technologies" | "Soft Skills" | "Other",
      "level": "Beginner" | "Intermediate" | "Advanced" | "Expert"
    }
  ],
  "work_experience": [
    {
      "company_name": "...",
      "position": "...",
      "employment_type": "Full-time" | "Part-time" | "Contract" | "Internship" | "Freelance",
      "location": "...",
      "start_date": "...",
      "end_date": "...",
      "is_current": false,
      "description": "...",
      "highlights": ["..."]
    }
  ],
  "education": [
    {
      "institution": "...",
      "degree": "...",
      "field_of_study": "...",
      "location": "...",
      "start_date": "...",
      "end_date": "...",
      "grade": "...",
      "description": "..."
    }
  ],
  "projects": [
    {
      "title": "...",
      "description": "...",
      "technologies": ["..."],
      "github_url": "...",
      "live_url": "...",
      "highlights": ["..."]
    }
  ],
  "certifications": [
    {
      "name": "...",
      "issuing_organization": "...",
      "issue_date": "...",
      "expiration_date": "...",
      "credential_id": "...",
      "credential_url": "..."
    }
  ],
  "additional_info": [
    {
      "category": "Award" | "Publication" | "Language" | "Volunteer" | "Interest" | "Other",
      "title": "...",
      "description": "...",
      "date": "...",
      "url": "..."
    }
  ]
}

Only return valid JSON. Do not include markdown codeblocks or commentary.

Resume Text:
${text.slice(0, 25000)}
`;

    // Prioritize gemini-3.5-flash-lite, with configurable override via GEMINI_MODEL
    const primaryModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const modelsToTry = Array.from(new Set([
      primaryModel,
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ]));
    let rawOutput: string | undefined;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
        rawOutput = response.text;
        if (rawOutput) break;
      } catch (modelErr) {
        console.warn(`Attempt with ${model} failed, trying next model...`);
      }
    }

    if (!rawOutput) return null;

    const parsed = JSON.parse(rawOutput);
    return sanitizeParsedData(parsed);
  } catch (err) {
    console.error("Gemini parse error:", err);
    return null;
  }
}

/**
 * OpenAI LLM structured parsing
 */
async function parseWithOpenAI(text: string, apiKey: string): Promise<ParsedResumeData | null> {
  try {
    const prompt = `Extract and structure all information from the resume below into valid JSON matching this schema:
personal_info: { full_name, email, phone, location, headline, linkedin_url, github_url, portfolio_url, other_links: [{label, url}] }
summary: string
skills: [{ name, category: "Technical Skills"|"Programming Languages"|"Frameworks & Libraries"|"Tools & Technologies"|"Soft Skills"|"Other", level }]
work_experience: [{ company_name, position, employment_type, location, start_date, end_date, is_current, description, highlights: [string] }]
education: [{ institution, degree, field_of_study, location, start_date, end_date, grade, description }]
projects: [{ title, description, technologies: [string], github_url, live_url, highlights: [string] }]
certifications: [{ name, issuing_organization, issue_date, expiration_date, credential_id, credential_url }]
additional_info: [{ category: "Award"|"Publication"|"Language"|"Volunteer"|"Interest"|"Other", title, description, date, url }]

Resume:
${text.slice(0, 15000)}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a professional resume parser returning valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    return sanitizeParsedData(parsed);
  } catch (err) {
    console.error("OpenAI parse error:", err);
    return null;
  }
}

/**
 * Heuristic Parser: Zero external dependencies, ultra-resilient regex & section segmentation
 */
export function parseWithHeuristics(rawText: string): ParsedResumeData {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Personal Info Extraction
  const personal_info: ResumePersonalInfo = {};

  // Email
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) personal_info.email = emailMatch[0];

  // Phone
  const phoneMatch = rawText.match(
    /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/
  ) || rawText.match(/\+?\d{1,4}[-.\s]?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}/);
  if (phoneMatch) personal_info.phone = phoneMatch[0].trim();

  // LinkedIn
  const linkedinMatch = rawText.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i
  );
  if (linkedinMatch) personal_info.linkedin_url = linkedinMatch[0];

  // GitHub
  const githubMatch = rawText.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i
  );
  if (githubMatch) personal_info.github_url = githubMatch[0];

  // Portfolio / Website
  const portfolioMatch = rawText.match(
    /(?:https?:\/\/)?(?:www\.)?(?!linkedin|github)([a-zA-Z0-9-]+\.(?:dev|io|me|com|app|tech|org))(?:\/[^\s)]*)?/i
  );
  if (portfolioMatch) personal_info.portfolio_url = portfolioMatch[0];

  // Full Name: Check first 5 non-empty lines for candidate name
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // Ignore lines that look like headers, contact details, or links
    if (
      !line.includes("@") &&
      !line.toLowerCase().includes("resume") &&
      !line.toLowerCase().includes("curriculum vitae") &&
      !line.toLowerCase().includes("phone") &&
      !line.toLowerCase().includes("linkedin") &&
      !line.toLowerCase().includes("github") &&
      !line.toLowerCase().includes("portfolio") &&
      line.length >= 3 &&
      line.length <= 40 &&
      /^[A-Za-z\s.'-]+$/.test(line)
    ) {
      personal_info.full_name = line;
      // Potential headline in next line
      if (i + 1 < lines.length && lines[i + 1].length < 60 && !lines[i + 1].includes("@")) {
        personal_info.headline = lines[i + 1];
      }
      break;
    }
  }

  // Location: Search top 10 lines for city/state/country patterns
  const locationRegex = /\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?|[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)\b/;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const match = lines[i].match(locationRegex);
    if (match && !match[0].toLowerCase().includes("university") && !match[0].toLowerCase().includes("college")) {
      personal_info.location = match[0].trim();
      break;
    }
  }

  // 2. Identify Sections
  const sectionHeaders = [
    { type: "summary", regex: /^(?:professional\s+)?(?:summary|profile|about\s+me|career\s+objective|objective)$/i },
    { type: "skills", regex: /^(?:technical\s+)?(?:skills|core\s+competencies|technologies|tools\s*(&|and)?\s*technologies)$/i },
    { type: "experience", regex: /^(?:work\s+)?(?:experience|employment(?:\s+history)?|professional\s+experience)$/i },
    { type: "education", regex: /^(?:education|academic(?:\s+background|\s+history)?|degrees)$/i },
    { type: "projects", regex: /^(?:personal\s+)?(?:projects|key\s+projects|academic\s+projects)$/i },
    { type: "certifications", regex: /^(?:certifications?|licenses(?:\s*(&|and)\s*certifications)?|courses)$/i },
    { type: "additional", regex: /^(?:additional\s+information|awards(?:\s*(&|and)\s*honors)?|honors|publications|languages|volunteer(?:\s+experience)?|interests)$/i },
  ];

  interface SectionBlock {
    type: string;
    header: string;
    lines: string[];
  }

  const sections: SectionBlock[] = [];
  let currentSection: SectionBlock = { type: "header", header: "header", lines: [] };

  for (const line of lines) {
    let matchedType: string | null = null;
    let matchedHeader = "";

    const cleanLine = line.replace(/[:_#*-]/g, "").trim();
    for (const h of sectionHeaders) {
      if (h.regex.test(cleanLine)) {
        matchedType = h.type;
        matchedHeader = cleanLine;
        break;
      }
    }

    if (matchedType) {
      if (currentSection.lines.length > 0 || currentSection.type !== "header") {
        sections.push(currentSection);
      }
      currentSection = { type: matchedType, header: matchedHeader, lines: [] };
    } else {
      currentSection.lines.push(line);
    }
  }
  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  // 3. Extract Professional Summary
  let summary = "";
  const summarySec = sections.find((s) => s.type === "summary");
  if (summarySec && summarySec.lines.length > 0) {
    summary = summarySec.lines.join(" ");
  }

  // 4. Extract Skills
  const skills: ResumeSkillItem[] = [];
  const knownLanguages = [
    "javascript", "typescript", "python", "java", "c++", "c#", "c", "go", "golang",
    "rust", "ruby", "php", "swift", "kotlin", "sql", "r", "html", "css", "html5", "css3", "sass"
  ];
  const knownFrameworks = [
    "react", "react.js", "next.js", "nextjs", "vue", "vue.js", "angular", "node.js", "nodejs",
    "express", "express.js", "django", "fastapi", "flask", "spring", "spring boot",
    "tailwind", "tailwindcss", "bootstrap", "graphql", "rest", "rest api", "redux", "zustand"
  ];
  const knownTools = [
    "git", "github", "docker", "kubernetes", "aws", "amazon web services", "gcp", "google cloud",
    "azure", "linux", "jira", "postman", "vercel", "supabase", "firebase", "postgresql", "postgres",
    "mongodb", "mysql", "redis", "elasticsearch", "ci/cd", "jest", "cypress"
  ];
  const knownSoftSkills = [
    "leadership", "communication", "teamwork", "problem solving", "critical thinking",
    "time management", "agile", "scrum", "mentoring", "adaptability", "collaboration"
  ];

  const skillsSec = sections.find((s) => s.type === "skills");
  const skillTokens: string[] = [];

  if (skillsSec) {
    for (const line of skillsSec.lines) {
      // Split on commas, bullets, pipes, or semicolons
      const parts = line.split(/[,|;•·\n]/).map((p) => p.trim()).filter((p) => p.length > 1);
      for (const p of parts) {
        // Strip category prefixes like "Frontend:", "Tools:", etc.
        const cleaned = p.replace(/^[^:]+:\s*/, "").trim();
        if (cleaned) skillTokens.push(cleaned);
      }
    }
  } else {
    // Check general text for known tech terms
    const textLower = rawText.toLowerCase();
    for (const lang of knownLanguages) {
      if (textLower.includes(` ${lang} `) || textLower.includes(`, ${lang}`) || textLower.includes(`${lang},`)) {
        skillTokens.push(capitalize(lang));
      }
    }
    for (const fw of knownFrameworks) {
      if (textLower.includes(` ${fw} `) || textLower.includes(`, ${fw}`) || textLower.includes(`${fw},`)) {
        skillTokens.push(capitalize(fw));
      }
    }
  }

  // Deduplicate and categorize skills
  const seenSkill = new Set<string>();
  for (const token of skillTokens) {
    const clean = token.replace(/[()[\]{}]/g, "").trim();
    if (!clean || clean.length > 35 || seenSkill.has(clean.toLowerCase())) continue;
    seenSkill.add(clean.toLowerCase());

    const lower = clean.toLowerCase();
    let category: ResumeSkillItem["category"] = "Technical Skills";
    if (knownLanguages.some((l) => lower === l || lower.startsWith(l))) {
      category = "Programming Languages";
    } else if (knownFrameworks.some((f) => lower === f || lower.startsWith(f))) {
      category = "Frameworks & Libraries";
    } else if (knownTools.some((t) => lower === t || lower.startsWith(t))) {
      category = "Tools & Technologies";
    } else if (knownSoftSkills.some((s) => lower === s || lower.startsWith(s))) {
      category = "Soft Skills";
    }

    skills.push({
      name: clean,
      category,
      level: "Advanced",
      order_index: skills.length,
    });
  }

  // 5. Extract Work Experience
  const work_experience: ResumeWorkExperience[] = [];
  const expSec = sections.find((s) => s.type === "experience");
  if (expSec) {
    const expBlocks = splitEntriesByDate(expSec.lines);
    for (const block of expBlocks) {
      const expItem = parseExperienceBlock(block);
      if (expItem.company_name || expItem.position) {
        expItem.order_index = work_experience.length;
        work_experience.push(expItem);
      }
    }
  }

  // 6. Extract Education
  const education: ResumeEducation[] = [];
  const eduSec = sections.find((s) => s.type === "education");
  if (eduSec) {
    const eduBlocks = splitEntriesByDate(eduSec.lines);
    for (const block of eduBlocks) {
      const eduItem = parseEducationBlock(block);
      if (eduItem.institution || eduItem.degree) {
        eduItem.order_index = education.length;
        education.push(eduItem);
      }
    }
  }

  // 7. Extract Projects
  const projects: ResumeProject[] = [];
  const projSec = sections.find((s) => s.type === "projects");
  if (projSec) {
    const projBlocks = splitProjectEntries(projSec.lines);
    for (const block of projBlocks) {
      const projItem = parseProjectBlock(block);
      if (projItem.title) {
        projItem.order_index = projects.length;
        projects.push(projItem);
      }
    }
  }

  // 8. Extract Certifications
  const certifications: ResumeCertification[] = [];
  const certSec = sections.find((s) => s.type === "certifications");
  if (certSec) {
    for (const line of certSec.lines) {
      if (line.length < 4) continue;
      const certItem = parseCertificationLine(line);
      certItem.order_index = certifications.length;
      certifications.push(certItem);
    }
  }

  // 9. Extract Additional Info
  const additional_info: ResumeAdditionalInfo[] = [];
  const addSec = sections.find((s) => s.type === "additional");
  if (addSec) {
    for (const line of addSec.lines) {
      if (line.length < 4) continue;
      let category: ResumeAdditionalInfo["category"] = "Award";
      const lower = line.toLowerCase();
      if (lower.includes("language") || lower.includes("fluent") || lower.includes("native")) {
        category = "Language";
      } else if (lower.includes("volunteer") || lower.includes("community")) {
        category = "Volunteer";
      } else if (lower.includes("publication") || lower.includes("paper")) {
        category = "Publication";
      } else if (lower.includes("interest") || lower.includes("hobby")) {
        category = "Interest";
      }

      additional_info.push({
        category,
        title: line,
        order_index: additional_info.length,
      });
    }
  }

  return {
    personal_info,
    summary,
    skills,
    work_experience,
    education,
    projects,
    certifications,
    additional_info,
  };
}

// ----------------------------------------------------------------------
// Helper Parsers
// ----------------------------------------------------------------------

const DATE_RANGE_REGEX = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\s*(?:-|–|to)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(?:(?:19|20)\d{2}|Present|Current)/i;

function splitEntriesByDate(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let currentBlock: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasDate = DATE_RANGE_REGEX.test(line);

    // If line has date and we already have lines, start a new block
    if (hasDate && currentBlock.length >= 1) {
      const prevLine = currentBlock[currentBlock.length - 1];
      if (!isBulletPoint(prevLine) && prevLine.length < 80) {
        currentBlock.pop();
        if (currentBlock.length > 0) blocks.push(currentBlock);
        currentBlock = [prevLine, line];
      } else {
        if (currentBlock.length > 0) blocks.push(currentBlock);
        currentBlock = [line];
      }
    } else {
      currentBlock.push(line);
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  return blocks;
}

const KNOWN_ROLES_REGEX = /\b(engineer|developer|designer|manager|lead|architect|director|intern|specialist|consultant|analyst|scientist|programmer|coordinator|officer)\b/i;

function parseExperienceBlock(lines: string[]): ResumeWorkExperience {
  let company_name = "";
  let position = "";
  let location = "";
  let start_date = "";
  let end_date = "";
  let is_current = false;
  const highlights: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateMatch = line.match(DATE_RANGE_REGEX);

    if (dateMatch && !start_date) {
      const dateParts = dateMatch[0].split(/-|–|to/i).map((d) => d.trim());
      start_date = dateParts[0] || "";
      end_date = dateParts[1] || "";
      if (end_date.toLowerCase().includes("present") || end_date.toLowerCase().includes("current")) {
        is_current = true;
      }

      // Check if location is on same line
      const afterDate = line.replace(dateMatch[0], "").replace(/^[|•·,\s]+/, "").trim();
      if (afterDate && !location && afterDate.includes(",")) {
        location = afterDate;
      }
      continue;
    }

    if (isBulletPoint(line)) {
      highlights.push(cleanBulletPoint(line));
    } else if (!company_name && !position) {
      // First non-bullet line is often "Company - Position" or "Position - Company"
      if (line.includes("-") || line.includes("|") || line.includes(" at ")) {
        const parts = line.split(/[-|]|(?:\s+at\s+)/i).map((p) => p.trim());
        const first = parts[0];
        const second = parts[1] || "";

        if (KNOWN_ROLES_REGEX.test(first) && !KNOWN_ROLES_REGEX.test(second)) {
          position = first;
          company_name = second;
        } else {
          company_name = first;
          position = second;
        }
      } else {
        if (KNOWN_ROLES_REGEX.test(line)) {
          position = line;
        } else {
          company_name = line;
        }
      }
    } else if (!position && KNOWN_ROLES_REGEX.test(line)) {
      position = line;
    } else if (!company_name) {
      company_name = line;
    } else if (!location && (line.includes(",") || line.toLowerCase().includes("remote"))) {
      location = line;
    } else {
      highlights.push(cleanBulletPoint(line));
    }
  }

  return {
    company_name: company_name || "Company",
    position: position || "Professional",
    location,
    start_date,
    end_date,
    is_current,
    description: highlights.join(" "),
    highlights,
  };
}

function parseEducationBlock(lines: string[]): ResumeEducation {
  let institution = "";
  let degree = "";
  let field_of_study = "";
  let start_date = "";
  let end_date = "";
  let grade = "";
  let location = "";

  for (const line of lines) {
    const dateMatch = line.match(DATE_RANGE_REGEX) || line.match(/\b(19|20)\d{2}\b/);
    if (dateMatch && !end_date) {
      end_date = dateMatch[0];
    }

    const gpaMatch = line.match(/(?:GPA|CGPA|Grade)?:?\s*([0-4]\.\d{1,2}(?:\s*\/\s*4\.0)?|[0-9]\.\d{1,2}(?:\s*\/\s*10)?)/i);
    if (gpaMatch && !grade) {
      grade = gpaMatch[0];
    }

    if (!institution && /university|college|institute|school|academy/i.test(line)) {
      institution = line.split(/[-|,]/)[0].trim();
      continue;
    }

    if (!degree && /bachelor|master|b\.s|m\.s|b\.tech|m\.tech|phd|associate|diploma|degree/i.test(line)) {
      degree = line;
      if (line.toLowerCase().includes(" in ")) {
        const parts = line.split(/\s+in\s+/i);
        degree = parts[0].trim();
        field_of_study = parts[1]?.trim() || "";
      }
    } else if (!location && line.includes(",")) {
      location = line;
    }
  }

  return {
    institution: institution || (lines[0] || "University"),
    degree: degree || (lines[1] || "Degree"),
    field_of_study: field_of_study || "",
    location,
    start_date,
    end_date,
    grade,
    description: lines.join("; "),
  };
}

function splitProjectEntries(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    const isMetaLine =
      line.includes("github.com") ||
      line.includes("http") ||
      line.toLowerCase().startsWith("technologies") ||
      line.toLowerCase().startsWith("tech stack") ||
      isBulletPoint(line);

    if (!isMetaLine && line.length < 60 && current.length > 0) {
      blocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current);
  return blocks;
}

function parseProjectBlock(lines: string[]): ResumeProject {
  const title = lines[0]?.replace(/[|•·-].*$/, "").trim() || "Project";
  let github_url = "";
  let live_url = "";
  const technologies: string[] = [];
  const highlights: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("github.com")) {
      const m = line.match(/(?:https?:\/\/)?github\.com\/[^\s)]+/);
      if (m) github_url = m[0];
    }
    if (line.includes("http") && !line.includes("github.com")) {
      const m = line.match(/https?:\/\/[^\s)]+/);
      if (m) live_url = m[0];
    }

    if (/technologies|tech stack|tools used/i.test(line)) {
      const techList = line.replace(/^[^:]+:\s*/, "").split(/[,|;]/);
      for (const t of techList) {
        if (t.trim()) technologies.push(t.trim());
      }
    } else if (isBulletPoint(line)) {
      highlights.push(cleanBulletPoint(line));
    }
  }

  return {
    title,
    description: highlights.join(" ") || lines.slice(1).join(" "),
    technologies,
    github_url,
    live_url,
    highlights,
  };
}

function parseCertificationLine(line: string): ResumeCertification {
  let name = line;
  let issuing_organization = "Professional Certification";
  let issue_date = "";
  let credential_url = "";

  const urlMatch = line.match(/https?:\/\/[^\s)]+/);
  if (urlMatch) {
    credential_url = urlMatch[0];
    line = line.replace(credential_url, "");
  }

  const dateMatch = line.match(/\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\b/i);
  if (dateMatch) {
    issue_date = dateMatch[0];
  }

  if (line.includes("-") || line.includes("|") || line.includes("by")) {
    const parts = line.split(/[-|]|(?:\s+by\s+)/i).map((p) => p.trim());
    name = parts[0] || name;
    if (parts[1]) issuing_organization = parts[1];
  }

  return {
    name: name.replace(/[•·*]/g, "").trim(),
    issuing_organization,
    issue_date,
    credential_url,
  };
}

function isBulletPoint(line: string): boolean {
  return /^[\s]*[•·*–-]\s+/.test(line) || /^\d+\.\s+/.test(line);
}

function cleanBulletPoint(line: string): string {
  return line.replace(/^[\s]*[•·*–-]\s+/, "").replace(/^\d+\.\s+/, "").trim();
}

function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function sanitizeParsedData(data: any): ParsedResumeData {
  return {
    personal_info: data?.personal_info || {},
    summary: data?.summary || "",
    skills: Array.isArray(data?.skills) ? data.skills : [],
    work_experience: Array.isArray(data?.work_experience) ? data.work_experience : [],
    education: Array.isArray(data?.education) ? data.education : [],
    projects: Array.isArray(data?.projects) ? data.projects : [],
    certifications: Array.isArray(data?.certifications) ? data.certifications : [],
    additional_info: Array.isArray(data?.additional_info) ? data.additional_info : [],
  };
}

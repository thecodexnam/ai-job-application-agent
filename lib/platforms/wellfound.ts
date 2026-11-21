// ==============================================================================
// lib/platforms/wellfound.ts
// Platform handler for Wellfound (formerly AngelList Talent) application flows
// ==============================================================================

import { FormField } from "../application/types";

export const wellfoundPlatformHandler = {
  platform: "wellfound" as const,

  knownFieldSelectors: {
    noteTextarea: ['textarea[name="note"]', 'textarea[placeholder*="note"]', 'textarea'],
    resume: ['input[type="file"]'],
    submitButton: ['button[data-test="JobApplicationModal-submit"]', 'button:has-text("Apply")', 'button[type="submit"]'],
  },

  getDefaultFormFields(): FormField[] {
    return [
      { id: "note", name: "note", label: "Note to Hiring Manager", type: "textarea", required: true },
      { id: "resume", name: "resume", label: "Resume", type: "file", required: true },
    ];
  },

  getExtractionScript(): string {
    return `
      (() => {
        const fields = [];
        const container = document.querySelector('[role="dialog"]') || document.querySelector('form') || document.body;
        const inputs = container.querySelectorAll('textarea, input:not([type="hidden"]):not([type="submit"])');
        inputs.forEach((el, idx) => {
          const id = el.name || el.id || 'wellfound_field_' + idx;
          const label = el.getAttribute('placeholder') || el.name || 'Application Field';
          fields.push({
            id: id,
            name: el.name || id,
            label: label,
            type: el.tagName.toLowerCase() === 'textarea' ? 'textarea' : (el.type === 'file' ? 'file' : 'text'),
            required: true
          });
        });
        return fields;
      })()
    `;
  },
};

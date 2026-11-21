// ==============================================================================
// lib/platforms/ashby.ts
// Platform handler for Ashby ATS application forms
// ==============================================================================

import { FormField } from "../application/types";

export const ashbyPlatformHandler = {
  platform: "ashby" as const,

  knownFieldSelectors: {
    name: ['input[name="name"]', 'input[id*="name"]'],
    email: ['input[name="email"]', 'input[type="email"]'],
    phone: ['input[name="phoneNumber"]', 'input[name="phone"]', 'input[type="tel"]'],
    resume: ['input[type="file"]'],
    linkedin: ['input[name*="linkedin"]', 'input[name*="LinkedIn"]'],
    github: ['input[name*="github"]', 'input[name*="GitHub"]'],
    website: ['input[name*="website"]', 'input[name*="portfolio"]'],
    submitButton: ['button[type="submit"]', 'button:has-text("Submit Application")'],
  },

  getDefaultFormFields(): FormField[] {
    return [
      { id: "name", name: "name", label: "Full Name", type: "text", required: true },
      { id: "email", name: "email", label: "Email Address", type: "email", required: true },
      { id: "phoneNumber", name: "phoneNumber", label: "Phone Number", type: "tel", required: true },
      { id: "resume", name: "resume", label: "Resume / CV", type: "file", required: true },
      { id: "linkedin", name: "linkedin", label: "LinkedIn Profile", type: "text", required: false },
      { id: "github", name: "github", label: "GitHub Profile", type: "text", required: false },
      { id: "website", name: "website", label: "Portfolio / Website", type: "text", required: false },
    ];
  },

  getExtractionScript(): string {
    return `
      (() => {
        const fields = [];
        const form = document.querySelector('form') || document.body;
        const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), textarea, select');

        inputs.forEach((el, idx) => {
          const id = el.name || el.id || 'ashby_field_' + idx;
          let labelText = '';
          const parent = el.closest('div[class*="field"]') || el.closest('label') || el.parentElement;
          if (parent) {
            const labelEl = parent.querySelector('label') || parent.querySelector('span');
            if (labelEl) labelText = labelEl.innerText.trim();
          }
          if (!labelText) {
            labelText = el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.name || id;
          }

          const isRequired = el.required || el.getAttribute('aria-required') === 'true' || labelText.includes('*');
          const cleanLabel = labelText.replace(/[*✱]/g, '').trim();

          let type = 'text';
          if (el.tagName.toLowerCase() === 'textarea') type = 'textarea';
          else if (el.tagName.toLowerCase() === 'select') type = 'select';
          else if (el.type === 'file') type = 'file';
          else if (el.type === 'email') type = 'email';
          else if (el.type === 'tel') type = 'tel';

          fields.push({
            id: id,
            name: el.name || id,
            label: cleanLabel || id,
            type: type,
            required: isRequired
          });
        });

        return fields;
      })()
    `;
  },
};

// ==============================================================================
// lib/platforms/generic.ts
// Generic fallback platform handler for arbitrary employer ATS career pages
// ==============================================================================

import { FormField } from "../application/types";

export const genericPlatformHandler = {
  platform: "generic" as const,

  knownFieldSelectors: {
    name: ['input[autocomplete="name"]', 'input[name*="name"]', 'input[id*="name"]'],
    email: ['input[type="email"]', 'input[name*="email"]', 'input[id*="email"]'],
    phone: ['input[type="tel"]', 'input[name*="phone"]', 'input[id*="phone"]'],
    resume: ['input[type="file"][name*="resume"]', 'input[type="file"]'],
    linkedin: ['input[name*="linkedin"]', 'input[id*="linkedin"]'],
    portfolio: ['input[name*="portfolio"]', 'input[name*="website"]', 'input[name*="github"]'],
    submitButton: ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Submit")', 'button:has-text("Apply")'],
  },

  getDefaultFormFields(): FormField[] {
    return [
      { id: "full_name", name: "full_name", label: "Full Name", type: "text", required: true },
      { id: "email", name: "email", label: "Email Address", type: "email", required: true },
      { id: "phone", name: "phone", label: "Phone Number", type: "tel", required: true },
      { id: "resume", name: "resume", label: "Resume / CV", type: "file", required: true },
      { id: "linkedin", name: "linkedin", label: "LinkedIn Profile", type: "text", required: false },
      { id: "portfolio", name: "portfolio", label: "Portfolio / Website", type: "text", required: false },
    ];
  },

  getExtractionScript(): string {
    return `
      (() => {
        const fields = [];
        const form = document.querySelector('form') || document.body;
        const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select');

        inputs.forEach((el, idx) => {
          const id = el.name || el.id || 'generic_field_' + idx;
          let labelText = '';

          // 1. Direct label reference
          if (el.id) {
            const lbl = document.querySelector('label[for="' + el.id + '"]');
            if (lbl) labelText = lbl.innerText.trim();
          }

          // 2. Parent label or wrapper
          if (!labelText) {
            const parent = el.closest('label') || el.closest('.form-group') || el.closest('[class*="field"]');
            if (parent) {
              const labelEl = parent.querySelector('label') || parent.querySelector('span');
              if (labelEl) labelText = labelEl.innerText.trim();
            }
          }

          // 3. Fallbacks
          if (!labelText) {
            labelText = el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.name || id;
          }

          const isRequired = el.required || el.getAttribute('aria-required') === 'true' || labelText.includes('*');
          const cleanLabel = labelText.replace(/[*✱]/g, '').trim();

          let type = 'text';
          if (el.tagName.toLowerCase() === 'textarea') type = 'textarea';
          else if (el.tagName.toLowerCase() === 'select') type = 'select';
          else if (el.type === 'file') type = 'file';
          else if (el.type === 'email') type = 'email';
          else if (el.type === 'tel') type = 'tel';
          else if (el.type === 'checkbox') type = 'checkbox';
          else if (el.type === 'radio') type = 'radio';

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

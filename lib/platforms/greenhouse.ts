// ==============================================================================
// lib/platforms/greenhouse.ts
// Platform handler for Greenhouse ATS application forms
// ==============================================================================

import { FormField } from "../application/types";

export const greenhousePlatformHandler = {
  platform: "greenhouse" as const,

  /**
   * Typical field patterns found on Greenhouse boards
   */
  knownFieldSelectors: {
    firstName: ['#first_name', 'input[name="job_application[first_name]"]', 'input[autocomplete="given-name"]'],
    lastName: ['#last_name', 'input[name="job_application[last_name]"]', 'input[autocomplete="family-name"]'],
    email: ['#email', 'input[name="job_application[email]"]', 'input[type="email"]'],
    phone: ['#phone', 'input[name="job_application[phone]"]', 'input[type="tel"]'],
    resume: ['#resume', 'input[type="file"][id*="resume"]', 'input[type="file"]'],
    coverLetter: ['#cover_letter', 'textarea[id*="cover_letter"]', 'input[type="file"][id*="cover_letter"]'],
    linkedin: ['input[id*="linkedin"]', 'input[name*="linkedin"]'],
    website: ['input[id*="website"]', 'input[name*="website"]', 'input[id*="portfolio"]'],
    submitButton: ['#submit_app', 'input[type="submit"]', 'button[type="submit"]'],
  },

  /**
   * Expected default form fields for Greenhouse applications
   */
  getDefaultFormFields(): FormField[] {
    return [
      { id: "first_name", name: "first_name", label: "First Name", type: "text", required: true },
      { id: "last_name", name: "last_name", label: "Last Name", type: "text", required: true },
      { id: "email", name: "email", label: "Email", type: "email", required: true },
      { id: "phone", name: "phone", label: "Phone", type: "tel", required: true },
      { id: "resume", name: "resume", label: "Resume / CV", type: "file", required: true },
      { id: "linkedin", name: "linkedin", label: "LinkedIn Profile", type: "text", required: false },
      { id: "website", name: "website", label: "Website / Portfolio", type: "text", required: false },
    ];
  },

  /**
   * Extraction script executed in the browser context to inspect Greenhouse DOM
   */
  getExtractionScript(): string {
    return `
      (() => {
        const fields = [];
        const form = document.querySelector('form#application_form') || document.querySelector('form');
        if (!form) return fields;

        const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), textarea, select');
        inputs.forEach((el, idx) => {
          const id = el.id || el.name || 'gh_field_' + idx;
          let labelText = '';
          if (el.id) {
            const lbl = document.querySelector('label[for="' + el.id + '"]');
            if (lbl) labelText = lbl.innerText.trim();
          }
          if (!labelText && el.closest('.field')) {
            const parentLbl = el.closest('.field').querySelector('label');
            if (parentLbl) labelText = parentLbl.innerText.trim();
          }
          if (!labelText) {
            labelText = el.getAttribute('aria-label') || el.placeholder || el.name || id;
          }

          const isRequired = el.required || el.getAttribute('aria-required') === 'true' || labelText.includes('*');
          const cleanLabel = labelText.replace(/\\*/g, '').trim();

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

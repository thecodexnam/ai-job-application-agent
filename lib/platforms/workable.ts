// ==============================================================================
// lib/platforms/workable.ts
// Platform handler for Workable application forms
// ==============================================================================

import { FormField } from "../application/types";

export const workablePlatformHandler = {
  platform: "workable" as const,

  knownFieldSelectors: {
    firstName: ['input[name="firstname"]', 'input[data-ui="firstname"]'],
    lastName: ['input[name="lastname"]', 'input[data-ui="lastname"]'],
    email: ['input[name="email"]', 'input[type="email"]'],
    phone: ['input[name="phone"]', 'input[type="tel"]'],
    resume: ['input[data-ui="resume"]', 'input[type="file"]'],
    summary: ['textarea[name="summary"]'],
    submitButton: ['button[data-ui="application-form-submit"]', 'button[type="submit"]'],
  },

  getDefaultFormFields(): FormField[] {
    return [
      { id: "firstname", name: "firstname", label: "First Name", type: "text", required: true },
      { id: "lastname", name: "lastname", label: "Last Name", type: "text", required: true },
      { id: "email", name: "email", label: "Email", type: "email", required: true },
      { id: "phone", name: "phone", label: "Phone", type: "tel", required: true },
      { id: "resume", name: "resume", label: "Resume", type: "file", required: true },
    ];
  },

  getExtractionScript(): string {
    return `
      (() => {
        const fields = [];
        const form = document.querySelector('form[data-ui="application-form"]') || document.querySelector('form');
        if (!form) return fields;

        const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), textarea, select');
        inputs.forEach((el, idx) => {
          const id = el.name || el.id || 'workable_field_' + idx;
          let labelText = '';
          const parent = el.closest('div[data-ui="field-wrapper"]') || el.closest('label');
          if (parent) {
            const labelEl = parent.querySelector('label') || parent.querySelector('span');
            if (labelEl) labelText = labelEl.innerText.trim();
          }
          if (!labelText) {
            labelText = el.getAttribute('placeholder') || el.name || id;
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

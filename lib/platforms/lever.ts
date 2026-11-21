// ==============================================================================
// lib/platforms/lever.ts
// Platform handler for Lever ATS application forms
// ==============================================================================

import { FormField } from "../application/types";

export const leverPlatformHandler = {
  platform: "lever" as const,

  knownFieldSelectors: {
    fullName: ['input[name="name"]', 'input[autocomplete="name"]'],
    email: ['input[name="email"]', 'input[type="email"]'],
    phone: ['input[name="phone"]', 'input[type="tel"]'],
    org: ['input[name="org"]'],
    resume: ['input[type="file"][name="resume"]', 'input[type="file"]'],
    linkedin: ['input[name="urls[LinkedIn]"]', 'input[name*="LinkedIn"]'],
    github: ['input[name="urls[GitHub]"]', 'input[name*="GitHub"]'],
    portfolio: ['input[name="urls[Portfolio]"]', 'input[name*="Portfolio"]', 'input[name="urls[Other]"]'],
    additionalInfo: ['textarea[name="comments"]', 'textarea'],
    submitButton: ['#btn-submit', 'button[type="submit"]'],
  },

  getDefaultFormFields(): FormField[] {
    return [
      { id: "name", name: "name", label: "Full Name", type: "text", required: true },
      { id: "email", name: "email", label: "Email", type: "email", required: true },
      { id: "phone", name: "phone", label: "Phone", type: "tel", required: true },
      { id: "resume", name: "resume", label: "Resume / CV", type: "file", required: true },
      { id: "linkedin", name: "urls[LinkedIn]", label: "LinkedIn URL", type: "text", required: false },
      { id: "github", name: "urls[GitHub]", label: "GitHub URL", type: "text", required: false },
      { id: "portfolio", name: "urls[Portfolio]", label: "Portfolio URL", type: "text", required: false },
    ];
  },

  getExtractionScript(): string {
    return `
      (() => {
        const fields = [];
        const form = document.querySelector('form.application-form') || document.querySelector('form');
        if (!form) return fields;

        const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), textarea, select');
        inputs.forEach((el, idx) => {
          const id = el.name || el.id || 'lever_field_' + idx;
          let labelText = '';
          const parentBlock = el.closest('.application-question') || el.closest('label');
          if (parentBlock) {
            const textEl = parentBlock.querySelector('.text') || parentBlock.querySelector('.application-label');
            if (textEl) labelText = textEl.innerText.trim();
          }
          if (!labelText) {
            labelText = el.getAttribute('placeholder') || el.name || id;
          }

          const isRequired = el.required || el.hasAttribute('data-qa') || labelText.includes('✱') || labelText.includes('*');
          const cleanLabel = labelText.replace(/[✱*]/g, '').trim();

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

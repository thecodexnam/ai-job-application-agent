import { FormField, JobPlatform } from "./types";

export const MOCK_APPLICATION_FIELDS: FormField[] = [
  { id: "first_name", name: "first_name", label: "First Name", type: "text", required: true },
  { id: "last_name", name: "last_name", label: "Last Name", type: "text", required: true },
  { id: "email", name: "email", label: "Email", type: "email", required: true },
  { id: "phone", name: "phone", label: "Phone", type: "tel", required: true },
  { id: "location", name: "location", label: "Location", type: "text", required: false },
  { id: "linkedin", name: "linkedin", label: "LinkedIn Profile", type: "text", required: false },
  { id: "resume", name: "resume", label: "Resume / CV", type: "file", required: true },
  {
    id: "work_authorization",
    name: "work_authorization",
    label: "Are you legally authorized to work in this location?",
    type: "select",
    required: true,
    options: [
      "Yes, I am authorized to work in this location",
      "No, I require work authorization / sponsorship",
    ],
  },
];

export function getMockFormFields(_platform: JobPlatform): FormField[] {
  return MOCK_APPLICATION_FIELDS.map((field) => ({ ...field }));
}

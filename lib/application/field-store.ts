import { FormField, JobPlatform } from "./types";
import { inferProfileMapping } from "./profile-matcher";

export function toFieldKey(field: FormField): string {
  const raw = field.name || field.id || field.label || "field";
  return raw.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 160) || "field";
}

export async function persistDetectedFields(
  supabase: any,
  applicationId: string,
  platform: JobPlatform,
  fields: FormField[]
): Promise<void> {
  const rows = fields.map((field) => ({
    application_id: applicationId,
    field_key: toFieldKey(field),
    label: field.label || field.name || field.id,
    field_type: field.type,
    required: Boolean(field.required),
    options: field.options || [],
    profile_mapping: field.profileMapping ?? inferProfileMapping(field),
    selector: field.selector || field.id || null,
    platform,
  }));

  if (rows.length === 0) return;

  const { error } = await supabase.from("application_form_fields").upsert(rows, {
    onConflict: "application_id,field_key",
  });

  if (error) {
    console.warn("[FieldStore] Upsert warning:", error.message);
    await supabase
      .from("job_applications")
      .update({
        form_data: { fields, platform },
      })
      .eq("id", applicationId);
    return;
  }

  await supabase
    .from("job_applications")
    .update({
      form_data: { fields, platform },
    })
    .eq("id", applicationId);
}

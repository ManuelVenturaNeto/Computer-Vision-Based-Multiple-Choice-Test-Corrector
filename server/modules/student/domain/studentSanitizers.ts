export function sanitizeStudentName(value: unknown) {
  return String(value ?? "")
    .replace(/[^a-zA-ZÀ-ÿ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeStudentRegistration(value: unknown) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 6);
}

import { describe, expect, it } from "vitest";

import { LoginSchema, SignupSchema } from "@/lib/validation/auth";

describe("LoginSchema", () => {
  it("accepts a valid email + password and lowercases the email", () => {
    const r = LoginSchema.safeParse({ email: "SAM@Example.com", password: "x" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("sam@example.com");
  });

  it("rejects a bad email or empty password", () => {
    expect(LoginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
    expect(LoginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("SignupSchema", () => {
  const base = { firstName: "Sam", email: "sam@example.com", password: "supersecret" };

  it("accepts a valid registration", () => {
    const r = SignupSchema.safeParse({ ...base, experienceLevel: "regular" });
    expect(r.success).toBe(true);
  });

  it("requires a first name and an 8+ char password", () => {
    expect(SignupSchema.safeParse({ ...base, firstName: "" }).success).toBe(false);
    expect(SignupSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
  });

  it("treats an empty experience level as undefined", () => {
    const r = SignupSchema.safeParse({ ...base, experienceLevel: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.experienceLevel).toBeUndefined();
  });

  it("rejects an unknown experience level", () => {
    expect(SignupSchema.safeParse({ ...base, experienceLevel: "elite" }).success).toBe(false);
  });
});

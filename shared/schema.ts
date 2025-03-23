import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User/Voter schema
export const voters = pgTable("voters", {
  id: serial("id").primaryKey(),
  voterId: text("voter_id").notNull().unique(),
  aadhaarNumber: text("aadhaar_number").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(), // Hash of DOB or actual password
  dob: text("dob").notNull(),
  age: integer("age").notNull(),
  email: text("email").notNull(),
  gender: text("gender").notNull(),
  address: text("address").notNull(),
  state: text("state").notNull(),
  district: text("district").notNull(),
  pincode: text("pincode").notNull(),
  maritalStatus: text("marital_status").notNull(),
  profileImage: text("profile_image"), // Base64 encoded string
  hasVoted: boolean("has_voted").default(false),
  votedFor: integer("voted_for"),
});

export const insertVoterSchema = createInsertSchema(voters).omit({
  id: true,
  hasVoted: true,
  votedFor: true,
});

// Candidate schema
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  partyName: text("party_name").notNull(),
  partyLogo: text("party_logo").notNull(), // Base64 encoded string or URL
  constituency: text("constituency").notNull(),
  votes: integer("votes").default(0),
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  votes: true,
});

// Admin schema
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // Hashed password
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
});

// Authentication types
export const loginVoterSchema = z.object({
  voterId: z.string().min(1, "Voter ID is required"),
  password: z.string().min(1, "Password is required"),
});

export const loginAdminSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Biometric verification schema
export const biometricVerificationSchema = z.object({
  voterId: z.string().min(1, "Voter ID is required"),
  faceImage: z.string().min(1, "Face image is required"),
  fingerprint: z.string().min(1, "Fingerprint is required"),
});

// Vote casting schema
export const voteSchema = z.object({
  voterId: z.string().min(1, "Voter ID is required"),
  candidateId: z.number().min(1, "Candidate ID is required"),
});

// Type definitions
export type InsertVoter = z.infer<typeof insertVoterSchema>;
export type Voter = typeof voters.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;
export type LoginVoter = z.infer<typeof loginVoterSchema>;
export type LoginAdmin = z.infer<typeof loginAdminSchema>;
export type BiometricVerification = z.infer<typeof biometricVerificationSchema>;
export type Vote = z.infer<typeof voteSchema>;

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  loginVoterSchema,
  loginAdminSchema,
  insertVoterSchema,
  insertCandidateSchema,
  biometricVerificationSchema,
  voteSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import MemoryStore from "memorystore";
import { z } from "zod";

// Create a memory store for sessions
const memoryStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(
    session({
      store: new memoryStore({ checkPeriod: 86400000 }),
      secret: process.env.SESSION_SECRET || "voting-system-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 86400000, // 24 hours
      },
    })
  );

  // Authentication check middleware
  const isVoterAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.session && req.session.voter) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  const isAdminAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.session && req.session.admin) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes
  app.post("/api/auth/voter/login", async (req, res) => {
    try {
      const data = loginVoterSchema.parse(req.body);
      const voter = await storage.getVoterByVoterId(data.voterId);

      if (!voter || voter.password !== data.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Store voter in session
      req.session.voter = {
        id: voter.id,
        voterId: voter.voterId,
        name: voter.name,
      };

      return res.status(200).json({
        message: "Login successful",
        voter: {
          id: voter.id,
          voterId: voter.voterId,
          name: voter.name,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/admin/login", async (req, res) => {
    try {
      const data = loginAdminSchema.parse(req.body);
      const admin = await storage.getAdminByUsername(data.username);

      if (!admin || admin.password !== data.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Store admin in session
      req.session.admin = {
        id: admin.id,
        username: admin.username,
      };

      return res.status(200).json({
        message: "Login successful",
        admin: {
          id: admin.id,
          username: admin.username,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      return res.status(200).json({ message: "Logout successful" });
    });
  });

  // Voter routes
  app.get("/api/voters", isAdminAuthenticated, async (req, res) => {
    try {
      const voters = await storage.listVoters();
      return res.status(200).json(voters);
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve voters" });
    }
  });

  app.get("/api/voters/:voterId", isVoterAuthenticated, async (req, res) => {
    try {
      // Only allow voter to retrieve their own details or admin to retrieve any voter
      if (
        !req.session.admin &&
        req.session.voter?.voterId !== req.params.voterId
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const voter = await storage.getVoterByVoterId(req.params.voterId);
      if (!voter) {
        return res.status(404).json({ message: "Voter not found" });
      }

      return res.status(200).json(voter);
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve voter" });
    }
  });

  app.post("/api/voters", isAdminAuthenticated, async (req, res) => {
    try {
      const data = insertVoterSchema.parse(req.body);
      
      // Check if voter with same voterId or aadhaar already exists
      const existingVoterById = await storage.getVoterByVoterId(data.voterId);
      const existingVoterByAadhaar = await storage.getVoterByAadhaar(data.aadhaarNumber);
      
      if (existingVoterById) {
        return res.status(400).json({ message: "Voter with this ID already exists" });
      }
      
      if (existingVoterByAadhaar) {
        return res.status(400).json({ message: "Voter with this Aadhaar number already exists" });
      }
      
      const voter = await storage.createVoter(data);
      return res.status(201).json(voter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Failed to create voter" });
    }
  });

  app.put("/api/voters/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertVoterSchema.partial().parse(req.body);
      
      const voter = await storage.updateVoter(id, data);
      if (!voter) {
        return res.status(404).json({ message: "Voter not found" });
      }
      
      return res.status(200).json(voter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Failed to update voter" });
    }
  });

  app.delete("/api/voters/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteVoter(id);
      
      if (!success) {
        return res.status(404).json({ message: "Voter not found" });
      }
      
      return res.status(200).json({ message: "Voter deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete voter" });
    }
  });

  // Candidate routes
  app.get("/api/candidates", async (req, res) => {
    try {
      const candidates = await storage.listCandidates();
      return res.status(200).json(candidates);
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve candidates" });
    }
  });

  app.get("/api/candidates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const candidate = await storage.getCandidateById(id);
      
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      return res.status(200).json(candidate);
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve candidate" });
    }
  });

  app.post("/api/candidates", isAdminAuthenticated, async (req, res) => {
    try {
      const data = insertCandidateSchema.parse(req.body);
      const candidate = await storage.createCandidate(data);
      return res.status(201).json(candidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Failed to create candidate" });
    }
  });

  app.put("/api/candidates/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertCandidateSchema.partial().parse(req.body);
      
      const candidate = await storage.updateCandidate(id, data);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      return res.status(200).json(candidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Failed to update candidate" });
    }
  });

  app.delete("/api/candidates/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCandidate(id);
      
      if (!success) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      return res.status(200).json({ message: "Candidate deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete candidate" });
    }
  });

  // Biometric verification route
  app.post("/api/verify-biometrics", isVoterAuthenticated, async (req, res) => {
    try {
      const data = biometricVerificationSchema.parse(req.body);
      const voter = await storage.getVoterByVoterId(data.voterId);
      
      if (!voter) {
        return res.status(404).json({ message: "Voter not found" });
      }
      
      // For demo, we'll simply verify that the voter exists
      // In a real app, we would compare the biometric data
      
      return res.status(200).json({ 
        message: "Biometric verification successful",
        verified: true
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Failed to verify biometrics" });
    }
  });

  // Voting route
  app.post("/api/vote", isVoterAuthenticated, async (req, res) => {
    try {
      const data = voteSchema.parse(req.body);
      const voter = await storage.getVoterByVoterId(data.voterId);
      
      if (!voter) {
        return res.status(404).json({ message: "Voter not found" });
      }
      
      if (voter.hasVoted) {
        return res.status(400).json({ message: "You have already voted" });
      }
      
      const success = await storage.castVote(voter.id, data.candidateId);
      if (!success) {
        return res.status(400).json({ message: "Failed to cast vote" });
      }
      
      return res.status(200).json({ message: "Vote cast successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Failed to cast vote" });
    }
  });

  // Get current session user
  app.get("/api/me", (req, res) => {
    if (req.session.voter) {
      return res.status(200).json({ 
        type: "voter",
        user: req.session.voter 
      });
    } else if (req.session.admin) {
      return res.status(200).json({ 
        type: "admin",
        user: req.session.admin 
      });
    } else {
      return res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Create http server
  const httpServer = createServer(app);
  return httpServer;
}

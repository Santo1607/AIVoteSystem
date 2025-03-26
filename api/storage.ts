import { 
  voters, candidates, admins, 
  type Voter, type InsertVoter, 
  type Candidate, type InsertCandidate,
  type Admin, type InsertAdmin
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // Voter operations
  getVoterById(id: number): Promise<Voter | undefined>;
  getVoterByVoterId(voterId: string): Promise<Voter | undefined>;
  getVoterByAadhaar(aadhaarNumber: string): Promise<Voter | undefined>;
  createVoter(voter: InsertVoter): Promise<Voter>;
  updateVoter(id: number, voter: Partial<Voter>): Promise<Voter | undefined>;
  deleteVoter(id: number): Promise<boolean>;
  listVoters(): Promise<Voter[]>;
  
  // Candidate operations
  getCandidateById(id: number): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: number, candidate: Partial<Candidate>): Promise<Candidate | undefined>;
  deleteCandidate(id: number): Promise<boolean>;
  listCandidates(): Promise<Candidate[]>;
  incrementVote(candidateId: number): Promise<Candidate | undefined>;
  
  // Admin operations
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // Voting operations
  castVote(voterId: number, candidateId: number): Promise<boolean>;
}

// PostgreSQL database implementation of storage
export class DatabaseStorage implements IStorage {
  // Voter operations
  async getVoterById(id: number): Promise<Voter | undefined> {
    const results = await db.select().from(voters).where(eq(voters.id, id));
    return results[0];
  }

  async getVoterByVoterId(voterId: string): Promise<Voter | undefined> {
    const results = await db.select().from(voters).where(eq(voters.voterId, voterId));
    return results[0];
  }

  async getVoterByAadhaar(aadhaarNumber: string): Promise<Voter | undefined> {
    const results = await db.select().from(voters).where(eq(voters.aadhaarNumber, aadhaarNumber));
    return results[0];
  }

  async createVoter(voter: InsertVoter): Promise<Voter> {
    // Ensure profileImage is not undefined
    const profileImage = voter.profileImage || null;
    const [newVoter] = await db.insert(voters)
      .values({
        ...voter,
        profileImage,
        hasVoted: false,
        votedFor: null
      })
      .returning();
    return newVoter;
  }

  async updateVoter(id: number, voter: Partial<Voter>): Promise<Voter | undefined> {
    const [updatedVoter] = await db.update(voters)
      .set(voter)
      .where(eq(voters.id, id))
      .returning();
    return updatedVoter;
  }

  async deleteVoter(id: number): Promise<boolean> {
    const result = await db.delete(voters).where(eq(voters.id, id));
    // Since we can't easily check affected rows count, we'll verify by trying to fetch the record
    const checkDeleted = await this.getVoterById(id);
    return checkDeleted === undefined;
  }

  async listVoters(): Promise<Voter[]> {
    return await db.select().from(voters);
  }

  // Candidate operations
  async getCandidateById(id: number): Promise<Candidate | undefined> {
    const results = await db.select().from(candidates).where(eq(candidates.id, id));
    return results[0];
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const [newCandidate] = await db.insert(candidates)
      .values({
        ...candidate,
        votes: 0
      })
      .returning();
    return newCandidate;
  }

  async updateCandidate(id: number, candidate: Partial<Candidate>): Promise<Candidate | undefined> {
    const [updatedCandidate] = await db.update(candidates)
      .set(candidate)
      .where(eq(candidates.id, id))
      .returning();
    return updatedCandidate;
  }

  async deleteCandidate(id: number): Promise<boolean> {
    const result = await db.delete(candidates).where(eq(candidates.id, id));
    // Since we can't easily check affected rows count, we'll verify by trying to fetch the record
    const checkDeleted = await this.getCandidateById(id);
    return checkDeleted === undefined;
  }

  async listCandidates(): Promise<Candidate[]> {
    return await db.select().from(candidates);
  }

  async incrementVote(candidateId: number): Promise<Candidate | undefined> {
    const candidate = await this.getCandidateById(candidateId);
    if (!candidate) return undefined;
    
    const [updatedCandidate] = await db.update(candidates)
      .set({
        votes: (candidate.votes || 0) + 1
      })
      .where(eq(candidates.id, candidateId))
      .returning();
    
    return updatedCandidate;
  }

  // Admin operations
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const results = await db.select().from(admins).where(eq(admins.username, username));
    return results[0];
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [newAdmin] = await db.insert(admins).values(admin).returning();
    return newAdmin;
  }

  // Voting operations
  async castVote(voterId: number, candidateId: number): Promise<boolean> {
    try {
      // Use a transaction to ensure both operations succeed or fail together
      await db.transaction(async (tx) => {
        // Check if voter exists and hasn't voted yet
        const [voter] = await tx.select().from(voters).where(eq(voters.id, voterId));
        if (!voter || voter.hasVoted) {
          throw new Error("Voter doesn't exist or has already voted");
        }
        
        // Check if candidate exists
        const [candidate] = await tx.select().from(candidates).where(eq(candidates.id, candidateId));
        if (!candidate) {
          throw new Error("Candidate doesn't exist");
        }
        
        // Update voter
        await tx.update(voters)
          .set({
            hasVoted: true,
            votedFor: candidateId
          })
          .where(eq(voters.id, voterId));
        
        // Increment candidate votes
        await tx.update(candidates)
          .set({
            votes: (candidate.votes || 0) + 1
          })
          .where(eq(candidates.id, candidateId));
      });
      
      return true;
    } catch (error) {
      console.error("Error casting vote:", error);
      return false;
    }
  }
  
  // Initialize database with default data
  async initializeDatabase(): Promise<void> {
    try {
      // Check if we already have any admins
      const adminsResults = await db.select().from(admins);
      if (adminsResults.length === 0) {
        // Add default admin
        await this.createAdmin({
          username: "admin",
          password: "admin123"
        });
        console.log("Created default admin user");
      }
      
      // Check if we already have any candidates
      const candidatesResults = await db.select().from(candidates);
      if (candidatesResults.length === 0) {
        // Add sample candidates
        await Promise.all([
          this.createCandidate({
            name: "Amit Sharma",
            partyName: "Party A",
            partyLogo: "https://via.placeholder.com/50?text=A",
            constituency: "Bangalore Urban",
          }),
          this.createCandidate({
            name: "Priya Patel",
            partyName: "Party B",
            partyLogo: "https://via.placeholder.com/50?text=B",
            constituency: "Bangalore Urban",
          }),
          this.createCandidate({
            name: "Rajiv Singh",
            partyName: "Party C",
            partyLogo: "https://via.placeholder.com/50?text=C",
            constituency: "Bangalore Urban",
          }),
          this.createCandidate({
            name: "Sunita Gupta",
            partyName: "Party D",
            partyLogo: "https://via.placeholder.com/50?text=D",
            constituency: "Bangalore Urban",
          })
        ]);
        console.log("Created sample candidates");
      }
      
      // Check if we already have any voters
      const votersResults = await db.select().from(voters);
      if (votersResults.length === 0) {
        // Add sample voters
        await Promise.all([
          this.createVoter({
            voterId: "ABCD1234567",
            aadhaarNumber: "1234-5678-9012",
            name: "Rahul Kumar",
            password: "15/08/1985",
            dob: "15/08/1985",
            age: 37,
            email: "rahul.kumar@example.com",
            gender: "Male",
            address: "123 Main Street, Gandhi Nagar, Apartment 4B",
            state: "Karnataka",
            district: "Bangalore Urban",
            pincode: "560001",
            maritalStatus: "Married",
            profileImage: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U2ZTZlNiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjcwIiByPSI0MCIgZmlsbD0iIzk5OSIvPjxwYXRoIGQ9Ik01MCwxODAgTDUwLDE0MCBDNTAsMTAwIDc1LDkwIDEwMCw5MCBDMTMwLDkwIDE1MCwxMDAgMTUwLDE0MCBMMTUwLDE4MCI+PC9wYXRoPjwvc3ZnPg=="
          }),
          this.createVoter({
            voterId: "EFGH9876543",
            aadhaarNumber: "5678-9012-3456",
            name: "Priya Singh",
            password: "20/05/1994",
            dob: "20/05/1994",
            age: 29,
            email: "priya.singh@example.com",
            gender: "Female",
            address: "456 Park Avenue, Indira Nagar",
            state: "Karnataka",
            district: "Mysore",
            pincode: "570001",
            maritalStatus: "Single",
            profileImage: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U2ZTZlNiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjcwIiByPSI0MCIgZmlsbD0iIzk5OSIvPjxwYXRoIGQ9Ik01MCwxODAgTDUwLDE0MCBDNTAsMTAwIDc1LDkwIDEwMCw5MCBDMTMwLDkwIDE1MCwxMDAgMTUwLDE0MCBMMTUwLDE4MCI+PC9wYXRoPjwvc3ZnPg=="
          })
        ]);
        console.log("Created sample voters");
      }
      
      console.log("Database initialization complete");
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }
}

// Create and export a singleton instance of the database storage
export const storage = new DatabaseStorage();

// Initialize the database with sample data
storage.initializeDatabase().catch(console.error);

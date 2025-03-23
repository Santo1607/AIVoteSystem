import { 
  voters, candidates, admins, 
  type Voter, type InsertVoter, 
  type Candidate, type InsertCandidate,
  type Admin, type InsertAdmin
} from "@shared/schema";

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

// In-memory implementation of storage
export class MemStorage implements IStorage {
  private voters: Map<number, Voter>;
  private candidates: Map<number, Candidate>;
  private admins: Map<number, Admin>;
  private voterIdCounter: number;
  private candidateIdCounter: number;
  private adminIdCounter: number;

  constructor() {
    this.voters = new Map();
    this.candidates = new Map();
    this.admins = new Map();
    this.voterIdCounter = 1;
    this.candidateIdCounter = 1;
    this.adminIdCounter = 1;

    // Initialize with a default admin
    this.createAdmin({
      username: "admin",
      password: "admin123" // In a real app, this would be hashed
    });

    // Initialize with some sample data for development
    // Sample candidates
    this.createCandidate({
      name: "Amit Sharma",
      partyName: "Party A",
      partyLogo: "https://via.placeholder.com/50?text=A",
      constituency: "Bangalore Urban",
    });
    this.createCandidate({
      name: "Priya Patel",
      partyName: "Party B",
      partyLogo: "https://via.placeholder.com/50?text=B",
      constituency: "Bangalore Urban",
    });
    this.createCandidate({
      name: "Rajiv Singh",
      partyName: "Party C",
      partyLogo: "https://via.placeholder.com/50?text=C",
      constituency: "Bangalore Urban",
    });
    this.createCandidate({
      name: "Sunita Gupta",
      partyName: "Party D",
      partyLogo: "https://via.placeholder.com/50?text=D",
      constituency: "Bangalore Urban",
    });

    // Sample voter
    this.createVoter({
      voterId: "ABCD1234567",
      aadhaarNumber: "1234-5678-9012",
      name: "Rahul Kumar",
      password: "15/08/1985", // In a real app, this would be hashed
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
    });
    
    this.createVoter({
      voterId: "EFGH9876543",
      aadhaarNumber: "5678-9012-3456",
      name: "Priya Singh",
      password: "20/05/1994", // In a real app, this would be hashed
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
    });
  }

  // Voter operations
  async getVoterById(id: number): Promise<Voter | undefined> {
    return this.voters.get(id);
  }

  async getVoterByVoterId(voterId: string): Promise<Voter | undefined> {
    return Array.from(this.voters.values()).find(v => v.voterId === voterId);
  }

  async getVoterByAadhaar(aadhaarNumber: string): Promise<Voter | undefined> {
    return Array.from(this.voters.values()).find(v => v.aadhaarNumber === aadhaarNumber);
  }

  async createVoter(voter: InsertVoter): Promise<Voter> {
    const id = this.voterIdCounter++;
    const newVoter: Voter = { ...voter, id, hasVoted: false, votedFor: null };
    this.voters.set(id, newVoter);
    return newVoter;
  }

  async updateVoter(id: number, voter: Partial<Voter>): Promise<Voter | undefined> {
    const existingVoter = this.voters.get(id);
    if (!existingVoter) return undefined;
    
    const updatedVoter = { ...existingVoter, ...voter };
    this.voters.set(id, updatedVoter);
    return updatedVoter;
  }

  async deleteVoter(id: number): Promise<boolean> {
    return this.voters.delete(id);
  }

  async listVoters(): Promise<Voter[]> {
    return Array.from(this.voters.values());
  }

  // Candidate operations
  async getCandidateById(id: number): Promise<Candidate | undefined> {
    return this.candidates.get(id);
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const id = this.candidateIdCounter++;
    const newCandidate: Candidate = { ...candidate, id, votes: 0 };
    this.candidates.set(id, newCandidate);
    return newCandidate;
  }

  async updateCandidate(id: number, candidate: Partial<Candidate>): Promise<Candidate | undefined> {
    const existingCandidate = this.candidates.get(id);
    if (!existingCandidate) return undefined;
    
    const updatedCandidate = { ...existingCandidate, ...candidate };
    this.candidates.set(id, updatedCandidate);
    return updatedCandidate;
  }

  async deleteCandidate(id: number): Promise<boolean> {
    return this.candidates.delete(id);
  }

  async listCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidates.values());
  }

  async incrementVote(candidateId: number): Promise<Candidate | undefined> {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) return undefined;
    
    const updatedCandidate = { ...candidate, votes: candidate.votes + 1 };
    this.candidates.set(candidateId, updatedCandidate);
    return updatedCandidate;
  }

  // Admin operations
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(a => a.username === username);
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const id = this.adminIdCounter++;
    const newAdmin: Admin = { ...admin, id };
    this.admins.set(id, newAdmin);
    return newAdmin;
  }

  // Voting operations
  async castVote(voterId: number, candidateId: number): Promise<boolean> {
    const voter = this.voters.get(voterId);
    const candidate = this.candidates.get(candidateId);
    
    if (!voter || !candidate) return false;
    if (voter.hasVoted) return false;
    
    // Update the voter
    this.voters.set(voterId, { ...voter, hasVoted: true, votedFor: candidateId });
    
    // Increment the candidate's votes
    this.candidates.set(candidateId, { ...candidate, votes: candidate.votes + 1 });
    
    return true;
  }
}

export const storage = new MemStorage();

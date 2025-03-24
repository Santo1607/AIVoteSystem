import Web3 from 'web3';
import * as fs from 'fs';
import * as path from 'path';
import * as solc from 'solc';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import crypto from 'crypto';

// Function to compile the Solidity contract
function compileContract() {
  try {
    // In ESM, __dirname is not defined, so we need to use import.meta.url
    // Get the current file's directory
    const contractPath = path.resolve(process.cwd(), 'contracts/VotingSystem.sol');
    const source = fs.readFileSync(contractPath, 'utf8');
    
    // Prepare input for solc compiler
    const input = {
      language: 'Solidity',
      sources: {
        'VotingSystem.sol': {
          content: source,
        },
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['*'],
          },
        },
      },
    };
    
    // Compile the contract
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    // Extract ABI and bytecode
    const contract = output.contracts['VotingSystem.sol']['VotingSystem'];
    return {
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object
    };
  } catch (error) {
    console.error('Error compiling contract:', error);
    throw error;
  }
}

export class BlockchainService {
  private web3: Web3;
  private contract: Contract<any> | null = null;
  private contractAddress: string | null = null;
  private contractAbi: AbiItem[] | null = null;
  private initialized: boolean = false;
  
  constructor() {
    // Connect to local Ethereum node (for development)
    // For production, use an Ethereum provider like Infura
    this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
    
    // For development, we'll use a simulated blockchain
    // In production, this would connect to a real Ethereum node
    if (process.env.NODE_ENV === 'development') {
      this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
      // Enable simulation mode in development
      this.simulateBlockchain();
    } else {
      // For production, use a provider like Infura or Alchemy
      const providerUrl = process.env.ETHEREUM_PROVIDER_URL || 'http://localhost:8545';
      this.web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
    }
  }
  
  // Initialize the blockchain service
  async initialize() {
    if (this.initialized) return;
    
    try {
      // In development, we'll deploy a new contract each time
      // In production, we would use a deployed contract address
      if (process.env.CONTRACT_ADDRESS) {
        this.contractAddress = process.env.CONTRACT_ADDRESS;
        const compiled = compileContract();
        this.contractAbi = compiled.abi as AbiItem[];
        this.contract = new this.web3.eth.Contract(
          this.contractAbi,
          this.contractAddress
        );
      } else {
        // Deploy a new contract for development
        await this.deployContract();
      }
      
      this.initialized = true;
      console.log('Blockchain service initialized');
      
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      // In development, continue even if blockchain fails
      // In production, this would throw an error
      if (process.env.NODE_ENV === 'development') {
        this.initialized = true;
        console.log('Running in simulation mode due to blockchain initialization failure');
      } else {
        throw error;
      }
    }
  }
  
  // Deploy the contract (for development)
  private async deployContract() {
    try {
      const compiled = compileContract();
      this.contractAbi = compiled.abi as AbiItem[];
      
      // Get admin account
      const accounts = await this.web3.eth.getAccounts();
      const adminAccount = accounts[0];
      
      // Create contract instance
      const contractInstance = new this.web3.eth.Contract(this.contractAbi);
      
      // Deploy contract
      const deployedContract = await contractInstance
        .deploy({
          data: '0x' + compiled.bytecode,
        })
        .send({
          from: adminAccount,
          gas: 5000000,
        });
      
      this.contract = deployedContract;
      this.contractAddress = deployedContract.options.address;
      
      console.log(`Contract deployed at address: ${this.contractAddress}`);
      return this.contractAddress;
    } catch (error) {
      console.error('Error deploying contract:', error);
      throw error;
    }
  }
  
  // For development: Simulate blockchain operations
  private simulateBlockchain() {
    // This is a simplified simulation for development purposes
    // In a real application, all of these would interact with the Ethereum blockchain
    this.mockContractState = {
      candidates: new Map(),
      votes: new Map(),
      voterStatus: new Map(),
      candidateIds: [],
      votingOpen: false,
      resultsReleased: false,
    };
  }
  
  // Mock state for simulation mode
  private mockContractState: {
    candidates: Map<number, any>;
    votes: Map<string, any>;
    voterStatus: Map<string, boolean>;
    candidateIds: number[];
    votingOpen: boolean;
    resultsReleased: boolean;
  } | null = null;
  
  // Helper to check if service is ready
  private ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Blockchain service not initialized');
    }
  }
  
  // Helper to simulate blockchain calls in development
  private async simulateContractCall(method: string, ...args: any[]) {
    // Simulate blockchain delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!this.mockContractState) {
      throw new Error('Mock contract state not initialized');
    }
    
    switch (method) {
      case 'addCandidate':
        const [id, name, partyName, logoHash] = args;
        this.mockContractState.candidates.set(id, {
          id,
          name,
          partyName,
          partyLogo: logoHash,
          voteCount: 0
        });
        this.mockContractState.candidateIds.push(id);
        return true;
        
      case 'startVoting':
        this.mockContractState.votingOpen = true;
        return true;
        
      case 'endVoting':
        this.mockContractState.votingOpen = false;
        return true;
        
      case 'releaseResults':
        this.mockContractState.resultsReleased = true;
        return true;
        
      case 'castVote':
        const [voterIdHash, candidateId, encryptedData] = args;
        // Check if voter has already voted
        const voterKey = this.web3.utils.hexToString(voterIdHash);
        if (this.mockContractState.voterStatus.get(voterKey)) {
          throw new Error('Voter has already cast a vote');
        }
        
        // Check if voting is open
        if (!this.mockContractState.votingOpen) {
          throw new Error('Voting is not open');
        }
        
        // Check if candidate exists
        if (!this.mockContractState.candidates.has(candidateId)) {
          throw new Error('Candidate does not exist');
        }
        
        // Record vote
        const candidate = this.mockContractState.candidates.get(candidateId);
        candidate.voteCount++;
        this.mockContractState.voterStatus.set(voterKey, true);
        this.mockContractState.votes.set(voterKey, encryptedData);
        return true;
        
      case 'getCandidate':
        const [candidateId2] = args;
        const candidate2 = this.mockContractState.candidates.get(candidateId2);
        if (!candidate2) {
          return {
            id: 0,
            name: '',
            partyName: '',
            voteCount: 0
          };
        }
        
        return {
          id: candidate2.id,
          name: candidate2.name,
          partyName: candidate2.partyName,
          voteCount: this.mockContractState.resultsReleased ? candidate2.voteCount : 0
        };
        
      case 'getAllCandidates':
        const ids = [];
        const names = [];
        const partyNames = [];
        const voteCounts = [];
        
        for (const id of this.mockContractState.candidateIds) {
          const candidate = this.mockContractState.candidates.get(id);
          ids.push(candidate.id);
          names.push(candidate.name);
          partyNames.push(candidate.partyName);
          voteCounts.push(this.mockContractState.resultsReleased ? candidate.voteCount : 0);
        }
        
        return {
          ids,
          names,
          partyNames,
          voteCounts
        };
        
      case 'checkVoterStatus':
        const [voterIdHash2] = args;
        const voterKey2 = this.web3.utils.hexToString(voterIdHash2);
        return this.mockContractState.voterStatus.get(voterKey2) || false;
        
      case 'getTotalVotes':
        if (!this.mockContractState.resultsReleased) {
          throw new Error('Results have not been released yet');
        }
        
        let totalVotes = 0;
        for (const id of this.mockContractState.candidateIds) {
          const candidate = this.mockContractState.candidates.get(id);
          totalVotes += candidate.voteCount;
        }
        
        return totalVotes;
        
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }
  
  // Utility method to hash data
  public hashData(data: string): string {
    return this.web3.utils.sha3(data) || '';
  }
  
  // Encrypt vote data for privacy
  public encryptVoteData(voterId: string, candidateId: number): string {
    // In a real application, this would use proper encryption
    // For demonstration, we'll use a simple hash
    const data = `${voterId}-${candidateId}-${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  // Add a candidate to the blockchain
  async addCandidate(id: number, name: string, partyName: string, logoUrl: string) {
    this.ensureInitialized();
    
    try {
      // Hash the logo URL for blockchain storage
      const logoHash = this.web3.utils.sha3(logoUrl) || '';
      
      if (process.env.NODE_ENV === 'development') {
        return await this.simulateContractCall('addCandidate', id, name, partyName, logoHash);
      }
      
      // In production, this would call the actual contract
      const accounts = await this.web3.eth.getAccounts();
      const adminAccount = accounts[0];
      
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      await this.contract.methods
        .addCandidate(id, name, partyName, logoHash)
        .send({ from: adminAccount, gas: 500000 });
      
      return true;
    } catch (error) {
      console.error('Failed to add candidate to blockchain:', error);
      throw error;
    }
  }
  
  // Start voting on the blockchain
  async startVoting() {
    this.ensureInitialized();
    
    try {
      if (process.env.NODE_ENV === 'development') {
        return await this.simulateContractCall('startVoting');
      }
      
      // In production, this would call the actual contract
      const accounts = await this.web3.eth.getAccounts();
      const adminAccount = accounts[0];
      
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      await this.contract.methods
        .startVoting()
        .send({ from: adminAccount, gas: 100000 });
      
      return true;
    } catch (error) {
      console.error('Failed to start voting on blockchain:', error);
      throw error;
    }
  }
  
  // End voting on the blockchain
  async endVoting() {
    this.ensureInitialized();
    
    try {
      if (process.env.NODE_ENV === 'development') {
        return await this.simulateContractCall('endVoting');
      }
      
      // In production, this would call the actual contract
      const accounts = await this.web3.eth.getAccounts();
      const adminAccount = accounts[0];
      
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      await this.contract.methods
        .endVoting()
        .send({ from: adminAccount, gas: 100000 });
      
      return true;
    } catch (error) {
      console.error('Failed to end voting on blockchain:', error);
      throw error;
    }
  }
  
  // Release results on the blockchain
  async releaseResults() {
    this.ensureInitialized();
    
    try {
      if (process.env.NODE_ENV === 'development') {
        return await this.simulateContractCall('releaseResults');
      }
      
      // In production, this would call the actual contract
      const accounts = await this.web3.eth.getAccounts();
      const adminAccount = accounts[0];
      
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      await this.contract.methods
        .releaseResults()
        .send({ from: adminAccount, gas: 100000 });
      
      return true;
    } catch (error) {
      console.error('Failed to release results on blockchain:', error);
      throw error;
    }
  }
  
  // Cast a vote on the blockchain
  async castVote(voterId: string, candidateId: number) {
    this.ensureInitialized();
    
    try {
      // Hash voter ID for privacy
      const voterIdHash = this.web3.utils.sha3(voterId) || '';
      
      // Encrypt vote data
      const encryptedVoteData = this.encryptVoteData(voterId, candidateId);
      const encryptedDataHex = this.web3.utils.asciiToHex(encryptedVoteData);
      
      if (process.env.NODE_ENV === 'development') {
        return await this.simulateContractCall('castVote', voterIdHash, candidateId, encryptedDataHex);
      }
      
      // In production, this would call the actual contract
      const accounts = await this.web3.eth.getAccounts();
      const voterAccount = accounts[0]; // In reality, this would be the voter's account
      
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      await this.contract.methods
        .castVote(voterIdHash, candidateId, encryptedDataHex)
        .send({ from: voterAccount, gas: 200000 });
      
      return true;
    } catch (error) {
      console.error('Failed to cast vote on blockchain:', error);
      throw error;
    }
  }
  
  // Get candidate information from the blockchain
  async getCandidate(id: number) {
    this.ensureInitialized();
    
    try {
      if (process.env.NODE_ENV === 'development') {
        return await this.simulateContractCall('getCandidate', id);
      }
      
      // In production, this would call the actual contract
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      const result = await this.contract.methods.getCandidate(id).call();
      
      return {
        id: Number(result.id),
        name: result.name,
        partyName: result.partyName,
        voteCount: Number(result.voteCount)
      };
    } catch (error) {
      console.error('Failed to get candidate from blockchain:', error);
      throw error;
    }
  }
  
  // Get all candidates from the blockchain
  async getAllCandidates() {
    this.ensureInitialized();
    
    try {
      if (process.env.NODE_ENV === 'development') {
        return await this.simulateContractCall('getAllCandidates');
      }
      
      // In production, this would call the actual contract
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      const result = await this.contract.methods.getAllCandidates().call();
      
      const candidates = [];
      for (let i = 0; i < result.ids.length; i++) {
        candidates.push({
          id: Number(result.ids[i]),
          name: result.names[i],
          partyName: result.partyNames[i],
          voteCount: Number(result.voteCounts[i])
        });
      }
      
      return candidates;
    } catch (error) {
      console.error('Failed to get all candidates from blockchain:', error);
      throw error;
    }
  }
  
  // Check if a voter has already voted
  async checkVoterStatus(voterId: string) {
    this.ensureInitialized();
    
    try {
      // Hash voter ID for privacy
      const voterIdHash = this.web3.utils.sha3(voterId) || '';
      
      if (process.env.NODE_ENV === 'development') {
        return await this.simulateContractCall('checkVoterStatus', voterIdHash);
      }
      
      // In production, this would call the actual contract
      const accounts = await this.web3.eth.getAccounts();
      const adminAccount = accounts[0];
      
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      return await this.contract.methods
        .checkVoterStatus(voterIdHash)
        .call({ from: adminAccount });
    } catch (error) {
      console.error('Failed to check voter status on blockchain:', error);
      throw error;
    }
  }
  
  // Get total number of votes cast
  async getTotalVotes() {
    this.ensureInitialized();
    
    try {
      if (process.env.NODE_ENV === 'development') {
        return await this.simulateContractCall('getTotalVotes');
      }
      
      // In production, this would call the actual contract
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      const result = await this.contract.methods.getTotalVotes().call();
      return Number(result);
    } catch (error) {
      console.error('Failed to get total votes from blockchain:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const blockchainService = new BlockchainService();
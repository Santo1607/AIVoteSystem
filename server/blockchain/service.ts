import Web3 from 'web3';
import * as fs from 'fs';
import * as path from 'path';
import * as solc from 'solc';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import crypto from 'crypto';

// Helper function to resolve imports for solc
function findImports(importPath: string) {
  try {
    const fullPath = path.resolve(process.cwd(), 'contracts', importPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    return { contents: content };
  } catch (error) {
    console.error('Error resolving import:', importPath, error);
    return { error: 'Import file not found' };
  }
}

// For development, let's use pre-compiled ABI and bytecode
// In a real project, we would compile the contract source code
function compileContract() {
  try {
    // This is a simplified approach for this project
    // Instead of compiling, we'll use a pre-defined ABI and bytecode
    
    // Mock ABI for our voting system contract
    const abi = [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "partyName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "partyLogo",
            "type": "string"
          }
        ],
        "name": "addCandidate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "voterIdHash",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "candidateId",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "encryptedData",
            "type": "bytes"
          }
        ],
        "name": "castVote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "voterIdHash",
            "type": "bytes32"
          }
        ],
        "name": "checkVoterStatus",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "endVoting",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getAllCandidates",
        "outputs": [
          {
            "internalType": "uint256[]",
            "name": "ids",
            "type": "uint256[]"
          },
          {
            "internalType": "string[]",
            "name": "names",
            "type": "string[]"
          },
          {
            "internalType": "string[]",
            "name": "partyNames",
            "type": "string[]"
          },
          {
            "internalType": "uint256[]",
            "name": "voteCounts",
            "type": "uint256[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          }
        ],
        "name": "getCandidate",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getTotalVotes",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "releaseResults",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "startVoting",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    
    // Mock bytecode (for a real app, this would be the actual compiled bytecode)
    const bytecode = "608060405234801561001057600080fd5b50600080546001600160a01b03191633179055610abd806100326000396000f3fe608060405234801561001057600080fd5b50600436106100935760003560e01c8063a87d942c11610066578063a87d942c1461012d578063b5c4e81f14610135578063c19d93fb14610161578063d9548e5314610183578063ea0438de1461018b57610093565b80632b38cd271461009857806351b42b00146100ad57806380265ecd146100b75780638da5cb5b14610107575b600080fd5b6100ab6100a63660046108d9565b61019f565b005b6100ab6102a3565b6100f96100c5366004610842565b6001600160a01b031660009081526003602090815260408083208151938452908201526002908101905290205460ff1690565b60405190151581526020015b60405180910390f35b6000546100ff906001600160a01b031681565b6100ff610304565b61014061038e565b6040805192516001835260208301939093528201526060016100fe565b610169600155565b6040516001148152602001610fe565b6100ab6104ad565b61019261053c565b6040516100fe91906108a6565b600154600290600019141561022e5760405162461bcd60e51b815260206004820152603f60248201527f566f74696e6720686173206e6f7420737461727465642e20506c65617365207760448201527f61697420666f722074686520656c656374696f6e20746f2062652064656c617260648201527f65642e0000000000000000000000000000000000000000000000000000000000608482015260a401610fe565b6001600160a01b0383166000908152600360209081526040808320845190840181529281019290925260029091018290525460ff161561029e5760405162461bcd60e51b815260206004820152601d60248201527f566f74657220686173206e6f742063617374206120766f746520796574000000604482015260640161022e565b5050565b6000546001600160a01b031633146102ca5760405162461bcd60e51b815260040161022e90610867565b6001546002146102ea5760405162461bcd60e51b815260040161022e906108bd565b60028055565b60025460001461031b5760405162461bcd60e51b815260040161022e9061085c565b6000805460405163c4d66de860e01b8152306004820152602401602060405180830381865afa158015610350573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061037491906108c7565b600080546001600160a01b0319166001600160a01b039290921691909117905590565b60408051600080825260208201909252600091829182919060609060029060208260208a01010101610be0565b60005460408051634904195760e01b815290516000926001600160a01b0316916349041957916004808301926020929190829003018186803b1580156103f157600080fd5b505afa158015610405573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061042991906108c7565b6001600160a01b0316331461044f5760405162461bcd60e51b815260040161022e90610867565b6001546000146104705760405162461bcd60e51b815260040161022e9061085c565b60018055600080546001600160a01b031690636e296e456040518163ffffffff1660e01b8152600401600060405180830381600087803b1580156104b257600080fd5b505af11580156104c6573d6000803e3d6000fd5b5050505060405160200160125b604051602081830303815290604052905b90565b6000546001600160a01b031633146104d45760405162461bcd60e51b815260040161022e90610867565b6001546001146104f55760405162461bcd60e51b815260040161022e906108bd565b60028055600080546001600160a01b0316906383197ef06040518163ffffffff1660e01b8152600401600060405180830381600087803b15801561053757600080fd5b505af1505050565b60408051600080825260208201909252606091829182600290602082602001010101610be0565b60408051600080825260208201909252600091829182919060609060029060208260208d010101016008565b60408051600080825260208201909252600091829182919060609060029060208260208c010101016008565b6040516001600160a01b03811681526020016106c565b60405160008152602001610fe565b60408051600080825260208201909252600091829182919060609060029060208260208b010101016008565b60408051600080825260208201909252600091829182919060609060029060208260208a010101016008565b6001806103c4565b60405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015260640161022e565b60405162461bcd60e51b815260206004820152602760248201527f416374696f6e2063616e6e6f742062652070726f636573736564206174207468604482015266698532bc3a399760c91b606482015260840161022e565b60405162461bcd60e51b815260206004820152601f60248201527f416374696f6e206e6f742070726f636573736162e6c20656e204c61756268696060482015260808201526094610fe565b80356001600160a01b038116811461081057600080fd5b919050565b60008083601f84011261082757600080fd5b50813567ffffffffffffffff81111561083f57600080fd5b602083019150836020828501011115610be057600080fd5b60006020828403121561085457600080fd5b610be7826107f9565b602081526000825180602084015261087b816040850160208701610be0565b601f01601f19169190910160400192915050565b602081526000825180602084015261087b816040850160208701610be0565b6000602082840312156108c157600080fd5b5035919050565b6000602082840312156108d957600080fd5b8151610be7816109e9565b60008060006060848603121561091157600080fd5b833567ffffffffffffffff81111561092857600080fd5b61093486828701610815565b9350506020610945868287016108c1565b925050604084013567ffffffffffffffff81111561096157600080fd5b61096d86828701610815565b9150509250925092565b6000806000806060858703121561098d57600080fd5b843567ffffffffffffffff8111156109a457600080fd5b6109b087828801610815565b94505060208501359250604085013567ffffffffffffffff8111156109d357600080fd5b6109df87828801610815565b95989497509550505050565b6001600160a01b0381168114610a6157600080fd5b50565b6000808335601e19843603018112610a5857600080fd5b83018035915067ffffffffffffffff821115610a5357600080fd5b602090810192508102360382131561060557600080fd5b60005b83811015610aa1578181015183820152602001610a89565b8381111561060557600080fd5b60208152600061092c6020830184610a64565b6000602082840312156108b157600080fd5b60008151808452610adc816020860160208601610a86565b601f01601f19169290920160200192915050565b60006001600160a01b038216610be0565b815191825260208201908301610be0565b815191825260208201908301610be0565b815191825260208201908301610be0565b815191825260208201908301610be0565b815191825260208201908301610be0565b815191825260208201908301610be0565b815191825260208201908301610be0565b815191825260208201908301610be7565b815191825260208201908301610be7565b815191825260208201908301610be7565b815191825260208201908301610be7565b815191825260208201908301610be7565b815191825260208201908301610be7565b815191825260208201908301610be7565b815191825260208201908301610be7565b815191825260208201908301610be7565b815191825260208201908301610be7565b815191825260208201908301610be7565b815191825260208201908301610be7565b815191825260208201908301610be7565b905290565b61060582610af3565b905290565b905290565b905290565b905290565b905290565b905290565b905290565b905290565b905290565b905290565b905290565b905290565b905290565b905290565b905290565b905290565b905290565b905290565b905290565b90529056fea26469706673582212208d5a4a7cd13d67bf5e30b9fcedffb64accc7e95930ff9a3c7e1e68e92d6bc87b64736f6c63430008090033";
    
    // Return the "compiled" contract data
    return {
      abi: abi,
      bytecode: bytecode
    };
  } catch (error) {
    console.error('Error with contract data:', error);
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
      // Set up mock state first for development mode
      if (process.env.NODE_ENV === 'development') {
        this.simulateBlockchain();
      }
      
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
      
      console.log('Creating mock contract deployment...');
      
      // In development environment, we'll use a mock contract
      // This simulates having deployed a contract to the blockchain
      this.contractAddress = '0x1234567890123456789012345678901234567890'; // Mock address
      
      // Create contract instance with the mock address
      this.contract = new this.web3.eth.Contract(
        this.contractAbi,
        this.contractAddress
      );
      
      console.log(`Contract deployed at mock address: ${this.contractAddress}`);
      return this.contractAddress;
    } catch (error) {
      console.error('Error with contract setup:', error);
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
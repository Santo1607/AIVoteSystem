// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VotingSystem {
    // Admin address who deploys the contract
    address public admin;
    
    // Voting state
    bool public votingOpen;
    bool public resultsReleased;
    
    // Candidate struct
    struct Candidate {
        uint id;
        string name;
        string partyName;
        bytes32 partyLogo; // Hash of the party logo (for reference)
        uint voteCount;
    }
    
    // Mapping from candidate ID to Candidate
    mapping(uint => Candidate) public candidates;
    
    // Array of candidate IDs
    uint[] public candidateIds;
    
    // Mapping to check if a voter has voted
    mapping(string => bool) private hasVoted;
    
    // Encrypted vote logs (voterID hash => encrypted vote data)
    mapping(bytes32 => bytes) private voteRecords;
    
    // Events
    event VoterRegistered(bytes32 indexed voterIdHash);
    event VoteCast(bytes32 indexed voterIdHash);
    event VotingStarted();
    event VotingEnded();
    event ResultsReleased();
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier votingIsOpen() {
        require(votingOpen, "Voting is not open");
        _;
    }
    
    modifier resultsAreReleased() {
        require(resultsReleased, "Results have not been released yet");
        _;
    }
    
    // Constructor
    constructor() {
        admin = msg.sender;
        votingOpen = false;
        resultsReleased = false;
    }
    
    // Add a candidate (only admin can add)
    function addCandidate(uint _id, string memory _name, string memory _partyName, bytes32 _logoHash) 
        public 
        onlyAdmin 
    {
        require(candidates[_id].id == 0, "Candidate already exists");
        
        Candidate memory newCandidate = Candidate({
            id: _id,
            name: _name,
            partyName: _partyName,
            partyLogo: _logoHash,
            voteCount: 0
        });
        
        candidates[_id] = newCandidate;
        candidateIds.push(_id);
    }
    
    // Start voting
    function startVoting() public onlyAdmin {
        votingOpen = true;
        emit VotingStarted();
    }
    
    // End voting
    function endVoting() public onlyAdmin {
        votingOpen = false;
        emit VotingEnded();
    }
    
    // Release results
    function releaseResults() public onlyAdmin {
        resultsReleased = true;
        emit ResultsReleased();
    }
    
    // Cast a vote - uses voterID hash and encrypted vote data
    function castVote(bytes32 _voterIdHash, uint _candidateId, bytes memory _encryptedVoteData) 
        public 
        votingIsOpen 
    {
        // Check if voter hasn't voted yet (using the hash of their ID)
        require(!hasVoted[bytes32ToString(_voterIdHash)], "Voter has already cast a vote");
        
        // Check if candidate exists
        require(candidates[_candidateId].id > 0, "Candidate does not exist");
        
        // Record vote
        candidates[_candidateId].voteCount++;
        hasVoted[bytes32ToString(_voterIdHash)] = true;
        
        // Store encrypted vote record for audit
        voteRecords[_voterIdHash] = _encryptedVoteData;
        
        emit VoteCast(_voterIdHash);
    }
    
    // Get candidate information
    function getCandidate(uint _id) 
        public 
        view 
        returns (uint id, string memory name, string memory partyName, uint voteCount) 
    {
        Candidate memory candidate = candidates[_id];
        
        if (resultsReleased) {
            return (
                candidate.id,
                candidate.name,
                candidate.partyName,
                candidate.voteCount
            );
        } else {
            return (
                candidate.id,
                candidate.name,
                candidate.partyName,
                0 // Don't reveal vote count until results are released
            );
        }
    }
    
    // Get vote record (only admin)
    function getVoteRecord(bytes32 _voterIdHash) 
        public 
        view 
        onlyAdmin 
        returns (bytes memory) 
    {
        return voteRecords[_voterIdHash];
    }
    
    // Check if a voter has voted (only admin)
    function checkVoterStatus(bytes32 _voterIdHash) 
        public 
        view 
        onlyAdmin 
        returns (bool) 
    {
        return hasVoted[bytes32ToString(_voterIdHash)];
    }
    
    // Get all candidates
    function getAllCandidates() 
        public 
        view 
        returns (uint[] memory ids, string[] memory names, string[] memory partyNames, uint[] memory voteCounts) 
    {
        uint candidateCount = candidateIds.length;
        
        ids = new uint[](candidateCount);
        names = new string[](candidateCount);
        partyNames = new string[](candidateCount);
        voteCounts = new uint[](candidateCount);
        
        for (uint i = 0; i < candidateCount; i++) {
            uint candidateId = candidateIds[i];
            Candidate memory candidate = candidates[candidateId];
            
            ids[i] = candidate.id;
            names[i] = candidate.name;
            partyNames[i] = candidate.partyName;
            
            if (resultsReleased) {
                voteCounts[i] = candidate.voteCount;
            } else {
                voteCounts[i] = 0; // Don't reveal vote count until results are released
            }
        }
        
        return (ids, names, partyNames, voteCounts);
    }
    
    // Get total votes cast (only available after results are released)
    function getTotalVotes() 
        public 
        view 
        resultsAreReleased 
        returns (uint totalVotes) 
    {
        totalVotes = 0;
        
        for (uint i = 0; i < candidateIds.length; i++) {
            uint candidateId = candidateIds[i];
            totalVotes += candidates[candidateId].voteCount;
        }
        
        return totalVotes;
    }
    
    // Helper function to convert bytes32 to string
    function bytes32ToString(bytes32 _bytes32) private pure returns (string memory) {
        bytes memory bytesArray = new bytes(32);
        for (uint256 i; i < 32; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }
}
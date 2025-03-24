// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract VotingSystem {
    address private owner;
    
    // Election state
    // 0: Not started
    // 1: Voting in progress
    // 2: Voting ended, results pending
    // 3: Results released
    uint256 public electionState;
    
    struct Candidate {
        uint256 id;
        string name;
        string partyName;
        string partyLogo; // URL or hash to the logo
        uint256 voteCount;
    }
    
    mapping(uint256 => Candidate) private candidates;
    uint256[] private candidateIds;
    
    // Voter status tracking (hash of voter ID -> has voted)
    mapping(bytes32 => bool) private voterStatus;
    
    // Encrypted vote data for audit (hash of voter ID -> encrypted data)
    mapping(bytes32 => bytes) private voteData;
    
    // Events
    event VoteCast(bytes32 indexed voterIdHash, uint256 candidateId);
    event ElectionStateChanged(uint256 state);
    event CandidateAdded(uint256 id, string name, string partyName);
    
    constructor() {
        owner = msg.sender;
        electionState = 0; // Not started
    }
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier electionNotStarted() {
        require(electionState == 0, "Election has already started");
        _;
    }
    
    modifier electionInProgress() {
        require(electionState == 1, "Voting is not in progress");
        _;
    }
    
    modifier electionEnded() {
        require(electionState == 2, "Voting has not ended");
        _;
    }
    
    modifier resultsReleased() {
        require(electionState == 3, "Results have not been released");
        _;
    }
    
    // Election management functions
    
    function addCandidate(uint256 id, string memory name, string memory partyName, string memory partyLogo) public onlyOwner electionNotStarted {
        candidates[id] = Candidate(id, name, partyName, partyLogo, 0);
        candidateIds.push(id);
        emit CandidateAdded(id, name, partyName);
    }
    
    function startVoting() public onlyOwner electionNotStarted {
        electionState = 1; // Voting in progress
        emit ElectionStateChanged(electionState);
    }
    
    function endVoting() public onlyOwner electionInProgress {
        electionState = 2; // Voting ended, results pending
        emit ElectionStateChanged(electionState);
    }
    
    function releaseResults() public onlyOwner electionEnded {
        electionState = 3; // Results released
        emit ElectionStateChanged(electionState);
    }
    
    // Voting functions
    
    function castVote(bytes32 voterIdHash, uint256 candidateId, bytes memory encryptedData) public electionInProgress {
        // Check if voter has already voted
        require(!voterStatus[voterIdHash], "Voter has already cast a vote");
        
        // Check if candidate exists
        require(candidates[candidateId].id == candidateId, "Candidate does not exist");
        
        // Record vote
        candidates[candidateId].voteCount++;
        voterStatus[voterIdHash] = true;
        voteData[voterIdHash] = encryptedData;
        
        emit VoteCast(voterIdHash, candidateId);
    }
    
    // Query functions
    
    function checkVoterStatus(bytes32 voterIdHash) public view returns (bool) {
        return voterStatus[voterIdHash];
    }
    
    function getCandidate(uint256 id) public view returns (uint256, string memory, string memory, uint256) {
        Candidate memory candidate = candidates[id];
        uint256 votes = electionState == 3 ? candidate.voteCount : 0; // Only show votes if results are released
        return (candidate.id, candidate.name, candidate.partyName, votes);
    }
    
    function getAllCandidates() public view returns (uint256[] memory, string[] memory, string[] memory, uint256[] memory) {
        uint256 count = candidateIds.length;
        uint256[] memory ids = new uint256[](count);
        string[] memory names = new string[](count);
        string[] memory partyNames = new string[](count);
        uint256[] memory voteCounts = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            uint256 id = candidateIds[i];
            Candidate memory candidate = candidates[id];
            ids[i] = candidate.id;
            names[i] = candidate.name;
            partyNames[i] = candidate.partyName;
            voteCounts[i] = electionState == 3 ? candidate.voteCount : 0; // Only show votes if results are released
        }
        
        return (ids, names, partyNames, voteCounts);
    }
    
    function getTotalVotes() public view resultsReleased returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < candidateIds.length; i++) {
            total += candidates[candidateIds[i]].voteCount;
        }
        return total;
    }
}
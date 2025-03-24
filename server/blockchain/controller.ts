import { Request, Response } from 'express';
import { blockchainService } from './service';

// Initialize blockchain when the server starts
let blockchainInitialized = false;

export async function initializeBlockchain() {
  if (!blockchainInitialized) {
    try {
      await blockchainService.initialize();
      blockchainInitialized = true;
      console.log('Blockchain service initialized successfully');
      
      // Start voting by default in development mode
      if (process.env.NODE_ENV === 'development') {
        await blockchainService.startVoting();
        console.log('Voting has been started in blockchain (development mode)');
      }
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      // Continue in simulation mode
      blockchainInitialized = true;
    }
  }
}

// API endpoint to start voting
export async function startVoting(req: Request, res: Response) {
  try {
    await blockchainService.startVoting();
    res.status(200).json({ success: true, message: 'Voting has been started' });
  } catch (error: any) {
    console.error('Error starting voting:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// API endpoint to end voting
export async function endVoting(req: Request, res: Response) {
  try {
    await blockchainService.endVoting();
    res.status(200).json({ success: true, message: 'Voting has been ended' });
  } catch (error: any) {
    console.error('Error ending voting:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// API endpoint to release results
export async function releaseResults(req: Request, res: Response) {
  try {
    await blockchainService.releaseResults();
    res.status(200).json({ success: true, message: 'Results have been released' });
  } catch (error: any) {
    console.error('Error releasing results:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// API endpoint to cast a vote
export async function castVote(req: Request, res: Response) {
  try {
    const { voterId, candidateId } = req.body;
    
    if (!voterId || !candidateId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    await blockchainService.castVote(voterId, candidateId);
    res.status(200).json({ success: true, message: 'Vote has been cast successfully' });
  } catch (error: any) {
    console.error('Error casting vote:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// API endpoint to get all candidates with vote counts (if results are released)
export async function getCandidates(req: Request, res: Response) {
  try {
    const candidates = await blockchainService.getAllCandidates();
    res.status(200).json({ success: true, candidates });
  } catch (error: any) {
    console.error('Error getting candidates:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// API endpoint to get total votes (only if results are released)
export async function getTotalVotes(req: Request, res: Response) {
  try {
    const totalVotes = await blockchainService.getTotalVotes();
    res.status(200).json({ success: true, totalVotes });
  } catch (error: any) {
    console.error('Error getting total votes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// API endpoint to check if a voter has already voted
export async function checkVoterStatus(req: Request, res: Response) {
  try {
    const { voterId } = req.params;
    
    if (!voterId) {
      return res.status(400).json({ success: false, message: 'Missing voter ID' });
    }
    
    const hasVoted = await blockchainService.checkVoterStatus(voterId);
    res.status(200).json({ success: true, hasVoted });
  } catch (error: any) {
    console.error('Error checking voter status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
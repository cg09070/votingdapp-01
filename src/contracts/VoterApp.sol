pragma solidity >=0.5.0;
pragma experimental ABIEncoderV2; /// needed to pass structs in functions 

contract VoterApp {
  string public appName;
	
	address owner; /// the deployer of this contract
	
	/// Mappings are not iterable. Count variables are stored for this purpose
	uint public electionCount = 0;
	uint public contestCount = 0;
	uint public candidateCount = 0;
	uint public amendmentCount = 0;
	uint public voterCount = 0;
	
	/// Do not have a length. Used for mapping of structs
	mapping(uint => Election) public elections;
	mapping(uint => Contest) public contests;
	mapping(uint => Candidate) public candidates;
	mapping(uint => Amendment) public amendments;
	mapping(address => Voter) public voters;
	
	/// Restricts access to the owner
	modifier onlyOwner() {
		require(msg.sender == owner);
		_;
	}
	
	struct Election {
		string electionName;
		uint closingDate;
		bool isClosed;
	}
	
	struct Amendment {
		uint electionId;
		string amendmentName;
		string amendmentDescription;
		uint votesFor;
		uint votesAgainst;
	}
	
	struct Contest {
		uint electionId;
		string contestName;
	}
	
	struct Candidate {
		uint contestId;
		string candidateName;
		string candidatePlatform;
		uint voteCount;
	}
	
	struct Voter {
		bool isRegistered;
		uint[] voted; /// stores the election id that a voter has submitted a ballot
	}
	
	constructor() public {
		appName = "CGary Voter Application";
		owner = msg.sender; /// sets the deployer of the contract as the owner
		registerVoter(owner); /// adds the owner as a registered voter
	}
	
	/**
		function does not change the state and is marked as a view
		checks if the public key address matches that of the owner
	/*
	function isAdmin() public view returns (address) {
		return owner; 
	}
	
	/**
		function will only be called from outside the contract and is set as external.
		function can only be called by the owner
		all election data is passed to this function to be stored in the appropriate structs
	/*	
	function createElection(Election calldata _election, Amendment[] calldata _amendments, Contest[] calldata _contests, Candidate[] calldata _candidates) external onlyOwner {
		elections[electionCount].electionName = _election.electionName;
		elections[electionCount].closingDate = _election.closingDate;
		elections[electionCount++].isClosed = _election.isClosed;
		
		for(uint i=0; i<_amendments.length; i++){
			amendments[amendmentCount].electionId = _amendments[i].electionId;
			amendments[amendmentCount].amendmentName = _amendments[i].amendmentName;
			amendments[amendmentCount].amendmentDescription = _amendments[i].amendmentDescription;
			amendments[amendmentCount].votesFor = 0; // not passed in. Always initialized to 0
			amendments[amendmentCount++].votesAgainst = 0; // not passed in. Always initialized to 0
		}
		
		for(uint i=0; i<_contests.length; i++){
			contests[contestCount].electionId = _contests[i].electionId;
			contests[contestCount++].contestName = _contests[i].contestName;
		}
		
		for(uint i=0; i<_candidates.length; i++){
			candidates[candidateCount].contestId = _candidates[i].contestId;
			candidates[candidateCount].candidateName = _candidates[i].candidateName;
			candidates[candidateCount].candidatePlatform = _candidates[i].candidatePlatform;
			candidates[candidateCount++].voteCount = 0; // not passed in. Always initialized to 0
		}
	}
	
	/**
		function registers a voter using their public key.
	/*
	function registerVoter(address _voterId) public onlyOwner {
		voters[_voterId].isRegistered = true;
		voters[_voterId].voted.push(1000000); // dummy declaration for initialization purposes. '10000000' is used as infinity
		
		voterCount++;
	}
	
	/**
		The only function that any address can access.
		Votes are passed in and stored in the appropriate structs
	/*
	function castBallot(uint electionId, uint[] memory amendmentId, int[] memory amendmentVote, int[] memory contestVote) public {
		for(uint i=0; i<voters[msg.sender].voted.length; i++){
			require(!(voters[msg.sender].voted[i] == electionId));
		}
		
		for(uint i=0; i<amendmentId.length; i++) {
			votesForAmendment(amendmentId[i], amendmentVote[i]);
		}

		for(uint i=0; i<contestVote.length; i++) {
			votesForCandidate(contestVote[i]);
		}
		
		voters[msg.sender].voted.push(electionId); /// stores in which election the voter has cast a ballot
	}
	
	/**
		function is only called internally and is declared as private
		increments the appropriate candidate's vote count by one if the voter made a selection
	/*
	function votesForCandidate(int _candidateId) private {
		if(_candidateId >= 0 )
			candidates[uint256(_candidateId)].voteCount++;
	}
	
	/**
		function is only called internally and is declared as private
		increments the appropriate amendment's vote count by one if the voter made a selection
	/*
	function votesForAmendment(uint _amendmentId, int _vote) private {
		if(_vote >= 0){
			if(_vote == 1)
				amendments[_amendmentId].votesFor++;
			else
				amendments[_amendmentId].votesAgainst++;
		}
	}
}


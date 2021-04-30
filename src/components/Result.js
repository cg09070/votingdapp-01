import React, { Component } from 'react';
import Votechart from './Votechart';
import Web3 from 'web3';
import VoterApp from '../abis/VoterApp.json';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

/*
	Results Page: open election bar graph and closed election accordians
*/
class Result extends Component {
	
	// loads the blockchain
	async componentWillMount() {
		await this.loadWeb3();
		await this.loadBlockchainData();
	}
	
	// connects web app to the blockchain
	async loadWeb3() {
		if (window.ethereum) {
			window.web3 = new Web3(window.ethereum);
			await window.ethereum.enable();
		}	else if (window.web3) {
			window.web3 = new Web3(window.web3.currentProvider);
		} else {
			window.alert('Non-Ethereum browser detected. You should consider trying MetaMask?');
		}
	}
	
	// imports all election data to the web app
	async loadBlockchainData() {
		const web3 = window.web3;
								
		const networkId = await web3.eth.net.getId();
		const networkData = VoterApp.networks[networkId];
		if(networkData) {
			const voterapp = web3.eth.Contract(VoterApp.abi, networkData.address);
			this.setState({ voterapp });
			
			let electionCount = await voterapp.methods.electionCount().call();
			let amendmentCount = await voterapp.methods.amendmentCount().call();
			let contestCount = await voterapp.methods.contestCount().call();
			let candidateCount = await voterapp.methods.candidateCount().call();
			
			// Checks whether an election should be open
			if(electionCount.toNumber()){
				let elections = []
				for(var i=0; i<electionCount.toNumber(); i++){
					let election = await voterapp.methods.elections(i).call() // smart contract call it import election struct mapped at index i
					
					let currentDate = new Date().getTime()/(1000*60*60*24)
					let endDate = new Date(window.web3.utils.hexToNumber(election.closingDate)).getTime()/(1000*60*60*24)
					let date = endDate - currentDate
					
					if(date > 0 && date <= 5 ){
						elections.push({
							electionId: i,
							electionName: election.electionName,
							closingDate: election.closingDate,
							isClosed: false
						})
					}
					else {
						elections.push({
							electionId: i,
							electionName: election.electionName,
							closingDate: election.closingDate,
							isClosed: true
						})
					}
				}
				this.setState({ elections })
			}
			
			// stores the amendments in an array
			if(amendmentCount.toNumber()){
				let amendments = []
				for(var i=0; i<amendmentCount.toNumber(); i++){
					let a = await voterapp.methods.amendments(i).call() // smart contract call it import amendment struct mapped at index i
					amendments.push(a)
				}
				this.setState({ amendments })
			}
			
			// stores the contests in an array
			if(contestCount.toNumber()){
				let contests = []
				for(var i=0; i<contestCount.toNumber(); i++){
					let c = await voterapp.methods.contests(i).call() // smart contract call it import contest struct mapped at index i
					contests.push({
						contestId: i,
						electionId: c.electionId,
						contestName: c.contestName
					})
				}
				this.setState({ contests })
			}
			
			// stores the candidates in an array
			if(candidateCount.toNumber() !== 0){
				let candidates = []
				for(var i=0; i<candidateCount.toNumber(); i++){
					let c = await voterapp.methods.candidates(i).call() // smart contract call it import candidate struct mapped at index i
					candidates.push(c)
				}
				this.setState({ candidates })
			}
			
		} else {
			window.alert("VoterApp contract not deployed at detected network");
		}
	}
	
	constructor(props) {
		super(props);
		this.state = {
			amendments: [],
			candidates: [],
			contests: [],
			elections: [],
			loading: true
		}
	};
	
  render() {	
    return (
      <div id="results-container">
				<div className="container-fluid mt-5">
					<div className="row">
						<main role="main" className="col-lg-12 d-flex">
							<Results
								electionCount={this.state.electionCount}
								ballotCount={this.state.ballotCount}
								elections={this.state.elections}
								amendments={this.state.amendments}
								contests={this.state.contests}
								candidates={this.state.candidates}
							/>
						</main>
					</div>
				</div>
      </div>  
    );
  }
}

function Results(props){
	return (
		<div id="content">
			<div id="open-election-results">
				<h1>Open Election Results</h1>
				{openElection(props)}
			</div>
			<br /><br /><br />
			<div id="previous-elections-results">
				<h1>Closed Elections</h1>
				{closedElections(props)}
			</div>
		</div>
	)
}

function openElection(props) {
	let openElection = []
	let openAmendments = []
	let openCandidates = []
	
	// gets the open election id if one exists and its associated contests
	if(props.elections.length > 0){
		openElection = props.elections.filter(election => election.isClosed === false)
		
		if(openElection.length && props.amendments.length){
			for(var i=0; i<props.amendments.length; i++){
				if(props.amendments[i].electionId.toNumber() === openElection[0].electionId)
					openAmendments.push(props.amendments[i])
			}
		}
		
		if(openElection.length && props.contests.length){
			for(var i=0; i<props.contests.length; i++){
				if(props.contests[i].electionId.toNumber() === openElection[0].electionId)
					openCandidates.push(...props.candidates.filter(candidate => candidate.contestId.toNumber() === props.contests[i].contestId))
			}
		}		
	}
	
	// passes open election data to Votechart to be displayed in a bar graph
	return (
		<div className="margin-top">
			<Votechart 
				openElection={openElection}
				openAmendments={openAmendments}
				openCandidates={openCandidates}
			/>
		</div>
	)
}

function closedElections(props) {
	return (
		<div className="margin-top">
			<div>
				{props.elections.filter(election => election.isClosed === true).map((e, ekey) => {
					return (
						<Accordion key={ekey}>
							<AccordionSummary
								expandIcon={<ExpandMoreIcon />}
								aria-controls="panel1a-content"
								id="panel1a-header"
							>
							<Typography className="closed-election">{e.electionName.toString()} - ({new Date(window.web3.utils.hexToNumber(e.closingDate)).toDateString()})</Typography>
							</AccordionSummary>
							{props.amendments.filter(amendment => amendment.electionId.toNumber() === e.electionId).map((a, akey) => {
								return (
									<AccordionDetails key={akey}>
										<Typography>{a.amendmentName.toString()} (no:{a.votesAgainst.toNumber()} yes:{a.votesFor.toNumber()}) </Typography>
									</AccordionDetails>
								)
							})}
							{props.contests.filter(contest => contest.electionId.toNumber() === e.electionId).map((co, cokey) => {
								return (
									<AccordionDetails key={cokey}>
										{props.candidates.filter(candidate => (e.electionId === co.electionId.toNumber() && candidate.contestId.toNumber() === co.contestId)).map((ca, cakey) => {
											return (
												<Typography className="contest-group" key={cakey}>{co.contestName.toString()}: {ca.candidateName.toString()} ({ca.voteCount.toNumber()})<br /></Typography>
											)
										})}
									</AccordionDetails>
								)
							})}
						</Accordion>
					)
				})}
			</div>
		</div>
	)
}

export default Result;

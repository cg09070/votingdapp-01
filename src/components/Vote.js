import React, { Component, useState } from 'react';
import Web3 from 'web3';
import tooltip from '../tooltip.png';
import VoterApp from '../abis/VoterApp.json';
import Tooltip from '@material-ui/core/Tooltip';

/*
	Vote Page: creates a ballot for an open election
*/
class Vote extends Component {
	
	// loads the blockchain
	async componentWillMount() {
		await this.loadWeb3();
		await this.loadBlockchainData();
	}
	
	// connects web app to the blockchain
	async loadWeb3() {
		if (window.ethereum) {
			window.web3 = new Web3(window.ethereum);
			await window.ethereum.enable()
		}	else if (window.web3) {
			window.web3 = new Web3(window.web3.currentProvider)
		} else {
			window.alert('Non-Ethereum browser detected. You should consider trying MetaMask?')
		}
	}
	
	// imports all election data to the web app
	async loadBlockchainData() {
		const web3 = window.web3
								
		const networkId = await web3.eth.net.getId()
		const networkData = VoterApp.networks[networkId]
		if(networkData) {
			const voterapp = web3.eth.Contract(VoterApp.abi, networkData.address)
			this.setState({ voterapp })
			
			let electionCount = await voterapp.methods.electionCount().call()
			let amendmentCount = await voterapp.methods.amendmentCount().call()					
			let contestCount = await voterapp.methods.contestCount().call()			
			let candidateCount = await voterapp.methods.candidateCount().call()

			const accounts = await web3.eth.getAccounts()
			this.setState({ account: accounts[0] })
			
			// checks whether the user is a registered voter
			const voter = await voterapp.methods.voters(this.state.account).call()
			this.setState({ voter })

			// reloads the blockchain data if the user switches accounts
			window.ethereum.on('accountsChanged', (accounts) => {
				this.loadBlockchainData()
			})
						
			// Checks whether an election should be open
			if(electionCount.toNumber()){
				let elections = []
				for(var i=0; i<electionCount.toNumber(); i++){
					let election = await voterapp.methods.elections(i).call()
					
					let currentDate = new Date().getTime()/(1000*60*60*24)
					let endDate = new Date(window.web3.utils.hexToNumber(election.closingDate)).getTime()/(1000*60*60*24)
					let date = endDate - currentDate
					
					if(date > 0 && date <= 5 ){
						this.setState({ electionCount: 1 })
						elections.push({
							electionId: i,
							electionName: election.electionName,
							closingDate: election.closingDate,
							isClosed: false
						})
						break
					}
				}
				this.setState({ elections })
			}
			
			// if an open election has been found, import the contests related to the election
			if(this.state.electionCount == 1 && amendmentCount.toNumber()){
				let amendments = []
				for(var i=0; i<amendmentCount.toNumber(); i++){
					let amendment = await voterapp.methods.amendments(i).call()
					if(amendment.electionId.toNumber() === this.state.elections[0].electionId)
						amendments.push({
							amendmentId: i,
							electionId: amendment.electionId,
							amendmentName: amendment.amendmentName,
							amendmentDescription: amendment.amendmentDescription
						})
					// ends the for loop when the election Id increments
					if(amendment.electionId.toNumber() > this.state.elections[0].electionId)
						break
				}
				this.setState({ amendments })
			}
			
			if(this.state.electionCount == 1 && contestCount.toNumber()){
				let contests = []
				let candidates = []
				
				for(var i=0; i<contestCount.toNumber(); i++){
					let contest = await voterapp.methods.contests(i).call()
					if(contest.electionId.toNumber() === this.state.elections[0].electionId){
						contests.push({
							contestId: i,
							electionId: contest.electionId,
							contestName: contest.contestName
						})
						for(var j=0; j<candidateCount.toNumber(); j++){
							let candidate = await voterapp.methods.candidates(j).call()
							if(candidate.contestId.toNumber() === i)
								candidates.push({
									candidateId: j,
									contestId: candidate.contestId,
									candidateName: candidate.candidateName,
									candidatePlatform: candidate.candidatePlatform,
									voteCount: candidate.voteCount
								})
							if(candidate.contestId.toNumber() > i)
								break
						}
					}
					this.setState({ candidates })
					// ends the for loop when the election Id increments
					if(contest.electionId.toNumber() > this.state.elections[0].electionId)
						break
				}
				this.setState({ contests })
			}
		} else {
			window.alert("VoterApp contract not deployed at detected network");
		}
	}
	
	// send ballot selections to the blockchain
	async castBallot(amendmentList, contestList){
		if(this.isRegistered()) {
			let amendmentId = []
			let amendmentVote = []
			let contestVote = []

			for(var i=0; i<amendmentList.length; i++) {
				amendmentId.push(amendmentList[i].amendmentId)
				if(amendmentList[i].vote != "")
					amendmentVote.push(Number(amendmentList[i].vote))
				else
					amendmentVote.push(-1)
			}

			for(var i=0; i<contestList.length; i++) {
				if(contestList.contestId != "")
					contestVote.push(contestList[i].vote)
				else
					contestVote.push(-1)
			}
			
			await this.state.voterapp.methods.castBallot(this.state.elections[0].electionId, amendmentId, amendmentVote, contestVote)
				.send({ from: this.state.account })
				.on("confirmation", () => {
					window.location.reload()
				}
			)
		} else {
			alert("you are not eligible to vote at this time. you are not a registered voter");
		}
	}
	
	constructor(props) {
		super(props);
		this.state = {
			account: '',
			amendments: [],
			candidates: [],
			contests: [],
			elections: [],
			electionCount: 0,
			selected: '',
			voter: false
		}
		
		// it is necessary to bind methods that are passed to child elements
		this.castBallot = this.castBallot.bind(this)
	};
	
	isRegistered() {
		return this.state.voter
	}
	
	// loads the ballot if the user is registered
	render() {
    return (
      <div>
				<div className="container-fluid mt-5">
					<div className="row">
						<main role="main" className="col-lg-12 d-flex">
							{
								!this.isRegistered() ?
								<h1>You are not registered to vote in this election</h1> :
								!this.state.electionCount == 1 ?
									<h1>There are no open elections at this time</h1> :
									<Ballot 
										{...this.state}
										castBallot = {this.castBallot}
									/>
							}
						</main>
					</div>
				</div>
      </div>  
    );
  }
}

function Ballot(props){
	const handleSubmitEvent = (event) => {
		props.castBallot(amendmentList, contestList)
	}
		
	const [amendmentList, setAmendmentList] = useState([{ amendmentId: '', vote: '' }])
	
	let i=amendmentList.length
	while(i++ < props.amendments.length){
    setAmendmentList([...amendmentList, { amendmentId: '', vote: '' }])
	}

  const handleAmendmentVote = (event, index, id) => {
    const list = [...amendmentList]
		list[index].amendmentId = Number(id)
    list[index].vote = event.target.value
    setAmendmentList(list)
  }
	const [contestList, setContestList] = useState([{ contestId: '', vote: '' }])
	
	i=contestList.length
	while(i++ < props.contests.length){
    setContestList([...contestList, { contestId: '', vote: '' }])
	}

  const handleContestVote = (event, index, id) => {
    const list = [...contestList]
		list[index].contestId = Number(id)
    list[index].vote = event.target.value
    setContestList(list)
  }
	
	return (
		<div id="content">
			<h1 className="text-center">Vote Here</h1>
			<p>
				<br />Thank you for exercising your right to vote. All votes remain confidential and are cast anonymously.
				<br />Please make one selection per contest and make a selection for each race. 
				<br />Hover over the info icon for a description related to the associated amendment or candidate.
			</p>
				<div className="margin-top">
				{props.elections.map((e, ekey) => {
					return (
						<div key={ekey} id="content">
							<h1>{e.electionName.toString()}</h1>
							<form className="bgcolor-election"><div className="amendments">
								{props.amendments.map((a, akey) => {
									return (
										<div key={akey} className="box">
											<p><b>(id-{akey}) {a.amendmentName.toString()}</b>
											<Tooltip title={a.amendmentDescription.toString()}>
												<img className="sm-icon" src={tooltip} alt="?" />
											</Tooltip>
											<label><span>    </span>no
												<input
													className="form-select"
													name={"amendment" + akey}
													id="amendmentVote"
													onChange={event => {handleAmendmentVote(event, akey, a.amendmentId)}}
													type="radio"
													value={"0" || ''}
												/>
											</label><span>    </span>
											<label>yes
												<input
													className="form-select"
													name={"amendment" + akey}
													id="amendmentVote"
													onChange={event => {handleAmendmentVote(event, akey, a.amendmentId)}}
													type="radio"
													value={"1" || ''}
												/>
											</label></p>
										</div>
									)
								})}
							
							</div><div className="contests">
								{props.contests.map((co, cokey) => {
									return (
										<div key={cokey} className="box">
											<h5 className="bgcolor-candidate">{co.contestName.toString()}</h5>
											{props.candidates.filter(candidate => candidate.contestId.toNumber() === co.contestId).map((ca, cakey) => {
												return (
													<p key={cakey}><b>(id-{cakey}) {ca.candidateName.toString()}</b>
														<Tooltip title={ca.candidatePlatform.toString()}>
															<img className="sm-icon" src={tooltip} alt="?" />
														</Tooltip>
														<label><span>    </span>
															<input
																className="form-select"
																name={"contest" + co.contestId}
																id="contestVote"
																onChange={event => {handleContestVote(event, cokey, co.contestId)}}
																type="radio"
																value={ca.candidateId || ''}
															/>
														</label>
													</p>
												)
											})}
										</div>
									)
								})}
							</div>
								<div><button className="btn btn-success" type="button" onClick={event => {handleSubmitEvent(event)}}>Submit</button></div>
							</form>
						</div>
					)
				})}
			</div>
		</div>
	)
}

export default Vote;

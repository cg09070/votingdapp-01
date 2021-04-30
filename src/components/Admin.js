import React, { Component, Fragment, useState } from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import Web3 from 'web3'
import VoterApp from '../abis/VoterApp.json'

/*
	Admin Page: create elections and register voters
*/
class Admin extends Component {
	
	// loads the blockchain
	async componentWillMount() {
		await this.loadWeb3()
		await this.loadBlockchainData()
	}
	
	// connects web app to the blockchain
	async loadWeb3() {
		if (window.ethereum) {
			window.web3 = new Web3(window.ethereum)
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
		const accounts = await web3.eth.getAccounts()
		this.setState({ account: accounts[0] })
								
		const networkId = await web3.eth.net.getId()
		const networkData = VoterApp.networks[networkId]
		
		if(networkData) {
			const voterapp = web3.eth.Contract(VoterApp.abi, networkData.address)
			this.setState({ voterapp })
			
			// checks whether the user is an administrator
			const admin = await voterapp.methods.isAdmin().call()
			this.setState({ admin })

			// reloads the blockchain data if the user switches accounts
			window.ethereum.on('accountsChanged', (accounts) => {
				this.loadBlockchainData()
			})
			
			const electionCount = await voterapp.methods.electionCount().call()
			let contestCount = await voterapp.methods.contestCount().call()
			
			contestCount = contestCount.toNumber()
			this.setState({ contestCount })
			this.setState({ initialCount: contestCount })
			
			this.setState({ electionCount })
			this.setState({ contestCount })
			
		} else {
			window.alert("VoterApp contract not deployed at detected network")
		}
	}
	
	constructor(props) {
		super(props)
		this.state = {
			account: '',
			admin: '',
			amendments: [],
			candidates: [],
			contests: [],
			contestCount: 0,
      currentStep: 1,
			election: [],
			electionCount: 0,
			initialCount: 0,
			loading: false,
			voterId: ''
		}
		
		// it is necessary to bind methods that are passed to child elements
		this.previousButton = this.previousButton.bind(this)
		this.setElection = this.setElection.bind(this)
		this.setAmendments = this.setAmendments.bind(this)
		this.setContests = this.setContests.bind(this)
		this.handleSubmit = this.handleSubmit.bind(this)
	}
  
  _next = () => {
    let currentStep = this.state.currentStep
    currentStep = currentStep + 1
    this.setState({ currentStep })
  }
    
  _prev = () => {
    let currentStep = this.state.currentStep
    currentStep =  currentStep - 1
    this.setState({ currentStep })
  }
	
	previousButton() {
		if(this.state.currentStep !== 1){
			return (
				<button 
					className="btn btn-secondary" 
					type="button" onClick={this._prev}>
				Previous
				</button>
			)
		}
		return null
	}

	nextButton(){
		return (
			<button 
				className="btn btn-primary float-right" 
				type="button" onClick={this._next}>
			Next
			</button>
		)
	}

	/*
		called when the nextButton is clicked in step 1
		stores the election data in a variable 'election'
	*/
	setElection(electionName, closingDate){		
		const election = [{
			electionName: electionName,
			closingDate: closingDate,
			isClosed: true}
		]
		this.setState({ election })
		this._next()
	}

	/*
		called when the nextButton is clicked in step 2
		stores the amendment data in an array variable 'amendments'
	*/
	setAmendments(amendmentList){
		let amendments = []
		
		for(var i=0; i<amendmentList.length; i++){
			amendments.push({
				electionId: this.state.electionCount.toNumber(),
				amendmentName: amendmentList[i].amendmentName,
				amendmentDescription: amendmentList[i].amendmentDescription,
				votesFor: 0,
				votesAgainst: 0
			})
		}
		this.setState({ amendments })
		this._next()
	}

	/*
		called when the save button is clicked in step 3
		appends the election data in an array variable 'contests'
		candidates are stored in a contest subarray
	*/
	setContests(contestName, candidateList){
		let contests = this.state.contests
		const contest = [{
			electionId: this.state.electionCount.toNumber(),
			contestName
		}]
		contests.push(...contest)
		this.setState({ contests })
		
		let candidates = [...this.state.candidates]
		for(var i=0; i<candidateList.length; i++){
			candidates.push({
				contestId: this.state.contestCount,
				candidateName: candidateList[i].candidateName,
				candidatePlatform: candidateList[i].candidatePlatform,
				voteCount: 0
			})
		}
		this.setState({ candidates })
		
		let contestCount = this.state.contestCount + 1
		this.setState({ contestCount })
		
		this._next()
	}

	/*
		called when the submit button is clicked in step 3
		sends all entered information to the blockchain
	*/
  handleSubmit = async(event) => {
		const closingDate = this.state.election[0].closingDate.getTime()
    let { election, amendments, contests, candidates } = this.state
		
		/*
			the form will not be submitted if an election name is not entered
			amendments will not be sent if the name field is empty
			contests will not be sent if the name field is empty
		*/
		if(election.length && election[0].electionName !== ''){
			election = [{
				electionName: election[0].electionName,
				closingDate: window.web3.utils.toHex(closingDate),
				isClosed: true
			}]
		
			if(amendments.length && amendments[0].amendmentName === ''){
				amendments = []
			}

			if(contests.length && contests[0].contestName === ''){
				contests = []
			}
		
			// passes all data to the blockchain
			await this.state.voterapp.methods.createElection(...election, [...amendments], [...contests], [...candidates])
				.send({ from: this.state.account })
				.on("confirmation", () => {
					window.location.reload() // clears the form if the transaction is successful
				}
			)
		}
  }
  
	/*
		called when the register submit button is clicked
	*/
  registerVoter = async(event) => {
    await this.state.voterapp.methods.registerVoter(this.state.voterId).send({ from: this.state.account })
			.on("confirmation", () => {
				window.location.reload()
			}
		)
  }
	
	isAdmin() {
		if(this.state.account === this.state.admin)
			return true
		return false
	}
	
	render() {
    return (
      <div className="container-med mx-auto">
				<div className="container-fluid mt-5">
					<div className="row">
						<main role="main" className="col-lg-12 d-flex">
							{
								!this.isAdmin() ? 
								<h1>Please switch to an admin account</h1> : 
								<div id="content">
									<div className="form-group">
										<h1>Create Election</h1>
										<p>Step {this.state.currentStep} </p> 

										<form onSubmit={this.handleSubmit}>
										{/* 
											render the form steps and pass required props in
										*/}
											<Step1 
												currentStep={this.state.currentStep}
												setElection={this.setElection}
												nextButton={this.nextButton}
											/>
											<Step2
												currentStep={this.state.currentStep}
												setAmendments={this.setAmendments}
												previousButton={this.previousButton}
											/>
											<Step3 
												currentStep={this.state.currentStep}
												setContests={this.setContests}
												previousButton={this.previousButton}
												handleSubmit={this.handleSubmit}
											/>
										</form>
									</div>
									<div id="electionDetails" className="margin-top">
										<h3>Election Details</h3>
										<table>
										{/* 
											show the entered data in a table before submission
										*/}
											<thead></thead>
												<Election	election={this.state.election}
													electionCount={this.state.electionCount}
												/>
												<Amendment amendments={this.state.amendments} />
												<Contest 
													contests={this.state.contests}
													initialCount={this.state.initialCount}
													candidates={this.state.candidates} />
										</table>
									</div>
									<br /><br />
									<div className="form-group">
										<h1>Register A Voter</h1>
										<form onSubmit={this.registerVoter}>			
										{/* 
											render the form to register a voter
										*/}
											<input
												className="form-control"
												name="voterId"
												onChange={event => this.setState({ voterId: event.target.value })}
												placeholder="Enter Voter Id"
												type="text"
												value={this.state.voterId || ''}
											/>
											<button className="btn btn-primary" type="button" onClick={this.registerVoter}>Register</button>
										</form>
									</div>
								</div>
						  }
						</main>
					</div>
				</div>
      </div>  
    )
  }
}

/*
	loads form input fields for step 1: election name and date
*/
function Step1(props) {
  if (props.currentStep !== 1) {
    return null
  }
	const [electionName, setElectionName] = useState('')
	const [closingDate, setclosingDate] = useState(new Date())
	
  // handle input change
  const handleInputEvent = (event) => {
    setElectionName(event.target.value)
  }

  const handleDateChange = (date) => {
    setclosingDate(date)
  }
	
	// handle click event of the Next button
	const handleNextEvent = () => {
		props.setElection(electionName, closingDate)
	}
	
	return(
		<div>
			<div className="row g-2">
				<label htmlFor="election" className="">Election Name</label>
				<input
					className="form-control"
					id="electionName"
					name="electionName"
					type="text"
					placeholder="Enter Election Name"
					value={electionName || ''}
					onChange={handleInputEvent}
				/>
				<label htmlFor="election" className="">Closing Date:</label>
				<DatePicker
					selected={ closingDate }
					onChange={ handleDateChange }
					name="closingDate"
					dateFormat="MM/dd/yyyy"
				/>
				<button 
					className="btn btn-primary float-right" 
					type="button" onClick={handleNextEvent}>Next
				</button>
			</div>
		</div>
  )
}

/*
	loads form input fields for step 2: amendment name and description
*/
function Step2(props) {
  if (props.currentStep !== 2) {
    return null
  }
	const [amendmentList, setAmendmentList] = useState([{ amendmentName: '', amendmentDescription: '' }])

  // handle input change
  const handleInputChange = (event, index) => {
    const { name, value } = event.target
    const list = [...amendmentList]
    list[index][name] = value
    setAmendmentList(list)
  }
	
	// handle click event of the Next button
	const handleNextEvent = () => {
		props.setAmendments(amendmentList)
	}

  // handle click event of the Remove button
  const handleRemoveClick = index => {
    const list = [...amendmentList]
    list.splice(index, 1)
    setAmendmentList(list)
  }

  // handle click event of the Add button
  const handleAddClick = () => {
    setAmendmentList([...amendmentList, { amendmentName: '', amendmentDescription: '' }])
  }
	
  return (
    <div className="addAmendment">
      <label htmlFor="amendment">Amendment Information</label>
      {amendmentList.map((amendment, key) => {
        return (
          <div key={key} className="box">
            <input
							className="form-control"
							name="amendmentName"
              onChange={event => handleInputChange(event, key)}
			  			placeholder="Enter Amendment Name"
							type="text"
              value={amendment.amendmentName || ''}
            />
            <textarea
							className="form-control"
              name="amendmentDescription"
              onChange={event => handleInputChange(event, key)}
			  			placeholder="Enter Amendment Description"
              value={amendment.amendmentDescription || ''}
            />
            <div className="btn-box gap-2">
              {amendmentList.length !== 1 && <button className="mr10"
                onClick={() => handleRemoveClick(key)}>Remove</button>}
              {amendmentList.length - 1 === key && <button onClick={handleAddClick}>Add</button>}
            </div>
          </div>
        )
      })}
			<br />
			{props.previousButton()}
			<button 
				className="btn btn-primary float-right" 
				type="button" onClick={handleNextEvent}>Next
			</button>
    </div>
  )
}

/*
	loads form input fields for step 3: contest name, candidate name and platform
*/
function Step3(props) {
  if (props.currentStep < 3) {
    return null
  }
	const [contestName, setContestName] = useState('')
  const [candidateList, setCandidateList] = useState([{ candidateName: '', candidatePlatform: '' }])
	
  // handle contest input change
	const handleContestInput = (event) => {
		setContestName(event.target.value)
	}

  // passes contest and candidate input to the contest array
	const handleSaveEvent = () => {
		props.setContests(contestName, candidateList)
		setContestName('')
		setCandidateList([{ candidateName: '', candidatePlatform: '' }])
	}

  // handle candidate input change
  const handleCandidateInput = (event, index) => {
    const { name, value } = event.target
    const list = [...candidateList]
    list[index][name] = value
    setCandidateList(list)
  }

  // handle click event of the Remove button
  const handleRemoveClick = index => {
    const list = [...candidateList]
    list.splice(index, 1)
    setCandidateList(list)
  }

  // handle click event of the Add button
  const handleAddClick = () => {
    setCandidateList([...candidateList, { candidateName: '', candidatePlatform: '' }])
  }
	
	return(
		<div>
			<div key={props.currentStep} className="form-group">
				<label htmlFor="contest">Contest {props.currentStep-2} Information</label>
				<input
					className="form-control"
					id="contestName"
					name="contestName"
					type="text"
					placeholder="Enter Contest Name"
					value={contestName || ''}
					onChange={handleContestInput}
				/>
				{ addCandidates() }
				{ props.previousButton() }
				<button 
					className="btn btn-primary float-right" 
					type="button" onClick={handleSaveEvent}>Save
				</button>
			</div>
		</div>
	)

	/*
		adds any number of candidates to the current contest
	*/
	function addCandidates() {
		return (
			<div className="addCandidate">
				<label htmlFor="candidate">Candidate Information</label>
				{candidateList.map((candidate, key) => {
					return (
						<div key={key} className="box">
							<input
								className="form-control"
								id="candidateName"
								name="candidateName"
								onChange={event => handleCandidateInput(event, key)}
								placeholder="Enter Candidate Name"
								type="text"
								value={candidate.candidateName || ''}
							/>
							<textarea
								className="form-control"
								id="candidatePlatform"
								name="candidatePlatform"
								onChange={event => handleCandidateInput(event, key)}
								placeholder="Enter Candidate Platform"
								value={candidate.candidatePlatform || ''}
							/>
							<div className="btn-box">
								{candidateList.length !== 1 && <button
									className="mr10"
									onClick={() => handleRemoveClick(key)}>Remove</button>}
								{candidateList.length - 1 === key && <button onClick={handleAddClick}>Add</button>}
							</div>
						</div>
					)
				})}
			<button className="btn btn-success float-right" type="button" onClick={props.handleSubmit}>Submit</button>  
			</div>
		)
	}
}


/*
	Displays the election details being entered in the 'create election' form
*/
function Election(props) {
	if(props.election !== undefined){
		return (
			<tbody>
				{props.election.map((e, key) => {
					return(
				 		<Fragment>
							<tr className="bgcolor-election">
								<th scope="col">Election #</th>
								<th scope="col">Name</th>
								<th scope="col">Date</th>
								<th scope="col">Closed</th>
							</tr>
							<tr key={key}>
								<td>{props.electionCount.toNumber()}</td>
								<td>{e.electionName}</td>
								<td>{e.closingDate.toDateString()}</td>
								<td>{e.isClosed.toString()}</td>
							</tr>
						</Fragment>
					)
				})}
			</tbody>
		)
	}
}

function Amendment(props) {
	return (
		<tbody>
			{props.amendments.map((amendment, index) => {
				return(
			 		<Fragment>
						<tr className="bgcolor-amendment">
							<th scope="col">Election #</th>
							<th scope="col">Amendment #</th>
							<th scope="col">Amendment Name</th>
							<th scope="col">Amendment Description</th>
						</tr>
						<tr key={index}>
							<td>{amendment.electionId}</td>
							<td>{index}</td>
							<td>{amendment.amendmentName}</td>
							<td>{amendment.amendmentDescription}</td>
						</tr>
					</Fragment>
				)
			})}
		</tbody>
	)
}

function Contest(props) {
	return(
		<tbody>
			{props.contests.map((contest, index) => {
				return(
			 		<Fragment key={index}>
						<tr className="bgcolor-contest">
							<th scope="col">Election #</th>
							<th scope="col">Contest #</th>
							<th scope="col">Contest Name</th>
			 				<th></th>
						</tr>
						<tr>
							<td>{contest.electionId}</td>
							<td>{index+props.initialCount}</td>
							<td>{contest.contestName}</td>
						</tr>
						<tr className="bgcolor-candidate">
							<th scope="col">Contest #</th>
							<th scope="col">Candidate #</th>
							<th scope="col">Candidate Name</th>
							<th scope="col">Candidate Platform</th>
						</tr>
						{props.candidates.filter(candidate => candidate.contestId === index+props.initialCount).map((candidate, i) => {
							return(
								<Fragment key={i}>
									<tr>
										<td>{index+props.initialCount}</td>
										<td>{i}</td>
										<td>{candidate.candidateName}</td>
										<td>{candidate.candidatePlatform}</td>
									</tr>
								</Fragment>
							)
						})}
					</Fragment>
				)
			})}
		</tbody>
	)
}

export default Admin
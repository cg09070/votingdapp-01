import React, { Component } from 'react';
import { Bar } from 'react-chartjs-2';

class Votechart extends Component {
	constructor(props){
		super(props);
		this.state = {
			labels: [],
			data: [0]
		}
	}
	
	componentDidUpdate() {
		if(this.props.openElection.length){
			setInterval(() => {
				this.setData()
			}, 10000);
		}
	}
	
	setData() {
		if(this.props.openElection.length){
			let names = [];
			let votes = [];
			for(var i=0; i<this.props.openAmendments.length; i++){
				names.push(this.props.openAmendments[i].amendmentName)
				votes.push(this.props.openAmendments[i].votesFor)
			}

			for(var i=0; i<this.props.openCandidates.length; i++){
				names.push(this.props.openCandidates[i].candidateName)
				votes.push(this.props.openCandidates[i].voteCount)
			}
			
			let text = this.props.openElection[0].electionName + " (ends " + new Date(window.web3.utils.hexToNumber(this.props.openElection[0].closingDate)).toDateString() + ")"
			this.setState({
				text: text,
				labels: [...names],
				data: [...votes]
			})
		}
	}
	
  render() {
		const state = {
			labels: [...this.state.labels],
    
			datasets: [
				{
					label: 'votes',
					backgroundColor: [
						'rgba(255, 99, 132, 0.2)',
						'rgba(54, 162, 235, 0.2)',
						'rgba(255, 206, 86, 0.2)',
						'rgba(75, 192, 192, 0.2)',
						'rgba(153, 102, 255, 0.2)',
						'rgba(255, 159, 64, 0.2)',
					],
					borderColor: [
						'rgba(255, 99, 132, 1)',
						'rgba(54, 162, 235, 1)',
						'rgba(255, 206, 86, 1)',
						'rgba(75, 192, 192, 1)',
						'rgba(153, 102, 255, 1)',
						'rgba(255, 159, 64, 1)',
					],
					borderWidth: 1,
					data: [...this.state.data]
				}
			]
		}
		
    return (
      <div>
        <Bar
          data={state}
          options={{
            title:{
              display:true,
              text: this.state.text || "updating...",
              fontSize:20
            },
						scales: {
							yAxes: [
								{
									ticks: {
										beginAtZero: true,
										stepSize: 1
									},
								},
							],
						},
						colorSet: "colorSet1",
            legend:{
              display:false,
              position:'right'
            }
          }}
        />
      </div>
    );
  }
}

export default Votechart;
import React, {Component} from 'react';
import resultpic from '../result.png'
import voterpic from '../voter.png'

//View Results link and Vote Here link
class Home extends Component {	
	render() {
    return (
			<div className="container">
				<div className="container-fluid mt-5">
					<div className="row">
						<main ref={this.inputRef} role="main" className="col-lg-12 d-flex">
							<table className="text-center">
								<tbody>
									<tr>
										<td><a href='/result'><img src={resultpic} alt="View Results" /></a></td>
										<td><a href='/vote'><img src={voterpic} alt="Vote Here" /></a></td>
									</tr>
								</tbody>
							</table>
						</main>
					</div>
				</div>
			</div>
    );
  }
}

export default Home;

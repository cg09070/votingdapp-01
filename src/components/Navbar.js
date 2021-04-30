import React, { Component } from 'react';

// Navigation Bar
class Navbar extends Component {
	
	render() {
		return (
			<nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
      	<a
        	className="navbar-brand col-sm-3 col-md-2 mr-0"
          href="http://localhost:3000"
          rel="noopener noreferrer"
        >
        	Blockchain Voting Application
        </a>
				<ul className="navbar-nav px-3">
					<li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
						<a className="link-light" href='/admin'>Admin login</a>
					</li>
				</ul>
      </nav>
		)
	}
}

export default Navbar;
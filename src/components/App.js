import React, {Component} from 'react';
import { BrowserRouter, Route } from 'react-router-dom'
import './App.css';
import Navbar from './Navbar';
import Home from './Home'
import Admin from './Admin'
import Result from './Result'
import Vote from './Vote'

// Sets the target location for links
class App extends Component {	
	render() {
    return (
			<BrowserRouter basepath="/voterApp">
					<Navbar />
					<Route path='/' component={Home} />
					<Route path='/admin' component={Admin} />
					<Route path='/result' component={Result} />
					<Route path='/vote' component={Vote} />
			</BrowserRouter>
    );
  }
}

export default App;

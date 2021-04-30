# votingdapp-01
Development of a blockchain voting application. This application was initially created using the following YouTube tutorial from [dappuniversity](https://www.youtube.com/watch?v=VH9Q2lf2mNo&ab_channel=DappUniversity)

Before downloading this application, please ensure you have the following software installed:

1. [git](https://git-scm.com/)
2. [npm](https://www.npmjs.com/)
3. [truffle](https://www.trufflesuite.com/truffle)
4. [ganache](https://www.trufflesuite.com/ganache)
5. [metamask](https://metamask.io/)

and one of the browsers supported by Metamask. Development was done using Google Chrome and is the suggested browser.

To initialize this application on your local blockchain, from the command line

1. clone the repository: git clone https://github.com/cg09070/votingdapp-01.git
2. move inside folder: cd votingdapp-01
3. run install command: npm install
4. run Ganache on your computer and create a new Ethereum workspace.
5. Give it a desired name and add project by navigating to truffle-config.js in the project folder
6. on the server tab, change the port to 8545 and click save workspace
7. from the command line run: truffle migrate
8. from the command line run: npm start

At this point the web browser will open the application at http://localhost:3000. you should see the site homepage.

![homepage screenshot](https://github.com/cg09070/votingdapp-01/blob/main/home.jpg?raw=true)

Finally, import the first Ganache account to Metamask to access the admin, vote, and results pages.

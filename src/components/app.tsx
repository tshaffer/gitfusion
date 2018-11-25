import {
  remote,
} from 'electron';

import { isNil } from 'lodash';

import * as React from 'react';
import * as path from "path";

import * as simplegit from 'simple-git/promise';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import RaisedButton from 'material-ui/RaisedButton';
import {List, ListItem} from 'material-ui/List';
import Checkbox from 'material-ui/Checkbox';

const styles = {
  block: {
    maxWidth: 250,
  },
  checkbox: {
    marginBottom: 2,
    marginTop: 0,
    paddingBottom: 2,
    paddingTop: 0,
    top: 0,
  },
  listItem: {
    marginBottom: 4,
    marginTop: 4,
    paddingBottom: 4,
    paddingTop: 4,
    paddingLeft: 42,
  },
  lineStyle: {
    strokeWidth: '2',
    stroke: 'red'
  },
  labelStyle: {
    topMargin: '4px'
  }
};

import {
  ListLogLine, CommitsByHash, CommitOnBranches, ListLogSummary,
} from '../gitInterfaces';

let git: any = null;
let commitsByHash: CommitsByHash = {};

export default class App extends React.Component<any, object> {

  state: any;
// let sortedCommits: CommitOnBranches[] = [];

  constructor(props: any) {
    super(props);

    this.state = {
      repoName: 'bacon',
      repoPath: '',
      localBranches: [],
      sortedCommits: [],
    };

    this.handleBrowse = this.handleBrowse.bind(this);
    this.updateCheck = this.updateCheck.bind(this);
  }

  handleBrowse = () => {

    const dialog: any = remote.dialog;
    dialog.showOpenDialog({
      defaultPath: '/Users/tedshaffer/Documents/Projects',
      properties: [
        'openDirectory',
      ]
    }, (selectedPaths: string[]) => {
      if (!isNil(selectedPaths) && selectedPaths.length === 1) {

        const repoPath = selectedPaths[0];
        const repoName = path.basename(repoPath);

        this.setState({
          repoPath,
          repoName,
        });

        // TODO - check for error return
        git = simplegit(repoPath);
        git.status().then((status: any) => {
          console.log(status);
        });
        git.branch(['-r']).then((branchResults: any) => {
          console.log(branchResults);
        });

        git.branchLocal().then((localBranchResults: any) => {
          
          console.log(localBranchResults);
          const localBranches: any[] = [];

          for (const branchName in localBranchResults.branches) {
            if (localBranchResults.branches.hasOwnProperty(branchName)) {
              const localBranch: any = localBranchResults.branches[branchName];
              localBranches.push( {
                display: false,
                name: localBranch.name,
                current: localBranch.current,
              });
            }
          }

          this.setState( {
            localBranches
          });
        });
      }
    });
  }

  gitCheckoutBranch(branchName: string): Promise<void> {

    return git.checkout(branchName);
  
  }

  gitGetBranchCommitHistory(localBranches: any[], branchName: string): Promise<void> {

    return new Promise((resolve, reject) => {

      git.log(['--max-count=10']).then( (commitsSummary: ListLogSummary) => {
          
        console.log(commitsSummary);
  
        commitsSummary.all.forEach( (commit: ListLogLine) => {
  
          let commitOnBranches: CommitOnBranches;
  
          if (commitsByHash.hasOwnProperty(commit.hash)) {
            commitOnBranches = commitsByHash[commit.hash];
            const branchNames = commitOnBranches.branchNames;
            branchNames.push(branchName);
  
            // TODO - use cool es6 stuff. spread or object.assign
            commitOnBranches.branchNames = branchNames;
            commitsByHash[commit.hash] = commitOnBranches;
          }
          else {
            commitOnBranches = {
              branchNames: [branchName],
              commitData: commit
            };
            commitsByHash[commit.hash] = commitOnBranches;
          }
  
        });
        const sortedCommits = this.resortCommits();
        this.setState({
          localBranches,
          sortedCommits
        });

        Promise.resolve(1);
      });
    });
}


  updateCheck(event: any, isInputChecked: boolean) {

    const index: number = Number(event.target.id);

    const localBranches: any[] = this.state.localBranches;
    const selectedBranch: any = localBranches[index];
    selectedBranch.display = !selectedBranch.display;

    const branchName = selectedBranch.name;

    if (selectedBranch.display) {

      console.log('checkout branch: ', branchName);

      this.gitCheckoutBranch(branchName)
        .then( () => {
          return this.gitGetBranchCommitHistory(localBranches, branchName);
        })
        .then( () => {
          console.log('Update branch commit history complete');
        });
    }
    else {

      Object.keys(commitsByHash).forEach( (commitHash: string) => {
        if (commitsByHash.hasOwnProperty(commitHash)) {
          const commit: CommitOnBranches = commitsByHash[commitHash];
          const commitBranches: string[] = commit.branchNames;
          const indexOfBranchName = commitBranches.indexOf(branchName);
          if (indexOfBranchName >= 0) {
            commitBranches.splice(indexOfBranchName, 1);
            if (commitBranches.length === 0) {
              // reference count down to zero; remove commit
              delete commitsByHash[commitHash];
            }
          }
        }
      });

      const sortedCommits: CommitOnBranches[] = this.resortCommits();
      this.setState({
        localBranches,
        sortedCommits,
      });
    }
  }

  // sort commits in preparation for render
  // for now, assume that we want to display everything in commitsByHash
  resortCommits(): CommitOnBranches[] {

    const hashes: string[] = Object.keys(commitsByHash);
    const sortedCommits: CommitOnBranches[] = hashes.map( (hash) => {
      return commitsByHash[hash];
    });

    sortedCommits.sort( (a, b) => {
      const aDate: Date = new Date(a.commitData.date);
      const bDate: Date = new Date(b.commitData.date);
      return bDate.valueOf() - aDate.valueOf();
    });

    console.log(sortedCommits);

    return sortedCommits;
  }

  getListItem(localBranch: any, index: number) {
    return (
      <ListItem
        key={index}
        leftCheckbox={
          <Checkbox
            id={index.toString()}
            checked={localBranch.display}
            onCheck={this.updateCheck}
            style={styles.checkbox}
          />
        }
        primaryText={localBranch.name}
        style={styles.listItem}
      />
    );
  }

  getCommitListItem(commit: CommitOnBranches, index: number) {
    return (
      <ListItem
        key={index}
        primaryText={commit.commitData.message}
        style={styles.listItem}
      />
    );
  }

  render() {

    const localBranches = this.state.localBranches.map( (localBranch: any, index: number) => {
      return this.getListItem(localBranch, index);
    });

    const commits = this.state.sortedCommits.map( (commit: CommitOnBranches, index: number) => {
      return this.getCommitListItem(commit, index);
    });

    return (
      <MuiThemeProvider>
        <div>
          <div>
            <RaisedButton label='Browse' onClick={this.handleBrowse} />
            <br/>
            <p>Repo: <span style={styles.labelStyle}>{this.state.repoName}</span></p>
            <List>
              <ListItem
                primaryText="Local Branches"
                initiallyOpen={true}
                primaryTogglesNestedList={true}
                nestedItems={localBranches}>
              </ListItem>
            </List>
            <List>
              {commits}
            </List>
          </div>
          <div>
            <svg height="210" width="500">
              <line x1="0" y1="0" x2="200" y2="200" style={styles.lineStyle} />
            </svg>
          </div>
        </div>
      </MuiThemeProvider>
    );
  }
}

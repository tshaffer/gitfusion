import {
  remote,
} from 'electron';

import { isNil } from 'lodash';

import * as React from 'react';
import * as path from "path";

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import RaisedButton from 'material-ui/RaisedButton';
import { List, ListItem } from 'material-ui/List';
import Checkbox from 'material-ui/Checkbox';

import {
  cd,
  gitCheckout,
  gitStatus,
  shellInit,
  getLocalBranches,
  getBranchCommits,
} from '../gitInterface';

import {
  BranchCommits,
  Commit,
  CommitOnBranches,
  CommitsByHash, 
  LocalBranch,
  LocalBranches,
} from '../gitInterfaces';

// “width: 100px; float:left;”

// https://v0.material-ui.com/#/
// https://material-ui.com/api/list-item/
// https://material-ui.com/customization/overrides/#overriding-with-classes
// https://www.w3schools.com/css/tryit.asp?filename=trycss_position_absolute
// document.body.style.height = '100%';

const styles = {
  leftDiv: {
    width: '100px',
    height: '100%',
    float: 'left',
    // backgroundColor: '#475'
  },
  rightDiv: {
    marginLeft: '110px'
  },
  topAbsolute: {
    position: 'absolute',
    right: '0',
    width: '200px',
    height: '100px'
  },
  bottomAbsolute: {
    position: 'absolute',
    right: '0',
    width: '200px',
    height: '100px'
  },
  topDiv: {
    display: 'block',
    width: '100%',
    height: '50%',
  },
  commitDetail: {
    display: 'block',
    width: '100%',
    height: '50%',
    // backgroundColor: '#475',
    // overflow: 'scroll'
  },
  block: {
    maxWidth: 250,
  },
  lineStyle: {
    strokeWidth: '2',
    stroke: 'red'
  },
  superListItem: {
    margin: '0px',
    padding: '0px'
  },
  checkbox: {
    left: 2,
    marginBottom: 2,
    marginTop: 0,
    paddingBottom: 2,
    paddingTop: 0,
    top: 0,
  },
  listItem: {
    marginBottom: 4,
    marginTop: 6,
    paddingBottom: 4,
    paddingTop: 4,
    paddingLeft: 26,
  },
  listStyle: {
    padding: 0,
  },
  textSmall: {
    // fontStyle: 'italic',
    fontSize: '13px',
    fontFamily: 'sans-serif'
  },
  tightParagraph: {
    marginTop: '4px',
    marginBottom: '4px'
  }
};

// TODO - add to state?
let commitsByHash: CommitsByHash = {};

interface AppState {
  repoName: string;
  repoPath: string; // TODO - may not be required as a state variable
  localBranches: LocalBranches;
  sortedCommits: any[];
  selectedCommit: CommitOnBranches;
}

export default class App extends React.Component<any, object> {

  state: AppState;

  constructor(props: any) {
    super(props);

    shellInit();

    this.state = {
      repoName: '',
      repoPath: '',
      localBranches: {
        currentBranch: null,
        branches: [],
      },
      sortedCommits: [],
      selectedCommit: null,
    };

    this.handleBrowse = this.handleBrowse.bind(this);
    this.handleSelectBranch = this.handleSelectBranch.bind(this);
    this.selectCommit = this.selectCommit.bind(this);
    this.getSelectedCommitDetail = this.getSelectedCommitDetail.bind(this);

  }

  componentDidMount() {
    this.onSelectRepo('/Users/tedshaffer/Documents/Projects/fb24-0/bacon');
  }

  onSelectRepo(repoPath: string) {
    const repoName = path.basename(repoPath);

    // TODO - check for error return
    cd(repoPath);

    const status = gitStatus();

    const localBranches: LocalBranches = getLocalBranches();

    this.setState({
      repoPath,
      repoName,
      localBranches
    });
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
        this.onSelectRepo(selectedPaths[0]);
      }
    });
  }

  mergeBranchCommits(branchName: string, branchCommits: BranchCommits) {
    
    branchCommits.commits.forEach((commit: Commit) => {
      let commitOnBranches: CommitOnBranches;
      if (commitsByHash.hasOwnProperty(commit.hash)) {
        commitOnBranches = commitsByHash[commit.hash];
        const branchNames = commitOnBranches.branchNames;
        branchNames.push(branchName);
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
      sortedCommits
    });
  }

  removeBranchCommits(branchName: string) {
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
      sortedCommits,
    });
  }

  handleSelectBranch(event: any, isInputChecked: boolean) {

    const index: number = Number(event.target.id);

    const localBranches: LocalBranches = this.state.localBranches;
    const selectedBranch: LocalBranch = localBranches.branches[index];
    selectedBranch.display = !selectedBranch.display;

    const branchName = selectedBranch.name;

    if (selectedBranch.display) {
      gitCheckout(branchName);
      const branchCommits: BranchCommits = getBranchCommits();
      this.mergeBranchCommits(branchName, branchCommits);
    }
    else {
      this.removeBranchCommits(branchName);
    }
  }

  // sort commits in preparation for render
  // for now, assume that we want to display everything in commitsByHash
  resortCommits(): CommitOnBranches[] {

    const hashes: string[] = Object.keys(commitsByHash);
    const sortedCommits: CommitOnBranches[] = hashes.map((hash) => {
      return commitsByHash[hash];
    });

    sortedCommits.sort((a, b) => {
      const aDate: Date = new Date(a.commitData.commitDate);
      const bDate: Date = new Date(b.commitData.commitDate);
      return bDate.valueOf() - aDate.valueOf();
    });

    console.log(sortedCommits);

    return sortedCommits;
  }

  getListItem(localBranch: LocalBranch, index: number) {
    return (
      <ListItem
        key={index}
        leftCheckbox={
          <Checkbox
            id={index.toString()}
            checked={localBranch.display}
            onCheck={this.handleSelectBranch}
            style={styles.checkbox}
          />
        }
        primaryText={localBranch.name}
        style={styles.listItem}
      />
    );
  }

  selectCommit(commit: CommitOnBranches, thisArg: any) {
    console.log(this);
    console.log(commit);
    console.log(thisArg);
    this.setState( {
      selectedCommit: commit,
    });
  }

  getSelectedCommitDetail(): any {
    console.log(this);
    console.log(this.state);

    if (isNil(this.state.selectedCommit)) {
      return null;
    }

    const commitData: Commit = this.state.selectedCommit.commitData;
    const { author, commitDate, hash, message, parentHashes } = commitData;
    return (
      <div>
        <p>{author}</p>
        <p>{commitDate}</p>
        <p>{message}</p>
        <p>{hash}</p>
        <p>{parentHashes}</p>
      </div>
    )
  }

  getCommitListItem(commit: CommitOnBranches, index: number) {
    return (
      <ListItem
        key={index}
        id={index.toString()}
        primaryText={commit.commitData.message}
        style={styles.listItem}
        onClick={this.selectCommit.bind(this, commit)}
      />
    );
  }

  render() {

    const localBranches = this.state.localBranches.branches.map((localBranch: any, index: number) => {
      return this.getListItem(localBranch, index);
    });

    const commits = this.state.sortedCommits.map((commit: CommitOnBranches, index: number) => {
      return this.getCommitListItem(commit, index);
    });

    const commitDetail = this.getSelectedCommitDetail();

    return (
      <MuiThemeProvider>
        <div>
          <div style={styles.leftDiv}>
            <svg height="400" width="100">
              <line x1="0" y1="0" x2="100" y2="400" style={styles.lineStyle} />
            </svg>
          </div>
          <div style={styles.rightDiv}>
          <div>
            <RaisedButton label='Browse' onClick={this.handleBrowse} />
            <br />
            <p style={styles.tightParagraph}>Repo: {this.state.repoName}</p>
            <p style={styles.tightParagraph}>Location: {this.state.repoPath}</p>
            <List style={styles.listStyle}>
              <ListItem
                primaryText="Local Branches"
                initiallyOpen={true}
                primaryTogglesNestedList={true}
                nestedItems={localBranches}
                style={styles.superListItem}>
              </ListItem>
            </List>
            <List>
              {commits}
            </List>
          </div>
          <div style={styles.commitDetail}>
            <h3>Commit Detail</h3>
            {commitDetail}
          </div>
          </div>
        </div>
      </MuiThemeProvider>
    );
  }
}

/* SVG stuff
          <div>
            <svg height="210" width="500">
              <line x1="0" y1="0" x2="200" y2="200" style={styles.lineStyle} />
              <text
                style={styles.textSmall}
                x="50" 
                y="55"
              >
                Example Text 0
              </text>
              <text
                style={styles.textSmall}
                x="50" 
                y="75"
              >
                Example Text 1
              </text>
            </svg>
          </div>
*/


import {
  remote,
} from 'electron';

import { isNil } from 'lodash';

import * as dateformat from 'dateformat';

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
} from '../gitInterfaces';

// “width: 100px; float:left;”

// https://v0.material-ui.com/#/
// https://material-ui.com/api/list-item/
// https://material-ui.com/customization/overrides/#overriding-with-classes
// https://www.w3schools.com/css/tryit.asp?filename=trycss_position_absolute
// document.body.style.height = '100%';

const styles = {
  rootDiv: {
    width: '100%',
    height: '100%'
  },
  leftDiv: {
    width: '100px',
    height: '100%',
    float: 'left',
    backgroundColor: '#475'
  },
  rightDiv: {
    marginLeft: '110px',
    height: '100%'
  },
  commitList: {
    display: 'block',
    width: '100%',
    height: '70%',
  },
  summaryType: {
    width: '128px'
  },
  summaryValue: {
    width: '900px'
  },
  commitSubject: {
    width: '800px'
  },
  commitAuthor: {
    width: '200px'
  },
  commitDate: {
    width: '300px',
  },
  commitDetail: {
    display: 'block',
    width: '100%',
    height: '30%',
    // backgroundColor: '#475',
    // overflowY: 'scroll'
  },
  commitDetailItem: {
    marginTop: '4px',
    marginBottom: '0px',
  },
  commitLabel: {
    width: '64px'
  },
  svgLineStyle: {
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
  tightParagraph: {
    marginTop: '4px',
    marginBottom: '4px'
  },
  svgTextSmall: {
    // fontStyle: 'italic',
    fontSize: '13px',
    fontFamily: 'sans-serif'
  },
  svgSelectedBranchColor: {
    fill: 'red'
  },
  svgUnselectedBranchColor: {
    fill: 'gray'
  },
  svgCircle: {
    r: 5,
    stroke: 'black',
    strokeWidth: '3',
    // fill: 'red'
  }
};

// TODO - add to state?
let commitsByHash: CommitsByHash = {};

interface AppState {
  repoName: string;
  repoPath: string; // TODO - may not be required as a state variable
  currentBranch: string;
  localBranches: LocalBranch[];
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
      currentBranch: '',
      localBranches: [],
      sortedCommits: [],
      selectedCommit: null,
    };

    this.handleBrowse = this.handleBrowse.bind(this);
    this.handleSelectBranch = this.handleSelectBranch.bind(this);
    this.handleSelectCommit = this.handleSelectCommit.bind(this);
    this.getSelectedCommitDetail = this.getSelectedCommitDetail.bind(this);

  }

  componentDidMount() {
    const currentBranch: string = this.onSelectRepo('/Users/tedshaffer/Documents/Projects/fb24-0/bacon');
    const branchCommits: BranchCommits = getBranchCommits();
    this.mergeBranchCommits(currentBranch, branchCommits);
  }

  onSelectRepo(repoPath: string): string {
    const repoName = path.basename(repoPath);

    // TODO - check for error return
    cd(repoPath);
    const status = gitStatus();
    const tmp = status.split('On branch ');
    const currentBranch = tmp[1].split('\n')[0];

    const localBranches: LocalBranch[] = getLocalBranches();

    this.setState({
      repoPath,
      repoName,
      currentBranch,
      localBranches
    });

    return currentBranch;
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

    const sortedCommits = this.reSortCommits();
    this.setState({
      sortedCommits
    });
  }

  removeBranchCommits(branchName: string) {
    Object.keys(commitsByHash).forEach((commitHash: string) => {
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

    const sortedCommits: CommitOnBranches[] = this.reSortCommits();
    this.setState({
      sortedCommits,
    });
  }

  handleSelectBranch(event: any, isInputChecked: boolean) {

    const index: number = Number(event.target.id);

    const localBranches: LocalBranch[] = this.state.localBranches;
    const selectedBranch: LocalBranch = localBranches[index];
    selectedBranch.display = !selectedBranch.display;

    const branchName = selectedBranch.name;

    if (selectedBranch.display) {
      gitCheckout(branchName);
      const branchCommits: BranchCommits = getBranchCommits();
      this.mergeBranchCommits(branchName, branchCommits);
      gitCheckout(this.state.currentBranch);
    }
    else {
      this.removeBranchCommits(branchName);
    }
  }

  // sort commits in preparation for render
  // for now, assume that we want to display everything in commitsByHash
  reSortCommits(): CommitOnBranches[] {

    const hashes: string[] = Object.keys(commitsByHash);
    const sortedCommits: CommitOnBranches[] = hashes.map((hash) => {
      return commitsByHash[hash];
    });

    sortedCommits.sort((a, b) => {
      return b.commitData.commitDate.valueOf() - a.commitData.commitDate.valueOf();
    });

    console.log(sortedCommits);

    return sortedCommits;
  }

  handleSelectCommit(commit: CommitOnBranches, thisArg: any) {
    this.setState({
      selectedCommit: commit,
    });
  }

  getStatusSummary() {

    const currentBranchName: string =
      isNil(this.state.currentBranch) ? '' : this.state.currentBranch;

    return (
      <table>
        <tbody>
          <tr style={styles.tightParagraph}>
            <td style={styles.summaryType}>Repo:</td>
            <td style={styles.summaryValue}>{this.state.repoName}</td>
          </tr>
          <tr style={styles.tightParagraph}>
            <td style={styles.summaryType}>Location:</td>
            <td style={styles.summaryValue}>{this.state.repoPath}</td>
          </tr>
          <tr style={styles.tightParagraph}>
            <td style={styles.summaryType}>Current branch:</td>
            <td style={styles.summaryValue}>{currentBranchName}</td>
          </tr>
        </tbody>
      </table>
    );
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

  getCommitSummaryRow(commit: CommitOnBranches, index: number) {
    return (
      <tr
        onClick={this.handleSelectCommit.bind(this, commit)}>
        <td style={styles.commitSubject}>{commit.commitData.subject}</td>
        <td style={styles.commitAuthor}>{commit.commitData.author}</td>
        <td style={styles.commitDate}>{dateformat(commit.commitData.commitDate, 'shortDate')}</td>
      </tr>
    );
  }

  getCommits(): any {

    const commitRows = this.state.sortedCommits.map((commit: CommitOnBranches, index: number) => {
      return this.getCommitSummaryRow(commit, index);
    });

    return (
      <table>
        <tbody>{commitRows}</tbody>
      </table>
    );
  }

  getSelectedCommitDetail(): any {

    if (isNil(this.state.selectedCommit)) {
      return null;
    }

    const commitData: Commit = this.state.selectedCommit.commitData;
    const { author, commitDate, hash, message, parentHashes } = commitData;
    const formattedDate = dateformat(commitDate, 'm/d/yy "at" hh:MM tt');

    return (
      <table>
        <tbody>
          <tr>
            <td style={styles.commitLabel}>Author</td>
            <td>{author}</td>
          </tr>
          <tr>
            <td style={styles.commitLabel}>Date</td>
            <td>{formattedDate}</td>
          </tr>
          <tr>
            <td style={styles.commitLabel}>Message</td>
            <td>{message}</td>
          </tr>
          <tr>
            <td style={styles.commitLabel}>Hash</td>
            <td>{hash}</td>
          </tr>
          <tr>
            <td style={styles.commitLabel}>Parents</td>
            <td>{parentHashes}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  getCommitLine(x1: number, y1: number, x2: number, y2: number): any {
    return (
      <line x1={x1} y1={y1} x2={x2} y2={y2} style={styles.svgLineStyle} />
    );
  }

  // xCoordinateByBranch

  getBranchNamesKey(branchNames: string[]): string {
    let branchNamesKey = '';
    branchNames.forEach((branchName) => {
      branchNamesKey = branchNamesKey + ':' + branchName;
    })
    return branchNamesKey;
  }

  getCommitIndicator(x: number, y: number, commitIndicatorStyle: any) {
    const circleStyle: any = Object.assign({}, styles.svgCircle, commitIndicatorStyle);
    return (
      <circle cx={x} cy={y} r="5px" style={circleStyle} />
    );
  }

  getCommitsGraph(): any[] {

    const currentBranchX = 80;
    let lastBranchX = currentBranchX;
    const branchXDelta = 24;

    const commitStartingY = 70;
    let yCoordinate = commitStartingY;
    const commitYDelta = 23;

    if (isNil(this.state.currentBranch)) {
      return [];
    }

    const currentBranchName = this.state.currentBranch;

    const xCoordinateByBranchName: any = {};

    const currentBranchStyle = styles.svgSelectedBranchColor;
    const nonCurrentBranchStyle = styles.svgUnselectedBranchColor;
    let commitIndicatorStyle: any;

    let xCoordinate: number;
    const commitDataByHash: any = {};

    this.state.sortedCommits.map((commit: CommitOnBranches, index: number) => {
      const branchNames = commit.branchNames;
      const i = branchNames.indexOf(currentBranchName);
      if (i >= 0 && branchNames[i] === currentBranchName) {
        xCoordinate = currentBranchX;
        commitIndicatorStyle = currentBranchStyle;
      }
      else {
        const branchNamesKey = this.getBranchNamesKey(branchNames);
        if (!xCoordinateByBranchName.hasOwnProperty(branchNamesKey)) {
          lastBranchX -= branchXDelta;
          xCoordinateByBranchName[branchNamesKey] = lastBranchX;
        }
        xCoordinate = xCoordinateByBranchName[branchNamesKey];
        commitIndicatorStyle = nonCurrentBranchStyle;
      }
      commitDataByHash[commit.commitData.hash] = {
        xCoordinate,
        yCoordinate,
        commitIndicatorStyle,
      }
      yCoordinate += commitYDelta;
    });

    console.log(commitDataByHash);

    let commitIndicators: any[] = [];
    let commitLines: any[] = [];
    for (const hash in commitDataByHash) {
      if (commitDataByHash.hasOwnProperty(hash)) {
        const commitData: any = commitDataByHash[hash];
        const { xCoordinate, yCoordinate, commitIndicatorStyle } = commitData;
        commitIndicators.push(this.getCommitIndicator(xCoordinate, yCoordinate, commitIndicatorStyle));

        // draw lines from commit to parent(s)
        const commits: CommitOnBranches = commitsByHash[hash];
        const detailedCommitData: Commit = commits.commitData;
        console.log(detailedCommitData.parentHashes);
        const parentHashes: string[] = detailedCommitData.parentHashes.split(' ');
        parentHashes.forEach((parentHash) => {
          const parentCommitData = commitDataByHash[parentHash];
          if (!isNil(parentCommitData)) {
            commitLines.push(this.getCommitLine(
              xCoordinate,
              yCoordinate,
              parentCommitData.xCoordinate,
              parentCommitData.yCoordinate,
            ));
          }
        });
      }
    }

    const commitGraphics: any = commitLines.concat(commitIndicators);

    return commitGraphics;
  }

  render() {

    const statusSummary: any = this.getStatusSummary();

    const localBranches = this.state.localBranches.map((localBranch: any, index: number) => {
      return this.getListItem(localBranch, index);
    });

    const commits = this.getCommits();
    const commitsGraph = this.getCommitsGraph();
    const commitDetail = this.getSelectedCommitDetail();

    return (
      <MuiThemeProvider>
        <div style={styles.rootDiv}>
          <div style={{overflowY : 'scroll', display: 'block', width: '100%', height: '20%'}}>
            <RaisedButton label='Select Repo' onClick={this.handleBrowse} />
            {statusSummary}
            <List style={styles.listStyle}>
              <ListItem
                primaryText="Select Local Branches"
                initiallyOpen={false}
                primaryTogglesNestedList={true}
                nestedItems={localBranches}
                style={styles.superListItem}>
              </ListItem>
            </List>
          </div>
          <div style={{overflowY : 'scroll', display: 'block', width: '100%', height: '50%'}}>
            <div style={styles.leftDiv}>
              <svg height="700" width="100">
                {commitsGraph}
              </svg>
            </div>
            <div style={styles.rightDiv}>
              <h3>Commits</h3>
              {commits}
            </div>
          </div>
          <div style={{overflowY : 'scroll', display: 'block', width: '100%', height: '30%'}}>
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

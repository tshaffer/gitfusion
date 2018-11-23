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
import Subheader from 'material-ui/Subheader';
import Checkbox from 'material-ui/Checkbox';

export default class App extends React.Component<any, object> {

  state: any;

  constructor(props: any) {
    super(props);

    this.state = {
      repoName: 'bacon',
      repoPath: '',
      localBranchesDisplay: [false, false, false],

    };

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
        const git = simplegit(repoPath);
        git.status().then((status: any) => {
          console.log(status);
        });
        git.branch(['-r']).then((branchResults: any) => {
          console.log(branchResults);
        });
    
      }
    });
  }

  updateCheck(event: any, isInputChecked: boolean) {
    console.log('update check invoked');
    console.log(event);

    const localBranchesDisplay: any[] = this.state.localBranchesDisplay;
    const index: number = Number(event.target.id);
    localBranchesDisplay[index] = !localBranchesDisplay[index];
    this.setState({
      localBranchesDisplay
    });
  }

  render() {

    const self = this;

    const lineStyle = {
      strokeWidth: '2',
      stroke: 'red'
    };

    const labelStyle = {
      topMargin: '4px'
    };

    return (
      <MuiThemeProvider>
        <div>
          <div>
            <RaisedButton label='Browse' onClick={self.handleBrowse} />
            <br/>
            <p>Repo: <span style={labelStyle}>{self.state.repoName}</span></p>


            <List>
              <Subheader>Local Branches</Subheader>
              <ListItem
                leftCheckbox={
                  <Checkbox
                  id={'0'}
                  checked={self.state.localBranchesDisplay[0]}
                  onCheck={this.updateCheck}
                  />
                }
                primaryText="Notifications"
              />
              <ListItem
                leftCheckbox={
                  <Checkbox
                  id={'1'}
                  checked={self.state.localBranchesDisplay[1]}
                  onCheck={this.updateCheck}
                  />
                }
                primaryText="Sounds"
              />
              <ListItem
                leftCheckbox={
                  <Checkbox
                  id={'2'}
                  checked={self.state.localBranchesDisplay[2]}
                  onCheck={this.updateCheck}
                  />
                }
                primaryText="Video sounds"
              />
            </List>            
          </div>
          <div>
            <svg height="210" width="500">
              <line x1="0" y1="0" x2="200" y2="200" style={lineStyle} />
            </svg>
          </div>
        </div>
      </MuiThemeProvider>
    );
  }
}

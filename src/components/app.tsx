import {
  remote,
} from 'electron';

import { isNil } from 'lodash';

import * as React from 'react';

import * as simplegit from 'simple-git/promise';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import RaisedButton from 'material-ui/RaisedButton';

export default class App extends React.Component<any, object> {

  constructor(props: any) {
    super(props);
  }

  handleBrowse = () => {

    // const git = simplegit();
    const git = simplegit('/Users/tedshaffer/Documents/Projects/bs-bpf-converter');
    git.status().then((status: any) => {
      console.log(status);
    });
    git.branch(['-r']).then((branchResults: any) => {
      console.log(branchResults);
    });

    const dialog: any = remote.dialog;
    dialog.showOpenDialog({
      defaultPath: '/Users/tedshaffer/Desktop/aa',
      properties: [
        'openDirectory',
      ]
    }, (selectedPaths: string[]) => {
      if (!isNil(selectedPaths) && selectedPaths.length === 1) {
        this.setState({
          contentFolder: selectedPaths[0]
        });
      }
    });
  }

  render() {

    const self = this;

    const lineStyle = {
      strokeWidth: '2',
      stroke: 'red'
    };

    return (
      <MuiThemeProvider>
        <div>
          <div>
            Content folder:
          <RaisedButton label='Browse' onClick={self.handleBrowse} />
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

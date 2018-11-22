import {
  remote,
} from 'electron';

import { isNil } from 'lodash';

import * as React from 'react';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import RaisedButton from 'material-ui/RaisedButton';

export default class App extends React.Component<any, object> {

  state: any;

  constructor(props: any){
    super(props);

  }

  handleBrowse = () => {

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

    return (
      <MuiThemeProvider>
        <div>
          <div>
            Content folder:
            <RaisedButton label='Browse' onClick={self.handleBrowse}/>
          </div>
          <div>
            BrightSign IP Address:
            />
          </div>
        </div>
      </MuiThemeProvider>
    );
  }
}

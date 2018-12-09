import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import Checkbox from 'material-ui/Checkbox';

import {
  LocalBranch,
} from '../gitInterfaces';


const styles = {
  block: {
    maxWidth: 250,
  },
  checkbox: {
    marginBottom: 16,
  },
};

export interface BranchSelectorFormProps {
  branches: LocalBranch[];
  // stopPlayback: boolean;
  // onUpdateStopPlayback: (id: string, stopPlayback: boolean) => (dispatch: Function) => void;
}

export default class BranchSelectorDialog extends React.Component<BranchSelectorFormProps> {
  state = {
    open: true,
  };

  handleOpen = () => {
    this.setState({open: true});
  };

  handleClose = () => {
    this.setState({open: false});
  };

  getCheckboxes() {
    const checkBoxes: any = this.props.branches.map( (branch: LocalBranch, index) => {
      return (
        <Checkbox
          key={index}
          label={branch.name}
          style={styles.checkbox}
        />
      )
    });

    if (checkBoxes.length > 0) {
      return checkBoxes;
    }
    else {
      return null;
    }
  }

  render() {

    const branchCheckboxes = this.getCheckboxes();

    const actions = [
      <FlatButton
        label="Cancel"
        primary={true}
        onClick={this.handleClose}
      />,
      <FlatButton
        label="Submit"
        primary={true}
        keyboardFocused={true}
        onClick={this.handleClose}
      />,
    ];

    return (
      <div>
        <Dialog
          title="Local Branches"
          actions={actions}
          modal={false}
          open={this.state.open}
          onRequestClose={this.handleClose}
          autoScrollBodyContent={true}
        >
          {branchCheckboxes}
        </Dialog>
      </div>
    );
  }
}
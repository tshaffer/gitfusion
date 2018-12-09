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

interface DialogState {
  open: boolean;
  branches: LocalBranch[];
}

export default class BranchSelectorDialog extends React.Component<BranchSelectorFormProps> {

  state: DialogState;

  constructor(props: any) {
    super(props);

    this.state = {
      open: true,
      branches: [],
    };

    // this.handleSelectRepo = this.handleSelectRepo.bind(this);
  }

  componentDidMount() {
    const branches = this.props.branches.map( (branch: LocalBranch) => {
      return {
        name: branch.name,
        display: branch.display,
      }
    });
    this.setState( {
      branches,
    })
  }

  handleClose = () => {
    this.setState({open: false});
  };

  handleToggleDisplayBranch(branchIndex: number, thisArg: any) {
    const branches = this.state.branches;
    branches[branchIndex].display = !branches[branchIndex].display;
    this.setState( {
      branches,
    });
  }

  getCheckboxes() {
    const checkBoxes: any = this.state.branches.map( (branch: LocalBranch, branchIndex) => {
      const displayBranch = this.state.branches[branchIndex].display;
      return (
        <Checkbox
          key={branchIndex}
          label={branch.name}
          style={styles.checkbox}
          checked={displayBranch}
          onCheck={this.handleToggleDisplayBranch.bind(this, branchIndex)}
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
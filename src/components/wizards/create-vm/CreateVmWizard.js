import React from 'react';
import PropTypes from 'prop-types';
import { Wizard } from 'patternfly-react';
import { createVM } from '../../../k8s/request';
import BasicSettingsTab from './BasicSettingsTab';
import ResultTab from './ResultTab';

export class CreateVmWizard extends React.Component {
  state = {
    activeStepIndex: 0,
    stepData: [
      {
        value: {}, // Basic Settings
        valid: false
      },
      {
        value: '',
        valid: null // result of the request
      }
    ]
  };

  onStepDataChanged = (value, valid) => {
    this.setState(state => {
      const stepData = [...state.stepData];
      stepData[state.activeStepIndex] = { value, valid };

      return { stepData };
    });
  };

  getLastStepIndex = () => this.state.stepData.length - 1;
  lastStepReached = () => this.state.activeStepIndex === this.getLastStepIndex();

  onStepChanged = newActiveStepIndex => {
    // create Vm only once last step is reached
    if (!this.lastStepReached() && newActiveStepIndex === this.getLastStepIndex()) {
      createVM(this.state.stepData[0].value)
        .then(result => this.onStepDataChanged(result, true))
        .catch(error => this.onStepDataChanged(error.message, false));
    }

    this.setState(state => {
      if (
        state.activeStepIndex !== state.stepData.length - 1 && // do not allow going back once last step is reached
        (newActiveStepIndex < state.activeStepIndex || // allow going back to past steps
          state.stepData.slice(0, newActiveStepIndex).reduce((validity, item) => validity && item.valid, true))
      ) {
        return { activeStepIndex: newActiveStepIndex };
      }
      return null;
    });
  };

  wizardStepsNewVM = [
    {
      title: 'Basic Settings',
      render: () => (
        <BasicSettingsTab
          key="1"
          workloadProfiles={this.props.workloadProfiles}
          flavors={this.props.flavors}
          namespaces={this.props.namespaces}
          operatingSystems={this.props.operatingSystems}
          templates={this.props.templates}
          basicSettings={this.state.stepData[0].value}
          onChange={this.onStepDataChanged}
        />
      )
    },
    {
      title: 'Result',
      render: () => {
        const stepData = this.state.stepData[this.getLastStepIndex()];
        return <ResultTab result={stepData.value} successfull={stepData.valid} />;
      }
    }
  ];

  render() {
    const beforeLastStepReached = this.state.activeStepIndex === this.state.stepData.length - 2;

    return (
      <Wizard.Pattern
        show
        onHide={this.props.onHide}
        steps={this.wizardStepsNewVM}
        activeStepIndex={this.state.activeStepIndex}
        onStepChanged={index => this.onStepChanged(index)}
        previousStepDisabled={this.lastStepReached()}
        stepButtonsDisabled={this.lastStepReached()}
        nextStepDisabled={!this.state.stepData[this.state.activeStepIndex].valid}
        nextText={beforeLastStepReached ? 'Create Virtual Machine' : 'Next'}
      />
    );
  }
}

CreateVmWizard.propTypes = {
  onHide: PropTypes.func.isRequired,
  workloadProfiles: PropTypes.array.isRequired,
  flavors: PropTypes.array.isRequired,
  operatingSystems: PropTypes.array.isRequired,
  templates: PropTypes.array.isRequired,
  namespaces: PropTypes.array.isRequired
};

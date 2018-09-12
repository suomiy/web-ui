import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { FormFactory } from '../../forms/FormFactory';
import { isPositiveNumber } from '../../../utils/validation';

class BasicSettingsTab extends React.Component {
  onFormChange = (newValue, target) => {
    let validMsg;

    if (this.basicFormFields[target].validate) {
      validMsg = this.basicFormFields[target].validate(newValue);
    }
    if (this.basicFormFields[target].required && newValue.trim().length === 0) {
      validMsg = 'is required';
    }

    if (validMsg) {
      validMsg = `${this.basicFormFields[target].title} ${validMsg}`;
    }

    const basicSettings = {
      ...this.props.basicSettings,
      [target]: {
        value: newValue,
        validMsg
      }
    };

    this.props.onChange(basicSettings, this.validateWizard(basicSettings));
  };

  validateWizard = values => {
    let wizardValid = true;

    // check if all required fields are defined
    const requiredKeys = Object.keys(this.basicFormFields).filter(key => this.isFieldRequired(key, values));
    const requiredKeysInValues = Object.keys(values).filter(key => this.isFieldRequired(key, values));
    if (requiredKeys.length !== requiredKeysInValues.length) {
      wizardValid = false;
    }

    // check if all fields are valid
    for (const key in values) {
      if (
        values[key].validMsg &&
        (this.basicFormFields[key].isVisible ? this.basicFormFields[key].isVisible(values) : true)
      ) {
        wizardValid = false;
        break;
      }
    }

    return wizardValid;
  };

  isFieldRequired = (key, basicVmSettings) =>
    this.basicFormFields[key].required &&
    (this.basicFormFields[key].isVisible ? this.basicFormFields[key].isVisible(basicVmSettings) : true);

  basicFormFields = {
    name: {
      title: 'Name',
      required: true
    },
    description: {
      title: 'Description',
      type: 'textarea'
    },
    namespace: {
      id: 'namespace-dropdown',
      title: 'Namespace',
      type: 'dropdown',
      defaultValue: '--- Select Namespace ---',
      choices: this.props.namespaces,
      required: true
    },
    imageSourceType: {
      id: 'image-source-type-dropdown',
      title: 'Provision Source',
      type: 'dropdown',
      defaultValue: '--- Select Provision Source ---',
      choices: [
        {
          name: 'PXE'
        },
        {
          name: 'URL'
        },
        {
          name: 'Template'
        },
        {
          name: 'Registry'
        }
      ],
      required: true
    },
    template: {
      id: 'template-dropdown',
      title: 'Template',
      type: 'dropdown',
      defaultValue: '--- Select Template ---',
      required: true,
      isVisible: basicVmSettings => get(basicVmSettings, 'imageSourceType.value') === 'Template',
      choices: this.props.templates
    },
    registryImage: {
      title: 'Registry Image',
      required: true,
      isVisible: basicVmSettings => get(basicVmSettings, 'imageSourceType.value') === 'Registry'
    },
    imageURL: {
      title: 'URL',
      required: true,
      isVisible: basicVmSettings => get(basicVmSettings, 'imageSourceType.value') === 'URL'
    },
    operatingSystem: {
      id: 'operating-system-dropdown',
      title: 'Operating System',
      type: 'dropdown',
      defaultValue: '--- Select Operating System ---',
      choices: this.props.operatingSystems,
      required: true
    },
    flavor: {
      id: 'flavor-dropdown',
      title: 'Flavor',
      type: 'dropdown',
      defaultValue: '--- Select Flavor ---',
      choices: this.props.flavors.concat([{ name: 'Custom' }]),
      required: true
    },
    memory: {
      title: 'Memory (GB)',
      required: true,
      isVisible: basicVmSettings => get(basicVmSettings, 'flavor.value', '') === 'Custom',
      validate: currentValue => (isPositiveNumber(currentValue) ? undefined : 'must be a number')
    },
    cpu: {
      title: 'CPUs',
      required: true,
      isVisible: basicVmSettings => get(basicVmSettings, 'flavor.value', '') === 'Custom',
      validate: currentValue => (isPositiveNumber(currentValue) ? undefined : 'must be a number')
    },
    workloadProfile: {
      id: 'workload-profile-dropdown',
      title: 'Workload Profile',
      type: 'dropdown',
      defaultValue: '--- Select Workload Profile ---',
      choices: this.props.workloadProfiles,
      required: true,
      help: () =>
        this.props.workloadProfiles.map(value => (
          <p key={value.id}>
            <b>{value.name}</b>: {value.description}
          </p>
        ))
    },
    startVM: {
      title: 'Start virtual machine on creation',
      type: 'checkbox',
      noBottom: true
    },
    createTemplate: {
      title: 'Create new template from configuration',
      type: 'checkbox',
      noBottom: true
    },
    cloudInit: {
      title: 'Use cloud-init',
      type: 'checkbox'
    },
    hostname: {
      title: 'Hostname',
      isVisible: basicVmSettings => get(basicVmSettings, 'cloudInit.value', false),
      required: true
    },
    authKeys: {
      title: 'Authenticated SSH Keys',
      type: 'textarea',
      isVisible: basicVmSettings => get(basicVmSettings, 'cloudInit.value', false),
      required: true
    }
  };

  render() {
    return (
      <FormFactory
        fields={this.basicFormFields}
        fieldsValues={this.props.basicSettings}
        onFormChange={this.onFormChange}
      />
    );
  }
}

BasicSettingsTab.propTypes = {
  workloadProfiles: PropTypes.array.isRequired,
  flavors: PropTypes.array.isRequired,
  operatingSystems: PropTypes.array.isRequired,
  templates: PropTypes.array.isRequired,
  namespaces: PropTypes.array.isRequired,
  basicSettings: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default BasicSettingsTab;

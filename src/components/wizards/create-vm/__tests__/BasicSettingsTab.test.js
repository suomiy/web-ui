import React from 'react';
import { shallow } from 'enzyme';
import BasicSettingsTab from '../BasicSettingsTab';
import { os } from '../../new-vm/OperatingSystem';
import { workloadProfiles, flavors, templates, namespaces } from '../../new-vm/NewVmWizard.fixtures';
import { validBasicSettings } from './_utils';

const testCreateVmWizard = (basicSettings = {}, onChange = null) => (
  <BasicSettingsTab
    workloadProfiles={workloadProfiles}
    flavors={flavors}
    operatingSystems={os}
    templates={templates}
    namespaces={namespaces}
    basicSettings={basicSettings}
    onChange={onChange || jest.fn()}
  />
);

const expectMockToBeCalledWith = (fn, a, b) => {
  expect(fn.mock.calls[0][0]).toEqual(a);
  expect(fn.mock.calls[0][1]).toBe(b);
};

const testFormChange = (what, value, result, valid) => {
  const onChange = jest.fn();
  const component = shallow(testCreateVmWizard({}, onChange));
  component.instance().onFormChange(value, what);

  expectMockToBeCalledWith(onChange, result, valid);
};

describe('<CreateVmWizard />', () => {
  it('renders correctly', () => {
    const component = shallow(testCreateVmWizard());
    expect(component).toMatchSnapshot();
  });

  it('is validates incomplete form', () => {
    testFormChange(
      'name',
      'someName',
      {
        name: {
          validMsg: undefined,
          value: 'someName'
        }
      },
      false
    );
  });

  it('is valid when all required fields are filled', () => {
    const onChange = jest.fn();
    const component = shallow(testCreateVmWizard(validBasicSettings, onChange));
    component.instance().onFormChange(validBasicSettings.name.value, 'name'); // trigger validation

    expectMockToBeCalledWith(onChange, validBasicSettings, true);
  });

  it('required property is validated', () => {
    testFormChange(
      'name',
      '',
      {
        name: {
          validMsg: 'Name is required',
          value: ''
        }
      },
      false
    );
  });

  it('cpu field validation is triggered', () => {
    testFormChange(
      'cpu',
      'someCpu',
      {
        cpu: {
          validMsg: 'CPUs must be a number',
          value: 'someCpu'
        }
      },
      false
    );
  });

  it('memory field validation is triggered', () => {
    testFormChange(
      'memory',
      'someMemory',
      {
        memory: {
          validMsg: 'Memory (GB) must be a number',
          value: 'someMemory'
        }
      },
      false
    );
  });

  it('is invalid when one required fields is missing', () => {
    const onChange = jest.fn();
    const component = shallow(testCreateVmWizard(validBasicSettings, onChange));
    component.instance().onFormChange('', 'namespace');

    expectMockToBeCalledWith(
      onChange,
      {
        ...validBasicSettings,
        namespace: {
          validMsg: 'Namespace is required',
          value: ''
        }
      },
      false
    );
  });
});

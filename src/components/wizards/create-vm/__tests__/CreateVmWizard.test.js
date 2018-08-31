import React from 'react';
import { shallow } from 'enzyme';
import { WizardPattern } from 'patternfly-react';

import { os } from '../../new-vm/OperatingSystem';
import {
  workloadProfiles,
  flavors,
  templates,
  namespaces,
  storages,
  storageClasses
} from '../../new-vm/NewVmWizard.fixtures';
import { validBasicSettings } from './_utils';
import { CreateVmWizard } from '../CreateVmWizard';
import { createVM } from '../../../../k8s/request';

jest.mock('../../../../k8s/request');

const onHide = () => {};

const testCreateVmWizard = () => (
  <CreateVmWizard
    onHide={onHide}
    workloadProfiles={workloadProfiles}
    flavors={flavors}
    operatingSystems={os}
    templates={templates}
    namespaces={namespaces}
    storages={storages}
    storageClasses={storageClasses}
  />
);

const testWalkThrough = () => {
  const component = shallow(testCreateVmWizard());

  component.instance().onStepDataChanged(validBasicSettings, true);
  expect(component.find(WizardPattern).props().nextStepDisabled).toBeFalsy();

  component.instance().onStepChanged(1); // should allow going forward
  expect(component.state().activeStepIndex).toEqual(1);
  component.instance().onStepChanged(0); // try to go back
  expect(component.state().activeStepIndex).toEqual(0);

  component.instance().onStepChanged(1); // forward again
  expect(component.state().activeStepIndex).toEqual(1);
  expect(component.find(WizardPattern).props().nextText).toBe('Create Virtual Machine');
  expect(component.instance().lastStepReached()).toBeFalsy();

  component.instance().onStepDataChanged([{}], false); // create empty disk
  expect(component.find(WizardPattern).props().nextStepDisabled).toBeTruthy();
  component.instance().onStepDataChanged(
    [
      {
        id: 1,
        name: 'D',
        size: '15',
        storageClass: 'iscsi',
        isBootable: true
      },
      {
        id: 2,
        isBootable: false,
        attachStorage: {
          id: 'disk-two',
          name: 'disk Two',
          size: '15',
          storageClass: 'glusterfs'
        }
      }
    ],
    true
  );

  expect(createVM).not.toHaveBeenCalled();
  component.instance().onStepChanged(2); // create vm
  expect(component.state().activeStepIndex).toEqual(2);
  expect(component.instance().lastStepReached()).toBeTruthy();
  expect(createVM).toHaveBeenCalled();
  expect(component.find(WizardPattern).props().previousStepDisabled).toBeTruthy();
  component.instance().onStepChanged(0); // should not allow going backwards
  expect(component.state().activeStepIndex).toEqual(2);
};

describe('<CreateVmWizard />', () => {
  beforeEach(() => {
    createVM.mockClear();
  });

  it('renders correctly', () => {
    const component = shallow(testCreateVmWizard());
    expect(component).toMatchSnapshot();
  });

  it('is visible when mounted', () => {
    const component = shallow(testCreateVmWizard());
    expect(component.find(WizardPattern).props().show).toBeTruthy();
  });

  it("onStepChanged doesn't update activeStepIndex due to invalid form", () => {
    const component = shallow(testCreateVmWizard());
    expect(component.state().activeStepIndex).toEqual(0);
    component.instance().onStepChanged(1);
    expect(component.state().activeStepIndex).toEqual(0);
  });

  it('checks initial values', () => {
    const component = shallow(testCreateVmWizard());
    expect(component.find(WizardPattern).props().nextStepDisabled).toBeTruthy();
    expect(component.find(WizardPattern).props().nextText).toBe('Next');
    expect(component.find(WizardPattern).props().steps).toHaveLength(3);
    expect(component.instance().getLastStepIndex()).toBe(2);
  });

  it('changes next step disability', () => {
    const component = shallow(testCreateVmWizard());

    component.instance().onStepDataChanged(validBasicSettings, true);
    expect(component.state().stepData[0].value).toEqual(validBasicSettings);
    expect(component.state().stepData[0].valid).toBeTruthy();
    expect(component.find(WizardPattern).props().nextStepDisabled).toBeFalsy();

    // new required field will become visible
    component.instance().onStepDataChanged(
      {
        ...validBasicSettings,
        imageSourceType: {
          value: 'URL'
        }
      },
      false
    );
    expect(component.find(WizardPattern).props().nextStepDisabled).toBeTruthy();
  });

  it('creates vm', () => {
    createVM.mockReturnValueOnce(new Promise((resolve, reject) => resolve('VM created')));
    testWalkThrough();
  });

  it('fails creating the vm', () => {
    createVM.mockReturnValueOnce(new Promise((resolve, reject) => reject(new Error('VM not created'))));
    testWalkThrough();
  });
});

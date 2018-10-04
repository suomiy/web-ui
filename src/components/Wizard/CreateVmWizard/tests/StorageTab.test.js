import React from 'react';
import { shallow, mount } from 'enzyme';
import StorageTab from '../StorageTab';
import { ON_DELETE, ON_CHANGE, ON_CONFIRM } from '../../../Table/constants';

import { storages, storageClasses } from '../../NewVmWizard/fixtures/NewVmWizard.fixture';
import { rows } from '../fixtures/StorageTab.fixture';

const testStorageTab = (onChange, initialDisks) => (
  <StorageTab
    storages={storages}
    storageClasses={storageClasses}
    onChange={onChange || jest.fn()}
    initialDisks={initialDisks || []}
  />
);

const thirdRow = rows[2];
const testRows = rows.slice(0, 2);

const updatedThirdRow = {
  ...thirdRow,
  attachStorage: {
    id: 'attach'
  },
  name: 'name'
};

describe('<StorageTab />', () => {
  it('renders correctly', () => {
    const component = shallow(testStorageTab());
    expect(component).toMatchSnapshot();
  });

  it('creates disk', () => {
    const component = shallow(testStorageTab());

    expect(component.state().rows).toHaveLength(0);
    component.instance().createDisk();

    expect(component.state().rows).toHaveLength(1);
  });

  it('attaches storage', () => {
    const component = shallow(testStorageTab());

    expect(component.state().rows).toHaveLength(0);
    component.instance().attachStorage();

    expect(component.state().rows).toHaveLength(1);
  });

  it('initializes attach storage ', () => {
    const onChange = jest.fn();
    const component = mount(testStorageTab(onChange, testRows.slice(0, 1)));

    expect(component.state().rows).toHaveLength(1);
  });

  it('initializes disk and remove it', () => {
    const onChange = jest.fn();
    const component = mount(testStorageTab(onChange, testRows.slice(0, 1)));

    expect(component.state().rows).toHaveLength(1);
    component.instance().setState({ rows: [] });
    expect(component.state().rows).toHaveLength(0);
  });

  it('calls onChange on delete', () => {
    const onChange = jest.fn();

    const component = mount(testStorageTab(onChange, [...testRows, thirdRow]));
    component.instance().onChange(testRows, {
      editing: false,
      type: ON_DELETE,
      id: 3
    });

    expect(onChange).toHaveBeenCalled();
  });

  it('calls onChange on confirm', () => {
    const onChange = jest.fn();

    const component = mount(testStorageTab(onChange, [...testRows, thirdRow]));

    component.instance().onChange([...testRows, updatedThirdRow], {
      editing: true,
      type: ON_CONFIRM,
      id: 3
    });

    expect(onChange).toHaveBeenCalled();
  });

  it('does not call onChange on change', () => {
    const onChange = jest.fn();

    const component = mount(testStorageTab(onChange, [...testRows, thirdRow]));

    component.instance().onChange([...testRows, updatedThirdRow], {
      editing: true,
      type: ON_CHANGE,
      id: 3
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});

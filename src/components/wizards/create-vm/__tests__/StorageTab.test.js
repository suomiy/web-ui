import React from 'react';
import { shallow, mount } from 'enzyme';
import StorageTab from '../StorageTab';
import { ON_DELETE, ON_CHANGE, ON_CONFIRM } from '../../../table/constants';

import { storages, storageClasses } from '../../new-vm/NewVmWizard.fixtures';

const testStorageTab = (onChange, initialDisks) => (
  <StorageTab
    storages={storages}
    storageClasses={storageClasses}
    onChange={onChange || jest.fn()}
    initialDisks={initialDisks || []}
  />
);

const rows = [
  {
    id: 1,
    isBootable: true,
    name: 'D',
    size: '15',
    storageClass: 'iscsi',
    renderConfig: 0
  },
  {
    id: 2,
    isBootable: false,
    renderConfig: 1,
    attachStorage: {
      id: 'disk-two',
      name: 'disk Two',
      size: '15',
      storageClass: 'glusterfs'
    }
  }
];

const thirdRow = {
  id: 3,
  isBootable: false,
  renderConfig: 1,
  attachStorage: {}
};

const updatedThirdRow = {
  id: 3,
  isBootable: false,
  renderConfig: 1,
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
    const component = mount(testStorageTab(onChange, rows.slice(0, 1)));

    expect(component.state().rows).toHaveLength(1);
  });

  it('initializes disk and remove it', () => {
    const onChange = jest.fn();
    const component = mount(testStorageTab(onChange, rows.slice(0, 1)));

    expect(component.state().rows).toHaveLength(1);
    component.instance().setState({ rows: [] });
    expect(component.state().rows).toHaveLength(0);
  });

  it('calls onChange on delete', () => {
    const onChange = jest.fn();

    const component = mount(testStorageTab(onChange, [...rows, thirdRow]));
    component.instance().onChange(rows, { editing: false, type: ON_DELETE, id: 3 });

    expect(onChange).toHaveBeenCalled();
  });

  it('calls onChange on confirm', () => {
    const onChange = jest.fn();

    const component = mount(testStorageTab(onChange, [...rows, thirdRow]));

    component.instance().onChange([...rows, updatedThirdRow], { editing: true, type: ON_CONFIRM, id: 3 });

    expect(onChange).toHaveBeenCalled();
  });

  it('does not call onChange on change', () => {
    const onChange = jest.fn();

    const component = mount(testStorageTab(onChange, [...rows, thirdRow]));

    component.instance().onChange([...rows, updatedThirdRow], { editing: true, type: ON_CHANGE, id: 3 });

    expect(onChange).not.toHaveBeenCalled();
  });
});

import React from 'react';
import { shallow, mount } from 'enzyme';
import EditableDraggableTable from '../EditableDraggableTable';

const rows = [
  {
    id: 1,
    one: 'First Column',
    two: 'Second Column'
  },
  {
    id: 2,
    one: 'F Column',
    two: 'S Column'
  }
];

const columns = [
  {
    header: {
      label: 'One'
    },
    property: 'one'
  },
  {
    header: {
      label: 'Two'
    },
    property: 'two'
  }
];

const testEditableDraggableTable = (rowsArg = [], onChange = null) => (
  <EditableDraggableTable columns={columns} rows={rowsArg} onChange={onChange || jest.fn()} />
);

describe('<EditableDraggableTable />', () => {
  it('renders correctly', () => {
    const component = shallow(testEditableDraggableTable());
    expect(component).toMatchSnapshot();
  });

  it('renders data correctly', () => {
    const component = shallow(testEditableDraggableTable(rows));
    expect(component).toMatchSnapshot();
  });

  it('creates new row', () => {
    const onChange = jest.fn();
    const component = mount(testEditableDraggableTable(rows, onChange));

    component.setProps({
      onChange,
      rows: [
        ...rows,
        {
          id: 3,
          edit: true,
          one: 'F3 Column',
          two: 'S3 Column'
        }
      ]
    });
    expect(onChange).toHaveBeenCalled();
  });
});

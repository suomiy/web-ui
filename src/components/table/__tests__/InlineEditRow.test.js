import React from 'react';
import { shallow } from 'enzyme';
import InlineEditRow from '../InlineEditRow';
import { Table } from 'patternfly-react';

const testProp = 'testProp';

const testInlineEditRow = () => <InlineEditRow testProp={testProp} />;

describe('<EditableDraggableTable />', () => {
  it('renders correctly', () => {
    const component = shallow(testInlineEditRow());
    expect(component).toMatchSnapshot();
  });

  it('passes props', () => {
    const component = shallow(testInlineEditRow());
    expect(component.find(Table.InlineEditRow).props().testProp).toBe(testProp);
  });
});

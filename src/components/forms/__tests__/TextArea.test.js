import React from 'react';
import { shallow } from 'enzyme';
import { TextArea } from '../';

const testTextAreaControl = () => <TextArea id="1" onChange={jest.fn()} value="val" />;

describe('<TextAreaControl />', () => {
  it('renders correctly', () => {
    const component = shallow(testTextAreaControl());
    expect(component).toMatchSnapshot();
  });
});

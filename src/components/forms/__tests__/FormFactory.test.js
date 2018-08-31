import React from 'react';
import { shallow } from 'enzyme';
import { FormFactory, getFormElement } from '../FormFactory';
import { minFormFields, formFieldsValues, allFormFields } from '../FormFactory.fixtures';

const testCreateFormFactory = () => (
  <FormFactory fields={minFormFields} fieldsValues={formFieldsValues} onFormChange={() => {}} />
);

const testCreateFormFactoryAllFields = () => (
  <FormFactory fields={allFormFields} fieldsValues={formFieldsValues} onFormChange={() => {}} />
);

const testGetFormElement = () =>
  getFormElement({
    type: 'positive-number',
    id: 'test-id',
    value: 48,
    onChange: jest.fn()
  });

describe('<FormFactory />', () => {
  it('renders correctly', () => {
    const component = shallow(testCreateFormFactory());
    expect(component).toMatchSnapshot();
  });
  it('required field is marked', () => {
    const component = shallow(testCreateFormFactoryAllFields());
    expect(component.find('.required-pf')).toHaveLength(1);
  });
  it('not visible field is not rendered', () => {
    const component = shallow(testCreateFormFactory());
    expect(component.find('.control-label').find(node => node.text() === 'invisibleField')).toHaveLength(0);
  });
});

describe('getFormElement', () => {
  it('renders correctly', () => {
    const component = shallow(testGetFormElement());
    expect(component).toMatchSnapshot();
  });
});

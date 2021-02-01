import { mount } from '@vue/test-utils';
import { expect } from 'chai';

import TextInput from '@/components/ui/TextInput.vue';

import { fakeValidationErrors } from '../../fixtures/FakeErrors';

describe('TextInput', () => {
  let component;
  let input = () => component.find('input');

  beforeEach(() => {
    component = mount(TextInput, {
      propsData: {
        name: 'An input',
        value: null,
      },
    });
  });

  it('has correct elements', () => {
    expect(component.find('label').text()).to.contain('An input');
    let inputs = component.findAll('input');
    expect(inputs.length).to.eq(1);

    expect(inputs.at(0).attributes()).to.include({
      id: 'an_input',
      name: 'an_input',
      type: 'text',
    });
  });

  it('generates appropriate form id and name', async () => {
    await component.setProps({
      name: 'EmAiL',
    });
    expect(input().attributes('id')).to.eq('email');
    expect(input().attributes('name')).to.eq('email');

    await component.setProps({
      name: 'A Seperated Label',
    });
    expect(input().attributes('id')).to.eq('a_seperated_label');
    expect(input().attributes('name')).to.eq('a_seperated_label');
  });

  it('can set an autocomplete value', async () => {
    await component.setProps({
      autocomplete: 'current-password none',
    });
    expect(input().attributes('autocomplete')).to.eq('current-password none');
  });

  it('can set its type', async () => {
    await component.setProps({
      type: 'password',
    });
    expect(input().attributes('type')).to.eq('password');
  });

  it('sets its initial value', async () => {
    await component.setProps({
      value: 'Hello world',
    });
    expect(input().element.value).to.eq('Hello world');
  });

  it('outputs text input event', () => {
    expect(component.emitted().input).to.not.be.ok;
    input().trigger('input');
    expect(component.emitted().input).to.be.ok;
  });

  it('can display its errors', async () => {
    expect(component.text()).not.to.contain('An error on the an_input field');

    await component.setProps({
      errors: fakeValidationErrors(['an_input']),
    });

    expect(component.text()).to.contain('An error on the an_input field');

    // Check behavior on typing
    input().trigger('input');
    await component.vm.$forceUpdate();
    expect(component.text()).not.to.contain('An error on the an_input field');
  });
});
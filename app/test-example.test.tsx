import { render } from '@testing-library/react-native';
import React from 'react';
import ProductsScreen from './products';

describe('ProductsScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<ProductsScreen />);
    expect(getByText('Products')).toBeTruthy();
  });
});

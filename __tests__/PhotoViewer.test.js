import React from 'react';
import { render } from '@testing-library/react-native';
import { PhotoViewer } from '../components/PhotoViewer';

describe('PhotoViewer', () => {
  it('renders and displays photo count', () => {
    const photos = ['file:///a.jpg', 'file:///b.jpg'];
    const { getByText } = render(<PhotoViewer visible photos={photos} initialIndex={0} onClose={jest.fn()} />);
    expect(getByText('1 / 2')).toBeTruthy();
  });

  it('does not render if photos array empty', () => {
    const { queryByText } = render(<PhotoViewer visible photos={[]} initialIndex={0} onClose={jest.fn()} />);
    expect(queryByText(/\d+ \/ \d+/)).toBeNull();
  });
});

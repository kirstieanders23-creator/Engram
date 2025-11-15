import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useDebounce } from '../utils/useDebounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  it('debounces value changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), { initialProps: { value: 'a' } });
    expect(result.current).toBe('a');
    rerender({ value: 'ab' });
    // Not updated yet
    expect(result.current).toBe('a');
    act(() => { jest.advanceTimersByTime(299); });
    expect(result.current).toBe('a');
    act(() => { jest.advanceTimersByTime(1); });
    expect(result.current).toBe('ab');
  });
});

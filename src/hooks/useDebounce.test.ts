import { act, renderHook } from '@testing-library/react-native';
import { useDebounce } from './useDebounce';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('waits at least 300 ms and cancels intermediate input', () => {
  const { result, rerender } = renderHook(
    ({ text }: { text: string }) => useDebounce(text),
    {
      initialProps: { text: '' },
    },
  );
  rerender({ text: 'c' });
  act(() => jest.advanceTimersByTime(200));
  rerender({ text: 'café' });
  act(() => jest.advanceTimersByTime(299));
  expect(result.current).toBe('');
  act(() => jest.advanceTimersByTime(1));
  expect(result.current).toBe('café');
});

test('cleans up its pending timer on unmount', () => {
  const { rerender, unmount } = renderHook(
    ({ text }: { text: string }) => useDebounce(text),
    {
      initialProps: { text: '' },
    },
  );
  rerender({ text: 'pending' });
  expect(jest.getTimerCount()).toBe(1);
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '@/components/ui/button';
import { InDevelopmentNotice } from '@/components/ui/in-development-notice';
import { ProgressBar } from '@/components/ui/progress-bar';
import { changeLanguage } from '@/lib/i18n';

describe('UI components', () => {
  afterEach(async () => {
    await act(() => changeLanguage('en-US'));
  });

  it('Button fires onPress and exposes its label', async () => {
    const onPress = jest.fn();
    await render(<Button label="Continue" onPress={onPress} testID="cta" />);
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('Button does not fire while disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} disabled />);
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it.each([
    ['en-US', 'In development'],
    ['pt-BR', 'Em desenvolvimento'],
    ['es', 'En desarrollo'],
  ] as const)('InDevelopmentNotice is translated (%s)', async (language, expected) => {
    await changeLanguage(language);
    await render(<InDevelopmentNotice />);
    expect(screen.getByText(expected)).toBeTruthy();
  });

  it('re-renders when the language changes', async () => {
    await render(<InDevelopmentNotice compact />);
    expect(screen.getByText('In development')).toBeTruthy();
    await act(() => changeLanguage('pt-BR'));
    expect(screen.getByText('Em desenvolvimento')).toBeTruthy();
  });

  it('ProgressBar clamps its accessibility value', async () => {
    await render(<ProgressBar progress={1.7} accessibilityLabel="Protein" />);
    expect(screen.getByLabelText('Protein').props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 100,
    });
  });
});

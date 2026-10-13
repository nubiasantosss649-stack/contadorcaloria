import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Screen, ScreenHeader, Text, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { useAuthMessages } from '@/features/auth/use-auth-error';
import {
  MIN_PASSWORD_LENGTH,
  validatePassword,
  validatePasswordConfirmation,
} from '@/lib/validation';
import { authService } from '@/services/auth-service';

/** Shown after a password-recovery link: the user must choose a new password. */
export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const messages = useAuthMessages();
  const { finishPasswordRecovery, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const passwordError = validatePassword(password);
  const confirmationError = validatePasswordConfirmation(password, confirmation);

  const onSubmit = async () => {
    setSubmitted(true);
    setRequestError(null);
    if (passwordError || confirmationError) return;
    setLoading(true);
    const result = await authService.updatePassword(password);
    setLoading(false);
    if (!result.ok) return setRequestError(messages.request(result.code));
    finishPasswordRecovery();
  };

  return (
    <Screen keyboard>
      <ScreenHeader title={t('auth.reset.title')} subtitle={t('auth.reset.subtitle')} />
      <View className="gap-4">
        <TextField
          label={t('auth.reset.newPassword')}
          placeholder={t('auth.passwordPlaceholder', { min: MIN_PASSWORD_LENGTH })}
          icon="lock-closed-outline"
          secure
          showPasswordLabel={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          error={submitted ? messages.validation(passwordError) : null}
          autoComplete="new-password"
          textContentType="newPassword"
          testID="reset-password"
        />
        <TextField
          label={t('auth.register.confirmPassword')}
          icon="lock-closed-outline"
          secure
          showPasswordLabel={t('auth.register.confirmPassword')}
          value={confirmation}
          onChangeText={setConfirmation}
          error={submitted ? messages.validation(confirmationError) : null}
          autoComplete="new-password"
          textContentType="newPassword"
          testID="reset-confirmation"
        />
      </View>
      {requestError ? (
        <Text variant="bodySmall" tone="danger" center accessibilityLiveRegion="polite">
          {requestError}
        </Text>
      ) : null}
      <Button
        label={t('auth.reset.submit')}
        onPress={onSubmit}
        loading={loading}
        testID="reset-submit"
      />
      <Button label={t('profile.signOut')} variant="ghost" onPress={() => void signOut()} />
    </Screen>
  );
}

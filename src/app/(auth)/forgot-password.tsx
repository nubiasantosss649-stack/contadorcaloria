import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppModal, Button, Screen, ScreenHeader, Text, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { BackendStatus } from '@/features/auth/components/backend-status';
import { useAuthMessages } from '@/features/auth/use-auth-error';
import { validateEmail } from '@/lib/validation';
import { authService } from '@/services/auth-service';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const messages = useAuthMessages();
  const { isBackendConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const emailError = submitted ? messages.validation(validateEmail(email)) : null;

  const onSubmit = async () => {
    setSubmitted(true);
    setRequestError(null);
    if (validateEmail(email)) return;
    setLoading(true);
    const result = await authService.sendPasswordReset(email);
    setLoading(false);
    if (result.ok) setSent(true);
    else setRequestError(messages.request(result.code));
  };

  return (
    <Screen keyboard>
      <ScreenHeader showBack title={t('auth.forgot.title')} subtitle={t('auth.forgot.subtitle')} />
      <BackendStatus />
      <View className="gap-4">
        <TextField
          label={t('auth.email')}
          placeholder={t('auth.emailPlaceholder')}
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          error={emailError}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={onSubmit}
          editable={isBackendConfigured}
        />
        {requestError ? (
          <Text variant="bodySmall" tone="danger" accessibilityLiveRegion="polite">
            {requestError}
          </Text>
        ) : null}
        <Button
          label={t('auth.forgot.submit')}
          onPress={onSubmit}
          loading={loading}
          disabled={!isBackendConfigured}
        />
      </View>

      <AppModal
        visible={sent}
        onClose={() => setSent(false)}
        icon="mail-outline"
        title={t('auth.forgot.sentTitle')}
        description={t('auth.forgot.sentDescription', { email: email.trim() })}
        actions={
          <Button
            label={t('auth.forgot.backToLogin')}
            onPress={() => {
              setSent(false);
              router.back();
            }}
          />
        }
      />
    </Screen>
  );
}

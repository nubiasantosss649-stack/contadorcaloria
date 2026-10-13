import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppModal, Button, Screen, ScreenHeader, Text, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { BackendStatus } from '@/features/auth/components/backend-status';
import { useAuthMessages } from '@/features/auth/use-auth-error';
import { usePreferences } from '@/features/preferences/preferences-provider';
import {
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirmation,
} from '@/lib/validation';
import { authService } from '@/services/auth-service';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const messages = useAuthMessages();
  const { isBackendConfigured } = useAuth();
  const { resolvedLanguage } = usePreferences();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [confirmEmailSentTo, setConfirmEmailSentTo] = useState<string | null>(null);

  const errors = {
    name: validateName(name),
    email: validateEmail(email),
    password: validatePassword(password),
    confirmation: validatePasswordConfirmation(password, confirmation),
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const show = (key: keyof typeof errors) => (submitted ? messages.validation(errors[key]) : null);

  const onSubmit = async () => {
    setSubmitted(true);
    setRequestError(null);
    if (hasErrors) return;
    setLoading(true);
    const result = await authService.signUp(name, email, password, resolvedLanguage);
    setLoading(false);
    if (!result.ok) return setRequestError(messages.request(result.code));
    // Without email confirmation Supabase returns a session and the guard redirects automatically.
    if (result.data.needsConfirmation) setConfirmEmailSentTo(email.trim());
  };

  return (
    <Screen keyboard>
      <ScreenHeader
        showBack
        title={t('auth.register.title')}
        subtitle={t('auth.register.subtitle')}
      />
      <BackendStatus />

      <View className="gap-4">
        <TextField
          label={t('auth.register.name')}
          placeholder={t('auth.register.namePlaceholder')}
          icon="person-outline"
          value={name}
          onChangeText={setName}
          error={show('name')}
          testID="register-name"
          autoComplete="name"
          textContentType="name"
          editable={isBackendConfigured}
        />
        <TextField
          label={t('auth.email')}
          placeholder={t('auth.emailPlaceholder')}
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          error={show('email')}
          testID="register-email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          editable={isBackendConfigured}
        />
        <TextField
          label={t('auth.password')}
          placeholder={t('auth.passwordPlaceholder', { min: MIN_PASSWORD_LENGTH })}
          icon="lock-closed-outline"
          secure
          showPasswordLabel={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          error={show('password')}
          testID="register-password"
          autoComplete="new-password"
          textContentType="newPassword"
          editable={isBackendConfigured}
        />
        <TextField
          label={t('auth.register.confirmPassword')}
          icon="lock-closed-outline"
          secure
          showPasswordLabel={t('auth.register.confirmPassword')}
          value={confirmation}
          onChangeText={setConfirmation}
          error={show('confirmation')}
          testID="register-confirmation"
          autoComplete="new-password"
          textContentType="newPassword"
          editable={isBackendConfigured}
        />
      </View>

      {requestError ? (
        <Text variant="bodySmall" tone="danger" center accessibilityLiveRegion="polite">
          {requestError}
        </Text>
      ) : null}

      <View className="gap-3">
        <Button
          label={t('auth.register.submit')}
          onPress={onSubmit}
          loading={loading}
          disabled={!isBackendConfigured}
          testID="register-submit"
        />
        <Text variant="caption" tone="muted" center>
          {t('auth.register.legal')}
        </Text>
      </View>

      <View className="flex-row items-center justify-center gap-1.5">
        <Text variant="bodySmall" tone="muted">
          {t('auth.register.haveAccount')}
        </Text>
        <Text
          variant="bodySmall"
          tone="primary"
          className="font-inter-semibold"
          accessibilityRole="link"
          onPress={() => router.back()}
        >
          {t('auth.register.signIn')}
        </Text>
      </View>

      <AppModal
        visible={confirmEmailSentTo !== null}
        onClose={() => setConfirmEmailSentTo(null)}
        icon="mail-unread-outline"
        title={t('auth.register.checkEmailTitle')}
        description={t('auth.register.checkEmailDescription', { email: confirmEmailSentTo ?? '' })}
        actions={
          <Button
            label={t('auth.forgot.backToLogin')}
            onPress={() => {
              setConfirmEmailSentTo(null);
              router.replace('/login');
            }}
          />
        }
      />
    </Screen>
  );
}

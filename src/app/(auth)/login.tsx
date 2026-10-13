import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LogoMark } from '@/components/brand/logo-mark';
import { Button, Screen, ScreenHeader, Text, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { BackendStatus } from '@/features/auth/components/backend-status';
import { useAuthMessages } from '@/features/auth/use-auth-error';
import { MIN_PASSWORD_LENGTH, validateEmail, validatePassword } from '@/lib/validation';
import { authService } from '@/services/auth-service';

export default function LoginScreen() {
  const { t } = useTranslation();
  const messages = useAuthMessages();
  const { isBackendConfigured } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const emailError = submitted ? messages.validation(validateEmail(email)) : null;
  const passwordError = submitted
    ? messages.validation(validatePassword(password, { checkLength: false }))
    : null;

  const onSubmit = async () => {
    setSubmitted(true);
    setRequestError(null);
    if (validateEmail(email) || validatePassword(password, { checkLength: false })) return;
    setLoading(true);
    const result = await authService.signIn(email, password);
    setLoading(false);
    // On success the auth listener updates the session and the router guard redirects.
    if (!result.ok) setRequestError(messages.request(result.code));
  };

  return (
    <Screen keyboard>
      <View className="gap-6 pt-6">
        <LogoMark size={56} />
        <ScreenHeader title={t('auth.login.title')} subtitle={t('auth.login.subtitle')} />
      </View>

      <BackendStatus showPreview />

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
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          editable={isBackendConfigured}
          testID="login-email"
        />
        <TextField
          ref={passwordRef}
          label={t('auth.password')}
          placeholder={t('auth.passwordPlaceholder', { min: MIN_PASSWORD_LENGTH })}
          icon="lock-closed-outline"
          secure
          showPasswordLabel={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          error={passwordError}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={onSubmit}
          editable={isBackendConfigured}
          testID="login-password"
        />
        <Link href="/forgot-password" className="self-end py-1">
          <Text variant="bodySmall" tone="primary" className="font-inter-semibold">
            {t('auth.login.forgotPassword')}
          </Text>
        </Link>
      </View>

      {requestError ? (
        <Text variant="bodySmall" tone="danger" center accessibilityLiveRegion="polite">
          {requestError}
        </Text>
      ) : null}

      <Button
        label={t('auth.login.submit')}
        onPress={onSubmit}
        loading={loading}
        disabled={!isBackendConfigured}
        testID="login-submit"
      />

      <View className="flex-row items-center justify-center gap-1.5">
        <Text variant="bodySmall" tone="muted">
          {t('auth.login.noAccount')}
        </Text>
        <Link href="/register">
          <Text variant="bodySmall" tone="primary" className="font-inter-semibold">
            {t('auth.login.createAccount')}
          </Text>
        </Link>
      </View>
    </Screen>
  );
}

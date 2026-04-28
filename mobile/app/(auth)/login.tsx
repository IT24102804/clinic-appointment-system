import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppLogo } from "@/components/ui/app-logo";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { AppColors } from "@/constants/design";
import { login } from "@/services/auth";
import { getPatientProfile } from "@/services/patients";
import { saveToken } from "@/services/secure-token";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    try {
      setBusy(true);
      setError(null);

      const payload = await login({ email, password });
      await saveToken(payload.token);

      try {
        await getPatientProfile(payload.token);
        router.replace("/(tabs)" as any);
      } catch (profileError) {
        const status = (profileError as any)?.status;
        if (status === 404) {
          router.replace({ pathname: "/(auth)/complete-profile" as any, params: { token: payload.token } } as any);
          return;
        }

        throw profileError;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <View style={styles.logoRow}>
        <AppLogo />
      </View>

      <PageHeader eyebrow="Patients" title="Sign in" subtitle="Sign in to manage appointments and your patient profile." />

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <AppInput value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>Password</Text>
        <AppInput value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton label="Sign in" busy={busy} onPress={() => void submit()} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  logoRow: {
    alignItems: "center",
    marginTop: 4,
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.text,
    marginTop: 6,
  },
  error: {
    color: AppColors.danger,
    fontWeight: "600",
    marginTop: 4,
  },
});

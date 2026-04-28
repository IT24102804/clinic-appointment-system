import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppLogo } from "@/components/ui/app-logo";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { AppColors } from "@/constants/design";
import { registerPatient } from "@/services/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async () => {
    try {
      setBusy(true);
      setError(null);
      setSuccess(null);

      await registerPatient({ firstName, lastName, email, password });
      setSuccess("Account created. Please sign in to continue.");
      router.replace("/(auth)/login" as any);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create an account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <View style={styles.logoRow}>
        <AppLogo />
      </View>

      <PageHeader
        eyebrow="Patients"
        title="Create your patient account"
        subtitle="This registration is for patients. You will complete your patient profile after sign up."
      />

      <View style={styles.form}>
        <Text style={styles.label}>First name</Text>
        <AppInput value={firstName} onChangeText={setFirstName} placeholder="Sanduni" />

        <Text style={styles.label}>Last name</Text>
        <AppInput value={lastName} onChangeText={setLastName} placeholder="Perera" />

        <Text style={styles.label}>Email</Text>
        <AppInput value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>Password</Text>
        <AppInput value={password} onChangeText={setPassword} placeholder="Password1!" secureTextEntry />

        {success ? <Text style={styles.success}>{success}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton label="Create account" busy={busy} onPress={() => void submit()} />
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
  success: {
    color: AppColors.primary,
    fontWeight: "600",
    marginTop: 4,
  },
});

import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { AppScreen } from "@/components/ui/app-screen";
import { AppColors } from "@/constants/design";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        tone="hero"
        eyebrow="Daily workspace"
        title="Clinic dashboard"
        subtitle="Move from check-in to follow-up with one calm mobile flow for appointments, prescriptions, and supporting records."
      />

      <View style={styles.actionRow}>
        <AppButton label="Browse modules" onPress={() => router.push("/(tabs)/more")} />
        <AppButton label="Open appointments" onPress={() => router.push("/(tabs)/appointments")} variant="secondary" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Start a task</Text>
        <Text style={styles.sectionSubtitle}>
          Use the same simple flow staff-friendly apps use: begin with the visit, handle treatment, then open supporting modules only when needed.
        </Text>
      </View>

      <View style={styles.quickGrid}>
        <Pressable onPress={() => router.push("/(tabs)/appointments")} style={styles.quickLink}>
          <AppCard style={styles.quickCard}>
            <Text style={styles.quickEyebrow}>Visit flow</Text>
            <Text style={styles.quickTitle}>Appointments</Text>
            <Text style={styles.quickText}>Review bookings, reschedule visits, and keep the day moving on time.</Text>
          </AppCard>
        </Pressable>

        <Pressable onPress={() => router.push("/(tabs)/prescriptions")} style={styles.quickLink}>
          <AppCard style={styles.quickCard}>
            <Text style={styles.quickEyebrow}>Clinical work</Text>
            <Text style={styles.quickTitle}>Prescriptions</Text>
            <Text style={styles.quickText}>Create treatment instructions, manage medicines, and attach PDFs or images.</Text>
          </AppCard>
        </Pressable>

        <Pressable onPress={() => router.push("/(tabs)/more")} style={styles.quickLink}>
          <AppCard style={styles.quickCard}>
            <Text style={styles.quickEyebrow}>Support tools</Text>
            <Text style={styles.quickTitle}>Patients, billing & records</Text>
            <Text style={styles.quickText}>Jump into people, billing, doctor, and record modules from one shared workspace.</Text>
          </AppCard>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Prescription snapshot</Text>
        <Text style={styles.sectionSubtitle}>
          This live section keeps the dashboard practical. It shows what is waiting, what is complete, and how much documentation is attached right now.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 18,
  },
  actionRow: {
    gap: 12,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: AppColors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: AppColors.textMuted,
  },
  quickGrid: {
    gap: 12,
  },
  quickLink: {
    width: "100%",
  },
  quickCard: {
    padding: 18,
    gap: 8,
  },
  quickEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: AppColors.accent,
  },
  quickTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: AppColors.text,
  },
  quickText: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.textMuted,
  },
});

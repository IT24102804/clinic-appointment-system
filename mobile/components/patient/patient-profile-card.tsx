import { StyleSheet, Text } from "react-native";

import { AppCard } from "@/components/ui/app-card";
import { AppColors } from "@/constants/design";

type PatientProfileCardProps = {
  label: string;
  value: string;
};

export function PatientProfileCard({ label, value }: PatientProfileCardProps) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: AppColors.textMuted,
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.text,
  },
});

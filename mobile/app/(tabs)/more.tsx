import { StyleSheet, Text, View } from "react-native";

import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { AppScreen } from "@/components/ui/app-screen";
import { AppColors } from "@/constants/design";

export default function MoreScreen() {
  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        eyebrow="Care workspace"
        title="More tools"
        subtitle="This area is reserved for additional modules such as billing, records, and staff tools."
      />

      <AppCard muted style={styles.introCard}>
        <Text style={styles.introTitle}>Keep the flow simple</Text>
        <Text style={styles.introText}>
          Friendly mobile apps keep the main journey focused, then group supporting tools in one calm place. This tab is that shared workspace.
        </Text>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  introCard: {
    padding: 18,
    gap: 8,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: AppColors.text,
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.textMuted,
  },
});

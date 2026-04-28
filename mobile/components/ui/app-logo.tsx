import { Image, StyleSheet, Text, View } from "react-native";

import { AppColors } from "@/constants/design";

type AppLogoProps = {
  size?: "sm" | "md";
};

export function AppLogo({ size = "md" }: AppLogoProps) {
  const dims = size === "sm" ? 26 : 34;
  const fontSize = size === "sm" ? 14 : 16;
  const logoWidth = size === "sm" ? 36 : 46;

  return (
    <View style={styles.wrap}>
      <Image
        source={require("@/assets/images/onboarding/logo.png")}
        style={{ width: logoWidth, height: dims }}
        resizeMode="contain"
      />
      <Text style={[styles.wordmark, { fontSize }]}>
        <Text style={styles.wordmarkPrimary}>LANKADOC</Text>
        <Text style={styles.wordmarkAccent}>360</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  wordmark: {
    color: AppColors.text,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  wordmarkPrimary: {
    color: AppColors.primary,
  },
  wordmarkAccent: {
    color: "#C8A64B",
  },
});

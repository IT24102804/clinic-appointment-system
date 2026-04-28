import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppColors } from "@/constants/design";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(onboarding)/welcome" as any);
    }, 1200);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.brandWrap}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoMark}>+</Text>
        </View>
        <Text style={styles.brandName}>LankaDoc360</Text>
        <Text style={styles.tagline}>Your trusted clinic companion</Text>
      </View>

      <Image source={require("@/assets/images/splash-icon.png")} style={styles.decor} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  brandWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoMark: {
    fontSize: 44,
    color: AppColors.heroText,
    fontWeight: "900",
    marginTop: -4,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "900",
    color: AppColors.heroText,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  decor: {
    position: "absolute",
    bottom: 26,
    width: 120,
    height: 120,
    opacity: 0.18,
  },
});

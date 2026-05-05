import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
    const { loading, user } = useAuth();

    if (loading) {
        return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator /></View>;
    }

    if (!user) return <Redirect href="/(auth)/login" />;
    if (user.role !== "admin") return <Redirect href="/(patient)/home" />;

    return <Stack />;
}

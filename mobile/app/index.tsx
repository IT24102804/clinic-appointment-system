import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Index() {
    const { loading, user } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#2e86de" />
            </View>
        );
    }

    if (!user) return <Redirect href="/(auth)/login" />;
    return <Redirect href={user.role === "admin" ? "/(admin)/dashboard" : "/(patient)/home"} />;
}

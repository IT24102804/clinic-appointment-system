import { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
    const { login, user } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!user) return;
        console.log("User detected, redirecting to:", user.role === "admin" ? "/(admin)/dashboard" : "/(patient)/home");
        router.replace(user.role === "admin" ? "/(admin)/dashboard" : "/(patient)/home");
    }, [user]);

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert("Login Failed", "Email and password are required.");
            return;
        }

        setBusy(true);
        try {
            console.log("Attempting login for:", email.trim());
            await login(email.trim(), password);
            console.log("Login successful");
        } catch (error: any) {
            console.log("Login error:", error?.response?.data || error.message);
            Alert.alert("Login Failed", error?.response?.data?.message || "Invalid credentials.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" }}>
            <Text style={{ fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 24 }}>Sign In</Text>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, marginBottom: 12 }}
            />
            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, marginBottom: 12 }}
            />
            <TouchableOpacity disabled={busy} onPress={handleLogin} style={{ backgroundColor: "#2e86de", padding: 13, borderRadius: 8 }}>
                <Text style={{ color: "#fff", textAlign: "center", fontWeight: "800" }}>{busy ? "Signing in..." : "Login"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={{ padding: 14 }}>
                <Text style={{ color: "#2e86de", textAlign: "center" }}>Don't have an account? Register</Text>
            </TouchableOpacity>
        </View>
    );
}

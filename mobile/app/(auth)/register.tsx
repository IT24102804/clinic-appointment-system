import { useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function RegisterScreen() {
    const { register } = useAuth();
    const [busy, setBusy] = useState(false);
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        NIC: "",
        dateOfBirth: "",
        gender: "Male",
        address: ""
    });

    const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

    const handleRegister = async () => {
        if (Object.values(form).some((value) => !String(value).trim())) {
            Alert.alert("Registration Failed", "Please fill all fields.");
            return;
        }

        setBusy(true);
        try {
            await register(form);
            router.replace("/(patient)/home");
        } catch (error: any) {
            Alert.alert("Registration Failed", error?.response?.data?.message || "Could not register.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={{ padding: 20 }}>
            <Text style={{ fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 20 }}>Register Patient</Text>
            {([
                ["firstName", "First Name"],
                ["lastName", "Last Name"],
                ["email", "Email"],
                ["password", "Password"],
                ["phone", "Phone"],
                ["NIC", "NIC"],
                ["dateOfBirth", "Date of Birth (YYYY-MM-DD)"],
                ["address", "Address"]
            ] as const).map(([key, label]) => (
                <TextInput
                    key={key}
                    placeholder={label}
                    value={form[key]}
                    onChangeText={(value) => update(key, value)}
                    secureTextEntry={key === "password"}
                    autoCapitalize={key === "email" ? "none" : "sentences"}
                    style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, marginBottom: 10 }}
                />
            ))}

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
                {["Male", "Female", "Other"].map((gender) => (
                    <TouchableOpacity
                        key={gender}
                        onPress={() => update("gender", gender)}
                        style={{ flex: 1, borderWidth: 1, borderColor: form.gender === gender ? "#2e86de" : "#d1d5db", padding: 10, borderRadius: 8 }}
                    >
                        <Text style={{ textAlign: "center", color: form.gender === gender ? "#2e86de" : "#111827", fontWeight: "700" }}>{gender}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity disabled={busy} onPress={handleRegister} style={{ backgroundColor: "#2e86de", padding: 13, borderRadius: 8 }}>
                <Text style={{ color: "#fff", textAlign: "center", fontWeight: "800" }}>{busy ? "Registering..." : "Register"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 14 }}>
                <Text style={{ color: "#2e86de", textAlign: "center" }}>Back to Login</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

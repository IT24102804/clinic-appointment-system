import { useState } from "react";
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { uploadPayment } from "../../../services/payment";

export default function PaymentScreen() {
    const router = useRouter();
    const { billingId, amount } = useLocalSearchParams();
    const [image, setImage] = useState<any>(null);
    const [reference, setReference] = useState("");
    const [method, setMethod] = useState("Bank Transfer");
    const [submitting, setSubmitting] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8
        });

        if (!result.canceled) setImage(result.assets[0]);
    };

    const submit = async () => {
        if (!image) {
            Alert.alert("Missing proof", "Please choose a payment proof image.");
            return;
        }

        const formData = new FormData();
        formData.append("billingId", String(billingId));
        formData.append("amount", String(amount));
        formData.append("method", method);
        formData.append("reference", reference);
        formData.append("proof", {
            uri: image.uri,
            name: image.fileName || "proof.jpg",
            type: image.mimeType || "image/jpeg"
        } as any);

        setSubmitting(true);
        try {
            await uploadPayment(formData);
            Alert.alert("Success", "Payment proof submitted for admin review.");
            router.back();
        } catch (error: any) {
            console.error("Payment upload failed:", error);
            Alert.alert("Error", error?.response?.data?.message || "Could not submit payment proof.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#f6f7fb", padding: 18 }}>
            <View style={{ backgroundColor: "#fff", padding: 18, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb" }}>
                <Text style={{ fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 6 }}>Upload Payment Proof</Text>
                <Text style={{ color: "#6b7280", marginBottom: 16 }}>Amount due: ${amount}</Text>

                <TextInput
                    value={method}
                    onChangeText={setMethod}
                    placeholder="Payment method"
                    style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 12, marginBottom: 10 }}
                />
                <TextInput
                    value={reference}
                    onChangeText={setReference}
                    placeholder="Reference number"
                    style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 12, marginBottom: 12 }}
                />

                <TouchableOpacity onPress={pickImage} style={{ backgroundColor: "#eef2ff", paddingVertical: 12, borderRadius: 6, alignItems: "center" }}>
                    <Text style={{ color: "#3730a3", fontWeight: "800" }}>{image ? "Change Proof Image" : "Choose Proof Image"}</Text>
                </TouchableOpacity>

                {image && <Image source={{ uri: image.uri }} style={{ height: 180, resizeMode: "contain", marginTop: 14, borderRadius: 6 }} />}

                <TouchableOpacity
                    disabled={submitting}
                    onPress={submit}
                    style={{ marginTop: 18, backgroundColor: submitting ? "#93c5fd" : "#2563eb", paddingVertical: 13, borderRadius: 6, alignItems: "center" }}
                >
                    <Text style={{ color: "#fff", fontWeight: "800" }}>{submitting ? "Submitting..." : "Submit Payment"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

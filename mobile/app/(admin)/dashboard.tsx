import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { getBills } from "../../services/billing";
import { useAuth } from "../../context/AuthContext";

const statusColors: Record<string, { bg: string; text: string }> = {
    accepted: { bg: "#dff7e9", text: "#17633a" },
    paid: { bg: "#dff7e9", text: "#17633a" },
    pending: { bg: "#fff2c7", text: "#805600" },
    pending_verification: { bg: "#dceafe", text: "#1d4ed8" },
    verified: { bg: "#dff7e9", text: "#17633a" },
    rejected: { bg: "#ffe1e1", text: "#a01313" }
};

export default function AdminDashboard() {
    const router = useRouter();
    const navigation = useNavigation();
    const { logout } = useAuth();
    const [bills, setBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBills = async () => {
        try {
            const { data } = await getBills();
            setBills(data);
        } catch (error) {
            console.error("Failed to fetch all bills:", error);
            Alert.alert("Error", "Could not load bills.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", fetchBills);
        fetchBills();
        return unsubscribe;
    }, [navigation]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchBills();
    }, []);

    const awaitingReview = useMemo(
        () => bills.filter((bill) => bill.paymentStatus === "pending_verification").length,
        [bills]
    );

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f6f7fb" }}>
                <ActivityIndicator size="large" color="#0f172a" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f6f7fb" }}>
            <FlatList
                data={bills}
                keyExtractor={(item) => item._id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                ListHeaderComponent={
                    <View style={{ padding: 18, gap: 14 }}>
                        <View style={{ backgroundColor: "#111827", padding: 20, borderRadius: 8 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                <Text style={{ color: "#fff", fontSize: 26, fontWeight: "800" }}>Admin Dashboard</Text>
                                <TouchableOpacity onPress={logout}>
                                    <Text style={{ color: "#fecaca", fontWeight: "800" }}>Logout</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={{ color: "#d1d5db", marginTop: 6, fontSize: 15 }}>View all bills and accept or reject submitted payments.</Text>
                            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                                <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.1)", padding: 12, borderRadius: 8 }}>
                                    <Text style={{ color: "#cbd5e1", fontSize: 12 }}>All Bills</Text>
                                    <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>{bills.length}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.1)", padding: 12, borderRadius: 8 }}>
                                    <Text style={{ color: "#cbd5e1", fontSize: 12 }}>Awaiting Review</Text>
                                    <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>{awaitingReview}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 24 }}
                renderItem={({ item }) => {
                    const displayStatus = item.paymentStatus === "pending_verification"
                        ? "pending"
                        : item.status === "accepted"
                            ? "accepted"
                            : item.paymentStatus === "rejected" || item.status === "rejected"
                                ? "rejected"
                                : item.status;
                    const colors = statusColors[displayStatus] || statusColors.pending;
                    const canReview = item.paymentStatus === "pending_verification" && item.paymentId;

                    return (
                        <View style={{ marginHorizontal: 18, marginBottom: 12, backgroundColor: "#fff", padding: 16, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb" }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: "#6b7280", fontSize: 12 }}>Patient</Text>
                                    <Text style={{ color: "#111827", fontSize: 17, fontWeight: "800", marginTop: 2 }}>{item.patientDisplayName || item.patientName || "Unknown Patient"}</Text>
                                    <Text style={{ color: "#6b7280", marginTop: 6 }}>Appointment: {item.appointmentId}</Text>
                                    <Text style={{ color: "#6b7280", marginTop: 4 }}>Dr. {item.doctorId?.name || "Unknown"} | Rs. {item.doctorFee}</Text>
                                </View>
                                <View style={{ backgroundColor: colors.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignSelf: "flex-start" }}>
                                    <Text style={{ color: colors.text, fontWeight: "800", fontSize: 12, textTransform: "capitalize" }}>{displayStatus.replace("_", " ")}</Text>
                                </View>
                            </View>

                            {canReview ? (
                                <TouchableOpacity
                                    style={{ marginTop: 14, backgroundColor: "#111827", paddingVertical: 12, borderRadius: 6, alignItems: "center" }}
                                    onPress={() =>
                                        router.push({
                                            pathname: "/(admin)/verify/[id]",
                                            params: {
                                                id: item._id,
                                                paymentId: item.paymentId,
                                                amount: item.totalAmount
                                            }
                                        })
                                    }
                                >
                                    <Text style={{ color: "#fff", fontWeight: "800" }}>Accept / Reject</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={{ marginTop: 14, paddingVertical: 12, borderRadius: 6, alignItems: "center", backgroundColor: "#f3f4f6" }}>
                                    <Text style={{ color: "#6b7280", fontWeight: "700" }}>No admin action</Text>
                                </View>
                            )}
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={{ alignItems: "center", marginTop: 26, paddingHorizontal: 20 }}>
                        <Text style={{ color: "#6b7280", fontSize: 15 }}>No bills in the system.</Text>
                    </View>
                }
            />
        </View>
    );
}

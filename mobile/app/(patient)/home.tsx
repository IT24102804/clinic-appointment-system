import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router, useNavigation, useRouter } from "expo-router";
import { deletePatientBill, getBillsByPatient, getDoctors, getMyPatientProfile, submitBill } from "../../services/billing";
import { useAuth } from "../../context/AuthContext";

const FALLBACK_DOCTOR_ID = "69f4767232bd05757d57b678";

const bankDetails = {
    bankName: "Commercial Bank",
    accountName: "Clinic Appointment System",
    accountNumber: "1234567890",
    branch: "Colombo"
};

type Doctor = {
    _id: string;
    name: string;
    specialization?: string;
    consultationFee?: number;
    doctorFee?: number;
    fee?: number;
};

type Patient = {
    _id: string;
    name: string;
    NIC?: string;
    phone?: string;
    email?: string;
};

const doctorName = (doctor?: Doctor) => {
    if (!doctor?.name) return "Select doctor";
    return doctor.name.trim().toLowerCase().startsWith("dr.") ? doctor.name : `Dr. ${doctor.name}`;
};

const getDoctorFee = (doctor?: Doctor) => {
    const fee = doctor?.consultationFee ?? doctor?.doctorFee ?? doctor?.fee ?? 0;
    return Number(fee) || 0;
};

const statusLabel = (bill: any) => {
    if (bill.paymentStatus === "verified" || bill.status === "accepted") return "accepted";
    if (bill.paymentStatus === "rejected" || bill.status === "rejected") return "rejected";
    return "pending";
};

const recentStatusSummary = (latestBills: any[]) => {
    const recentBills = [...latestBills]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
        .slice(0, 3);

    if (recentBills.length === 0) return "";

    return recentBills
        .map((bill) => `Appointment ${bill.appointmentId}: ${statusLabel(bill)}`)
        .join("\n");
};

const formatDate = (value?: string) => {
    if (!value) return "N/A";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toISOString().slice(0, 10);
};

export default function PatientDashboard() {
    const router = useRouter();
    const navigation = useNavigation();
    const { logout } = useAuth();
    const [bills, setBills] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [appointmentId, setAppointmentId] = useState("");
    const [selectedDoctorId, setSelectedDoctorId] = useState(FALLBACK_DOCTOR_ID);
    const [showDoctorList, setShowDoctorList] = useState(false);
    const [proofImage, setProofImage] = useState<any>(null);
    const [notification, setNotification] = useState("");
    const notifiedStatusesRef = useRef<Record<string, string>>({});

    const selectedDoctor = useMemo(
        () => doctors.find((doctor) => doctor._id === selectedDoctorId),
        [doctors, selectedDoctorId]
    );

    const doctorFee = getDoctorFee(selectedDoctor);

    const notifyStatusChanges = (latestBills: any[]) => {
        const changedBills = latestBills.filter((bill) => {
            const currentStatus = statusLabel(bill);
            const previousStatus = notifiedStatusesRef.current[bill._id];
            notifiedStatusesRef.current[bill._id] = currentStatus;
            return ["accepted", "rejected"].includes(currentStatus) && previousStatus !== currentStatus;
        });

        if (changedBills.length === 0) return;

        const firstBill = changedBills[0];
        const firstStatus = statusLabel(firstBill);
        const message = firstStatus === "accepted"
            ? `Your bill for appointment ${firstBill.appointmentId} was accepted by admin.`
            : `Your bill for appointment ${firstBill.appointmentId} was rejected by admin.`;

        setNotification(message);
        Alert.alert("Bill Status Updated", message);
    };

    const fetchDashboard = async () => {
        try {
            const [patientResult, doctorResult] = await Promise.all([
                getMyPatientProfile(),
                getDoctors()
            ]);

            const profile = patientResult.data?.data;
            const billResult = profile?._id
                ? await getBillsByPatient(profile._id)
                : { data: [] };

            setPatient(profile || null);
            setDoctors(doctorResult.data);
            notifyStatusChanges(billResult.data);
            setNotification(recentStatusSummary(billResult.data));
            setBills(billResult.data);

            if (doctorResult.data.length > 0 && !doctorResult.data.some((doctor: Doctor) => doctor._id === selectedDoctorId)) {
                setSelectedDoctorId(doctorResult.data[0]._id);
            }
        } catch (error) {
            console.error("Failed to fetch patient dashboard:", error);
            if ((error as any)?.response?.status === 401) {
                await logout();
                router.replace("/(auth)/login");
            } else {
                Alert.alert("Error", "Could not load dashboard details.");
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", fetchDashboard);
        fetchDashboard();
        return unsubscribe;
    }, [navigation]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboard();
    }, []);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8
        });

        if (!result.canceled) setProofImage(result.assets[0]);
    };

    const appendProofImage = async (formData: FormData) => {
        if (Platform.OS === "web") {
            const response = await fetch(proofImage.uri);
            const blob = await response.blob();
            const fileName = proofImage.fileName || "payment-proof.jpg";
            formData.append("proof", new File([blob], fileName, { type: blob.type || proofImage.mimeType || "image/jpeg" }));
            return;
        }

        formData.append("proof", {
            uri: proofImage.uri,
            name: proofImage.fileName || "payment-proof.jpg",
            type: proofImage.mimeType || "image/jpeg"
        } as any);
    };

    const handleSubmitBill = async () => {
        if (!appointmentId.trim()) {
            Alert.alert("Missing appointment", "Please enter the appointment ID.");
            return;
        }

        if (!patient) {
            Alert.alert("Missing patient", "Please login as a patient.");
            return;
        }

        if (!selectedDoctorId) {
            Alert.alert("Missing doctor", "Please choose a doctor.");
            return;
        }

        if (!proofImage) {
            Alert.alert("Missing proof", "Please upload the bank payment proof image.");
            return;
        }

        const formData = new FormData();
        formData.append("appointmentId", appointmentId.trim());
        formData.append("doctorId", selectedDoctorId);
        formData.append("patientId", patient._id);
        formData.append("patientName", patient.name);
        formData.append("method", "Bank Transfer");
        await appendProofImage(formData);

        setSubmitting(true);
        try {
            await submitBill(formData);
            setAppointmentId("");
            setProofImage(null);
            setShowDoctorList(false);
            Alert.alert("Submitted", "Your bill was sent to admin for review.");
            fetchDashboard();
        } catch (error: any) {
            console.error("Failed to submit bill:", error?.response?.data || error);
            Alert.alert("Error", error?.response?.data?.message || "Could not submit bill.");
        } finally {
            setSubmitting(false);
        }
    };

    const performDelete = async (id: string) => {
        if (!patient?._id) return;

        try {
            await deletePatientBill(patient._id, id);
            fetchDashboard();
        } catch (error: any) {
            console.error("Failed to delete bill:", error?.response?.data || error);
            Alert.alert("Error", error?.response?.data?.message || "Could not delete bill.");
        }
    };

    const handleDelete = async (id: string) => {
        const message = "You can delete it only before admin accepts or rejects it.";

        if (Platform.OS === "web") {
            if (window.confirm(`Delete submitted bill?\n\n${message}`)) {
                await performDelete(id);
            }
            return;
        }

        Alert.alert("Delete submitted bill?", message, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => performDelete(id)
            }
        ]);
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f4f6f8" }}>
                <ActivityIndicator size="large" color="#2e86de" />
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#f4f6f8" }} contentContainerStyle={{ padding: 20 }}>
            <View style={{ marginBottom: 16, padding: 15, backgroundColor: "white", borderRadius: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: "700" }}>Patient Dashboard</Text>
                    <TouchableOpacity onPress={logout}>
                        <Text style={{ color: "#dc2626", fontWeight: "700" }}>Logout</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => router.push("/(patient)/profile")} style={{ marginBottom: 12 }}>
                    <Text style={{ color: "#2e86de", fontWeight: "700" }}>View / Edit Patient Profile</Text>
                </TouchableOpacity>

                <TextInput
                    placeholder="Appointment ID"
                    value={appointmentId}
                    onChangeText={setAppointmentId}
                    autoCapitalize="none"
                    style={{ borderBottomWidth: 1, borderBottomColor: "#cbd5e1", marginBottom: 10, paddingVertical: 8 }}
                />

                <View style={{ marginBottom: 10 }}>
                    <Text style={{ marginBottom: 6, fontWeight: "600" }}>Doctor</Text>
                    {doctors.length > 0 ? (
                        <>
                            <View style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, backgroundColor: "#f8fafc" }}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontWeight: "700" }}>{doctorName(selectedDoctor)}</Text>
                                        <Text>{selectedDoctor?.specialization || "Doctor"} | Fee: Rs. {doctorFee}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setShowDoctorList((value) => !value)}>
                                        <Text style={{ color: "#2e86de", fontWeight: "700" }}>{showDoctorList ? "Close" : "Change"}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {showDoctorList && (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={{ marginTop: 8 }}
                                    contentContainerStyle={{ gap: 8 }}
                                >
                                    {doctors.map((doctor) => {
                                        const selected = doctor._id === selectedDoctorId;
                                        return (
                                            <TouchableOpacity
                                                key={doctor._id}
                                                onPress={() => {
                                                    setSelectedDoctorId(doctor._id);
                                                    setShowDoctorList(false);
                                                }}
                                                style={{
                                                    width: 210,
                                                    padding: 10,
                                                    borderRadius: 8,
                                                    borderWidth: 1,
                                                    borderColor: selected ? "#2e86de" : "#d1d5db",
                                                    backgroundColor: selected ? "#eaf4ff" : "#fff"
                                                }}
                                            >
                                                <Text numberOfLines={1} style={{ fontWeight: "700" }}>{doctorName(doctor)}</Text>
                                                <Text numberOfLines={1}>{doctor.specialization || "Doctor"}</Text>
                                                <Text>Fee: Rs. {getDoctorFee(doctor)}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </>
                    ) : (
                        <TextInput
                            placeholder="Doctor ID"
                            value={selectedDoctorId}
                            onChangeText={setSelectedDoctorId}
                            autoCapitalize="none"
                            style={{ borderBottomWidth: 1, borderBottomColor: "#cbd5e1", marginBottom: 10, paddingVertical: 8 }}
                        />
                    )}
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                        <Text>Patient ID: {patient?._id || "N/A"}</Text>
                        <Text>Patient Name: {patient?.name || "N/A"}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text>Doctor Fee: Rs. {doctorFee}</Text>
                    </View>
                </View>

                <View style={{ backgroundColor: "#f4f6f8", padding: 12, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={{ fontWeight: "700", marginBottom: 4 }}>Bank Details</Text>
                    <Text>Bank: {bankDetails.bankName}</Text>
                    <Text>Account Name: {bankDetails.accountName}</Text>
                    <Text>Account No: {bankDetails.accountNumber}</Text>
                    <Text>Branch: {bankDetails.branch}</Text>
                </View>

                <TouchableOpacity onPress={pickImage} style={{ backgroundColor: "#eef2ff", padding: 10, borderRadius: 8, marginBottom: 10 }}>
                    <Text style={{ color: "#3730a3", textAlign: "center" }}>{proofImage ? "Change Uploaded Image" : "Upload Payment Image"}</Text>
                </TouchableOpacity>

                {proofImage && <Image source={{ uri: proofImage.uri }} style={{ height: 120, resizeMode: "contain", marginBottom: 10 }} />}

                <TouchableOpacity
                    disabled={submitting}
                    onPress={handleSubmitBill}
                    style={{ backgroundColor: submitting ? "#8fc5f4" : "#2e86de", padding: 10, borderRadius: 8 }}
                >
                    <Text style={{ color: "white", textAlign: "center" }}>{submitting ? "Submitting..." : "Submit Bill"}</Text>
                </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10 }}>History Bills</Text>

            {notification ? (
                <View style={{ backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fdba74", padding: 12, borderRadius: 10, marginBottom: 10 }}>
                    <Text style={{ color: "#9a3412", fontWeight: "700" }}>Recent Bill Status</Text>
                    <Text style={{ color: "#9a3412", marginTop: 3, lineHeight: 20 }}>{notification}</Text>
                </View>
            ) : null}

            {bills.length > 0 ? (
                bills.map((item, index) => {
                    const currentStatus = statusLabel(item);
                    const canDelete = currentStatus === "pending";
                    const isPending = currentStatus === "pending";
                    const isAccepted = currentStatus === "accepted";
                    const badgeColors = isAccepted
                        ? { bg: "#dcfce7", text: "#166534" }
                        : isPending
                            ? { bg: "#fef3c7", text: "#92400e" }
                            : { bg: "#fee2e2", text: "#991b1b" };

                    return (
                        <View key={item._id} style={{ backgroundColor: "white", padding: 15, marginBottom: 10, borderRadius: 10 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, fontWeight: "700" }}>Appointment {item.appointmentId}</Text>
                                    <Text style={{ marginTop: 4, color: "#374151" }}>Dr. {item.doctorId?.name || "Unknown"}</Text>
                                </View>
                                <View style={{ backgroundColor: badgeColors.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
                                    <Text style={{ color: badgeColors.text, fontWeight: "700", textTransform: "capitalize" }}>{currentStatus}</Text>
                                </View>
                            </View>

                            <Text style={{ color: "#6b7280", marginTop: 8 }}>
                                Rs. {item.doctorFee} | Submitted: {formatDate(item.createdAt)}
                            </Text>

                            <View style={{ flexDirection: "row", marginTop: 10 }}>
                                <TouchableOpacity onPress={() => router.push({ pathname: "/(patient)/billing/[id]", params: { id: item._id } })}>
                                    <Text style={{ color: "#2e86de", marginRight: 15 }}>View</Text>
                                </TouchableOpacity>

                                {canDelete && (
                                    <TouchableOpacity onPress={() => handleDelete(item._id)}>
                                        <Text style={{ color: "red" }}>Delete</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                })
            ) : (
                <View style={{ backgroundColor: "white", padding: 15, borderRadius: 10 }}>
                    <Text>No history bills found.</Text>
                </View>
            )}

            <TouchableOpacity onPress={handleRefresh} style={{ padding: 12, alignItems: "center" }}>
                <Text style={{ color: "#2e86de" }}>{refreshing ? "Refreshing..." : "Refresh History"}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

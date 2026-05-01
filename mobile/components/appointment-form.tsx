import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppColors } from "@/constants/design";
import { AppointmentPayload, AppointmentStatus } from "@/types/appointment";

type AppointmentFormProps = {
  initialValue?: AppointmentPayload;
  submitLabel: string;
  busy?: boolean;
  error?: string | null;
  prefillDoctorId?: string;
  onSubmit: (payload: AppointmentPayload) => Promise<void> | void;
};

const STATUS_OPTIONS: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no-show",
];

const EMPTY_FORM: AppointmentPayload = {
  patientId: "",
  doctorId: "",
  appointmentDate: "",
  reason: "",
  notes: "",
  status: "pending",
};

function cloneFormValue(value?: AppointmentPayload): AppointmentPayload {
  if (!value) {
    return { ...EMPTY_FORM };
  }

  return {
    patientId: value.patientId || "",
    doctorId: value.doctorId || "",
    appointmentDate: value.appointmentDate
      ? new Date(value.appointmentDate).toISOString().slice(0, 16)
      : "",
    reason: value.reason || "",
    notes: value.notes || "",
    status: value.status || "pending",
  };
}

function formatDateForDisplay(isoString: string): string {
  if (!isoString) {
    return "";
  }

  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return isoString;
    }
    return d.toLocaleString();
  } catch {
    return isoString;
  }
}

export function AppointmentForm({
  initialValue,
  submitLabel,
  busy = false,
  error,
  prefillDoctorId,
  onSubmit,
}: AppointmentFormProps) {
  const [form, setForm] = useState<AppointmentPayload>(() => {
    const base = cloneFormValue(initialValue);
    if (prefillDoctorId && !base.doctorId) {
      base.doctorId = prefillDoctorId;
    }
    return base;
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const base = cloneFormValue(initialValue);
    if (prefillDoctorId && !base.doctorId) {
      base.doctorId = prefillDoctorId;
    }
    setForm(base);
  }, [initialValue, prefillDoctorId]);

  function updateField<Key extends keyof AppointmentPayload>(
    key: Key,
    value: AppointmentPayload[Key]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function applyQuickDate(offsetDays: number) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(9, 0, 0, 0);
    updateField("appointmentDate", d.toISOString().slice(0, 16));
  }

  async function handleSubmit() {
    const trimmed: AppointmentPayload = {
      ...form,
      patientId: form.patientId.trim(),
      doctorId: form.doctorId.trim(),
      appointmentDate: form.appointmentDate.trim(),
      reason: form.reason.trim(),
      notes: form.notes?.trim() || "",
    };

    if (!trimmed.patientId || !trimmed.doctorId) {
      setFormError("Patient ID and Doctor ID are both required.");
      return;
    }

    if (!trimmed.appointmentDate) {
      setFormError("Please enter an appointment date and time.");
      return;
    }

    const parsed = new Date(trimmed.appointmentDate);
    if (isNaN(parsed.getTime())) {
      setFormError(
        "Invalid date format. Use YYYY-MM-DDTHH:MM (e.g. 2026-05-10T09:30)."
      );
      return;
    }

    trimmed.appointmentDate = parsed.toISOString();

    if (!trimmed.reason) {
      setFormError("Please provide a reason for the appointment.");
      return;
    }

    setFormError(null);
    await onSubmit(trimmed);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Patient & doctor</Text>
      <AppInput
        placeholder="Patient ID"
        value={form.patientId}
        onChangeText={(value) => updateField("patientId", value)}
        autoCapitalize="none"
      />
      <AppInput
        placeholder="Doctor ID"
        value={form.doctorId}
        onChangeText={(value) => updateField("doctorId", value)}
        autoCapitalize="none"
      />

      <Text style={styles.sectionLabel}>Appointment date & time</Text>
      <AppInput
        placeholder="YYYY-MM-DDTHH:MM (e.g. 2026-05-10T09:30)"
        value={form.appointmentDate}
        onChangeText={(value) => updateField("appointmentDate", value)}
        autoCapitalize="none"
      />
      {form.appointmentDate ? (
        <Text style={styles.datePreview}>
          Preview: {formatDateForDisplay(form.appointmentDate)}
        </Text>
      ) : null}
      <View style={styles.quickDateRow}>
        <AppButton
          label="Tomorrow"
          onPress={() => applyQuickDate(1)}
          variant="secondary"
          style={styles.quickDateButton}
        />
        <AppButton
          label="In 3 days"
          onPress={() => applyQuickDate(3)}
          variant="secondary"
          style={styles.quickDateButton}
        />
        <AppButton
          label="In 1 week"
          onPress={() => applyQuickDate(7)}
          variant="secondary"
          style={styles.quickDateButton}
        />
      </View>

      <Text style={styles.sectionLabel}>Visit details</Text>
      <AppInput
        placeholder="Reason for visit"
        value={form.reason}
        onChangeText={(value) => updateField("reason", value)}
      />
      <AppInput
        placeholder="Additional notes (optional)"
        value={form.notes}
        onChangeText={(value) => updateField("notes", value)}
        multiline
      />

      <Text style={styles.sectionLabel}>Status</Text>
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map((status) => {
          const selected = form.status === status;
          return (
            <AppButton
              key={status}
              label={status.toUpperCase()}
              onPress={() => updateField("status", status)}
              variant={selected ? "primary" : "secondary"}
              style={styles.statusButton}
            />
          );
        })}
      </View>

      {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AppButton
        label={submitLabel}
        onPress={() => void handleSubmit()}
        busy={busy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.text,
  },
  datePreview: {
    fontSize: 13,
    color: AppColors.accent,
    fontStyle: "italic",
  },
  quickDateRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickDateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statusButton: {
    minWidth: 100,
    paddingVertical: 10,
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});

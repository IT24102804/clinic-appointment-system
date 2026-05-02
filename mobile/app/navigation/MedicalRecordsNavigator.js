import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MedicalRecordListScreen from "../screens/MedicalRecords/MedicalRecordListScreen";
import MedicalRecordDetailScreen from "../screens/MedicalRecords/MedicalRecordDetailScreen";
import MedicalRecordCreateEditScreen from "../screens/MedicalRecords/MedicalRecordCreateEditScreen";

const Stack = createNativeStackNavigator();

export function MedicalRecordsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#2563eb" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen
        name="MedicalRecordList"
        component={MedicalRecordListScreen}
        options={{ title: "Medical Records" }}
      />
      <Stack.Screen
        name="MedicalRecordDetail"
        component={MedicalRecordDetailScreen}
        options={{ title: "Record Details" }}
      />
      <Stack.Screen
        name="MedicalRecordCreateEdit"
        component={MedicalRecordCreateEditScreen}
        options={({ route }) => ({
          title: route.params?.record ? "Edit Record" : "New Record",
        })}
      />
    </Stack.Navigator>
  );
}
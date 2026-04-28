export type PatientProfile = {
  _id: string;
  userId:
    | string
    | {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        profileImage?: string;
      };
  NIC: string;
  phone: string;
  dateOfBirth: string;
  gender: "Male" | "Female" | "Other";
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

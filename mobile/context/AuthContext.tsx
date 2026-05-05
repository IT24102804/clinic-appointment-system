import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { setAuthToken } from "../services/api";

type AuthUser = {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: "patient" | "admin" | "doctor" | string;
};

type RegisterPayload = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    NIC: string;
    dateOfBirth: string;
    gender: string;
    address: string;
};

type AuthContextValue = {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const memoryStore = new Map<string, string>();

const readItem = (key: string) => {
    if (typeof localStorage !== "undefined") return localStorage.getItem(key);
    return memoryStore.get(key) || null;
};

const writeItem = (key: string, value: string) => {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    memoryStore.set(key, value);
};

const removeItems = (keys: string[]) => {
    keys.forEach((key) => {
        if (typeof localStorage !== "undefined") localStorage.removeItem(key);
        memoryStore.delete(key);
    });
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = readItem("accessToken");
        const storedUser = readItem("user");

        if (token) setAuthToken(token);
        if (storedUser) setUser(JSON.parse(storedUser));

        setLoading(false);
    }, []);

    const value = useMemo<AuthContextValue>(() => ({
        user,
        loading,
        async login(email, password) {
            const response = await api.post("/auth/login", { email, password });
            const { accessToken, refreshToken, user: responseUser } = response.data;
            writeItem("accessToken", accessToken);
            writeItem("refreshToken", refreshToken);
            writeItem("user", JSON.stringify(responseUser));
            setAuthToken(accessToken);
            setUser(responseUser);
        },
        async register(payload) {
            const response = await api.post("/auth/register", payload);
            const { accessToken, refreshToken, user: responseUser } = response.data;
            writeItem("accessToken", accessToken);
            writeItem("refreshToken", refreshToken);
            writeItem("user", JSON.stringify(responseUser));
            setAuthToken(accessToken);
            setUser(responseUser);
        },
        async logout() {
            try {
                await api.post("/auth/logout");
            } finally {
                removeItems(["accessToken", "refreshToken", "user"]);
                setAuthToken(null);
                setUser(null);
            }
        }
    }), [loading, user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}

import jwt from "jsonwebtoken";

// 🔐 Protect routes (JWT)
export const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded; // { userId, role }

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// 👨‍💼 Admin only
export const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access only" });
    }
    next();
};

// 👤 Patient only
export const isPatient = (req, res, next) => {
    if (!req.user || req.user.role !== "patient") {
        return res.status(403).json({ message: "Patient access only" });
    }
    next();
};
import crypto from "crypto";

const tokenSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "clinicapp_dev_secret";

export const signToken = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", tokenSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
};

export const verifyToken = (token) => {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature) return null;

  const expected = crypto.createHmac("sha256", tokenSecret()).update(body).digest("base64url");
  if (Buffer.byteLength(signature) !== Buffer.byteLength(expected)) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
};

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authorization token required." });
  }

  const payload = verifyToken(authHeader.slice("Bearer ".length).trim());
  if (!payload?.id) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }

  req.user = { id: payload.id, role: payload.role };
  next();
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated." });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Forbidden." });
  }

  next();
};

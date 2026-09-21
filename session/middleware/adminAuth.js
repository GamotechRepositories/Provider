export function requireAdminKey(req, res, next) {
  const requiredKey = process.env.ADMIN_API_KEY;

  if (!requiredKey) {
    return res.status(503).json({
      success: false,
      message: "Admin API is not configured",
    });
  }

  const providedKey = req.headers["x-admin-key"];

  if (!providedKey || providedKey !== requiredKey) {
    return res.status(401).json({
      success: false,
      message: "Valid X-Admin-Key header is required",
    });
  }

  return next();
}

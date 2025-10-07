// Simple validation helpers and middleware for common patterns

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function isNonEmptyString(value, { maxLength = 255 } = {}) {
  if (value === undefined || value === null) return false;
  const s = String(value).trim();
  return s.length > 0 && s.length <= maxLength;
}

function validate(fields) {
  return (req, res, next) => {
    for (const rule of fields) {
      const { path, required = false, type = 'string', maxLength, enumValues, regex } = rule;
      const value = path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), req.body);

      if (required && (value === undefined || value === null || String(value).trim() === '')) {
        return res.status(400).json({ error: `Missing required field: ${path}` });
      }
      if (value === undefined || value === null) continue;

      const s = String(value);
      if (type === 'string') {
        if (maxLength && s.length > maxLength) {
          return res.status(400).json({ error: `${path} exceeds max length ${maxLength}` });
        }
      }
      if (enumValues && !enumValues.includes(s)) {
        return res.status(400).json({ error: `${path} must be one of: ${enumValues.join(', ')}` });
      }
      if (regex && !regex.test(s)) {
        return res.status(400).json({ error: `${path} has invalid format` });
      }
    }
    next();
  };
}

module.exports = {
  validate,
  emailRegex,
  strongPasswordRegex,
  isNonEmptyString,
};



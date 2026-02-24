// Admin credentials encoder/decoder utility
// Credentials are encoded in base64 to avoid plain text exposure
// Format: "encodedEmail:encodedPassword"

// To encode new credentials:
// console.log(Buffer.from("email@domain.com").toString('base64'))
// console.log(Buffer.from("password").toString('base64'))

const ADMIN_CREDENTIALS = "YWNhZGVteUB2aWFsaWZlY29hY2gub3JnOkFjYWRlbUA=";

export function getAdminCredentials() {
  try {
    const decoded = Buffer.from(ADMIN_CREDENTIALS, 'base64').toString('utf-8');
    const [email, password] = decoded.split(':');
    return { email, password };
  } catch (error) {
    console.error("Failed to decode admin credentials:", error);
    return { email: null, password: null };
  }
}

export function validateAdminCredentials(inputEmail, inputPassword) {
  const { email, password } = getAdminCredentials();
  return email === inputEmail && password === inputPassword;
}

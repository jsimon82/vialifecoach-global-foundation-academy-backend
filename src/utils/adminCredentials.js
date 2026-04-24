// Admin credentials utility
// Uses environment variables for secure credential management

export function getAdminCredentials() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    
    if (!email || !password) {
      console.error("Admin credentials not found in environment variables");
      return { email: null, password: null };
    }
    
    return { email, password };
  } catch (error) {
    console.error("Failed to get admin credentials:", error);
    return { email: null, password: null };
  }
}

export function validateAdminCredentials(inputEmail, inputPassword) {
  const { email, password } = getAdminCredentials();
  return email === inputEmail && password === inputPassword;
}

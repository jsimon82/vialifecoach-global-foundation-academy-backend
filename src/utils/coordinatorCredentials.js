import bcrypt from 'bcrypt';

export function getCoordinatorCredentials() {
  try {
    const email = process.env.COORDINATOR_EMAIL || process.env.VITE_COORDINATOR_EMAIL;
    const password = process.env.COORDINATOR_PASSWORD || process.env.VITE_COORDINATOR_PASSWORD;
    
    if (!email || !password) {
      console.error("Coordinator credentials not found in environment variables");
      console.log("Looking for COORDINATOR_EMAIL and COORDINATOR_PASSWORD or VITE_COORDINATOR_EMAIL and VITE_COORDINATOR_PASSWORD");
      return { email: null, password: null, passwordHash: null };
    }
    
    // Hash password for database comparison
    const passwordHash = bcrypt.hashSync(password, 12);
    
    return { email, password, passwordHash };
  } catch (error) {
    console.error("Failed to get coordinator credentials:", error);
    return { email: null, password: null, passwordHash: null };
  }
}

import fetch from "node-fetch";

const res = await fetch("http://localhost:5500/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "academy@vialifecoach.org", password: "Academy@" }),
});

const data = await res.json();
console.log("Status:", res.status);
console.log("Response:", JSON.stringify(data, null, 2));

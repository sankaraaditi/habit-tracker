"use client";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function GoogleProvider({ children }) {
  return (
    <GoogleOAuthProvider clientId="395296237399-79irr1ro9tpuqj8beoqfs1e86gutf2ud.apps.googleusercontent.com">
      {children}
    </GoogleOAuthProvider>
  );
}
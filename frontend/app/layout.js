import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GoogleProvider from "./GoogleProvider";

const geist = Geist({ subsets: ["latin"] });

export const metadata = { title: "Habit Tracker", description: "Daily habit tracker" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <GoogleProvider>
          {children}
        </GoogleProvider>
      </body>
    </html>
  );
}
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RecipeProvider } from "../context/RecipeContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackgroundFX from "../components/BackgroundFX";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Zaika AI – Intelligent Recipe Generator",
  description: "AI powered personalized & fasting-friendly Indian recipes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col relative`}
      >
        <BackgroundFX />
        <RecipeProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-5 sm:px-8 py-10 animate-fade-up">
            {children}
          </main>
          <Footer />
        </RecipeProvider>
      </body>
    </html>
  );
}

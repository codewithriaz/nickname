import { DM_Sans, Hind_Siliguri, Inter, Lora, Outfit, Playfair_Display, Poppins, Space_Grotesk } from "next/font/google";

/** App UI fonts + every font a profile theme can pick (see src/config/fonts.ts). */
export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins", display: "swap", preload: false });
const dmsans = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans", display: "swap", preload: false });
const spacegrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-spacegrotesk", display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap", preload: false });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap", preload: false });
const hindsiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hindsiliguri",
  display: "swap",
  preload: false,
});

export const fontVariables = [inter, outfit, poppins, dmsans, spacegrotesk, playfair, lora, hindsiliguri].map((f) => f.variable).join(" ");

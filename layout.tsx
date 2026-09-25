import "./globals.css";
import type { Metadata } from "next";
export const metadata:Metadata={title:"AI Add-on Studio",description:"Multi-AI Minecraft Bedrock add-on factory"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
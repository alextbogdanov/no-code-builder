// ============================================================================
// ### IMPORTS ###
// ============================================================================
import type { Metadata } from "next";

// ============================================================================
// ### COMPONENTS ###
// ============================================================================
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Toaster } from "react-hot-toast";

// ============================================================================
// ### ASSETS ###
// ============================================================================
import "./globals.css";

// ============================================================================
// ### CONFIGURATIONS ###
// ============================================================================
export const metadata: Metadata = {
	title: "StartupLab - Turn Your Idea Into Reality",
	description:
		"Validate your startup idea with instant market analysis, then watch as your custom app is built automatically. No coding or technical skills required.",
	keywords: ["startup", "entrepreneur", "business", "idea validation", "market analysis", "app builder", "no-code"],
};

// ============================================================================
// ### CUSTOM ###
// ============================================================================
export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="dark">
			<head>
				<link rel="icon" href="/favicon.ico" />
			</head>
			<body className="font-body antialiased">
				<ConvexClientProvider>
					{children}
					<Toaster
						position="top-right"
						toastOptions={{
							style: {
								background: "#1a1b3a",
								color: "#fff",
								border: "1px solid #3d3e6b",
							},
							success: {
								iconTheme: {
									primary: "#00f5d4",
									secondary: "#0c0d24",
								},
							},
						}}
					/>
				</ConvexClientProvider>
			</body>
		</html>
	);
}

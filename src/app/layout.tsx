import { Outfit } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';
import "flatpickr/dist/flatpickr.css";

import { ThemeProvider } from '@/context/ThemeContext';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} dark:bg-gray-900`} suppressHydrationWarning={true}>
        <NextTopLoader color="#3758F9" showSpinner={false} />
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

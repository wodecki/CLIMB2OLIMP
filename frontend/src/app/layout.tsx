import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Doradca Dojrzałości GenAI',
  description: 'Wypełnij ten kwestionariusz, aby otrzymać szczegółową analizę i rekomendacje dla swoich wyzwań zarządczych.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={inter.className} suppressHydrationWarning={true}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm">
            <div className="container mx-auto px-4 py-4">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold text-gray-900">Doradca Dojrzałości GenAI</h1>
                <nav>
                  <ul className="flex space-x-4">
                    <li>
                      <a href="/" className="text-blue-600 hover:text-blue-800">
                        Kwestionariusz
                      </a>
                    </li>
                    <li>
                      <a href="/about" className="text-gray-600 hover:text-gray-800">
                        O aplikacji
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </header>
          {children}
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-600 text-sm">
                  &copy; {new Date().getFullYear()} Doradca Dojrzałości GenAI. Wszelkie prawa zastrzeżone.
                </p>
                <div className="mt-4 md:mt-0">
                  <p className="text-gray-500 text-sm">
                    Napędzane przez LangGraph i Next.js
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

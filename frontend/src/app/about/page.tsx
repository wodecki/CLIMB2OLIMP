import React from 'react';
import Link from 'next/link';

export default function About() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">O Rozwiązywaczu Problemów Zarządczych</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Przegląd</h2>
          <p className="text-gray-700 mb-4">
            Rozwiązywacz Problemów Zarządczych to zaawansowane narzędzie zaprojektowane w celu pomocy organizacjom w diagnozowaniu i rozwiązywaniu wyzwań zarządczych. Wykorzystując system wieloagentowy zbudowany z LangGraph, dostarcza szczegółową analizę i praktyczne rekomendacje oparte na twoich odpowiedziach w kwestionariuszu.
          </p>
          <p className="text-gray-700 mb-4">
            Ta aplikacja wykorzystuje zaawansowane techniki AI do symulacji zespołu wyspecjalizowanych analityków, każdy skupiający się na różnych aspektach zarządzania i rozwoju organizacyjnego.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Jak to Działa</h2>
          <ol className="list-decimal pl-6 space-y-3 text-gray-700">
            <li>
              <strong>Uzupełnij Kwestionariusz</strong> - Odpowiedz na pytania w różnych kategoriach związanych z praktykami zarządzania w twojej organizacji.
            </li>
            <li>
              <strong>Analiza AI</strong> - Nasz system wieloagentowy przetwarza twoje odpowiedzi, przy czym każdy agent analizuje konkretne aspekty twojej organizacji.
            </li>
            <li>
              <strong>Kompleksowy Raport</strong> - Otrzymaj szczegółowy raport z diagnozą, rekomendacjami i mapą drogową wdrożenia.
            </li>
            <li>
              <strong>Wdrożenie</strong> - Użyj spostrzezeń i rekomendacji, aby poprawić praktyki zarządzania w twojej organizacji.
            </li>
          </ol>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Nasz Zespół Analityków</h2>
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900">Analityk Zarządzania Danymi</h3>
              <p className="text-gray-600">Skupia się na jakości, dostępności i bezpieczeństwie danych w celu wsparcia adoptacji AI.</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900">Specjalista ds. Zarządzania Zmianą</h3>
              <p className="text-gray-600">Specjalizuje się w strukturach zespołowych, programach szkoleniowych i rozwoju organizacyjnym.</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900">Konsultant ds. Usprawniania Procesów</h3>
              <p className="text-gray-600">Bada przepływy pracy i procesy w celu identyfikacji nieefektywności i możliwości integracji AI.</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900">Doradca ds. Nauki o Decyzjach</h3>
              <p className="text-gray-600">Prowadzi strategiczne podejmowanie decyzji i ustanawia ramy zarządzania dla rozwiązań AI.</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900">Specjalista ds. Wdrożeń Technicznych</h3>
              <p className="text-gray-600">Nadzoruje projektowanie techniczne i integrację platform AI z istniejącymi systemami.</p>
            </div>
          </div>
        </section>
        
        <div className="mt-8 text-center">
          <Link 
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Rozpocznij Kwestionariusz
          </Link>
        </div>
      </div>
    </main>
  );
}

import Image from 'next/image'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-green-600">WitaLine</h1>
      <p className="mt-4 text-lg">Automatyczna recepcja AI</p>
      <a href="/dashboard" className="mt-8 px-6 py-3 bg-green-500 text-white rounded-lg">
        Wejdź do panelu
      </a>
    </main>
  )
}

export default function({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head><title>WitaLine - Recepcja AI</title></head>
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}

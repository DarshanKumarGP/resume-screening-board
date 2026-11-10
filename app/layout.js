import './globals.css'

export const metadata = {
  title: 'Resume screening board',
  description: 'Compare resumes against the LCA Consultant and UI/UX Intern roles.'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

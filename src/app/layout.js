import './globals.css';

export const metadata = {
  title: 'Mission Control',
  description: 'Unified command center for automation, deployments, inbox, and key vault',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="mission-control-body">{children}</body>
    </html>
  );
}

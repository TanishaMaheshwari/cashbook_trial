import SettingsClient from '@/components/settings/SettingsClient';
import { getBooks } from '@/lib/data';
import Header from '@/components/layout/Header';

export default async function SettingsPage() {
  const books = await getBooks();
  return (
    <>
      <Header />
      <SettingsClient initialBooks={books} />
    </>
  );
}

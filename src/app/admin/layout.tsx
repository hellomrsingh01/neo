import Header from "@/components/dashboard/Header";
import Footer from "@/components/dashboard/Footer";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-[#003c33] text-white">
      <Header />
      <main className="w-full flex-1 px-4 pt-6 sm:px-6">
        <div className="mx-auto w-full max-w-[1240px]">{children}</div>
      </main>
      <div className="w-full px-4 pb-6 sm:px-6">
        <div className="mx-auto w-full max-w-[1240px]">
          <Footer />
        </div>
      </div>
    </div>
  );
}

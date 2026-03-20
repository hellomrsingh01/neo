import Header from "@/components/dashboard/Header";
import Footer from "@/components/dashboard/Footer";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Dashboard Layout Wrapper
    <div className="min-h-screen bg-[#003c33] text-white">
      <Header />
      <div className="w-full px-4 pb-10 pt-6 sm:px-6">
        {children}
        <Footer />
      </div>
    </div>
  );
}


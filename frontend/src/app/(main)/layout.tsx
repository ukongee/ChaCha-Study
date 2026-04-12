import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import WelcomeGate from "@/components/layout/WelcomeGate";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <WelcomeGate>
      <div className="flex min-h-screen bg-[#F0F4FF]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </WelcomeGate>
  );
}

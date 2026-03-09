import DashboardSidebar from "@/components/DashboardSidebar";
import TopBar from "@/components/TopBar";
import CommandPalette from "@/components/CommandPalette";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-50 text-slate-900">
            <DashboardSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar />
                <main className="flex-1 overflow-y-auto md:pt-0 pt-12">
                    <div className="px-6 py-6 max-w-7xl mx-auto">{children}</div>
                </main>
            </div>
            <CommandPalette />
        </div>
    );
}

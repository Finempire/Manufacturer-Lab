import DashboardSidebar from "@/components/DashboardSidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-gray-50 text-gray-900">
            <DashboardSidebar />
            <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}

"use client";
import { FileText } from "lucide-react";
export default function MerchandiserTechPacksPage() {
    return (
        <div className="space-y-6">
            <div><h1 className="text-xl font-bold text-gray-900">Tech Packs</h1><p className="text-sm text-gray-500 mt-1">View and edit your assigned tech packs</p></div>
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No tech packs assigned to you</p>
            </div>
        </div>
    );
}

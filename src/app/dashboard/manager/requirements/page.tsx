"use client";
import { ClipboardList } from "lucide-react";
export default function RequirementsPage() {
    return (
        <div className="space-y-6">
            <div><h1 className="text-xl font-bold text-gray-900">Material Requirements</h1><p className="text-sm text-gray-500 mt-1">View requirements from Production Manager</p></div>
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No material requirements received</p>
            </div>
        </div>
    );
}

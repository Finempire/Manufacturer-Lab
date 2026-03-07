"use client";
import { ShoppingCart } from "lucide-react";
export default function MyPurchasesPage() {
    return (
        <div className="space-y-6">
            <div><h1 className="text-xl font-bold text-gray-900">My Purchases</h1><p className="text-sm text-gray-500 mt-1">View all purchases you have made</p></div>
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No purchases submitted yet</p>
            </div>
        </div>
    );
}

"use client";
import { Receipt } from "lucide-react";
export default function ExpenseRequestsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Expense Requests</h1>
                <p className="text-sm text-gray-500 mt-1">Review and process expense claims</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No expense requests pending</p>
                <p className="text-gray-400 text-xs mt-1">When team members raise expense requests, they will appear here</p>
            </div>
        </div>
    );
}

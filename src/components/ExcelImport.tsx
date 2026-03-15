"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

type EntityType = "buyers" | "vendors" | "materials" | "styles";

interface RowResult {
  row: number;
  data: Record<string, string>;
  status: "success" | "error" | "duplicate";
  error?: string;
}

interface ImportResult {
  mode: string;
  totalRows: number;
  successCount?: number;
  inserted?: number;
  errorCount: number;
  duplicateCount: number;
  results: RowResult[];
}

interface Props {
  entityType: EntityType;
  onComplete?: () => void;
}

const ENTITY_LABELS: Record<EntityType, string> = {
  buyers: "Buyers",
  vendors: "Vendors",
  materials: "Materials",
  styles: "Styles",
};

export default function ExcelImport({ entityType, onComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [committed, setCommitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    window.open(`/api/master/import?entity_type=${entityType}`, "_blank");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setPreview(null);
    setCommitted(false);

    // Auto-preview
    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("entity_type", entityType);
    formData.append("mode", "preview");

    try {
      const res = await fetch("/api/master/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed");
      setPreview(data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to preview file"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("entity_type", entityType);
    formData.append("mode", "commit");

    try {
      const res = await fetch("/api/master/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setPreview(data);
      setCommitted(true);
      toast.success(`${data.inserted} ${ENTITY_LABELS[entityType]} imported`);
      onComplete?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setCommitted(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = () => {
    reset();
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
      >
        <Upload className="w-4 h-4" />
        Import
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={close}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Import {ENTITY_LABELS[entityType]}
                </h2>
              </div>
              <button
                onClick={close}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Step 1: Download Template */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    1. Download Template
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fill in the Excel template with your data
                  </p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                >
                  <Download className="w-4 h-4" />
                  Template
                </button>
              </div>

              {/* Step 2: Upload File */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-900 mb-2">
                  2. Upload Filled File
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              {loading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-slate-600">
                    Processing...
                  </span>
                </div>
              )}

              {/* Step 3: Preview Results */}
              {preview && !loading && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-900">
                    3. Validation Preview
                  </p>

                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
                      <p className="text-xl font-bold text-green-700">
                        {preview.successCount ?? preview.inserted ?? 0}
                      </p>
                      <p className="text-xs text-green-600 mt-0.5">
                        {committed ? "Imported" : "Valid"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-center">
                      <p className="text-xl font-bold text-red-700">
                        {preview.errorCount}
                      </p>
                      <p className="text-xs text-red-600 mt-0.5">Errors</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-center">
                      <p className="text-xl font-bold text-amber-700">
                        {preview.duplicateCount}
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Duplicates
                      </p>
                    </div>
                  </div>

                  {/* Row details - only show errors and duplicates */}
                  {preview.results.filter((r) => r.status !== "success")
                    .length > 0 && (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">
                              Row
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">
                              Status
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">
                              Issue
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {preview.results
                            .filter((r) => r.status !== "success")
                            .slice(0, 50)
                            .map((r, i) => (
                              <tr key={i}>
                                <td className="px-3 py-2 text-sm text-slate-900 tabular-nums">
                                  {r.row}
                                </td>
                                <td className="px-3 py-2">
                                  {r.status === "error" ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                                      <XCircle className="w-3.5 h-3.5" /> Error
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                      <AlertTriangle className="w-3.5 h-3.5" />{" "}
                                      Duplicate
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-xs text-slate-600">
                                  {r.error}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={close}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-white transition"
              >
                {committed ? "Close" : "Cancel"}
              </button>
              <div className="flex items-center gap-3">
                {preview && !committed && (
                  <button
                    onClick={reset}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                  >
                    Reset
                  </button>
                )}
                {preview &&
                  !committed &&
                  (preview.successCount ?? 0) > 0 && (
                    <button
                      onClick={handleCommit}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Import {preview.successCount} Records
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

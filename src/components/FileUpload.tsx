import { useState, useRef } from "react";
import { UploadCloud, File, Image as ImageIcon, CheckCircle, XCircle, X } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
    type: "PROVISIONAL_INVOICE" | "TAX_INVOICE" | "PAYMENT_PROOF" | "TECH_PACK_DOC" | "EXPENSE_ATTACHMENT";
    entityId: string;
    onUploadSuccess: (relativePath: string) => void;
    accept?: string;
    maxSizeMB?: number;
}

export default function FileUpload({ type, entityId, onUploadSuccess, accept = "image/*,application/pdf", maxSizeMB = 10 }: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<"idle" | "selected" | "uploading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        if (selected.size > maxSizeMB * 1024 * 1024) {
            setStatus("error");
            setErrorMsg(`File size must be less than ${maxSizeMB}MB`);
            return;
        }

        setFile(selected);
        setStatus("selected");
        setErrorMsg("");
    };

    const handleUpload = async () => {
        if (!file) return;

        setStatus("uploading");
        setProgress(0);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);
        formData.append("entity_id", entityId);

        try {
            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    setProgress(percentComplete);
                }
            };

            const response = await new Promise((resolve, reject) => {
                xhr.open("POST", "/api/upload");
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            resolve(JSON.parse(xhr.responseText));
                        } catch (e) {
                            resolve(xhr.responseText);
                        }
                    } else {
                        reject(new Error(xhr.responseText || "Upload failed"));
                    }
                };
                xhr.onerror = () => reject(new Error("Network error"));
                xhr.send(formData);
            });

            const data = response as { path: string };
            setStatus("success");
            onUploadSuccess(data.path);
        } catch (error) {
            setStatus("error");
            setErrorMsg(error instanceof Error ? error.message : "Upload failed");
            toast.error("File upload failed");
        }
    };

    const clearFile = () => {
        setFile(null);
        setStatus("idle");
        setProgress(0);
        setErrorMsg("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="w-full">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={accept}
                className="hidden"
            />

            {status === "idle" && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors bg-white"
                >
                    <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-700">Tap to upload or take photo</p>
                    <p className="text-xs text-slate-500 mt-1">Images or PDF up to {maxSizeMB}MB</p>
                </div>
            )}

            {(status === "selected" || status === "uploading" || status === "error") && file && (
                <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                {file.type.includes("image") ? <ImageIcon className="w-5 h-5" /> : <File className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        {status !== "uploading" && (
                            <button onClick={clearFile} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {status === "error" && (
                        <div className="mt-3 text-xs text-red-600 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" /> {errorMsg}
                        </div>
                    )}

                    {status === "uploading" && (
                        <div className="mt-3">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Uploading...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-blue-600 h-1.5 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}

                    {status === "selected" && (
                        <div className="mt-4 flex gap-2">
                            <button onClick={handleUpload} className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
                                Upload Now
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition">
                                Change File
                            </button>
                        </div>
                    )}
                </div>
            )}

            {status === "success" && file && (
                <div className="border border-green-200 bg-green-50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                            <p className="text-sm font-medium text-green-900 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                            <p className="text-xs text-green-700">Upload complete</p>
                        </div>
                    </div>
                    <button onClick={clearFile} className="text-xs font-medium text-green-800 hover:text-green-900 underline">
                        Change
                    </button>
                </div>
            )}
        </div>
    );
}

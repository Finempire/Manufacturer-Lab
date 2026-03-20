import { useState, useRef } from "react";
import { UploadCloud, File, Image as ImageIcon, CheckCircle, XCircle, X } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
    type: "INVOICE" | "PROVISIONAL_INVOICE" | "TAX_INVOICE" | "PAYMENT_PROOF" | "EXPENSE_ATTACHMENT";
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
                    className="border-2 border-dashed border-border-secondary rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-3 transition-colors bg-surface-1"
                >
                    <UploadCloud className="w-8 h-8 text-foreground-muted mb-2" />
                    <p className="text-sm font-medium text-foreground-secondary">Tap to upload or take photo</p>
                    <p className="text-xs text-foreground-tertiary mt-1">Images or PDF up to {maxSizeMB}MB</p>
                </div>
            )}

            {(status === "selected" || status === "uploading" || status === "error") && file && (
                <div className="border border-border-secondary rounded-xl p-4 bg-surface-1 shadow-premium-sm">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-muted text-brand rounded-lg">
                                {file.type.includes("image") ? <ImageIcon className="w-5 h-5" /> : <File className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                                <p className="text-xs text-foreground-tertiary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        {status !== "uploading" && (
                            <button onClick={clearFile} className="p-1 text-foreground-muted hover:text-foreground-secondary rounded">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {status === "error" && (
                        <div className="mt-3 text-xs text-red-400 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" /> {errorMsg}
                        </div>
                    )}

                    {status === "uploading" && (
                        <div className="mt-3">
                            <div className="flex justify-between text-xs text-foreground-tertiary mb-1">
                                <span>Uploading...</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-surface-3 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-brand h-1.5 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}

                    {status === "selected" && (
                        <div className="mt-4 flex gap-2">
                            <button onClick={handleUpload} className="flex-1 px-3 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-hover transition">
                                Upload Now
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="flex-1 px-3 py-2 text-sm font-medium text-foreground-secondary bg-surface-3 border border-border-secondary rounded-lg hover:bg-surface-3 transition">
                                Change File
                            </button>
                        </div>
                    )}
                </div>
            )}

            {status === "success" && file && (
                <div className="border border-green-500/20 bg-green-500/10 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div>
                            <p className="text-sm font-medium text-green-300 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                            <p className="text-xs text-green-400">Upload complete</p>
                        </div>
                    </div>
                    <button onClick={clearFile} className="text-xs font-medium text-green-400 hover:text-green-300 underline">
                        Change
                    </button>
                </div>
            )}
        </div>
    );
}

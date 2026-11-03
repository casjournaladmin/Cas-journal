"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAX_MANUSCRIPT_FILE_SIZE_BYTES,
  MAX_COVER_IMAGE_FILE_SIZE_BYTES,
  type PublishingUploadCategory,
  type PublishingUploadAuthorizationResult,
} from "@/lib/storage/publishing-upload-policy";

type DirectStorageUploaderProps = {
  journalSlug: string;
  category: PublishingUploadCategory;
  namePrefix: string;
  label: string;
  accept: string;
  required?: boolean;
  helpText?: string;
  initialFileName?: string | null;
  onUploadStateChange?: (state: {
    isUploading: boolean;
    isUploaded: boolean;
    hasError: boolean;
  }) => void;
  requestUploadUrlAction: (input: {
    journalSlug: string;
    originalFileName: string;
    sizeBytes: number;
    mimeType?: string;
    category: PublishingUploadCategory;
  }) => Promise<{
    success?: boolean;
    data?: PublishingUploadAuthorizationResult;
    error?: string;
  }>;
};

export function DirectStorageUploader({
  journalSlug,
  category,
  namePrefix,
  label,
  accept,
  required = false,
  helpText,
  initialFileName,
  onUploadStateChange,
  requestUploadUrlAction,
}: DirectStorageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isUploaded, setIsUploaded] = useState<boolean>(!!initialFileName);
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadedData, setUploadedData] = useState<{
    objectPath: string;
    originalFileName: string;
    sizeBytes: number;
    mimeType: string;
  } | null>(null);

  const activeXhrRef = useRef<XMLHttpRequest | null>(null);

  const maxSizeBytes =
    category === "manuscript"
      ? MAX_MANUSCRIPT_FILE_SIZE_BYTES
      : MAX_COVER_IMAGE_FILE_SIZE_BYTES;
  const maxMb = Math.round(maxSizeBytes / (1024 * 1024));

  useEffect(() => {
    onUploadStateChange?.({
      isUploading,
      isUploaded: isUploaded || !!uploadedData,
      hasError: !!uploadError,
    });
  }, [isUploading, isUploaded, uploadedData, uploadError, onUploadStateChange]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (activeXhrRef.current) {
      activeXhrRef.current.abort();
      activeXhrRef.current = null;
    }

    setSelectedFile(file);
    setUploadError("");
    setUploadedData(null);
    setIsUploaded(false);

    if (file.size <= 0) {
      setUploadError("Selected file is empty.");
      return;
    }

    if (file.size > maxSizeBytes) {
      setUploadError(
        `File is ${(file.size / (1024 * 1024)).toFixed(1)} MB, which exceeds the ${maxMb} MB limit. Please compress the file.`,
      );
      return;
    }

    if (!journalSlug) {
      setUploadError("Please select a target journal first.");
      return;
    }

    await startDirectUpload(file);
  };

  const startDirectUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");

    try {
      const authResult = await requestUploadUrlAction({
        journalSlug,
        originalFileName: file.name,
        sizeBytes: file.size,
        mimeType:
          file.type ||
          (category === "manuscript" ? "application/pdf" : "image/jpeg"),
        category,
      });

      if (!authResult.success || !authResult.data) {
        throw new Error(authResult.error || "Upload authorization failed.");
      }

      const { signedUrl, objectPath } = authResult.data;

      const xhr = new XMLHttpRequest();
      activeXhrRef.current = xhr;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.min(
            99,
            Math.round((event.loaded / event.total) * 100),
          );
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        activeXhrRef.current = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          setIsUploading(false);
          setIsUploaded(true);
          setUploadedData({
            objectPath,
            originalFileName: file.name,
            sizeBytes: file.size,
            mimeType:
              file.type ||
              (category === "manuscript" ? "application/pdf" : "image/jpeg"),
          });
        } else {
          setIsUploading(false);
          setUploadError(
            `Storage upload failed (HTTP ${xhr.status}). Click to retry.`,
          );
        }
      };

      xhr.onerror = () => {
        activeXhrRef.current = null;
        setIsUploading(false);
        setUploadError(
          "Network connection interrupted during upload. Please check your internet and click to retry.",
        );
      };

      xhr.onabort = () => {
        activeXhrRef.current = null;
        setIsUploading(false);
      };

      xhr.open("PUT", signedUrl, true);
      xhr.setRequestHeader(
        "Content-Type",
        file.type || "application/octet-stream",
      );
      xhr.send(file);
    } catch (err: unknown) {
      setIsUploading(false);
      setUploadError(
        err instanceof Error ? err.message : "Failed to initiate upload.",
      );
    }
  };

  const handleRetry = () => {
    if (selectedFile) {
      startDirectUpload(selectedFile);
    }
  };

  const formattedFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-[color:var(--color-foreground)]">
        {label}{" "}
        {required ? (
          <span className="text-[color:var(--color-accent)]">*</span>
        ) : null}
      </label>

      {/* Hidden inputs submitted with the form */}
      {uploadedData ? (
        <>
          <input
            type="hidden"
            name={`${namePrefix}ObjectPath`}
            value={uploadedData.objectPath}
          />
          <input
            type="hidden"
            name={`${namePrefix}OriginalFileName`}
            value={uploadedData.originalFileName}
          />
          <input
            type="hidden"
            name={`${namePrefix}SizeBytes`}
            value={uploadedData.sizeBytes}
          />
          <input
            type="hidden"
            name={`${namePrefix}MimeType`}
            value={uploadedData.mimeType}
          />
        </>
      ) : null}

      <div className="relative rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={isUploading}
            className="text-xs file:mr-3 file:rounded-md file:border-0 file:bg-[color:var(--color-surface-raised)] file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-[color:var(--color-accent)] hover:file:bg-[color:var(--color-surface-hover)]"
          />

          {isUploading ? (
            <div className="flex items-center gap-2 text-xs font-medium text-[color:var(--color-accent)]">
              <span className="inline-block size-3 animate-spin rounded-full border-2 border-[color:var(--color-accent)] border-t-transparent" />
              <span>Uploading directly to storage ({uploadProgress}%)</span>
            </div>
          ) : isUploaded && (uploadedData || initialFileName) ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <span aria-hidden="true">✓</span>
              <span>
                {uploadedData
                  ? `Uploaded: ${uploadedData.originalFileName} (${formattedFileSize(uploadedData.sizeBytes)})`
                  : `Existing: ${initialFileName}`}
              </span>
            </div>
          ) : null}
        </div>

        {/* Real-time Upload Progress Bar */}
        {isUploading ? (
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-surface-raised)]">
            <div
              className="h-full bg-[color:var(--color-accent)] transition-all duration-150 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        ) : null}

        {/* Error State with Retry Button */}
        {uploadError ? (
          <div className="mt-2.5 flex items-center justify-between gap-2 rounded border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400">
            <span>{uploadError}</span>
            <button
              type="button"
              onClick={handleRetry}
              className="shrink-0 rounded bg-red-500/20 px-2 py-0.5 font-semibold text-red-300 hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        ) : null}

        {helpText ? (
          <p className="mt-1 text-[11px] text-[color:var(--color-muted)]">
            {helpText} (Max {maxMb} MB)
          </p>
        ) : null}
      </div>
    </div>
  );
}

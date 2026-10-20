"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { InternalChatMessageDTO } from "@/lib/editorial/internal-chat";

const timeFormatter = new Intl.DateTimeFormat("en-NG", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const dateFormatter = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
});

export function InternalChatBox({
  journalSlug,
  viewerId,
  initialMessages = [],
}: {
  journalSlug: string;
  viewerId: string;
  initialMessages: InternalChatMessageDTO[];
}) {
  const [messages, setMessages] =
    useState<InternalChatMessageDTO[]>(initialMessages);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isPollingRef = useRef(false);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling architecture adhering to AGENTS.md performance guardrails
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const fetchMessages = async () => {
      if (document.hidden || isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const res = await fetch(`/api/editor/${journalSlug}/internal-chat`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.messages)) {
            setMessages((prev) => {
              if (
                data.messages.length !== prev.length ||
                data.messages.some(
                  (m: InternalChatMessageDTO, i: number) =>
                    m.id !== prev[i]?.id,
                )
              ) {
                return data.messages;
              }
              return prev;
            });
          }
        }
      } catch {
        // Silently tolerate background network transient errors
      } finally {
        isPollingRef.current = false;
      }
    };

    const schedulePoll = () => {
      if (!document.hidden) {
        timer = setTimeout(async () => {
          await fetchMessages();
          schedulePoll();
        }, 4000);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timer) clearTimeout(timer);
      } else {
        fetchMessages();
        schedulePoll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    schedulePoll();

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [journalSlug]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...selected]);
      e.target.value = "";
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    setError("");
    const messageText = trimmed;
    const filesToSend = [...attachments];

    // Optimistic UI addition
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: InternalChatMessageDTO = {
      id: tempId,
      body: messageText || (filesToSend.length > 0 ? "Attachment" : null),
      createdAt: new Date().toISOString(),
      sender: {
        id: viewerId,
        displayName: "You",
        roleLabel: "Staff",
      },
      attachments: filesToSend.map((f, i) => ({
        id: `temp-att-${i}`,
        originalFileName: f.name,
        sizeBytes: f.size,
        mimeType: f.type,
      })),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setText("");
    setAttachments([]);

    startTransition(async () => {
      const formData = new FormData();
      if (messageText) formData.set("body", messageText);
      for (const file of filesToSend) {
        formData.append("files", file);
      }

      if (filesToSend.length > 0) {
        // Native XHR for truthful upload progress reporting
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/editor/${journalSlug}/internal-chat`);
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
        xhr.addEventListener("load", () => {
          setUploadProgress(null);
          if (xhr.status >= 200 && xhr.status < 300) {
            // Trigger sync
            fetch(`/api/editor/${journalSlug}/internal-chat`, {
              cache: "no-store",
            })
              .then((r) => r.json())
              .then((d) => {
                if (d.messages) setMessages(d.messages);
              });
          } else {
            try {
              const res = JSON.parse(xhr.responseText);
              setError(res.error || "Failed to send message.");
            } catch {
              setError("Failed to send message.");
            }
            // Revert optimistic
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
          }
        });
        xhr.addEventListener("error", () => {
          setUploadProgress(null);
          setError("Network upload error.");
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
        });
        xhr.send(formData);
      } else {
        try {
          const res = await fetch(`/api/editor/${journalSlug}/internal-chat`, {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error || "Failed to send message.");
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
          } else {
            // Refresh
            const refreshRes = await fetch(
              `/api/editor/${journalSlug}/internal-chat`,
              { cache: "no-store" },
            );
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              if (refreshData.messages) setMessages(refreshData.messages);
            }
          }
        } catch {
          setError("Network error while sending message.");
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
        }
      }
    });
  };

  return (
    <div className="flex h-[620px] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-sky-200/90 bg-[#f0f9ff]/40 shadow-sm dark:border-sky-800/80 dark:bg-[#021827]">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-sky-200/80 bg-white px-4 py-3 sm:px-5 dark:border-sky-800/60 dark:bg-[#032b45]">
        <div className="flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-[#0284c7]" />
          <h2 className="text-xs font-semibold tracking-wide text-[#032b45] uppercase dark:text-sky-100">
            Internal Staff Chat (Editors & Admins Only)
          </h2>
        </div>
        <span className="text-[11px] font-medium text-[#075985] dark:text-sky-300">
          Private Journal Discussion
        </span>
      </div>

      {/* Messages Thread */}
      <div
        ref={scrollContainerRef}
        className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 dark:text-sky-300">
            <span className="text-3xl">💬</span>
            <p className="mt-2 text-xs font-semibold text-[#032b45] dark:text-sky-200">
              No messages in this journal staff channel yet.
            </p>
            <p className="mt-0.5 text-[11px] text-[#075985] dark:text-sky-400">
              Post general editorial notes, reviewer updates, or coordination
              messages.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const mine = message.sender?.id === viewerId;
            return (
              <div
                key={message.id}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-[var(--radius-lg)] px-4 py-2.5 text-xs sm:max-w-[75%] ${
                    mine
                      ? "rounded-br-xs border border-[#0284c7] bg-[#032b45] text-white shadow-xs"
                      : "rounded-bl-xs border border-sky-200 bg-white text-[#032b45] shadow-xs dark:border-sky-800 dark:bg-[#053554] dark:text-sky-50"
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 border-b pb-1 text-[10px] ${
                      mine
                        ? "border-sky-700/60"
                        : "border-sky-100 dark:border-sky-900/40"
                    }`}
                  >
                    <span
                      className={`font-bold ${
                        mine
                          ? "text-sky-300"
                          : "text-[#075985] dark:text-sky-300"
                      }`}
                    >
                      {mine ? "You" : message.sender?.displayName}
                    </span>
                    {message.sender?.roleLabel ? (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                          mine
                            ? "bg-white/15 text-sky-100"
                            : "bg-sky-100 text-[#075985] dark:bg-sky-900/60 dark:text-sky-200"
                        }`}
                      >
                        {message.sender.roleLabel}
                      </span>
                    ) : null}
                  </div>

                  {message.body ? (
                    <p
                      className={`mt-1.5 leading-relaxed whitespace-pre-wrap ${
                        mine ? "text-white" : "text-[#032b45] dark:text-sky-50"
                      }`}
                    >
                      {message.body}
                    </p>
                  ) : null}

                  {message.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={`/api/editor/${journalSlug}/internal-chat/attachments/${att.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`mt-2 flex items-center gap-2 rounded px-2.5 py-1.5 text-xs transition ${
                        mine
                          ? "bg-white/10 text-sky-200 hover:bg-white/20 hover:text-white"
                          : "bg-sky-50 text-[#0284c7] hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60"
                      }`}
                    >
                      <span>📎</span>
                      <span className="max-w-[200px] truncate font-medium">
                        {att.originalFileName}
                      </span>
                      <span
                        className={`text-[10px] ${
                          mine
                            ? "text-sky-300/80"
                            : "text-[color:var(--color-subtle)]"
                        }`}
                      >
                        ({Math.round(att.sizeBytes / 1024)} KB)
                      </span>
                    </a>
                  ))}
                </div>
                <span
                  suppressHydrationWarning
                  className={`mt-1 px-1 text-[10px] ${
                    mine
                      ? "text-[#075985] dark:text-sky-400"
                      : "text-slate-500 dark:text-sky-400"
                  }`}
                >
                  {dateFormatter.format(new Date(message.createdAt))} ·{" "}
                  {timeFormatter.format(new Date(message.createdAt))}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Upload progress indicator */}
      {uploadProgress !== null ? (
        <div className="border-t border-sky-200 bg-sky-50 px-4 py-1.5 text-[11px] font-medium text-[#0284c7] dark:border-sky-800 dark:bg-sky-950/60">
          Uploading attachments: {uploadProgress}%
        </div>
      ) : null}

      {/* Attachment chips */}
      {attachments.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-t border-sky-200/80 bg-white px-4 py-2 dark:border-sky-800/60 dark:bg-[#032b45]">
          {attachments.map((file, idx) => (
            <span
              key={`${file.name}-${idx}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-300 bg-sky-50 px-2.5 py-0.5 text-[11px] font-medium text-[#032b45] dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-200"
            >
              <span>📎</span>
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(idx)}
                className="cursor-pointer text-slate-400 hover:text-[color:var(--color-danger)]"
                title={`Remove ${file.name}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {/* Composer Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-sky-200/80 bg-white p-3 sm:p-4 dark:border-sky-800/60 dark:bg-[#032b45]"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="sr-only"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
        />

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-sky-200 bg-sky-50 text-[#075985] transition hover:border-[#0284c7] hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/60"
            title="Attach file (DOCX, PDF, image)"
          >
            <span className="text-base font-bold">+</span>
          </button>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
              }
            }}
            placeholder="Type private message to journal team (Enter to send)..."
            className="max-h-32 min-h-[38px] flex-1 resize-none rounded-[var(--radius-md)] border border-sky-200 bg-white px-3 py-2 text-xs leading-5 text-[#032b45] placeholder:text-slate-400 focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] focus:outline-none dark:border-sky-800 dark:bg-[#021e31] dark:text-sky-100 dark:placeholder:text-sky-400/60"
            rows={1}
          />

          <button
            type="submit"
            disabled={pending || (!text.trim() && attachments.length === 0)}
            className="shrink-0 cursor-pointer rounded-[var(--radius-md)] bg-[#032b45] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#075985] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send"}
          </button>
        </div>

        {error ? (
          <p className="mt-2 text-xs font-medium text-[color:var(--color-danger)]">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}

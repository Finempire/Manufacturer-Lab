"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";

interface CommentsPanelProps {
  entityType:
    | "ORDER"
    | "TECH_PACK"
    | "MATERIAL_REQUIREMENT"
    | "MATERIAL_REQUEST"
    | "PURCHASE"
    | "EXPENSE_REQUEST";
  entityId: string;
}

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface User {
  id: string;
  name: string;
}

const MENTION_REGEX = /@\[([^\]]+)\]\([^)]+\)/g;

function renderContent(content: string) {
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(MENTION_REGEX.source, "g");

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} className="font-semibold text-brand">
        @{match[1]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

export default function CommentsPanel({ entityType, entityId }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionStartRef = useRef<number>(-1);

  const fetchComments = useCallback(() => {
    fetch(`/api/comments?entity_type=${entityType}&entity_id=${entityId}`)
      .then((r) => r.json())
      .then((data) => {
        setComments(data.comments || data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [entityType, entityId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (users.length === 0) {
      fetch("/api/master/users")
        .then((r) => r.json())
        .then((data) => setUsers(data.users || data || []))
        .catch(() => {});
    }
  }, [users.length]);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const insertMention = useCallback(
    (user: User) => {
      const before = content.slice(0, mentionStartRef.current);
      const after = content.slice(textareaRef.current?.selectionStart ?? content.length);
      const mention = `@[${user.name}](${user.id}) `;
      setContent(before + mention + after);
      setShowMentions(false);
      setMentionQuery("");
      mentionStartRef.current = -1;
      setTimeout(() => textareaRef.current?.focus(), 0);
    },
    [content]
  );

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursor);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex >= 0 && (atIndex === 0 || /\s/.test(textBeforeCursor[atIndex - 1]))) {
      const query = textBeforeCursor.slice(atIndex + 1);
      if (!/\s/.test(query)) {
        mentionStartRef.current = atIndex;
        setMentionQuery(query);
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }

    setShowMentions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionIndex((i) => Math.min(i + 1, filteredUsers.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filteredUsers[mentionIndex]) {
      e.preventDefault();
      insertMention(filteredUsers[mentionIndex]);
    } else if (e.key === "Escape") {
      setShowMentions(false);
    }
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);

    const optimistic: Comment = {
      id: `temp-${Date.now()}`,
      author_name: "You",
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setComments((prev) => [optimistic, ...prev]);
    setContent("");

    try {
      await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          content: trimmed,
        }),
      });
      fetchComments();
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-20 rounded bg-surface-3" />
              <div className="h-3 w-12 rounded bg-surface-3" />
            </div>
            <div className="h-4 w-full rounded bg-surface-3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-foreground-muted text-center py-8">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="text-sm">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="font-medium text-foreground">{comment.author_name}</span>
                <span className="text-xs text-foreground-muted">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-foreground-secondary whitespace-pre-wrap leading-relaxed">
                {renderContent(comment.content)}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border-secondary p-3 relative">
        {showMentions && filteredUsers.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-1 max-h-40 overflow-y-auto rounded-md border border-border-secondary bg-surface-2 shadow-premium-lg z-10">
            {filteredUsers.slice(0, 8).map((user, i) => (
              <button
                key={user.id}
                type="button"
                className={`w-full text-left px-3 py-1.5 text-sm ${
                  i === mentionIndex ? "bg-brand-muted text-brand" : "text-foreground-secondary hover:bg-surface-3"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(user);
                }}
              >
                {user.name}
              </button>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment... Use @ to mention"
          rows={2}
          className="w-full resize-none rounded-md border border-border-secondary bg-surface-0 px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </div>
    </div>
  );
}

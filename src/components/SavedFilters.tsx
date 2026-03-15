"use client";

import { useState, useEffect, useCallback } from "react";
import { Bookmark, BookmarkCheck, Trash2, Star } from "lucide-react";

interface SavedFilter {
  id: string;
  name: string;
  filter_json: string;
  is_default: boolean;
}

interface SavedFiltersProps {
  page: string;
  currentFilters: Record<string, unknown>;
  onApplyFilter: (filters: Record<string, unknown>) => void;
}

export function SavedFilters({ page, currentFilters, onApplyFilter }: SavedFiltersProps) {
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const fetchFilters = useCallback(async () => {
    const res = await fetch(`/api/saved-filters?page=${page}`);
    if (res.ok) {
      const data = await res.json();
      setFilters(data.filters || []);
    }
  }, [page]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  // Apply default filter on mount
  useEffect(() => {
    const defaultFilter = filters.find((f) => f.is_default);
    if (defaultFilter && !activeId) {
      try {
        onApplyFilter(JSON.parse(defaultFilter.filter_json));
        setActiveId(defaultFilter.id);
      } catch { /* ignore parse errors */ }
    }
  }, [filters, activeId, onApplyFilter]);

  const handleSave = async () => {
    if (!filterName.trim()) return;
    const res = await fetch("/api/saved-filters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page,
        name: filterName.trim(),
        filter_json: JSON.stringify(currentFilters),
        is_default: isDefault,
      }),
    });
    if (res.ok) {
      setFilterName("");
      setIsDefault(false);
      setShowSave(false);
      fetchFilters();
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/saved-filters/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (activeId === id) setActiveId(null);
      fetchFilters();
    }
  };

  const handleSetDefault = async (id: string) => {
    await fetch(`/api/saved-filters/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_default: true }),
    });
    fetchFilters();
  };

  const handleApply = (filter: SavedFilter) => {
    try {
      onApplyFilter(JSON.parse(filter.filter_json));
      setActiveId(filter.id);
    } catch { /* ignore */ }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((f) => (
        <div key={f.id} className="flex items-center gap-1">
          <button
            onClick={() => handleApply(f)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border transition-colors ${
              activeId === f.id
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.is_default && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
            {f.name}
          </button>
          <button
            onClick={() => handleSetDefault(f.id)}
            title="Set as default"
            className="p-0.5 text-gray-400 hover:text-amber-500"
          >
            <BookmarkCheck className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleDelete(f.id)}
            title="Delete filter"
            className="p-0.5 text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}

      {!showSave ? (
        <button
          onClick={() => setShowSave(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50"
        >
          <Bookmark className="w-3 h-3" />
          Save Filter
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="Filter name"
            className="px-2 py-1 text-xs border border-gray-300 rounded w-32"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <label className="flex items-center gap-1 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-3 h-3"
            />
            Default
          </label>
          <button
            onClick={handleSave}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={() => { setShowSave(false); setFilterName(""); }}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {activeId && (
        <button
          onClick={() => { setActiveId(null); onApplyFilter({}); }}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}

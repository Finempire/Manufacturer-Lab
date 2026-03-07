"use client";

import { useState, useCallback, useRef } from "react";

type ColumnWidths = Record<string, number>;

const MIN_WIDTHS: ColumnWidths = {
    style: 80,
    material: 80,
    description: 100,
    qty: 60,
    rate: 80,
    amount: 90,
};

export function useColumnResize(initialWidths: ColumnWidths) {
    const [widths, setWidths] = useState<ColumnWidths>(initialWidths);
    const widthsRef = useRef(widths);
    widthsRef.current = widths;

    const startResize = useCallback((colKey: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startWidth = widthsRef.current[colKey];
        const minW = MIN_WIDTHS[colKey] || 60;

        const onMouseMove = (ev: MouseEvent) => {
            ev.preventDefault();
            const newWidth = Math.max(minW, startWidth + (ev.clientX - startX));
            setWidths((prev) => ({ ...prev, [colKey]: newWidth }));
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };

        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }, []);

    return { widths, startResize };
}

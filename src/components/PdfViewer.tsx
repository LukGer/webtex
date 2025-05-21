import { MinusIcon, PlusIcon } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { OnDocumentLoadSuccess } from "react-pdf/dist/esm/shared/types.js";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "./ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

interface PdfViewerProps {
  pdfData: Uint8Array<ArrayBuffer>;
}

const ZOOM_STEP = 0.2;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

export default function PDFViewer({ pdfData }: PdfViewerProps) {
  const blob = useMemo(
    () => new Blob([pdfData], { type: "application/pdf" }),
    [pdfData]
  );

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onLoadSuccess: OnDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const onScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || numPages === 0) return;

    const containerRect = container.getBoundingClientRect();
    let closestPage = 1;
    let minDiff = Number.POSITIVE_INFINITY;

    pageRefs.current.forEach((ref, idx) => {
      if (ref) {
        const pageRect = ref.getBoundingClientRect();
        const diff = Math.abs(pageRect.top - containerRect.top);
        if (diff < minDiff) {
          minDiff = diff;
          closestPage = idx + 1;
        }
      }
    });

    setCurrentPage(closestPage);
  }, [numPages]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  const handleZoomOut = () => setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  const handleZoomReset = () => setZoom(1);

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-center border-gray-300 border-b bg-white p-2">
        <span className="text-sm">
          Page {currentPage} of {numPages}
        </span>

        <div className="flex-1" />

        <div className="inline-flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
          >
            <MinusIcon className="size-4" />
          </Button>
          <span className="font-mono text-sm">{Math.round(zoom * 100)}%</span>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
          >
            <PlusIcon className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomReset}
            disabled={zoom === 1}
          >
            Reset
          </Button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative flex-1 overflow-y-auto bg-gray-200 shadow-inner"
        onScroll={onScroll}
      >
        <Document
          file={blob}
          onLoadSuccess={onLoadSuccess}
          className="flex flex-col items-center px-24 py-4"
        >
          {Array.from({ length: numPages }, (_, index) => (
            <div
              key={`page_${index + 1}`}
              ref={(el) => {
                pageRefs.current[index] = el;
              }}
              className={index < numPages - 1 ? "mb-4" : ""}
            >
              <Page pageNumber={index + 1} scale={zoom} />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}

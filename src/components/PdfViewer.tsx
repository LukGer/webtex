import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { OnDocumentLoadSuccess } from "react-pdf/dist/esm/shared/types.js";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

interface PdfViewerProps {
  pdfData: Uint8Array<ArrayBuffer>;
}

export default function PDFViewer({ pdfData }: PdfViewerProps) {
  const blob = new Blob([pdfData], { type: "application/pdf" });

  const [numPages, setNumPages] = useState(0);

  const onLoadSuccess: OnDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto bg-gray-200">
        <Document
          key={URL.createObjectURL(blob)}
          file={blob}
          onLoadSuccess={onLoadSuccess}
          className="flex flex-col items-center py-4"
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div
              key={`page_${index + 1}`}
              className={index < numPages - 1 ? "mb-4" : ""}
            >
              <Page pageNumber={index + 1} />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}

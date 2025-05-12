import { type SyntheticEvent, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { OnDocumentLoadSuccess } from "react-pdf/dist/esm/shared/types.js";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFViewer({ pdf }: { pdf: ArrayBuffer }) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const onLoadSuccess: OnDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const onScroll = (event: SyntheticEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget;
    const pageHeight = event.currentTarget.scrollHeight / numPages;
    const currentPage = Math.floor(scrollTop / pageHeight) + 1;
    setCurrentPage(currentPage);
    console.log(`Current page: ${currentPage}`);
  };

  return (
    <div style={{ overflowY: "scroll", height: "100%" }}>
      <Document
        file={{ data: pdf }}
        onLoadSuccess={onLoadSuccess}
        onScroll={onScroll}
      >
        {Array.from(new Array(numPages ?? 0), (_, index) => (
          <Page key={`page_${index + 1}`} pageNumber={index + 1} />
        ))}
      </Document>
      <p>
        Current Page: {currentPage}/{numPages}
      </p>
    </div>
  );
}

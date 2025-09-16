// src/components/Results.js
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./Results.css";

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const s = location.state;
    if (s?.results) {
      setResults(s.results);
      setQuery(s.query || "");
      // refresh sessionStorage so it's up-to-date
      sessionStorage.setItem("fetscr_results", JSON.stringify({ results: s.results, query: s.query }));
    } else {
      // fallback to sessionStorage (so refresh or direct open works)
      const stored = sessionStorage.getItem("fetscr_results");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setResults(parsed.results || []);
          setQuery(parsed.query || "");
        } catch {
          setResults([]);
        }
      }
    }
  }, [location.state]);

  const downloadCSV = () => {
    const header = ["Name", "Title", "Link", "Snippet", "Image"];
    const rows = (results || []).map((r) => [
      r.name || "",
      r.title || "",
      r.link || "",
      (r.snippet || "").replace(/[\r\n]+/g, " "),
      r.image || "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fetscr_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    if (!tableRef.current) return;
    // render the table DOM to canvas
    const canvas = await html2canvas(tableRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("fetscr_results.pdf");
  };

  if (!results || results.length === 0) {
    return (
      <div className="results-page">
        <p>No results to show. Try a new search.</p>
        <button onClick={() => navigate("/")}>Back to search</button>
      </div>
    );
  }

  return (
    <div className="results-page">
      <div className="results-header">
        <h2>Results {query ? `for: "${query}"` : ""}</h2>
        <div className="results-actions">
          <button onClick={downloadCSV}>Download CSV</button>
          <button onClick={downloadPDF}>Download PDF</button>
          <button onClick={() => navigate("/")}>New Search</button>
        </div>
      </div>

      <div ref={tableRef} className="results-table-wrap">
        <table className="results-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              
              <th>Snippet</th>
              <th>Link</th>
              
            </tr>
          </thead>
          <tbody>
            {results.map((r, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>{r.name}</td>
                
                <td className="snippet">{r.snippet}</td>
                <td>
                  {r.link ? (
                    <a href={r.link} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>{r.image ? <img src={r.image} alt="" style={{ width: 60 }} /> : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

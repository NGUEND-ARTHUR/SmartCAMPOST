function downloadBlob(filename: string, blob: Blob) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || rows.length === 0) {
    downloadBlob(filename, new Blob([""], { type: "text/csv;charset=utf-8;" }));
    return;
  }

  const keys = Object.keys(rows[0]);
  const header = keys.join(",") + "\n";
  const lines = rows.map((row) =>
    keys
      .map((k) => {
        const v = row[k] == null ? "" : String(row[k]);
        return '"' + v.replace(/"/g, '""') + '"';
      })
      .join(","),
  );

  const csv = header + lines.join("\n");
  downloadBlob(filename, new Blob([csv], { type: "text/csv;charset=utf-8;" }));
}

export function exportToJson(filename: string, rows: unknown) {
  const json = JSON.stringify(rows ?? null, null, 2);
  downloadBlob(filename, new Blob([json], { type: "application/json;charset=utf-8;" }));
}

export async function exportToXlsx(
  filename: string,
  rows: Record<string, unknown>[],
  sheetName = "data",
) {
  const xlsx = await import("xlsx");
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(rows ?? []);
  xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
  const arrayBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "array" });
  downloadBlob(
    filename,
    new Blob([arrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
}

export async function exportToPdf(
  filename: string,
  rows: Record<string, unknown>[],
  title = "Export",
) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(title, 14, 14);

  if (!rows || rows.length === 0) {
    doc.setFontSize(11);
    doc.text("No data", 14, 26);
    doc.save(filename);
    return;
  }

  const keys = Object.keys(rows[0]);
  const body = rows.map((row) => keys.map((k) => String(row[k] ?? "")));

  autoTable(doc as any, {
    head: [keys],
    body,
    startY: 20,
    styles: { fontSize: 8 },
    headStyles: { fontSize: 9 },
  });

  doc.save(filename);
}

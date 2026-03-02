"use client";

import { useState, useCallback, useTransition, useRef } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { uploadInvitees } from "@/actions/invitees";
import type { InviteeRowInput } from "@/lib/validations/invitee";
import { cn } from "@/lib/utils/cn";

interface UploadResultData {
  created: number;
  updated: number;
  invitationsCreated: number;
  errors: Array<{ row: number; message: string }>;
}

type ActionResult<T> =
  | { success: true; data: T }
  | { error: string };

interface CSVUploadProps {
  eventId?: string;
  onImport?: (validRows: InviteeRowInput[]) => Promise<ActionResult<UploadResultData>>;
}

type MappableField =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "title"
  | "credentials"
  | "specialty"
  | "practiceName"
  | "npiNumber"
  | "inviteeType"
  | "yearStartedPractice"
  | "skip";

const FIELD_OPTIONS: Array<{ value: MappableField; label: string }> = [
  { value: "skip", label: "-- Skip --" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "title", label: "Title (e.g., Dr.)" },
  { value: "credentials", label: "Credentials (e.g., MD)" },
  { value: "specialty", label: "Specialty" },
  { value: "practiceName", label: "Practice Name" },
  { value: "npiNumber", label: "NPI Number" },
  { value: "inviteeType", label: "Invitee Type" },
  { value: "yearStartedPractice", label: "Year Started Practice" },
];

const REQUIRED_FIELDS: MappableField[] = ["firstName", "lastName", "email"];

type Step = "upload" | "mapping" | "preview" | "result";

interface RowError {
  row: number;
  field: string;
  message: string;
}

function guessMapping(header: string): MappableField {
  const h = header.toLowerCase().replace(/[_\- ]/g, "");
  if (h.includes("firstname") || h === "first") return "firstName";
  if (h.includes("lastname") || h === "last") return "lastName";
  if (h.includes("email") || h.includes("mail")) return "email";
  if (h.includes("phone") || h.includes("mobile") || h.includes("cell"))
    return "phone";
  if (h === "title" || h === "prefix" || h === "salutation") return "title";
  if (h.includes("credential") || h.includes("degree") || h.includes("suffix"))
    return "credentials";
  if (h.includes("special")) return "specialty";
  if (h.includes("practice") || h.includes("organization") || h.includes("org"))
    return "practiceName";
  if (h.includes("npi")) return "npiNumber";
  if (h.includes("year") && h.includes("start")) return "yearStartedPractice";
  if (h.includes("type") || h.includes("invitee")) return "inviteeType";
  return "skip";
}

function validateRow(
  row: Record<string, string>,
  rowIndex: number
): RowError[] {
  const errors: RowError[] = [];
  if (!row.firstName || row.firstName.trim() === "") {
    errors.push({ row: rowIndex, field: "firstName", message: "First name is required" });
  }
  if (!row.lastName || row.lastName.trim() === "") {
    errors.push({ row: rowIndex, field: "lastName", message: "Last name is required" });
  }
  if (!row.email || row.email.trim() === "") {
    errors.push({ row: rowIndex, field: "email", message: "Email is required" });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
    errors.push({ row: rowIndex, field: "email", message: "Invalid email format" });
  }
  return errors;
}

export function CSVUpload({ eventId, onImport }: CSVUploadProps) {
  const [step, setStep] = useState<Step>("upload");
  const [rawData, setRawData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<number, MappableField>>({});
  const [mappedRows, setMappedRows] = useState<Record<string, string>[]>([]);
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);
  const [result, setResult] = useState<UploadResultData | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    Papa.parse(file, {
      complete(results) {
        const data = results.data as string[][];
        if (data.length < 2) {
          setServerError("CSV must have at least a header row and one data row.");
          return;
        }
        const csvHeaders = data[0];
        const csvRows = data.slice(1).filter((row) => row.some((cell) => cell && cell.trim() !== ""));
        setHeaders(csvHeaders);
        setRawData(csvRows);
        const mapping: Record<number, MappableField> = {};
        csvHeaders.forEach((header, index) => { mapping[index] = guessMapping(header); });
        setColumnMapping(mapping);
        setStep("mapping");
        setServerError(null);
      },
      error(err) { setServerError(`Failed to parse CSV: ${err.message}`); },
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) { handleFile(file); }
    else { setServerError("Please upload a .csv file."); }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { handleFile(file); }
  }, [handleFile]);

  function applyMapping() {
    const mapped = rawData.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((_, colIndex) => {
        const field = columnMapping[colIndex];
        if (field && field !== "skip") { obj[field] = row[colIndex]?.trim() ?? ""; }
      });
      return obj;
    });
    const errors: RowError[] = [];
    mapped.forEach((row, idx) => { errors.push(...validateRow(row, idx + 1)); });
    setMappedRows(mapped);
    setRowErrors(errors);
    setStep("preview");
  }

  function handleImport() {
    setServerError(null);
    const validRows: InviteeRowInput[] = mappedRows
      .filter((_, idx) => !rowErrors.some((e) => e.row === idx + 1))
      .map((row) => ({
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        phone: row.phone || undefined,
        title: row.title || undefined,
        credentials: row.credentials || undefined,
        specialty: row.specialty || undefined,
        practiceName: row.practiceName || undefined,
        npiNumber: row.npiNumber || undefined,
        inviteeType: row.inviteeType === "RESIDENT_FELLOW" ? ("RESIDENT_FELLOW" as const) : ("IN_PRACTICE" as const),
        yearStartedPractice: row.yearStartedPractice ? parseInt(row.yearStartedPractice, 10) : undefined,
      }));
    if (validRows.length === 0) { setServerError("No valid rows to import."); return; }
    startTransition(async () => {
      let res: ActionResult<UploadResultData>;
      if (onImport) { res = await onImport(validRows); }
      else if (eventId) { res = await uploadInvitees(eventId, validRows); }
      else { setServerError("No event or import handler configured."); return; }
      if ("error" in res) { setServerError(res.error); return; }
      setResult(res.data);
      setStep("result");
    });
  }

  function reset() {
    setStep("upload"); setRawData([]); setHeaders([]); setColumnMapping({});
    setMappedRows([]); setRowErrors([]); setResult(null); setServerError(null);
    if (fileInputRef.current) { fileInputRef.current.value = ""; }
  }

  const validCount = mappedRows.length - new Set(rowErrors.map((e) => e.row)).size;
  const errorRowCount = new Set(rowErrors.map((e) => e.row)).size;

  return (
    <div className="space-y-6">
      {serverError && (
        <div className="rounded-button border border-danger/20 bg-red-50 px-4 py-3 text-sm text-danger">{serverError}</div>
      )}
      {step === "upload" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn("flex flex-col items-center justify-center rounded-card border-2 border-dashed p-12 transition-colors",
            isDragging ? "border-brand-teal bg-brand-teal/5" : "border-border hover:border-brand-teal/50")}
        >
          <p className="mb-2 text-sm font-medium text-text-primary">Drop your CSV file here, or click to browse</p>
          <p className="mb-4 text-xs text-text-muted">Supported format: .csv with headers</p>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileInput} className="hidden" id="csv-file-input" />
          <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>Choose File</Button>
        </div>
      )}
      {step === "mapping" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold text-text-primary mb-1">Map CSV Columns</h3>
            <p className="text-sm text-text-muted">Map each CSV column to the correct invitee field. Required fields: First Name, Last Name, Email.</p>
          </div>
          <div className="space-y-3">
            {headers.map((header, index) => (
              <div key={index} className="flex items-center gap-4 rounded-button bg-surface-muted px-4 py-3">
                <span className="min-w-[160px] text-sm font-medium text-text-primary truncate">{header}</span>
                <Select
                  options={FIELD_OPTIONS}
                  value={columnMapping[index] ?? "skip"}
                  onChange={(e) => setColumnMapping((prev) => ({ ...prev, [index]: e.target.value as MappableField }))}
                  className="max-w-[200px]"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={reset}>Start Over</Button>
            <Button type="button" onClick={applyMapping} disabled={!REQUIRED_FIELDS.every((f) => Object.values(columnMapping).includes(f))}>Preview Data</Button>
          </div>
        </div>
      )}
      {step === "preview" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-text-primary mb-1">Preview Import</h3>
              <p className="text-sm text-text-muted">Showing first 5 rows. Review the data before importing.</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="success">{validCount} valid</Badge>
              {errorRowCount > 0 && <Badge variant="danger">{errorRowCount} errors</Badge>}
            </div>
          </div>
          <div className="rounded-card border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row</TableHead><TableHead>First Name</TableHead><TableHead>Last Name</TableHead>
                  <TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Specialty</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappedRows.slice(0, 5).map((row, idx) => {
                  const errors = rowErrors.filter((e) => e.row === idx + 1);
                  const hasError = errors.length > 0;
                  return (
                    <TableRow key={idx} className={hasError ? "bg-red-50/50" : undefined}>
                      <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                      <TableCell>{row.firstName || "-"}</TableCell>
                      <TableCell>{row.lastName || "-"}</TableCell>
                      <TableCell>{row.email || "-"}</TableCell>
                      <TableCell>{row.phone || "-"}</TableCell>
                      <TableCell>{row.specialty || "-"}</TableCell>
                      <TableCell>
                        {hasError ? (
                          <span className="text-xs text-danger" title={errors.map((e) => e.message).join(", ")}>{errors.map((e) => e.message).join("; ")}</span>
                        ) : (<Badge variant="success">Valid</Badge>)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {mappedRows.length > 5 && <p className="text-sm text-text-muted text-center">... and {mappedRows.length - 5} more rows</p>}
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("mapping")}>Back to Mapping</Button>
            <Button type="button" onClick={handleImport} isLoading={isPending} disabled={validCount === 0}>Import {validCount} Invitees</Button>
          </div>
        </div>
      )}
      {step === "result" && result && (
        <div className="space-y-6">
          <div className="rounded-card border border-border bg-white p-6">
            <h3 className="text-base font-semibold text-text-primary mb-4">Import Complete</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-button bg-surface-muted px-4 py-3">
                <p className="text-2xl font-bold text-text-primary">{result.created}</p>
                <p className="text-xs text-text-muted">New invitees created</p>
              </div>
              <div className="rounded-button bg-surface-muted px-4 py-3">
                <p className="text-2xl font-bold text-text-primary">{result.updated}</p>
                <p className="text-xs text-text-muted">Existing invitees updated</p>
              </div>
              <div className="rounded-button bg-surface-muted px-4 py-3">
                <p className="text-2xl font-bold text-text-primary">{result.invitationsCreated}</p>
                <p className="text-xs text-text-muted">Invitations generated</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={reset}>Upload More</Button>
          </div>
        </div>
      )}
    </div>
  );
}

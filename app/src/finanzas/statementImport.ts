import { fmtFechaLocal } from "../lib/fechas";
import type { Category } from "./types";
type TransactionType = "income" | "expense" | "transfer";

type ImportableTransactionType = Exclude<TransactionType, "transfer">;

export interface StatementImportRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: ImportableTransactionType;
  category: string;
}

export interface CsvColumnMapping {
  date?: string;
  description?: string;
  amount?: string;
  credit?: string;
  debit?: string;
  category?: string;
}

export interface StatementImportResult {
  fileType: "csv" | "ofx";
  rows: StatementImportRow[];
  warnings: string[];
}

export interface StatementFileInspection {
  fileType: "csv";
  headers: string[];
  suggestedMapping: CsvColumnMapping;
}

type CsvHeaderCandidate = {
  delimiter: string;
  headerRowIndex: number;
  rawHeaders: string[];
  normalizedHeaders: string[];
};

const DATE_COLUMN_ALIASES = [
  "date",
  "posted date",
  "posting date",
  "posted",
  "post date",
  "transaction date",
  "trans date",
  "activity date",
  "effective date",
];

const DESCRIPTION_COLUMN_ALIASES = [
  "description",
  "transaction description",
  "transaction details",
  "details",
  "memo",
  "payee",
  "merchant",
  "name",
  "transaction",
  "description 1",
  "description 2",
];

const AMOUNT_COLUMN_ALIASES = [
  "amount",
  "transaction amount",
  "amount cad",
  "amount usd",
  "amt",
  "value",
  "net amount",
  "signed amount",
];

const CREDIT_COLUMN_ALIASES = [
  "credit",
  "credit amount",
  "deposit",
  "deposit amount",
  "money in",
  "received",
];

const DEBIT_COLUMN_ALIASES = [
  "debit",
  "debit amount",
  "withdrawal",
  "withdrawal amount",
  "money out",
  "spent",
  "charge",
];

const CATEGORY_COLUMN_ALIASES = ["category", "budget category"];

export class StatementImportError extends Error {
  code: "UNRECOGNIZED_COLUMNS" | "INVALID_FILE";
  inspection?: StatementFileInspection;

  constructor(
    message: string,
    code: "UNRECOGNIZED_COLUMNS" | "INVALID_FILE",
    inspection?: StatementFileInspection,
  ) {
    super(message);
    this.name = "StatementImportError";
    this.code = code;
    this.inspection = inspection;
  }
}

function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  values.push(currentValue.trim());
  return values;
}

function detectDelimiter(headerLine: string) {
  const supportedDelimiters = [",", ";", "\t", "|"];
  return supportedDelimiters
    .map((delimiter) => ({
      delimiter,
      count: splitCsvLine(headerLine, delimiter).length,
    }))
    .sort((left, right) => right.count - left.count)[0]?.delimiter || ",";
}

function findHeaderMatchIndex(headers: string[], aliases: string[]) {
  const exactMatchIndex = headers.findIndex((header) => aliases.includes(header));
  if (exactMatchIndex !== -1) {
    return exactMatchIndex;
  }

  return headers.findIndex((header) =>
    aliases.some((alias) => header.includes(alias) || alias.includes(header)),
  );
}

function findHeaderCandidate(lines: string[]): CsvHeaderCandidate {
  const scanDepth = Math.min(lines.length, 10);
  const candidates = lines.slice(0, scanDepth).map((line, index) => {
    const delimiter = detectDelimiter(line);
    const rawHeaders = splitCsvLine(line, delimiter);
    const normalizedHeaders = rawHeaders.map((header) => normalizeHeader(header));
    const score =
      (findHeaderMatchIndex(normalizedHeaders, DATE_COLUMN_ALIASES) !== -1 ? 3 : 0) +
      (findHeaderMatchIndex(normalizedHeaders, DESCRIPTION_COLUMN_ALIASES) !== -1 ? 3 : 0) +
      (
        findHeaderMatchIndex(normalizedHeaders, AMOUNT_COLUMN_ALIASES) !== -1 ||
        findHeaderMatchIndex(normalizedHeaders, CREDIT_COLUMN_ALIASES) !== -1 ||
        findHeaderMatchIndex(normalizedHeaders, DEBIT_COLUMN_ALIASES) !== -1
          ? 3
          : 0
      ) +
      (findHeaderMatchIndex(normalizedHeaders, CATEGORY_COLUMN_ALIASES) !== -1 ? 1 : 0);

    return {
      delimiter,
      headerRowIndex: index,
      rawHeaders,
      normalizedHeaders,
      score,
    };
  });

  const bestCandidate = candidates.sort((left, right) => right.score - left.score)[0];

  return {
    delimiter: bestCandidate?.delimiter || ",",
    headerRowIndex: bestCandidate?.headerRowIndex || 0,
    rawHeaders: bestCandidate?.rawHeaders || [],
    normalizedHeaders: bestCandidate?.normalizedHeaders || [],
  };
}

function normalizeAmountValue(rawValue: string) {
  const withoutWhitespace = rawValue.replace(/\s+/g, "");
  const lastComma = withoutWhitespace.lastIndexOf(",");
  const lastDot = withoutWhitespace.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      return withoutWhitespace.replace(/\./g, "").replace(/,/g, ".");
    }

    return withoutWhitespace.replace(/,/g, "");
  }

  if (lastComma !== -1) {
    const decimals = withoutWhitespace.length - lastComma - 1;
    return decimals > 0 && decimals <= 2
      ? withoutWhitespace.replace(/,/g, ".")
      : withoutWhitespace.replace(/,/g, "");
  }

  return withoutWhitespace;
}

function parseAmount(value?: string) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const upperValue = trimmedValue.toUpperCase();
  const isDebit = upperValue.endsWith("DR");
  const isCredit = upperValue.endsWith("CR");
  const isNegative = trimmedValue.includes("(") || trimmedValue.endsWith("-") || isDebit;
  const normalizedValue = normalizeAmountValue(
    trimmedValue
      .replace(/(CR|DR)$/i, "")
      .replace(/[^0-9,.\-()]/g, "")
      .replace(/[()]/g, "")
      .replace(/-$/, ""),
  );

  const parsedValue = Number(normalizedValue);
  if (Number.isNaN(parsedValue)) {
    return null;
  }

  if (isNegative) {
    return -Math.abs(parsedValue);
  }

  if (isCredit) {
    return Math.abs(parsedValue);
  }

  return parsedValue;
}

function toIsoDate(year: number, month: number, day: number) {
  const normalizedMonth = `${month}`.padStart(2, "0");
  const normalizedDay = `${day}`.padStart(2, "0");
  return `${year}-${normalizedMonth}-${normalizedDay}`;
}

function parseDateValue(rawValue?: string) {
  if (!rawValue) {
    return null;
  }

  const trimmedValue = rawValue.trim();
  if (!trimmedValue) {
    return null;
  }

  const compactDateMatch = trimmedValue.match(/^(\d{4})(\d{2})(\d{2})/);
  if (compactDateMatch) {
    return toIsoDate(Number(compactDateMatch[1]), Number(compactDateMatch[2]), Number(compactDateMatch[3]));
  }

  const normalizedValue = trimmedValue.replace(/[.]/g, "/").replace(/-/g, "/");
  const parts = normalizedValue.split("/").map((part) => part.trim());
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return toIsoDate(Number(parts[0]), Number(parts[1]), Number(parts[2]));
    }

    const first = Number(parts[0]);
    const second = Number(parts[1]);
    const third = Number(parts[2]);

    if (!Number.isNaN(first) && !Number.isNaN(second) && !Number.isNaN(third)) {
      if (first > 12 && second <= 12) {
        return toIsoDate(third, second, first);
      }

      return toIsoDate(third, first, second);
    }
  }

  const nativeDate = new Date(trimmedValue);
  if (Number.isNaN(nativeDate.getTime())) {
    return null;
  }

  return fmtFechaLocal(nativeDate);
}

function matchCategoryByName(value: string, categories: Category[], type: ImportableTransactionType) {
  const normalizedValue = value.trim().toLowerCase();
  if (!normalizedValue) {
    return null;
  }

  const candidateCategories = categories.filter((category) =>
    type === "income" ? category.type === "income" : category.type === "expense" || category.type === "savings",
  );

  const exactMatch = candidateCategories.find((category) => category.name.toLowerCase() === normalizedValue);
  if (exactMatch) {
    return exactMatch.name;
  }

  const fuzzyMatch = candidateCategories.find((category) => {
    const normalizedCategoryName = category.name.toLowerCase();
    return normalizedValue.includes(normalizedCategoryName) || normalizedCategoryName.includes(normalizedValue);
  });

  return fuzzyMatch?.name || null;
}

function inferCategory(description: string, categories: Category[], type: ImportableTransactionType) {
  const inferredCategory = matchCategoryByName(description, categories, type);
  if (inferredCategory) {
    return inferredCategory;
  }

  return "";
}

function buildStatementRow(
  index: number,
  date: string,
  description: string,
  signedAmount: number,
  categoryValue: string | undefined,
  categories: Category[],
): StatementImportRow | null {
  if (!date || !description || Number.isNaN(signedAmount) || signedAmount === 0) {
    return null;
  }

  const type: ImportableTransactionType = signedAmount >= 0 ? "income" : "expense";
  const matchedCategory = categoryValue ? matchCategoryByName(categoryValue, categories, type) : null;

  return {
    id: `import-${index}`,
    date,
    description,
    amount: Math.abs(signedAmount),
    type,
    category: matchedCategory || inferCategory(description, categories, type),
  };
}

function buildSuggestedMapping(candidate: CsvHeaderCandidate): CsvColumnMapping {
  const headers = candidate.rawHeaders;
  const normalizedHeaders = candidate.normalizedHeaders;

  const getMatchedHeader = (aliases: string[]) => {
    const matchIndex = findHeaderMatchIndex(normalizedHeaders, aliases);
    return matchIndex === -1 ? "" : headers[matchIndex];
  };

  return {
    date: getMatchedHeader(DATE_COLUMN_ALIASES),
    description: getMatchedHeader(DESCRIPTION_COLUMN_ALIASES),
    amount: getMatchedHeader(AMOUNT_COLUMN_ALIASES),
    credit: getMatchedHeader(CREDIT_COLUMN_ALIASES),
    debit: getMatchedHeader(DEBIT_COLUMN_ALIASES),
    category: getMatchedHeader(CATEGORY_COLUMN_ALIASES),
  };
}

function getMappedIndex(headers: string[], selectedHeader?: string) {
  if (!selectedHeader) {
    return -1;
  }

  const normalizedSelectedHeader = normalizeHeader(selectedHeader);
  return headers.findIndex((header) => normalizeHeader(header) === normalizedSelectedHeader);
}

function parseCsvStatement(content: string, categories: Category[], providedMapping?: CsvColumnMapping) {
  const lines = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\r/g, ""))
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new StatementImportError("The selected file does not contain enough rows to import.", "INVALID_FILE");
  }

  const headerCandidate = findHeaderCandidate(lines);
  const suggestedMapping = buildSuggestedMapping(headerCandidate);
  const resolvedMapping = {
    ...suggestedMapping,
    ...providedMapping,
  };

  const dateIndex = getMappedIndex(headerCandidate.rawHeaders, resolvedMapping.date);
  const descriptionIndex = getMappedIndex(headerCandidate.rawHeaders, resolvedMapping.description);
  const amountIndex = getMappedIndex(headerCandidate.rawHeaders, resolvedMapping.amount);
  const creditIndex = getMappedIndex(headerCandidate.rawHeaders, resolvedMapping.credit);
  const debitIndex = getMappedIndex(headerCandidate.rawHeaders, resolvedMapping.debit);
  const categoryIndex = getMappedIndex(headerCandidate.rawHeaders, resolvedMapping.category);

  if (dateIndex === -1 || descriptionIndex === -1 || (amountIndex === -1 && creditIndex === -1 && debitIndex === -1)) {
    throw new StatementImportError(
      "The statement columns could not be recognized automatically. Map the CSV columns to continue.",
      "UNRECOGNIZED_COLUMNS",
      {
        fileType: "csv",
        headers: headerCandidate.rawHeaders,
        suggestedMapping,
      },
    );
  }

  const rows: StatementImportRow[] = [];
  const warnings: string[] = [];

  lines.slice(headerCandidate.headerRowIndex + 1).forEach((line, index) => {
    const values = splitCsvLine(line, headerCandidate.delimiter);
    if (values.every((value) => !value.trim())) {
      return;
    }

    const date = parseDateValue(values[dateIndex]);
    const description = values[descriptionIndex]?.trim() || "";

    let signedAmount = amountIndex !== -1 ? parseAmount(values[amountIndex]) : null;
    if (signedAmount === null) {
      const creditAmount = creditIndex !== -1 ? parseAmount(values[creditIndex]) : null;
      const debitAmount = debitIndex !== -1 ? parseAmount(values[debitIndex]) : null;
      signedAmount = (creditAmount || 0) - Math.abs(debitAmount || 0);
    }

    const row = buildStatementRow(
      index,
      date || "",
      description,
      signedAmount ?? Number.NaN,
      categoryIndex !== -1 ? values[categoryIndex] : undefined,
      categories,
    );

    if (!row) {
      warnings.push(`Row ${headerCandidate.headerRowIndex + index + 2} could not be imported and was skipped.`);
      return;
    }

    rows.push(row);
  });

  if (rows.length === 0) {
    throw new StatementImportError("No valid transactions were found in the selected CSV file.", "INVALID_FILE");
  }

  return { fileType: "csv" as const, rows, warnings };
}

function getOfxTagValue(block: string, tagName: string) {
  const match = new RegExp(`<${tagName}>([^<\\r\\n]*)`, "i").exec(block);
  return match?.[1]?.trim() || "";
}

function extractOfxTransactionBlocks(content: string) {
  return content
    .split(/<STMTTRN>/i)
    .slice(1)
    .map((segment) => segment.split(/<\/STMTTRN>/i)[0])
    .filter((segment) => /<TRNAMT>/i.test(segment) || /<NAME>/i.test(segment) || /<MEMO>/i.test(segment));
}

function parseOfxStatement(content: string, categories: Category[]) {
  const transactionBlocks = extractOfxTransactionBlocks(content);
  if (transactionBlocks.length === 0) {
    throw new StatementImportError("No transactions were found in the selected OFX/QFX file.", "INVALID_FILE");
  }

  const warnings: string[] = [];
  const rows = transactionBlocks
    .map((block, index) => {
      const amount = parseAmount(getOfxTagValue(block, "TRNAMT"));
      const date = parseDateValue(getOfxTagValue(block, "DTPOSTED"));
      const name = getOfxTagValue(block, "NAME");
      const memo = getOfxTagValue(block, "MEMO");
      const fitId = getOfxTagValue(block, "FITID");
      const description = [name, memo].filter(Boolean).join(" - ") || fitId;

      const row = buildStatementRow(index, date || "", description, amount ?? Number.NaN, undefined, categories);
      if (!row) {
        warnings.push(`Transaction ${index + 1} in the OFX/QFX file could not be imported.`);
      }

      return row;
    })
    .filter((row): row is StatementImportRow => Boolean(row));

  if (rows.length === 0) {
    throw new StatementImportError("No valid transactions were found in the selected OFX/QFX file.", "INVALID_FILE");
  }

  return { fileType: "ofx" as const, rows, warnings };
}

export async function parseStatementFile(
  file: File,
  categories: Category[],
  options?: { csvColumnMapping?: CsvColumnMapping },
): Promise<StatementImportResult> {
  const fileContent = await file.text();
  const fileName = file.name.toLowerCase();
  const isOfxFile =
    fileName.endsWith(".ofx") || fileName.endsWith(".qfx") || fileContent.toLowerCase().includes("<ofx>");

  return isOfxFile
    ? parseOfxStatement(fileContent, categories)
    : parseCsvStatement(fileContent, categories, options?.csvColumnMapping);
}

const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const RESERVED_COLUMNS = new Set(['key', 'namespace', 'description', 'desc', 'note', 'notes']);

function parseArgs(argv) {
  return argv.reduce((acc, arg) => {
    if (!arg.startsWith('--')) {
      return acc;
    }

    const [rawKey, ...rawValue] = arg.slice(2).split('=');
    acc[rawKey] = rawValue.length > 0 ? rawValue.join('=') : 'true';
    return acc;
  }, {});
}

function resolveGids(args) {
  const rawGids = args.gids || process.env.GOOGLE_SHEET_GIDS;

  if (rawGids) {
    const gids = rawGids
      .split(',')
      .map((gid) => gid.trim())
      .filter(Boolean);

    if (gids.length > 0) {
      return gids;
    }
  }

  return [args.gid || process.env.GOOGLE_SHEET_GID || '0'];
}

function requireValue(value, message) {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

function fetchText(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          if (redirectCount >= 5) {
            reject(new Error('Too many redirects while downloading Google Sheet.'));
            response.resume();
            return;
          }

          const nextUrl = new URL(response.headers.location, url).toString();
          response.resume();
          resolve(fetchText(nextUrl, redirectCount + 1));
          return;
        }

        if (response.statusCode && response.statusCode >= 400) {
          reject(new Error(`Request failed with status ${response.statusCode}`));
          response.resume();
          return;
        }

        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => resolve(body));
      })
      .on('error', reject);
  });
}

function parseCsv(input) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const nextChar = input[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i += 1;
      }

      row.push(value);
      rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows
    .map((cells) => cells.map((cell) => cell.trim()))
    .filter((cells) => cells.some((cell) => cell !== ''));
}

function ensureObject(target, key) {
  if (
    !Object.prototype.hasOwnProperty.call(target, key) ||
    typeof target[key] !== 'object' ||
    target[key] === null ||
    Array.isArray(target[key])
  ) {
    target[key] = {};
  }

  return target[key];
}

function setNestedValue(target, dottedKey, value) {
  const parts = dottedKey.split('.').map((part) => part.trim()).filter(Boolean);

  if (parts.length === 0) {
    return;
  }

  let cursor = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    cursor = ensureObject(cursor, parts[i]);
  }

  cursor[parts[parts.length - 1]] = value;
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function buildExportUrl(sheetId, gid) {
  const url = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/export`);
  url.searchParams.set('format', 'csv');
  url.searchParams.set('gid', gid);
  return url.toString();
}

function normalizeHeaders(headers) {
  return headers.map((header) => header.replace(/^\uFEFF/, '').trim());
}

function toRowObject(headers, cells) {
  return headers.reduce((acc, header, index) => {
    acc[header] = (cells[index] || '').trim();
    return acc;
  }, {});
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sheetId = args.sheetId || process.env.GOOGLE_SHEET_ID;
  const gids = resolveGids(args);
  const outDir = path.resolve(process.cwd(), args.outDir || process.env.I18N_OUTPUT_DIR || 'i18n');

  requireValue(sheetId, 'Missing Google Sheet id. Set GOOGLE_SHEET_ID or pass --sheetId=...');

  const filesByLocale = new Map();
  const processedSheets = [];

  for (const gid of gids) {
    const exportUrl = buildExportUrl(sheetId, gid);
    const csvText = await fetchText(exportUrl);
    const rows = parseCsv(csvText);

    if (rows.length < 2) {
      throw new Error(`Worksheet gid=${gid} must include a header row and at least one data row.`);
    }

    const headers = normalizeHeaders(rows[0]);
    const keyColumn = headers.find((header) => header.toLowerCase() === 'key');

    if (!keyColumn) {
      throw new Error(`Worksheet gid=${gid} must include a "key" column.`);
    }

    const namespaceColumn = headers.find((header) => header.toLowerCase() === 'namespace');
    const localeColumns = headers.filter((header) => header && !RESERVED_COLUMNS.has(header.toLowerCase()));

    if (localeColumns.length === 0) {
      throw new Error(`Worksheet gid=${gid} has no locale columns. Add headers like "en", "zh-TW", "ja", etc.`);
    }

    for (const cells of rows.slice(1)) {
      const row = toRowObject(headers, cells);
      const translationKey = row[keyColumn];

      if (!translationKey) {
        continue;
      }

      const namespace = namespaceColumn ? row[namespaceColumn] || 'common' : null;

      for (const locale of localeColumns) {
        const translatedValue = row[locale];

        if (!translatedValue) {
          continue;
        }

        if (!filesByLocale.has(locale)) {
          filesByLocale.set(locale, {});
        }

        const localeRoot = filesByLocale.get(locale);
        const target = namespace ? ensureObject(localeRoot, namespace) : localeRoot;
        setNestedValue(target, translationKey, translatedValue);
      }
    }

    processedSheets.push(exportUrl);
  }

  if (filesByLocale.size === 0) {
    throw new Error('No translation content was generated. Check if locale cells contain values.');
  }

  const writtenFiles = [];

  for (const [locale, payload] of filesByLocale.entries()) {
    const hasNamespaces = Boolean(namespaceColumn);

    if (hasNamespaces) {
      for (const [namespace, namespacePayload] of Object.entries(payload)) {
        const filePath = path.join(outDir, locale, `${namespace}.json`);
        writeJson(filePath, namespacePayload);
        writtenFiles.push(filePath);
      }
      continue;
    }

    const filePath = path.join(outDir, `${locale}.json`);
    writeJson(filePath, payload);
    writtenFiles.push(filePath);
  }

  console.log(`Exported ${writtenFiles.length} file(s) from ${processedSheets.length} worksheet(s).`);
  for (const exportUrl of processedSheets) {
    console.log(`- source: ${exportUrl}`);
  }
  for (const filePath of writtenFiles) {
    console.log(`- ${filePath}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

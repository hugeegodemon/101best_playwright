const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

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

function parseGidList(rawGids) {
  if (!rawGids) {
    return [];
  }

  return rawGids
    .split(',')
    .map((gid) => gid.trim())
    .filter(Boolean);
}

function uniqueValues(values) {
  return [...new Set(values)];
}

function buildWorksheetListUrls(sheetId) {
  return [
    `https://docs.google.com/spreadsheets/d/${sheetId}/htmlview`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
  ];
}

function extractGidsFromSpreadsheetHtml(html) {
  const matches = html.match(/[\?&#]gid=(\d+)/g) || [];

  return uniqueValues(
    matches
      .map((match) => {
        const gidMatch = match.match(/gid=(\d+)/);
        return gidMatch ? gidMatch[1] : null;
      })
      .filter(Boolean),
  );
}

async function resolveGids(args, sheetId) {
  if (args.gid) {
    return [args.gid];
  }

  if (args.gids) {
    const gids = parseGidList(args.gids);

    if (gids.length > 0) {
      return gids;
    }
  }

  for (const worksheetListUrl of buildWorksheetListUrls(sheetId)) {
    try {
      const worksheetListHtml = await fetchText(worksheetListUrl);
      const discoveredGids = extractGidsFromSpreadsheetHtml(worksheetListHtml);

      if (discoveredGids.length > 0) {
        return discoveredGids;
      }
    } catch (error) {
      console.warn(`Warning: unable to inspect worksheet list at ${worksheetListUrl} (${error.message}).`);
    }
  }

  console.warn('Warning: unable to discover worksheet ids automatically. Falling back to gid=0.');
  return ['0'];
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
  let fieldStarted = false;

  function pushValue() {
    row.push(value);
    value = '';
    fieldStarted = false;
  }

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const nextChar = input[i + 1];

    if (char === '"') {
      fieldStarted = true;

      if (inQuotes && nextChar === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      pushValue();
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i += 1;
      }

      pushValue();
      rows.push(row);
      row = [];
      continue;
    }

    fieldStarted = true;
    value += char;
  }

  if (fieldStarted || value.length > 0 || row.length > 0) {
    pushValue();
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

function mergeObjects(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      mergeObjects(ensureObject(target, key), value);
      continue;
    }

    target[key] = value;
  }

  return target;
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

function getDomainsForSheetIndex(sheetIndex) {
  const groupIndex = sheetIndex % 4;

  if (groupIndex === 0) {
    return ['error_code'];
  }

  if (groupIndex === 1) {
    return ['backend', 'frontend'];
  }

  if (groupIndex === 2) {
    return ['backend'];
  }

  return ['frontend'];
}

function buildTranslationsFromSheet(rows) {
  if (rows.length < 3) {
    throw new Error('Worksheet must include 2 header rows and at least one data row.');
  }

  const descriptionHeader = (rows[0][0] || '').replace(/^\uFEFF/, '').trim();
  const keyHeader = (rows[1][0] || '').replace(/^\uFEFF/, '').trim().toLowerCase();
  const validKeyHeaders = new Set(['key', 'code', '代碼', '代码']);

  if (!descriptionHeader) {
    throw new Error('Cell A1 must contain a description label.');
  }

  if (!validKeyHeaders.has(keyHeader)) {
    throw new Error('Cell A2 must contain the key column label (expected "key", "code", "代碼", or "代码").');
  }

  const localeCodeRow = rows[1].map((cell) => cell.replace(/^\uFEFF/, '').trim());
  const localeColumns = [];

  for (let columnIndex = 1; columnIndex < localeCodeRow.length; columnIndex += 1) {
    const locale = localeCodeRow[columnIndex];

    if (!locale) {
      continue;
    }

    localeColumns.push({ columnIndex, locale });
  }

  if (localeColumns.length === 0) {
    throw new Error('Row 2 must include locale codes from column B onward.');
  }

  const filesByLocale = new Map();

  for (const cells of rows.slice(2)) {
    const translationKey = (cells[0] || '').replace(/^\uFEFF/, '').trim();

    if (!translationKey) {
      continue;
    }

    for (const { columnIndex, locale } of localeColumns) {
      const translatedValue = (cells[columnIndex] || '').trim();

      if (!translatedValue) {
        continue;
      }

      if (!filesByLocale.has(locale)) {
        filesByLocale.set(locale, {});
      }

      setNestedValue(filesByLocale.get(locale), translationKey, translatedValue);
    }
  }

  return filesByLocale;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sheetId = args.sheetId || process.env.GOOGLE_SHEET_ID;
  const outDir = path.resolve(process.cwd(), args.outDir || process.env.I18N_OUTPUT_DIR || 'i18n');

  requireValue(sheetId, 'Missing Google Sheet id. Set GOOGLE_SHEET_ID or pass --sheetId=...');
  const gids = await resolveGids(args, sheetId);

  const filesByLocale = new Map();
  const processedSheets = [];

  for (const [sheetIndex, gid] of gids.entries()) {
    const domains = getDomainsForSheetIndex(sheetIndex);
    const exportUrl = buildExportUrl(sheetId, gid);
    const csvText = await fetchText(exportUrl);
    const rows = parseCsv(csvText);
    const sheetTranslations = buildTranslationsFromSheet(rows);

    for (const [locale, payload] of sheetTranslations.entries()) {
      if (!filesByLocale.has(locale)) {
        filesByLocale.set(locale, {});
      }

      const localePayload = filesByLocale.get(locale);
      for (const domain of domains) {
        mergeObjects(ensureObject(localePayload, domain), payload);
      }
    }

    processedSheets.push({ domains, exportUrl });
  }

  if (filesByLocale.size === 0) {
    throw new Error('No translation content was generated. Check if locale cells contain values.');
  }

  const writtenFiles = [];

  for (const [locale, payload] of filesByLocale.entries()) {
    const filePath = path.join(outDir, `${locale}.json`);
    writeJson(filePath, payload);
    writtenFiles.push(filePath);
  }

  console.log(`Exported ${writtenFiles.length} file(s) from ${processedSheets.length} worksheet(s).`);
  for (const { domains, exportUrl } of processedSheets) {
    console.log(`- source [${domains.join(', ')}]: ${exportUrl}`);
  }
  for (const filePath of writtenFiles) {
    console.log(`- ${filePath}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

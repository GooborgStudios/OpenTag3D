/*
 * OpenTag3D shared logic (make.html + read.html).
 * Expects a global `SPEC` (site.data.spec), the site-wide helpers from
 * assets/scripts/site.js (`h`, `msg`), and #webNfcDialog / #webNfcDialogMessage
 * for Web NFC status, to already be defined/present before this script loads.
 */

const allFields = SPEC.core.fields;
const urlParams = new URLSearchParams(window.location.search);

let nfcController;

const NFC_INFO = {
  ntag: {
    pageSize: 4,
    capabilityContainerPage: 3,
    ndefPage: 4,
    dummyUid: [0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
    types: {
      ntag215: {
        type: "NTAG215",
        pageCount: 135,
        userMemoryLength: 0x3e * 8,
        cc: [0xe1, 0x10, 0x3e, 0x00],
      },
      ntag216: {
        type: "NTAG216",
        pageCount: 231,
        userMemoryLength: 0x6d * 8,
        cc: [0xe1, 0x10, 0x6d, 0x00],
      },
    },
  },
  ndef: {
    tlvType: 0x03,
    tlvExtendedLength: 0xff,
    tlvTerminator: 0xfe,
    mimeRecordHeader: 0xd2,
    mimeRecordPrefixLength: 3,
    extendedTlvPrefixLength: 4,
  },
};

// --- Web NFC dialog helpers ---
const showWebNfcDialog = (message) => {
  const dialog = document.getElementById("webNfcDialog");
  document.getElementById("webNfcDialogMessage").textContent = message;
  if (!dialog.open) dialog.showModal();
};

const finishWebNfcAction = (message, isErr = false) => {
  const dialog = document.getElementById("webNfcDialog");
  if (dialog.open) dialog.close();
  msg(message, isErr);
};

// --- Byte/encoding utils ---
const hex = (n, w = 2) => Number(n).toString(16).toUpperCase().padStart(w, "0");
const addrHex = (a) => "0x" + hex(a);
const parseHex = (s) => (typeof s === "number" ? s : parseInt(s, 16));
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const bytesToBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
const base64ToBytes = (b64) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const stringToBase64 = (str) => bytesToBase64(textEncoder.encode(str));
const base64ToString = (b64) => textDecoder.decode(base64ToBytes(b64));
// NFC Tools mobile's own export mangles payload bytes >= 0x80 by mapping
// each byte to the matching Latin-1 code point and then UTF-8-encoding
// that string. This reverses that mangling when reading such an export.
const mobilePayloadFromBase64 = (b64) =>
  Uint8Array.from(base64ToString(b64), (c) => c.charCodeAt(0));

const packInt = (n, len, be = true) => {
  const value = Math.floor(n || 0);
  const b = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    const shift = be ? len - 1 - i : i;
    b[i] = (value >> (8 * shift)) & 0xff;
  }
  return b;
};
const encodeAscii = (str, len) => {
  const out = new Uint8Array(len);
  const s = String(str || "");
  for (let i = 0; i < Math.min(len, s.length); i++) {
    const code = s.charCodeAt(i);
    if (code > 0x7f) throw new Error("Non-ASCII character detected");
    out[i] = code;
  }
  return out;
};
const encodeUtf8 = (str, len) => {
  const enc = textEncoder.encode(String(str || ""));
  const out = new Uint8Array(len);
  out.set(enc.subarray(0, len));
  return out;
};
const rgbaFromHex = (hexStr) => {
  const v = String(hexStr || "#00000000").replace("#", "");
  return [
    parseInt(v.slice(0, 2) || "00", 16),
    parseInt(v.slice(2, 4) || "00", 16),
    parseInt(v.slice(4, 6) || "00", 16),
    parseInt(v.slice(6, 8) || "FF", 16),
  ];
};
const fixHexRgba = (inputValue) => {
  let value = inputValue;
  if (!value.startsWith("#")) {
    value = "#" + value;
  }
  if (value.length < 7) {
    value = value.padEnd(7, "00");
  }
  if (value.length < 9) {
    // Assume hex color without alpha value is full opacity
    value = value.padEnd(9, "FF");
  }
  return value.substr(0, 9).toUpperCase();
};

const bufferFromText = (text) => {
  const bytes = String(text).replace(/\s/g, "");
  if (!bytes || bytes.length % 2 || !/^[0-9A-Fa-f]+$/.test(bytes)) {
    throw new Error("Expected an even number of hexadecimal characters");
  }
  return new Uint8Array(bytes.match(/../g).map((h) => parseInt(h, 16))).buffer;
};

const formatBytes = (buf, startAddr = 0x00, includeAddresses = false) => {
  const output = [];
  for (let offset = 0; offset < buf.length; offset += 16) {
    const slice = buf.subarray(offset, offset + 16);
    const hexs = [...slice].map((b) => hex(b)).join(" ");
    const ascii = [...slice]
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : "."))
      .join("");
    const line = hexs.padEnd(16 * 3 - 1, " ");
    output.push(
      includeAddresses
        ? `${addrHex(startAddr + offset)}  ${line}  |${ascii}|`
        : line,
    );
  }
  return output.join(includeAddresses ? "\n" : " ").trim();
};

const bufferToHex = (buf) => formatBytes(buf);
const hexdump = (buf, startAddr = 0x00) => formatBytes(buf, startAddr, true);

const downloadFile = (contents, type, name) => {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// https://stackoverflow.com/a/7616484
const generateHash = (string) => {
  let hash = 0;
  for (const char of string) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0; // Constrain to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

// --- Field encoding/decoding ---
const encodeFieldValue = (field, value) => {
  if (field.type === "int" && field.id === "tag_version") {
    // Handle alpha versions
    if (SPEC.version.startsWith("a")) {
      return packInt(0, field.length);
    }
    const version = value ?? Math.round(parseFloat(SPEC.version || "0") * 1000);
    return packInt(version, field.length);
  }
  if (field.type === "ascii") {
    return encodeAscii(String(field.const ?? value ?? ""), field.length);
  }
  if (field.type === "utf8") {
    return encodeUtf8(String(value ?? ""), field.length);
  }
  if (field.type === "rgba") {
    const rgba = Array.isArray(value) ? value : [255, 255, 255, 255];
    return new Uint8Array(rgba.slice(0, 4));
  }
  if (field.type === "int") {
    return packInt(Number(value || 0), field.length);
  }
  if (field.type === "date") {
    const parts = String(value || "").split("-");
    const [year = 0, month = 0, day = 0] =
      parts.length === 3 ? parts.map(Number) : [];
    return new Uint8Array([...packInt(year, 2), month & 0xff, day & 0xff]);
  }
  if (field.type === "time") {
    const parts = String(value || "00:00:00").split(":");
    const [hour = 0, minute = 0, second = 0] =
      parts.length >= 2 ? parts.map((part) => Number(part.split(".")[0])) : [];
    return new Uint8Array([hour & 0xff, minute & 0xff, second & 0xff]);
  }
  return typeof value === "number"
    ? packInt(value, field.length)
    : encodeUtf8(String(value || ""), field.length);
};

// Decodes a raw tag buffer into a Map of field id -> { raw, display } values,
// where `display` is the scaled/formatted value suitable for showing to a
// user (or writing back into a form input), and `raw` is the unscaled value.
const decodeTagBuffer = (buf, startAddr = 0x00) => {
  const data = new Uint8Array(buf);
  const values = new Map();
  const warnings = [];

  const read = (addr, len) => {
    const off = addr - startAddr;
    if (off < 0 || off + len > data.length) return new Uint8Array(len);
    return data.subarray(off, off + len);
  };
  const readInt = (bytes) => bytes.reduce((n, b) => (n << 8) | b, 0) >>> 0;

  for (const f of allFields) {
    if (f.type === "-") continue;
    const addr = parseHex(f.start);
    if (addr > data.length) break;
    const bytes = read(addr, f.length);

    try {
      if (f.id === "tag_version") {
        const v = readInt(bytes) / 1000.0;
        const ev = parseFloat(SPEC.version);
        values.set(f.id, { raw: v, display: v.toFixed(3) });
        if (v !== ev) {
          warnings.push(
            `Loaded tag version is mismatched (got ${v}, expected ${ev})`,
          );
        }
      } else if (f.type === "ascii" || f.type === "utf8") {
        const s = String.fromCharCode(...bytes).replace(/\u0000+$/, "");
        values.set(f.id, { raw: s, display: s });
      } else if (f.type === "rgba") {
        const [r = 0, g = 0, b = 0, a = 255] = bytes;
        const hexStr = "#" + [r, g, b, a].map((x) => hex(x)).join("");
        values.set(f.id, { raw: [r, g, b, a], display: hexStr });
      } else if (f.type === "int") {
        const n = readInt(bytes);
        values.set(f.id, { raw: n, display: n * (f.scaling || 1) });
      } else if (f.type === "date") {
        const y = (bytes[0] << 8) | bytes[1],
          m = bytes[2],
          d = bytes[3];
        const str = `${y.toString().padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        values.set(f.id, { raw: { year: y, month: m, day: d }, display: str });
      } else if (f.type === "time") {
        const [hh = 0, mm = 0, ss = 0] = bytes;
        const str = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
        values.set(f.id, {
          raw: { hour: hh, minute: mm, second: ss },
          display: str,
        });
      }
    } catch {
      /* be forgiving on decode */
    }
  }

  return { values, warnings };
};

// --- Web NFC ---
const writeViaWebNFC = async (buf) => {
  if (!("NDEFReader" in window)) {
    throw new Error("Web NFC is not supported in this browser");
  }

  nfcController?.abort();
  const controller = new AbortController();
  nfcController = controller;
  showWebNfcDialog("Waiting to write tag...");

  const reader = new NDEFReader();
  await reader.write(
    {
      records: [
        {
          recordType: "mime",
          mediaType: SPEC.mime_type,
          data: buf,
        },
      ],
    },
    {
      overwrite: true,
      signal: controller.signal,
    },
  );
  controller.abort();
  if (nfcController === controller) nfcController = null;
  finishWebNfcAction("Wrote NDEF payload to tag");
};

// Scans for an OpenTag3D NDEF record and invokes onPayload(buffer, startAddr).
const readViaWebNFC = async (onPayload, { silent = false } = {}) => {
  if (!("NDEFReader" in window)) {
    throw new Error("Web NFC is not supported in this browser");
  }

  nfcController?.abort();
  const controller = new AbortController();
  nfcController = controller;
  if (!silent) showWebNfcDialog("Waiting to read tag...");

  const reader = new NDEFReader();
  await reader.scan({ signal: controller.signal });
  reader.addEventListener("reading", (event) => {
    let found = false;
    for (const record of event.message.records) {
      if (record.recordType === "mime" && record.mediaType === SPEC.mime_type) {
        found = true;
        if (!silent) {
          document.getElementById("webNfcDialogMessage").textContent =
            "Reading tag...";
          finishWebNfcAction("Found and loaded OpenTag3D record");
        }
        controller.abort();
        if (nfcController === controller) nfcController = null;
        onPayload(record.data.buffer, 0x00);
        break;
      }
    }
    if (!found && !silent) {
      controller.abort();
      if (nfcController === controller) nfcController = null;
      finishWebNfcAction("Read tag does not have any OpenTag3D records", true);
    }
  });
  reader.addEventListener("readingerror", () => {
    controller.abort();
    if (nfcController === controller) nfcController = null;
    if (!silent) {
      finishWebNfcAction(
        "Error reading tag, try again or try another tag",
        true,
      );
    }
  });
};

const startAutomaticWebNFC = (onPayload) =>
  readViaWebNFC(onPayload, { silent: true }).catch(() => {});

// Builds a full NTAG page dump (Capability Container + NDEF TLV wrapping
// our MIME payload), shared by the Flipper and Proxmark3 exporters.
const buildNtagPageDump = (buf) => {
  const type = textEncoder.encode(SPEC.mime_type);
  const payload = new Uint8Array(buf);
  const ndefLength =
    NFC_INFO.ndef.mimeRecordPrefixLength + type.length + payload.length;
  const totalNdefLength =
    ndefLength + NFC_INFO.ndef.extendedTlvPrefixLength + 1;
  const tag =
    totalNdefLength <= NFC_INFO.ntag.types.ntag215.userMemoryLength
      ? NFC_INFO.ntag.types.ntag215
      : NFC_INFO.ntag.types.ntag216;
  if (payload.length > 0xff || totalNdefLength > tag.userMemoryLength) {
    throw new Error("OpenTag3D data does not fit in an NTAG NDEF record");
  }

  const newbuf = new Uint8Array(tag.pageCount * NFC_INFO.ntag.pageSize);

  // Dummy UID (pages 0-2) with valid BCC checksums - readers/tools like
  // Proxmark3 validate these bytes to detect a well-formed NTAG dump, even
  // though the real UID is fixed in hardware and can't be written via NDEF.
  const uid = NFC_INFO.ntag.dummyUid;
  newbuf.set([uid[0], uid[1], uid[2], 0x88 ^ uid[0] ^ uid[1] ^ uid[2]], 0);
  newbuf.set([uid[3], uid[4], uid[5], uid[6]], 4);
  newbuf.set([uid[3] ^ uid[4] ^ uid[5] ^ uid[6], 0x48, 0x00, 0x00], 8);

  // Capability Container at page 3.
  newbuf.set(
    tag.cc,
    NFC_INFO.ntag.capabilityContainerPage * NFC_INFO.ntag.pageSize,
  );

  // Start the NDEF TLV at page 4, followed by a short MIME record.
  const ndefOffset = NFC_INFO.ntag.ndefPage * NFC_INFO.ntag.pageSize;
  newbuf.set(
    [
      NFC_INFO.ndef.tlvType,
      NFC_INFO.ndef.tlvExtendedLength,
      (ndefLength >> 8) & 0xff,
      ndefLength & 0xff,
      NFC_INFO.ndef.mimeRecordHeader,
      type.length,
      payload.length,
    ],
    ndefOffset,
  );
  const recordOffset = ndefOffset + NFC_INFO.ndef.extendedTlvPrefixLength;
  const payloadOffset =
    recordOffset + NFC_INFO.ndef.mimeRecordPrefixLength + type.length;
  newbuf.set(type, recordOffset + NFC_INFO.ndef.mimeRecordPrefixLength);
  newbuf.set(payload, payloadOffset);
  newbuf[recordOffset + ndefLength] = NFC_INFO.ndef.tlvTerminator;

  return { tag, newbuf };
};

// --- Flipper Zero export (.nfc minimal dump of user pages) ---
const downloadFlipperNfc = (buf, name) => {
  const uid = NFC_INFO.ntag.dummyUid;
  const { tag, newbuf } = buildNtagPageDump(buf);

  const header = [
    "Filetype: Flipper NFC device",
    "Version: 4",
    "# Device type can be ISO14443-3A, ISO14443-3B, ISO14443-4A, ISO14443-4B, ISO15693-3, FeliCa, NTAG/Ultralight, Mifare Classic, Mifare Plus, Mifare DESFire, SLIX, ST25TB",
    "Device type: NTAG/Ultralight",
    "# UID is common for all formats",
    `UID: ${uid.map((p) => hex(p)).join(" ")}`,
    "# ISO14443-3A specific data",
    "ATQA: 00 44",
    "SAK: 00",
    "# NTAG/Ultralight specific data",
    "Data format version: 2",
    `NTAG/Ultralight type: ${tag.type}`,
    "Signature: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00",
    "Mifare version: 00 04 04 02 01 00 11 03",
    "Counter 0: 0",
    "Tearing 0: 00",
    "Counter 1: 0",
    "Tearing 1: 00",
    "Counter 2: 0",
    "Tearing 2: 00",
    `Pages total: ${tag.pageCount}`,
    `Pages read: ${tag.pageCount}`,
  ];

  // Build page-aligned dump for user area only (each page = 4 bytes)
  const lines = [];
  for (let off = 0; off < newbuf.length; off += NFC_INFO.ntag.pageSize) {
    const page = off / NFC_INFO.ntag.pageSize;
    const slice = newbuf.subarray(off, off + NFC_INFO.ntag.pageSize);
    const b = [...slice].map((x) => hex(x)).join(" ");
    lines.push(`Page ${page}: ${b}`);
  }
  const content = header.concat(lines).join("\n") + "\n";
  downloadFile(content, "text/plain", name);
};

// --- Proxmark3 export (mfu_dump_t .bin: 56-byte header + raw page data) ---
// Header layout per RfidResearchGroup/proxmark3 include/mifare.h:
// version[8], tbo[2], tbo1[1], pages[1], signature[32], counter_tearing[3][4]
const PM3_MFU_HEADER_LENGTH = 56;
const PM3_MFU_VERSION = [0x00, 0x04, 0x04, 0x02, 0x01, 0x00, 0x11, 0x03];
const PM3_MFU_PAGES_OFFSET = 11;

const buildProxmark3Bin = (buf) => {
  const { tag, newbuf } = buildNtagPageDump(buf);
  const header = new Uint8Array(PM3_MFU_HEADER_LENGTH);
  header.set(PM3_MFU_VERSION, 0);
  // "pages" is the highest page index (page count - 1), not a count.
  header[PM3_MFU_PAGES_OFFSET] = tag.pageCount - 1;
  const out = new Uint8Array(PM3_MFU_HEADER_LENGTH + newbuf.length);
  out.set(header, 0);
  out.set(newbuf, PM3_MFU_HEADER_LENGTH);
  return out;
};

const parseProxmark3Bin = (buf) => {
  const bytes = new Uint8Array(buf);
  if (bytes.length < PM3_MFU_HEADER_LENGTH) {
    throw new Error("File is too short to be a Proxmark3 dump");
  }
  const pages = bytes[PM3_MFU_PAGES_OFFSET] + 1;
  const data = bytes.subarray(
    PM3_MFU_HEADER_LENGTH,
    PM3_MFU_HEADER_LENGTH + pages * NFC_INFO.ntag.pageSize,
  );
  const payload = extractNdefPayload(data, 0x00);
  if (!payload) {
    throw new Error("No OpenTag3D record found in Proxmark3 dump");
  }
  return payload;
};

// --- IMPORTERS ---

// Parse our hexdump lines, Flipper "Page XX:" lines, or plain hex bytes.
const parseBytesFromText = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const byteMap = new Map();
  let minAddr = Infinity,
    maxAddr = -Infinity,
    sawAddressed = false;

  for (const line of lines) {
    // App hexdump: "0x10  AA BB ... |....|"
    let m = line.match(
      /^0x([0-9A-Fa-f]+)\s+((?:[0-9A-Fa-f]{2}\s+){0,15}[0-9A-Fa-f]{2})(?:\s+\|.*)?$/,
    );
    if (m) {
      const base = parseInt(m[1], 16);
      const bytes = m[2]
        .trim()
        .split(/\s+/)
        .map((h) => parseInt(h, 16));
      bytes.forEach((b, i) => byteMap.set(base + i, b));
      minAddr = Math.min(minAddr, base);
      maxAddr = Math.max(maxAddr, base + bytes.length - 1);
      sawAddressed = true;
      continue;
    }
    // Flipper page labels are decimal: "Page 10: AA BB CC DD"
    m = line.match(
      /^Page\s+(\d+):\s+((?:[0-9A-Fa-f]{2}\s+){0,3}[0-9A-Fa-f]{2})$/,
    );
    if (m) {
      const page = parseInt(m[1], 10);
      const base = page * NFC_INFO.ntag.pageSize;
      const bytes = m[2]
        .trim()
        .split(/\s+/)
        .map((h) => parseInt(h, 16));
      bytes.forEach((b, i) => byteMap.set(base + i, b));
      minAddr = Math.min(minAddr, base);
      maxAddr = Math.max(maxAddr, base + bytes.length - 1);
      sawAddressed = true;
      continue;
    }
  }

  if (sawAddressed) {
    const start = isFinite(minAddr) ? minAddr : 0x10;
    const out = new Uint8Array(maxAddr - start + 1);
    out.fill(0);
    for (let a = minAddr; a <= maxAddr; a++) {
      const b = byteMap.get(a);
      if (typeof b === "number") out[a - minAddr] = b;
    }
    return { startAddr: start, data: out };
  }

  // Plain hex bytes
  const all = text
    .replace(/[^0-9A-Fa-f]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (all.length) {
    return {
      startAddr: 0x00,
      data: new Uint8Array(all.map((h) => parseInt(h, 16))),
    };
  }
  throw new Error("No recognizable hex format found");
};

const extractNdefPayload = (data, startAddr) => {
  const ndefOffset =
    NFC_INFO.ntag.ndefPage * NFC_INFO.ntag.pageSize - startAddr;
  if (ndefOffset < 0 || data[ndefOffset] !== NFC_INFO.ndef.tlvType) return null;

  const lengthByte = data[ndefOffset + 1];
  const lengthOffset =
    ndefOffset + (lengthByte === NFC_INFO.ndef.tlvExtendedLength ? 2 : 1);
  const ndefLength =
    lengthByte === NFC_INFO.ndef.tlvExtendedLength
      ? (data[lengthOffset] << 8) | data[lengthOffset + 1]
      : lengthByte;
  const recordOffset =
    lengthOffset + (lengthByte === NFC_INFO.ndef.tlvExtendedLength ? 2 : 1);
  const recordEnd = recordOffset + ndefLength;

  if (
    recordEnd > data.length ||
    data[recordOffset] !== NFC_INFO.ndef.mimeRecordHeader
  )
    return null;

  const typeLength = data[recordOffset + 1];
  const payloadLength = data[recordOffset + 2];
  const typeOffset = recordOffset + NFC_INFO.ndef.mimeRecordPrefixLength;
  const payloadOffset = typeOffset + typeLength;
  const type = new TextDecoder().decode(
    data.subarray(typeOffset, payloadOffset),
  );

  if (type !== SPEC.mime_type || payloadOffset + payloadLength > recordEnd) {
    return null;
  }

  return data.slice(payloadOffset, payloadOffset + payloadLength);
};

// Parse an NFC Tools Desktop .json export and pull out our MIME record's payload.
const parseNfcToolsDesktopJson = (json) => {
  const records = Array.isArray(json?.data) ? json.data : [];
  for (const record of records) {
    const obj = record?.kRecordObject;
    if (!obj || !Array.isArray(obj.kPayload)) continue;
    const type = Array.isArray(obj.kType)
      ? String.fromCharCode(...obj.kType)
      : record.kRecordField1;
    if (type === SPEC.mime_type) {
      return new Uint8Array(obj.kPayload);
    }
  }
  return null;
};

// Parse an NFC Tools mobile app profile export and pull out our MIME record's payload.
// Profiles nest base64-encoded JSON several layers deep: profile.data -> tag fields
// (last of which is NDEFMessage) -> NDEF records -> {type, payload} (both base64).
const parseNfcToolsMobileJson = (json) => {
  const profiles = Array.isArray(json?.profiles) ? json.profiles : [];
  for (const profile of profiles) {
    if (typeof profile?.data !== "string") continue;
    const fields = JSON.parse(base64ToString(profile.data));
    const ndefMessageB64 = fields.find((f) => "NDEFMessage" in f)?.NDEFMessage;
    if (!ndefMessageB64) continue;

    const records = JSON.parse(base64ToString(ndefMessageB64));
    for (const rec of records) {
      if (!rec?.NDEFRecord) continue;
      const record = JSON.parse(base64ToString(rec.NDEFRecord));
      const type = base64ToString(record.type || "");
      if (type === SPEC.mime_type) {
        return mobilePayloadFromBase64(record.payload || "");
      }
    }
  }
  return null;
};

const parseNfcToolsJson = (json) => {
  const payload = Array.isArray(json?.profiles)
    ? parseNfcToolsMobileJson(json)
    : parseNfcToolsDesktopJson(json);
  if (!payload) {
    throw new Error("No OpenTag3D record found in NFC Tools JSON");
  }
  return payload;
};

// Parses clipboard/file text content (our hexdump, Flipper dump, plain hex,
// or NFC Tools JSON) into a raw buffer + its starting address.
const parseImportedText = (text) => {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    return { data: parseNfcToolsJson(JSON.parse(trimmed)), startAddr: 0x00 };
  }
  const { data, startAddr } = parseBytesFromText(trimmed);
  const payload = extractNdefPayload(data, startAddr);
  return payload ? { data: payload, startAddr: 0x00 } : { data, startAddr };
};

const describeTag = (values, hash) => {
  const manufacturer = values.get("manufacturer");
  const material = values.get("material");
  const materialMod = values.get("material_mod");
  const colorName = values.get("color_name");
  const serial = values.get("serial") || hash;
  return `OpenTag3D: ${manufacturer} ${material}${materialMod ? "-" + materialMod : ""} - ${colorName} [${serial}]`;
};

const buildNfcToolsDesktopJson = (buf, description) => {
  const payloadBytes = [...new Uint8Array(buf)];
  const payloadString = String.fromCharCode(...payloadBytes);
  return JSON.stringify({
    ntgui_version: 18,
    data: [
      {
        kRecordDescription: description,
        kRecordField2: payloadString,
        kRecordSelection: 9,
        kRecordField1: SPEC.mime_type,
        kRecordSize: payloadBytes.length,
        kRecordObject: {
          kTnf: 2,
          kChunked: false,
          kType: [...textEncoder.encode(SPEC.mime_type)],
          kId: [],
          kPayload: payloadBytes,
        },
      },
    ],
  });
};

// Mirrors the nested base64-JSON structure produced by the NFC Tools mobile app.
const NFC_TOOLS_MOBILE_TAG_FIELD_NAMES = [
  "Identifier",
  "Tech",
  "Type",
  "Iso",
  "PMm",
  "ATQA",
  "SAK",
  "SystemCode",
  "NdefStatus",
  "NdefSize",
  "NdefMaxSize",
  "DataFormat",
  "PlatformName",
  "PlatformDescription",
  "Signature",
  "PasswordStatus",
  "TagTamperStatus",
  "HistoricalBytes",
  "TagAFI",
  "TagDSFID",
  "TagLockedOverrideStatus",
];

const buildNfcToolsMobileJson = (buf, description) => {
  // Note: unlike parsing, the mobile app writes the raw base64-decoded bytes
  // to the tag as-is (it does not reverse the Latin-1/UTF-8 expansion seen
  // when it exports an already-written tag), so this must stay plain base64.
  const ndefRecord = stringToBase64(
    JSON.stringify({
      identifier: "",
      type: stringToBase64(SPEC.mime_type),
      payload: bytesToBase64(new Uint8Array(buf)),
      format: bytesToBase64([0x02]), // TNF: MIME media type
    }),
  );
  const ndefMessage = stringToBase64(
    JSON.stringify([{ NDEFRecord: ndefRecord }]),
  );
  const tagFields = NFC_TOOLS_MOBILE_TAG_FIELD_NAMES.map((name) => ({
    [name]: "",
  }));
  tagFields.push({ NDEFMessage: ndefMessage });

  return JSON.stringify({
    type: "nfc-tools-profiles",
    profiles: [
      {
        name: description,
        recordsCount: "1",
        data: stringToBase64(JSON.stringify(tagFields)),
      },
    ],
    version: 1,
  });
};

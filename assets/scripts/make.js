import "./filament-search.js";
import { h, msg } from "./site.js";
import {
  allFields,
  bufferFromText,
  bufferToHex,
  buildNfcToolsDesktopJson,
  buildNfcToolsMobileJson,
  buildProxmark3Bin,
  cancelWebNFC,
  decodeTagBuffer,
  describeTag,
  downloadFile,
  downloadFlipperNfc,
  encodeFieldValue,
  finishWebNfcAction,
  fixHexRgba,
  generateHash,
  hexdump,
  hex,
  parseHex,
  parseImportedText,
  parseProxmark3Bin,
  readViaWebNFC,
  rgbaFromHex,
  urlParams,
  writeViaWebNFC,
} from "./opentag3d.js";

const SPEC = globalThis.OpenTag3D.spec;
const MATERIAL_DENSITIES = globalThis.OpenTag3D.materialDensities;
const MATERIAL_DENSITY_BY_NAME = new Map(
  Object.entries(MATERIAL_DENSITIES).map(([material, density]) => [
    material.toLowerCase(),
    density,
  ]),
);
const materialField = allFields.find((field) => field.id === "material");
const textEncoder = new TextEncoder();
const materialOptions = Object.keys(MATERIAL_DENSITIES)
  .filter(
    (material) => textEncoder.encode(material).length <= materialField.length,
  )
  .map((material) => h("option", { value: material }));
const tagState = {
  values: new Map(),
  buffer: null,
  hash: null,
  filename: "",
};

let autoFilledDensity = null;
const inputSynchronizers = new WeakMap();

const hexdumpElement = document.getElementById("hexdump");
const webNfcDialog = document.getElementById("webNfcDialog");
const helpDialog = document.getElementById("helpDialog");

const checkMissing = () => {
  if (document.querySelectorAll(".field-row.invalid").length) {
    msg("Please fill out all required fields first", true);
    return true;
  }
  return false;
};

// --- Rendering ---
const renderForm = (includeUrlParams = true) => {
  const host = document.getElementById("formHost");
  host.innerHTML = "";

  const box = h("div", { class: `grid` });
  for (const f of allFields) {
    // Tag version is filled in automatically
    if (f.id === "tag_version") continue;
    // Ignore any deprecated fields
    if (f.id.startsWith("deprecated_")) continue;
    const row = h("div", {
      class: "field-row",
      "data-field": f.id,
    });
    const left = h("div");
    const label = h("label", {}, `${f.name}`);
    if (f.required) label.append(h("span", { class: "text--danger" }, "*"));
    left.append(label);
    const input = renderInputForField(f, includeUrlParams);
    if (f.id === "material") {
      input.setAttribute("list", "materialOptions");
      left.append(
        input,
        h("datalist", { id: "materialOptions" }, ...materialOptions),
      );
    } else {
      left.append(input);
    }
    row.append(left);
    const meta = h(
      "div",
      { class: "help" },
      h("span", { class: "chip mono" }, `id:${f.id}`),
      h("span", { class: "chip mono" }, `addr:${f.start}`),
      h("span", { class: "chip mono" }, `len:${f.length}`),
      f.unit && !["string", "version"].includes(f.unit)
        ? h("span", { class: "chip" }, `unit:${f.unit}`)
        : "",
      f.scaling ? h("span", { class: "chip" }, `scaling:${f.scaling}`) : "",
    );
    row.append(meta);
    if (f.description) {
      row.append(h("div", { class: "help" }, f.description));
    }
    if (f.id === "density") {
      row.append(
        h(
          "div",
          { class: "help" },
          "Density is auto-filled for known materials, but can be overridden if needed.",
        ),
      );
    }
    box.append(row);
  }
  host.append(box);
};

const syncInputValue = (input, fieldId, transform = (value) => value) => {
  const sync = () => {
    tagState.values.set(fieldId, transform(input.value));
  };
  inputSynchronizers.set(input, sync);
  input.addEventListener("input", () => {
    sync();
    buildMemory();
  });
  sync();
};

const setInputValue = (input, value) => {
  if (!input) return;
  input.value = value;
  inputSynchronizers.get(input)?.();
};

const roundToScale = (value, scale) => {
  if (scale === 1) return value;
  const decimalPlaces = scale < 1 ? String(scale).split(".")[1].length : 0;
  return Number((Math.round(value / scale) * scale).toFixed(decimalPlaces));
};

const resetFormFields = () => {
  tagState.values.clear();
  autoFilledDensity = null;
  document
    .querySelectorAll(".field-row input:not([type=hidden])")
    .forEach((input) => {
      setInputValue(input, input.dataset.resetValue);
      input.classList.remove("autofilled");
      input.removeAttribute("title");
    });
};

const updateDensityFromMaterial = (onlyIfEmpty = false) => {
  const materialInput = document.getElementById("material");
  const densityInput = document.getElementById("density");
  if (!materialInput || !densityInput) return;

  const density = MATERIAL_DENSITY_BY_NAME.get(
    materialInput.value.trim().toLowerCase(),
  );
  if (density !== undefined) {
    if (
      densityInput.value !== "" &&
      (onlyIfEmpty || autoFilledDensity !== densityInput.value)
    ) {
      return;
    }
    setInputValue(densityInput, density);
    autoFilledDensity = densityInput.value;
    densityInput.classList.add("autofilled");
    densityInput.title = "Auto-filled from the selected material";
    buildMemory();
  } else if (
    autoFilledDensity !== null &&
    densityInput.value === autoFilledDensity
  ) {
    setInputValue(densityInput, "");
    autoFilledDensity = null;
    densityInput.classList.remove("autofilled");
    densityInput.removeAttribute("title");
    buildMemory();
  }
};

const truncateUtf8 = (value, maxBytes) => {
  let result = "";
  let byteLength = 0;
  for (const character of value) {
    const characterLength = textEncoder.encode(character).length;
    if (byteLength + characterLength > maxBytes) break;
    result += character;
    byteLength += characterLength;
  }
  return result;
};

const splitSpoolMaterial = (material) => {
  const separator = material.search(/[+\- ]/);
  if (separator > 0) {
    const base = material.slice(0, separator);
    const modifier =
      material[separator] === "+" && separator === material.length - 1
        ? "Plus"
        : material.slice(separator + 1);
    return { material: base, modifier };
  }

  if (textEncoder.encode(material).length <= 5) {
    return { material, modifier: "" };
  }

  return {
    material: truncateUtf8(material, 5),
    modifier: "",
    truncated: true,
  };
};

const spoolColorValue = (color, translucent) => {
  if (typeof color !== "string") return null;
  const hexColor = color.replace(/^#/, "");
  if (!/^(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hexColor)) return null;
  const alpha =
    hexColor.length === 8 ? hexColor.slice(6) : translucent ? "80" : "FF";
  return `#${hexColor.slice(0, 6)}${alpha}`;
};

const applySpoolmanDBData = (filament) => {
  resetFormFields();
  const material = splitSpoolMaterial(filament.material);
  const warnings = [];
  const setSpoolField = (
    id,
    value,
    { required = false, allowZero = false } = {},
  ) => {
    const input = document.getElementById(id);
    if (!input) return;
    const field = allFields.find((candidate) => candidate.id === id);

    if (field?.type === "int") {
      if (value === undefined || value === null) {
        value = "";
        if (required) {
          warnings.push(`no valid ${id} value was available`);
        }
      } else if (
        !Number.isFinite(value) ||
        (value <= 0 && !(allowZero && value === 0)) ||
        value > Number(input.max)
      ) {
        value = "";
        warnings.push(`no valid ${id} value was available`);
      } else {
        const scale = field.scaling || 1;
        value = roundToScale(value, scale);
      }
    } else if (field?.type === "utf8" || field?.type === "ascii") {
      const text = typeof value === "string" ? value : "";
      value = truncateUtf8(text, field.length);
      if (value !== text) warnings.push(`${id} was shortened to fit`);
    }

    setInputValue(input, value);
  };

  setSpoolField("manufacturer", filament.manufacturer);
  setSpoolField("material", material.material);
  setSpoolField("material_mod", material.modifier);
  if (material.truncated) warnings.push("material type was shortened to fit");
  setSpoolField("color_name", filament.name);

  const colors = Array.isArray(filament.color_hexes)
    ? filament.color_hexes
    : filament.color_hex
      ? [filament.color_hex]
      : [];
  const colorFieldIds = ["color_1", "color_2", "color_3", "color_4"];
  const colorValues = colors.slice(0, colorFieldIds.length);
  for (const [index, fieldId] of colorFieldIds.entries()) {
    const color = spoolColorValue(
      colorValues[index],
      filament.translucent === true,
    );
    if (color) {
      setSpoolField(fieldId, color);
    } else if (index === 0) {
      setSpoolField(fieldId, "#FFFFFFFF");
      warnings.push("no valid primary color was available");
    } else {
      setSpoolField(fieldId, "#00000000");
    }
  }
  if (colors.length > colorFieldIds.length) {
    warnings.push("only the first four colors were used");
  }

  const getTemperature = (temperature, range) => {
    if (temperature !== undefined && temperature !== null) return temperature;
    if (
      !Array.isArray(range) ||
      range.length < 2 ||
      !Number.isFinite(range[0]) ||
      !Number.isFinite(range[1])
    ) {
      return temperature;
    }

    return Math.ceil((range[0] + range[1]) / 2 / 5) * 5;
  };

  setSpoolField("density", filament.density, { required: true });
  setSpoolField("diameter", filament.diameter, { required: true });
  setSpoolField("weight", filament.weight, { required: true });
  setSpoolField("empty_spool_weight", filament.spool_weight);
  setSpoolField("td", filament.transmission_distance);
  const extruderTempRange = filament.extruder_temp_range;
  setSpoolField(
    "print_temp",
    getTemperature(filament.extruder_temp, extruderTempRange),
    { required: true },
  );
  if (Array.isArray(extruderTempRange)) {
    setSpoolField("min_print_temp", extruderTempRange[0]);
    setSpoolField("max_print_temp", extruderTempRange[1]);
  }

  const bedTempRange = filament.bed_temp_range;
  setSpoolField("bed_temp", getTemperature(filament.bed_temp, bedTempRange), {
    required: true,
  });
  if (Array.isArray(bedTempRange)) {
    setSpoolField("min_bed_temp", bedTempRange[0]);
    setSpoolField("max_bed_temp", bedTempRange[1]);
  }
  setSpoolField("chamber_temp", 0, { allowZero: true });

  const densityInput = document.getElementById("density");
  autoFilledDensity = null;
  densityInput.classList.remove("autofilled");
  densityInput.removeAttribute("title");

  buildMemory();
  const materialType = `${material.material}${material.modifier ? ` ${material.modifier}` : ""}`;
  const message = warnings.length
    ? `Loaded ${filament.manufacturer} ${materialType} ${filament.name}. Note: ${warnings.join(", ")}.`
    : `Loaded ${filament.manufacturer} ${materialType} ${filament.name}.`;
  msg(message);
};

const renderInputForField = (f, includeUrlParams = true) => {
  // Calculate placeholder
  let placeholder = "";
  const firstExample = f.examples?.[0];
  if (firstExample !== undefined) {
    if (f.type === "int") {
      placeholder = firstExample * (f.scaling || 1);
    } else if (f.type === "rgba") {
      placeholder =
        "#" +
        firstExample
          .map((x) => x.toString(16).toUpperCase().padStart(2, "0"))
          .join("");
    } else {
      placeholder = firstExample;
    }
  }

  const paramValue = includeUrlParams ? urlParams.get(f.id) || "" : "";
  if (paramValue) tagState.values.set(f.id, paramValue);
  const resetValue =
    f.type === "rgba" ? (f.id === "color_1" ? "#FFFFFFFF" : "#00000000") : "";

  const commonParams = {
    id: f.id,
    "data-unit": f.unit,
    "data-reset-value": resetValue,
    placeholder,
    value: paramValue,
  };

  if (f.required) {
    commonParams["required"] = true;
  }

  // Generic by type
  if (f.type === "rgba") {
    const input = h("input", {
      ...commonParams,
      type: "text",
      value: paramValue ? fixHexRgba(paramValue) : resetValue,
    });

    const setBackground = (value) => {
      input.style.backgroundImage = `
        linear-gradient(135deg, ${value.slice(0, 7)} 0%, ${value.slice(0, 7)} 50%, ${value} 50%, ${value} 100%),
        url(/assets/images/transparency-grid.jpg)
      `;
    };

    const update = () => {
      const value = fixHexRgba(input.value);
      const rgba = rgbaFromHex(value);
      setBackground(value);
      tagState.values.set(f.id, rgba);
    };

    inputSynchronizers.set(input, update);
    input.addEventListener("input", () => {
      update();
      buildMemory();
    });
    input.addEventListener("focusout", () => {
      input.value = fixHexRgba(input.value);
    });
    update();

    return input;
  }
  if (f.type === "int") {
    const scale = f.scaling || 1;
    const inp = h("input", {
      ...commonParams,
      type: "number",
      min: 0,
      max: 255.0 ** f.length * scale,
      step: scale,
    });

    const roundAndClip = (value) => {
      if (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
      ) {
        return "";
      }

      let num = typeof value === "number" ? value : parseFloat(value);
      if (isNaN(num)) {
        return "";
      }

      num = roundToScale(num, scale);

      if (num < 0) {
        num = 0;
      } else if (num > inp.max) {
        num = inp.max;
      }

      return num;
    };

    syncInputValue(inp, f.id, (value) =>
      Math.round(parseFloat(value || "0") / scale),
    );

    inp.addEventListener(
      "focusout",
      () => (inp.value = roundAndClip(inp.value)),
    );

    return inp;
  }
  if (f.type === "date") {
    const ph = new Date().toISOString().split("T")[0];
    const inp = h("input", {
      ...commonParams,
      type: "date",
      placeholder: ph,
    });
    syncInputValue(inp, f.id);
    return inp;
  }
  if (f.type === "time") {
    const ph = new Date().toISOString().split("T")[1].split(".")[0];
    const inp = h("input", {
      ...commonParams,
      type: "time",
      step: 1,
      placeholder: ph,
    });
    syncInputValue(inp, f.id);
    return inp;
  }

  // Text fallback
  const inp = h("input", {
    ...commonParams,
    type: "text",
    maxlength: f.length,
  });
  syncInputValue(inp, f.id);
  return inp;
};

// --- Building ---
const buildMemory = () => {
  const size = parseHex(SPEC["core"].address_range.end) + 1;
  const buf = new Uint8Array(size + 1);
  buf.fill(0x00);

  // --- required validation helpers ---
  const isPresent = (f, val) => {
    if (!f.required) return true;
    if (f.type === "ascii" || f.type === "utf8")
      return typeof val === "string" && val.trim().length > 0;
    if (f.type === "rgba") return Array.isArray(val) && val.length === 4;
    if (f.type === "int") {
      if (val === undefined || val === null || val === "") return false;
      if (typeof val === "string" && val.trim() === "") return false;
      const n = typeof val === "number" ? val : Number(val);
      return Number.isFinite(n);
    }
    if (f.type === "date" || f.type === "time") {
      return typeof val === "string" && val.trim().length > 0;
    }
    return val !== undefined && val !== null && String(val).trim().length > 0;
  };

  tagState.values.set(
    "tag_version",
    Math.round(parseFloat(SPEC.version) * 1000),
  );

  const missing = allFields.filter(
    (f) => f.required && !isPresent(f, tagState.values.get(f.id)),
  );

  // highlight missing rows
  document
    .querySelectorAll("[data-field]")
    .forEach((el) => el.classList.remove("invalid"));
  for (const f of missing) {
    const row = document.querySelector(`[data-field="${f.id}"]`);
    if (row) row.classList.add("invalid");
  }

  const push = (addr, bytes) => {
    if (addr < 0 || addr + bytes.length > buf.length) {
      throw new Error(
        `Address ${addr} is out of range (length is ${buf.length})`,
      );
    }
    buf.set(bytes, addr);
  };

  for (const f of allFields) {
    if (f.type === "-") continue;
    const addr = parseHex(f.start);
    const val = tagState.values.get(f.id);
    try {
      push(addr, encodeFieldValue(f, val));
    } catch (e) {
      throw new Error(`Error packing ${f.name}: ${e.message}`);
    }
  }

  // Update hexdump
  hexdumpElement.textContent = hexdump(buf);

  tagState.buffer = buf;
  tagState.hash = generateHash(buf.toString()).slice(0, 8);
  tagState.filename = `OpenTag3D_${tagState.values.get("manufacturer")}_${tagState.values.get("material")}${tagState.values.get("material_mod") ? "-" + tagState.values.get("material_mod") : ""}_${tagState.values.get("color_name")}_${tagState.values.get("serial") || tagState.hash}`;
};

const downloadBin = (buf, name) => {
  downloadFile(buf, "application/octet-stream", name);
};

const registerExport = (buttonId, extension, exportData) => {
  const filename = () => `${tagState.filename}${extension}`;
  document.getElementById(buttonId).addEventListener("click", () => {
    if (checkMissing()) return;
    exportData(filename());
    msg(`Downloaded ${filename()}`);
  });
};

const loadImportedText = async (text) => {
  const { data, startAddr } = parseImportedText(text);
  await loadBufferIntoForm(data, startAddr);
};

// Decode imported buffer back into the form (reverse the scalings where we can)
const loadBufferIntoForm = async (buf, startAddr) => {
  const data = new Uint8Array(buf);
  hexdumpElement.textContent = hexdump(data, startAddr);

  const { values, warnings } = await decodeTagBuffer(data, startAddr);
  warnings.forEach((w) => msg(`Warning: ${w}`, true));

  for (const [id, { display }] of values) {
    if (id === "tag_version") continue;
    if (id.startsWith("deprecated_")) continue;
    const el = document.getElementById(id);
    if (!display && !el.required) continue;
    setInputValue(el, display);
  }

  buildMemory();
};

const fillExamples = (optional = false) => {
  const inputs = document.querySelectorAll(
    ".field-row input:not([type=hidden])",
  );
  for (const input of inputs) {
    if (optional || input.required) {
      setInputValue(input, input.placeholder);
    }
  }
  buildMemory();
  msg(`Filled ${optional ? "all" : "required"} field examples`);
};

// --- Init ---
window.addEventListener("DOMContentLoaded", () => {
  window.addEventListener("error", (e) => {
    msg("Error: " + e.message, true);
  });

  renderForm();
  buildMemory();

  const filamentSearch = document.getElementById("filamentSearch");
  filamentSearch.addEventListener("search-select", (event) =>
    applySpoolmanDBData(event.detail.item),
  );
  filamentSearch.addEventListener("search-error", (event) =>
    msg(
      `Could not load SpoolmanDB: ${event.detail.error.message}. Try searching again.`,
      true,
    ),
  );

  document
    .getElementById("material")
    .addEventListener("input", () => updateDensityFromMaterial());
  document.getElementById("density").addEventListener("input", () => {
    autoFilledDensity = null;
    document.getElementById("density").classList.remove("autofilled");
    document.getElementById("density").removeAttribute("title");
  });
  updateDensityFromMaterial(true);

  document
    .getElementById("webNfcDialogClose")
    .addEventListener("click", () => webNfcDialog.close());
  webNfcDialog.addEventListener("close", () => {
    cancelWebNFC();
  });

  document.getElementById("readWebNFC").addEventListener("click", () => {
    readViaWebNFC((buf, startAddr) =>
      loadBufferIntoForm(buf, startAddr).catch((e) =>
        finishWebNfcAction(e.message, true),
      ),
    ).catch((e) => finishWebNfcAction(e.message, true));
  });

  document
    .getElementById("helpDialogClose")
    .addEventListener("click", () => helpDialog.close());

  const hexParam = urlParams.get("hex");
  if (hexParam) {
    loadBufferIntoForm(bufferFromText(hexParam), 0x00).catch((e) =>
      msg("Import error: " + e.message, true),
    );
  }

  document
    .getElementById("exampleBtn")
    .addEventListener("click", () => fillExamples());

  document
    .getElementById("allExampleBtn")
    .addEventListener("click", () => fillExamples(true));

  document.getElementById("resetBtn").addEventListener("click", () => {
    resetFormFields();
    buildMemory();
    msg("Form has been reset to defaults");
  });

  // Load/import actions
  document
    .getElementById("loadFileBtn")
    .addEventListener("click", () =>
      document.getElementById("uploadFile").click(),
    );

  document
    .getElementById("loadClipboardBtn")
    .addEventListener("click", async () => {
      const clipboard = await navigator.clipboard.readText();
      try {
        await loadImportedText(clipboard);
        msg("Loaded data from clipboard");
      } catch (e) {
        msg(
          "Clipboard does not appear to be a valid OpenTag3D dump - " +
            e.message,
          true,
        );
        throw e;
      }
    });

  document
    .getElementById("uploadFile")
    .addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        if (file.name.toLowerCase().endsWith(".bin")) {
          const buf = await file.arrayBuffer();
          // A Proxmark3 dump is just a raw .bin with a 56-byte header, try that first.
          try {
            await loadBufferIntoForm(parseProxmark3Bin(buf), 0x00);
          } catch {
            await loadBufferIntoForm(buf, 0x00);
          }
        } else {
          await loadImportedText(await file.text());
        }
        msg(`Loaded ${file.name}`);
      } catch (err) {
        msg("Import error: " + err.message, true);
      } finally {
        e.target.value = "";
      }
    });

  // Save/export actions
  registerExport("downloadBin", ".bin", (name) =>
    downloadBin(tagState.buffer, name),
  );
  registerExport("downloadFlipper", ".nfc", (name) =>
    downloadFlipperNfc(tagState.buffer, name),
  );
  registerExport("downloadProxmark3Bin", ".pm3.bin", (name) =>
    downloadBin(buildProxmark3Bin(tagState.buffer), name),
  );
  registerExport(
    "downloadNfcToolsDesktopJson",
    ".nfctools-desktop.json",
    (name) =>
      downloadFile(
        buildNfcToolsDesktopJson(
          tagState.buffer,
          describeTag(tagState.values, tagState.hash),
        ),
        "application/json",
        name,
      ),
  );
  registerExport(
    "downloadNfcToolsMobileJson",
    ".nfctools-mobile.json",
    (name) =>
      downloadFile(
        buildNfcToolsMobileJson(
          tagState.buffer,
          describeTag(tagState.values, tagState.hash),
        ),
        "application/json",
        name,
      ),
  );

  document.getElementById("writeWebNFC").addEventListener("click", () => {
    if (!checkMissing()) {
      writeViaWebNFC(tagState.buffer).catch((e) =>
        finishWebNfcAction("Web NFC error: " + e.message, true),
      );
    }
  });

  document
    .getElementById("copyToClipboard")
    .addEventListener("click", async () => {
      await navigator.clipboard.writeText(bufferToHex(tagState.buffer));
      msg("Copied hex dump to clipboard");
    });

  document.getElementById("copyLink").addEventListener("click", async () => {
    const newParams = new URLSearchParams();
    for (const f of allFields) {
      const v = tagState.values.get(f.id);

      if (v == null || v === "") continue;
      if (f.id === "tag_version") continue;
      if (!f.required) {
        if (v === "" || v === undefined || v === null) continue;
        if (Array.isArray(v) && v.every((vp) => vp === 0)) continue;
      }

      if (f.type === "rgba") {
        newParams.set(f.id, v.map((vp) => hex(vp)).join(""));
      } else if (f.scaling) {
        newParams.set(f.id, v * f.scaling);
      } else {
        newParams.set(f.id, v);
      }
    }

    await navigator.clipboard.writeText(
      window.location.origin +
        window.location.pathname +
        "?" +
        newParams.toString(),
    );

    msg("Copied link to clipboard");
  });

  document
    .getElementById("helpButton")
    .addEventListener("click", () => helpDialog.showModal());

  // Enable explicit Web NFC actions when Web NFC is available.
  document.getElementById("writeWebNFC").disabled = !("NDEFReader" in window);
  document.getElementById("readWebNFC").disabled = !("NDEFReader" in window);
});

import "./search-box.js";

const DEFAULT_DATA_URL = "https://donkie.github.io/SpoolmanDB/filaments.json";
const dataCache = new Map();

export const MANUFACTURER_SHORTNAMES = new Map([
  ["polar filament", "pfil"],
  ["prusament", "prusa"],
]);

const loadFilaments = (url) => {
  if (!dataCache.has(url)) {
    const request = fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`SpoolmanDB returned HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (
          !Array.isArray(data) ||
          data.some(
            (filament) =>
              !filament ||
              typeof filament.manufacturer !== "string" ||
              typeof filament.material !== "string" ||
              typeof filament.name !== "string",
          )
        ) {
          throw new Error("SpoolmanDB returned an unexpected data format");
        }
        return data;
      })
      .catch((error) => {
        dataCache.delete(url);
        throw error;
      });
    dataCache.set(url, request);
  }
  return dataCache.get(url);
};

class FilamentSearch extends HTMLElement {
  constructor() {
    super();
    this.renderOptionCallback = null;
    this.getOptionLabelCallback = null;
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <search-box>
        <span slot="help">Search results come from </span>
        <a slot="help" href="https://donkie.github.io/SpoolmanDB/" target="_blank">SpoolmanDB</a>
        <span slot="help">.</span>
      </search-box>
    `;
    this.searchBox = this.shadowRoot.querySelector("search-box");
    this.searchBox.search = (query) => this.search(query);
    this.searchBox.renderOption = (filament, index) =>
      this.renderOptionCallback
        ? this.renderOptionCallback(filament, index)
        : this.defaultRenderOption(filament);
    this.searchBox.getOptionLabel = (filament, index) =>
      this.getOptionLabelCallback
        ? this.getOptionLabelCallback(filament, index)
        : `${filament.manufacturer} ${filament.material} ${filament.name}`;

    this.searchBox.addEventListener("search-select", (event) => {
      this.dispatchEvent(
        new CustomEvent("search-select", {
          detail: event.detail,
          bubbles: true,
          composed: true,
        }),
      );
    });
    this.searchBox.addEventListener("search-error", (event) => {
      this.dispatchEvent(
        new CustomEvent("search-error", {
          detail: event.detail,
          bubbles: true,
          composed: true,
        }),
      );
    });
  }

  connectedCallback() {
    for (const attribute of [
      "label",
      "placeholder",
      "max-results",
      "min-characters",
    ]) {
      if (this.hasAttribute(attribute)) {
        this.searchBox.setAttribute(attribute, this.getAttribute(attribute));
      }
    }
  }

  set renderOption(callback) {
    if (typeof callback !== "function") {
      throw new TypeError("SpoolmanSearch.renderOption must be a function");
    }
    this.renderOptionCallback = callback;
  }

  set getOptionLabel(callback) {
    if (typeof callback !== "function") {
      throw new TypeError("SpoolmanSearch.getOptionLabel must be a function");
    }
    this.getOptionLabelCallback = callback;
  }

  get dataUrl() {
    return this.getAttribute("data-url") || DEFAULT_DATA_URL;
  }

  get searchFields() {
    return (this.getAttribute("search-fields") || "manufacturer material name")
      .split(/\s+/)
      .filter(Boolean);
  }

  async search(query) {
    const filaments = await loadFilaments(this.dataUrl);
    const terms = query.toLocaleLowerCase().trim().split(/\s+/);
    const fields = this.searchFields;
    return filaments.filter((filament) => {
      const searchableValues = fields
        .map((field) => filament[field])
        .filter((value) => value !== undefined && value !== null)
        .map((value) =>
          Array.isArray(value) ? value.join(" ") : String(value),
        );
      if (fields.includes("manufacturer")) {
        const shortname = MANUFACTURER_SHORTNAMES.get(
          filament.manufacturer.toLocaleLowerCase(),
        );
        if (shortname) searchableValues.push(shortname);
      }
      const searchableText = searchableValues.join(" ").toLocaleLowerCase();
      return terms.every((term) => searchableText.includes(term));
    });
  }

  defaultRenderOption(filament) {
    const option = document.createElement("span");
    const title = document.createElement("span");
    title.className = "option__title";
    title.textContent = filament.manufacturer;
    const details = document.createElement("span");
    details.className = "option__details";
    details.textContent = [
      filament.material,
      filament.color_name || filament.name,
      Number.isFinite(filament.weight) ? `${filament.weight} g` : "",
      Number.isFinite(filament.diameter) ? `${filament.diameter} mm` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    option.append(title, details);
    return option;
  }
}

customElements.define("filament-search", FilamentSearch);

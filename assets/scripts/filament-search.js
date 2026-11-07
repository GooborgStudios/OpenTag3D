import "./search-box.js";

const DEFAULT_DATA_URL = "https://donkie.github.io/SpoolmanDB/filaments.json";
const POLAR_FILAMENT_QUERY = /\b(polar[\s-]+fil|pfil)/i;
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
      <style>
        dialog {
          width: min(26rem, calc(100vw - 2rem));
          padding: 1.25rem;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--menu);
          color: var(--text, #dce9ff);
          box-shadow: 0 0 32px rgb(64 144 255 / 20%), 0 0 48px rgb(0 0 0 / 45%);
        }
        dialog::backdrop {
          background: rgb(0 0 0 / 65%);
        }
        dialog h2 {
          margin: 0 0 8px;
          font-size: 18px;
        }
        dialog p {
          margin: 0 0 16px;
        }
        label {
          display: block;
          margin-bottom: 6px;
          color: var(--muted);
          font-size: 12px;
        }
        input {
          box-sizing: border-box;
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--input-border);
          border-radius: 12px;
          background: var(--input);
          color: inherit;
          font: inherit;
        }
        input:focus {
          border-color: var(--accent);
          outline: none;
        }
        .actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
        }
        button {
          padding: 0.35em 1em;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--input);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }
        button[type="submit"] {
          border-color: var(--accent);
          background: var(--accent);
          color: var(--menu);
        }
      </style>
      <search-box>
        <span slot="help">Filament listings from </span>
        <a slot="help" href="https://donkie.github.io/SpoolmanDB/" target="_blank" rel="noopener noreferrer">SpoolmanDB</a>
        <span slot="help">. Some manufacturers offer spool lookup services; search for their name to see if one is available.</span>
      </search-box>
      <dialog aria-labelledby="polar-lookup-title">
        <h2 id="polar-lookup-title">Look Up a Polar Filament Spool</h2>
        <p>
          Enter the serial number printed on your spool. On the lookup page,
          select "View on OpenTag3D.info" to open this tool in a new tab with
          the spool data loaded automatically.
        </p>
        <form action="https://pfil.us/opentag3d.php" method="get" target="_blank" rel="noopener">
          <label for="polar-serial">Serial number</label>
          <input
            type="text"
            id="polar-serial"
            name="id"
            placeholder="e.g. 50017-FYG5"
            autocomplete="off"
            required
          />
          <div class="actions">
            <button type="submit">Look Up Spool</button>
            <button type="button" data-close>Cancel</button>
          </div>
        </form>
      </dialog>
    `;
    this.searchBox = this.shadowRoot.querySelector("search-box");
    this.polarLookupDialog = this.shadowRoot.querySelector("dialog");
    this.polarSerialInput = this.shadowRoot.querySelector("#polar-serial");
    this.searchBox.search = (query) => this.search(query);
    this.searchBox.renderOption = (filament, index) =>
      this.renderOptionCallback
        ? this.renderOptionCallback(filament, index)
        : this.defaultRenderOption(filament);
    this.searchBox.getOptionLabel = (filament, index) =>
      this.getOptionLabelCallback
        ? this.getOptionLabelCallback(filament, index)
        : filament.type === "polar-filament-lookup"
          ? "Look up a Polar Filament spool"
          : `${filament.manufacturer} ${filament.material} ${filament.name}`;

    this.searchBox.addEventListener("search-select", (event) =>
      this.handleSearchSelect(event.detail.item),
    );
    this.polarLookupDialog
      .querySelector("form")
      .addEventListener("submit", () => this.polarLookupDialog.close());
    this.polarLookupDialog
      .querySelector("[data-close]")
      .addEventListener("click", () => this.polarLookupDialog.close());
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
      throw new TypeError("FilamentSearch.renderOption must be a function");
    }
    this.renderOptionCallback = callback;
  }

  set getOptionLabel(callback) {
    if (typeof callback !== "function") {
      throw new TypeError("FilamentSearch.getOptionLabel must be a function");
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
    const terms = query.toLocaleLowerCase().trim().split(/\s+/);
    const fields = this.searchFields;
    const polarFilamentLookup = POLAR_FILAMENT_QUERY.test(query)
      ? { type: "polar-filament-lookup" }
      : null;

    let filaments;
    try {
      filaments = await loadFilaments(this.dataUrl);
    } catch (error) {
      if (!polarFilamentLookup) throw error;
      this.dispatchEvent(
        new CustomEvent("search-error", {
          detail: { error },
          bubbles: true,
          composed: true,
        }),
      );
      return [polarFilamentLookup];
    }

    const matches = filaments.filter((filament) => {
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
    return polarFilamentLookup ? [polarFilamentLookup, ...matches] : matches;
  }

  handleSearchSelect(item) {
    if (item.type === "polar-filament-lookup") {
      this.polarLookupDialog.showModal();
      this.polarSerialInput.focus();
      return;
    }

    this.dispatchEvent(
      new CustomEvent("search-select", {
        detail: { item },
        bubbles: true,
        composed: true,
      }),
    );
  }

  defaultRenderOption(filament) {
    if (filament.type === "polar-filament-lookup") {
      const option = document.createElement("span");
      const title = document.createElement("span");
      title.className = "option__title";
      title.textContent = "Look up a Polar Filament spool";
      const details = document.createElement("span");
      details.className = "option__details";
      details.textContent = "Enter the spool's serial number";
      option.append(title, details);
      return option;
    }

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

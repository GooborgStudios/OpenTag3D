import "./search-box.js";

const DEFAULT_DATA_URL = "https://donkie.github.io/SpoolmanDB/filaments.json";
const dataCache = new Map();

const MANUFACTURERS = [
  {
    id: "polar-filament",
    name: "Polar Filament",
    shortnames: ["pfil"],
    lookup: {
      queryPattern: /\b(polar[\s-]+fil|pfil)/i,
      apiUrl: "https://pfil.us/ot3dWebApi.php",
      serialParameter: "i",
      serialPlaceholder: "e.g. 50017-FYG5",
    },
  },
  {
    id: "prusament",
    name: "Prusament",
    shortnames: ["prusa"],
  },
];

const LOOKUP_PROVIDERS = MANUFACTURERS.filter(
  (manufacturer) => manufacturer.lookup,
);

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
      <dialog aria-labelledby="lookup-title">
        <h2 id="lookup-title"></h2>
        <p>
          Enter the serial number printed on your spool to import its tag data
          directly from the manufacturer's OpenTag3D Web API.
        </p>
        <form>
          <label for="lookup-serial">Serial number</label>
          <input
            type="text"
            id="lookup-serial"
            autocomplete="off"
            required
          />
          <div class="actions">
            <button type="submit">Import Spool Data</button>
            <button type="button" data-close>Cancel</button>
          </div>
          <p role="status" aria-live="polite" data-status></p>
        </form>
      </dialog>
    `;
    this.searchBox = this.shadowRoot.querySelector("search-box");
    this.lookupDialog = this.shadowRoot.querySelector("dialog");
    this.lookupTitle = this.shadowRoot.querySelector("#lookup-title");
    this.lookupSerialInput = this.shadowRoot.querySelector("#lookup-serial");
    this.lookupForm = this.lookupDialog.querySelector("form");
    this.lookupStatus = this.lookupDialog.querySelector("[data-status]");
    this.activeLookupProvider = null;
    this.searchBox.search = (query) => this.search(query);
    this.searchBox.renderOption = (filament, index) =>
      this.renderOptionCallback
        ? this.renderOptionCallback(filament, index)
        : this.defaultRenderOption(filament);
    this.searchBox.getOptionLabel = (filament, index) =>
      this.getOptionLabelCallback
        ? this.getOptionLabelCallback(filament, index)
        : filament.type === "manufacturer-lookup"
          ? `Look up a spool from ${filament.manufacturer}`
          : `${filament.manufacturer} ${filament.material} ${filament.name}`;

    this.searchBox.addEventListener("search-select", (event) =>
      this.handleSearchSelect(event.detail.item),
    );
    this.lookupForm.addEventListener("submit", (event) => {
      event.preventDefault();
      this.lookupStatus.textContent = "";
      this.loadManufacturerFilament().catch((error) => {
        this.lookupStatus.textContent = error.message;
      });
    });
    this.lookupDialog
      .querySelector("[data-close]")
      .addEventListener("click", () => this.lookupDialog.close());
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
    const lookupOptions = LOOKUP_PROVIDERS.filter(({ lookup }) =>
      lookup.queryPattern.test(query),
    ).map((manufacturer) => ({
      type: "manufacturer-lookup",
      manufacturer: manufacturer.name,
      providerId: manufacturer.id,
    }));

    let filaments;
    try {
      filaments = await loadFilaments(this.dataUrl);
    } catch (error) {
      if (!lookupOptions.length) throw error;
      this.dispatchEvent(
        new CustomEvent("search-error", {
          detail: { error },
          bubbles: true,
          composed: true,
        }),
      );
      return lookupOptions;
    }

    const matches = filaments.filter((filament) => {
      const searchableValues = fields
        .map((field) => filament[field])
        .filter((value) => value !== undefined && value !== null)
        .map((value) =>
          Array.isArray(value) ? value.join(" ") : String(value),
        );
      if (fields.includes("manufacturer")) {
        const manufacturer = MANUFACTURERS.find(
          (entry) =>
            entry.name.toLocaleLowerCase() ===
            filament.manufacturer.toLocaleLowerCase(),
        );
        if (manufacturer) {
          searchableValues.push(...(manufacturer.shortnames || []));
        }
      }
      const searchableText = searchableValues.join(" ").toLocaleLowerCase();
      return terms.every((term) => searchableText.includes(term));
    });
    return [...lookupOptions, ...matches];
  }

  handleSearchSelect(item) {
    if (item.type === "manufacturer-lookup") {
      const provider = LOOKUP_PROVIDERS.find(
        ({ id }) => id === item.providerId,
      );
      if (!provider) {
        throw new Error(`Unknown filament lookup provider: ${item.providerId}`);
      }
      this.openLookupDialog(provider);
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

  openLookupDialog(provider) {
    this.activeLookupProvider = provider;
    this.lookupTitle.textContent = `Look Up a ${provider.name} Spool`;
    this.lookupSerialInput.placeholder =
      provider.lookup.serialPlaceholder || "Enter serial number";
    this.lookupSerialInput.value = "";
    this.lookupStatus.textContent = "";
    this.lookupDialog.showModal();
    this.lookupSerialInput.focus();
  }

  async loadManufacturerFilament() {
    const provider = this.activeLookupProvider;
    if (!provider?.lookup) {
      throw new Error("No filament lookup provider is selected");
    }

    const serial = this.lookupSerialInput.value.trim();
    if (!serial) {
      this.lookupSerialInput.focus();
      return;
    }

    const submitButton = this.lookupForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    this.lookupStatus.textContent = "Looking up spool…";

    try {
      const url = new URL(provider.lookup.apiUrl);
      url.searchParams.set(provider.lookup.serialParameter, serial);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `${provider.name} API returned HTTP ${response.status}`,
        );
      }

      const apiResponse = await response.json();
      if (
        !apiResponse ||
        typeof apiResponse.opentag_version !== "string" ||
        !apiResponse.tag_data ||
        typeof apiResponse.tag_data !== "object" ||
        Array.isArray(apiResponse.tag_data)
      ) {
        throw new Error(
          `${provider.name} API returned an unexpected data format`,
        );
      }

      const eventAccepted = this.dispatchEvent(
        new CustomEvent("filament-load", {
          detail: {
            source: provider.name,
            serial,
            apiVersion: apiResponse.opentag_version,
            tagData: apiResponse.tag_data,
          },
          bubbles: true,
          composed: true,
          cancelable: true,
        }),
      );
      if (!eventAccepted) {
        throw new Error(
          "The API data could not be applied. See the page notification for details.",
        );
      }
      this.lookupDialog.close();
    } catch (error) {
      const message =
        error instanceof TypeError
          ? `Could not reach the ${provider.name} API. Check your connection and whether CORS is enabled for this site.`
          : error.message;
      throw new Error(message, { cause: error });
    } finally {
      submitButton.disabled = false;
    }
  }

  defaultRenderOption(filament) {
    if (filament.type === "manufacturer-lookup") {
      const option = document.createElement("span");
      const title = document.createElement("span");
      title.className = "option__title";
      title.textContent = `Look up a ${filament.manufacturer} spool`;
      const details = document.createElement("span");
      details.className = "option__details";
      details.textContent = "Import tag data using its serial number";
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

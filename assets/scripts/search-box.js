class SearchBox extends HTMLElement {
  static observedAttributes = ["label", "placeholder"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.searchCallback = null;
    this.renderOptionCallback = null;
    this.getOptionLabelCallback = null;
    this.searchSequence = 0;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 2em;
        }
        label {
          display: block;
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 6px;
        }
        input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--input-border);
          border-radius: 12px;
          outline: none;
          background: var(--input);
          color: inherit;
          font: inherit;
          transition: border-color 0.2s;
        }
        input:hover,
        input:focus {
          border-color: var(--accent);
        }
        input::-webkit-search-cancel-button {
          filter: grayscale(1) brightness(0) invert(1);
        }
        #control {
          position: relative;
        }
        #results {
          display: grid;
          position: absolute;
          z-index: 10;
          top: calc(100% + 2px);
          left: 0;
          right: 0;
          max-height: 420px;
          overflow-y: auto;
          padding: 6px;
          gap: 4px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--input);
          box-shadow: 0 8px 24px rgb(0 0 0 / 35%);
        }
        #results[hidden] {
          display: none;
        }
        .option {
          display: block;
          width: 100%;
          text-align: left;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--input);
          color: inherit;
          cursor: pointer;
        }
        .option:hover,
        .option:focus-visible,
        .option[aria-selected="true"] {
          border-color: var(--accent);
        }
        .option__title {
          display: block;
          font-weight: bold;
        }
        .option__details {
          display: block;
          margin-top: 4px;
          color: var(--muted);
          font-size: 13px;
        }
        .option:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 1px;
        }
        .help {
          margin-top: 6px;
          font-size: 12px;
          color: var(--muted);
        }
        ::slotted(a) {
          color: rgb(83.2941% 75.451% 90.6667%);
        }
        ::slotted(a:hover),
        ::slotted(a:active) {
          color: rgb(87.4706% 81.5882% 93%);
          outline: 0;
        }
        ::slotted(a[href^="http"]):not(
            [href^="https://0.0.0.0"]
          ):not([href^="https://opentag3d.info"]):not(
            [href^="https://github.com/GooborgStudios/OpenTag3D"]
          )::after {
          content: "" / "(external link)";
          display: inline-block;
          width: 0.5em;
          height: 0.5em;
          margin-left: 0.2em;
          vertical-align: sub;
          background-color: currentColor;
          mask: url("/assets/images/icons/icons8-external_link.svg") center /
            contain no-repeat;
        }
      </style>
      <label></label>
      <div id="control">
        <input
          type="search"
          autocomplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="false"
          aria-controls="results"
        />
        <div id="results" role="listbox" hidden></div>
      </div>
      <div class="help"><slot name="help"></slot></div>
    `;

    this.labelElement = this.shadowRoot.querySelector("label");
    this.inputElement = this.shadowRoot.querySelector("input");
    this.resultsElement = this.shadowRoot.getElementById("results");
    this.inputElement.addEventListener("input", () => this.updateResults());
    this.inputElement.addEventListener("focus", () => this.updateResults());
    this.inputElement.addEventListener("keydown", (event) =>
      this.handleInputKeydown(event),
    );
    this.shadowRoot.addEventListener("focusout", () => {
      queueMicrotask(() => {
        if (!this.matches(":focus-within")) this.closeResults();
      });
    });
    this.onDocumentPointerDown = (event) => {
      if (!event.composedPath().includes(this)) this.closeResults();
    };
  }

  connectedCallback() {
    this.updateInputAttributes();
    document.addEventListener("pointerdown", this.onDocumentPointerDown);
  }

  attributeChangedCallback() {
    this.updateInputAttributes();
  }

  updateInputAttributes() {
    this.labelElement.textContent = this.getAttribute("label") || "Search";
    this.labelElement.htmlFor = "searchInput";
    this.inputElement.id = "searchInput";
    this.inputElement.placeholder = this.getAttribute("placeholder") || "";
    this.inputElement.setAttribute(
      "aria-label",
      this.getAttribute("label") || "Search",
    );
  }

  disconnectedCallback() {
    document.removeEventListener("pointerdown", this.onDocumentPointerDown);
  }

  set search(callback) {
    if (typeof callback !== "function") {
      throw new TypeError("SearchBox.search must be a function");
    }
    this.searchCallback = callback;
  }

  set renderOption(callback) {
    if (typeof callback !== "function") {
      throw new TypeError("SearchBox.renderOption must be a function");
    }
    this.renderOptionCallback = callback;
  }

  set getOptionLabel(callback) {
    if (typeof callback !== "function") {
      throw new TypeError("SearchBox.getOptionLabel must be a function");
    }
    this.getOptionLabelCallback = callback;
  }

  closeResults() {
    this.searchSequence += 1;
    this.resultsElement.hidden = true;
    this.inputElement.setAttribute("aria-expanded", "false");
    this.inputElement.removeAttribute("aria-activedescendant");
  }

  focusOption(index) {
    const options = this.resultsElement.querySelectorAll(".option");
    if (!options.length) return;
    const boundedIndex = (index + options.length) % options.length;
    options.forEach((option, optionIndex) => {
      option.setAttribute(
        "aria-selected",
        String(optionIndex === boundedIndex),
      );
    });
    this.inputElement.setAttribute(
      "aria-activedescendant",
      options[boundedIndex].id,
    );
    options[boundedIndex].focus();
    options[boundedIndex].scrollIntoView({ block: "nearest" });
  }

  handleInputKeydown(event) {
    const options = this.resultsElement.querySelectorAll(".option");
    if (event.key === "ArrowDown" && options.length) {
      event.preventDefault();
      this.focusOption(0);
    } else if (event.key === "ArrowUp" && options.length) {
      event.preventDefault();
      this.focusOption(options.length - 1);
    } else if (event.key === "Enter" && options.length) {
      event.preventDefault();
      const activeId = this.inputElement.getAttribute("aria-activedescendant");
      const selectedOption = activeId
        ? this.shadowRoot.getElementById(activeId)
        : options[0];
      selectedOption?.click();
    } else if (event.key === "Escape") {
      this.closeResults();
    }
  }

  async updateResults() {
    const query = this.inputElement.value.trim();
    this.resultsElement.replaceChildren();
    this.closeResults();
    if (query.length < this.minCharacters) return;
    const sequence = ++this.searchSequence;
    if (!this.searchCallback || !this.renderOptionCallback) {
      throw new Error("SearchBox requires search and renderOption callbacks");
    }

    try {
      const items = await this.searchCallback(query);
      if (sequence !== this.searchSequence) return;
      this.renderResults(Array.from(items).slice(0, this.maxResults), sequence);
    } catch (error) {
      if (sequence !== this.searchSequence) return;
      this.dispatchEvent(
        new CustomEvent("search-error", {
          detail: { error },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  get maxResults() {
    const value = Number(this.getAttribute("max-results"));
    return Number.isInteger(value) && value > 0 ? value : 20;
  }

  get minCharacters() {
    const attribute = this.getAttribute("min-characters");
    if (attribute === null) return 2;
    const value = Number(attribute);
    return Number.isInteger(value) && value >= 0 ? value : 2;
  }

  renderResults(items, sequence) {
    if (!items.length) return;

    items.forEach((item, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "option";
      option.id = `option-${sequence}-${index}`;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      option.tabIndex = -1;
      const content = this.renderOptionCallback(item, index);
      if (content instanceof Node) {
        option.append(content);
      } else {
        option.textContent = String(content ?? "");
      }
      option.setAttribute(
        "aria-label",
        this.getOptionLabelCallback
          ? this.getOptionLabelCallback(item, index)
          : option.textContent,
      );
      option.addEventListener("click", () => {
        this.dispatchEvent(
          new CustomEvent("search-select", {
            detail: { item },
            bubbles: true,
            composed: true,
          }),
        );
        this.closeResults();
      });
      option.addEventListener("focus", () => {
        const options = [...this.resultsElement.querySelectorAll(".option")];
        const activeIndex = options.indexOf(option);
        options.forEach((candidate, candidateIndex) => {
          candidate.setAttribute(
            "aria-selected",
            String(candidateIndex === activeIndex),
          );
        });
        this.inputElement.setAttribute("aria-activedescendant", option.id);
      });
      option.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          this.focusOption(index + (event.key === "ArrowDown" ? 1 : -1));
        } else if (event.key === "Escape") {
          event.preventDefault();
          this.closeResults();
          this.inputElement.focus();
        }
      });
      this.resultsElement.append(option);
    });

    this.resultsElement.hidden = false;
    this.inputElement.setAttribute("aria-expanded", "true");
  }
}

customElements.define("search-box", SearchBox);

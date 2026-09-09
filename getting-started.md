---
title: Getting Started
layout: single
permalink: /getting-started/
description: Learn what OpenTag3D can do and how users, developers, and filament manufacturers can get started.
---

<p class="getting-started__lede">
  <strong>Self-aware filament.</strong> Let every spool tell your printer and
  slicer what it is and how it should be used. Automatic setup. Fewer mistakes.
</p>

<nav class="role-grid" aria-label="Choose how you want to use OpenTag3D">
  <a class="role-card role-card--primary" href="#for-people-who-print">
    <span class="role-card__eyebrow">I print things</span>
    <img class="role-card__icon" src="/assets/images/getting-started-user.svg" alt="" aria-hidden="true">
    <strong>Start or enhance your 3D printing journey</strong>
    <span>See why tags are useful and how to use them.</span>
  </a>
  <a class="role-card" href="#for-developers">
    <span class="role-card__eyebrow">I design and build tools</span>
    <img class="role-card__icon" src="/assets/images/getting-started-developer.svg" alt="" aria-hidden="true">
    <strong>Develop with OpenTag3D</strong>
    <span>Read the specification and explore the source.</span>
  </a>
  <a class="role-card" href="#for-manufacturers">
    <span class="role-card__eyebrow">I make filament or hardware</span>
    <img class="role-card__icon" src="/assets/images/getting-started-manufacturer.svg" alt="" aria-hidden="true">
    <strong>Adopt the open, decentralized standard</strong>
    <span>Add support without fees, licenses, or lock-in.</span>
  </a>
</nav>

## For people who print

### Why does filament need an RFID tag?

An RFID tag gives every spool a digital identity. It carries the filament's
material, color, recommended settings, and other useful details. Compatible
printers and slicers can read that information automatically, so you spend less
time adjusting profiles, catch incompatible settings before a print starts,
and keep your filament organized.

<img class="getting-started__overview-image getting-started__overview-image--compact" src="/assets/images/a-look-inside.png" alt="A filament spool's NFC tag sharing its material, color, and recommended print settings">

<div class="benefit-grid" markdown="1">

<div class="benefit-card" markdown="1">

#### Save Time

Your spool can provide its configuration and profiles for you. Change materials
or colors without manually changing your print settings.

</div>

<div class="benefit-card" markdown="1">

#### Make Less Mistakes

Your printer can warn you when your settings fall outside the filament's
specifications, helping catch errors that could cause a print to fail before it
starts.

</div>

<div class="benefit-card" markdown="1">

#### Be More Organized

Every tag identifies its spool, including details such as color, material, and
serial number. Use that information for inventory and organization that ties
directly into your printers.

</div>

</div>

### What can it enable?

OpenTag3D is a standard, not a single app or product. It gives projects a common
set of data they can use to build features such as:

- **Automatic slicer profiles:** Load settings from the filament instead of
  finding and entering them by hand.
- **Inventory management:** Identify each spool uniquely and keep its material,
  color, and other details together.
- **Automatic dryer settings:** Select an appropriate temperature and duration
  for the material, reducing the risk of a drying mistake.
- **Filament-remaining estimates:** Use the tag as a rotation marker and combine
  it with the stored core diameter, or weigh the spool and subtract the stored
  empty-spool weight.

> [!NOTE]
> These are capabilities the standard makes possible. Availability depends on
> the printer, slicer, accessory, or community project you use.

### I’m sold. How do I start?

#### 1. Use filament and projects that already support OpenTag3D

This is the easiest route: buy a tagged spool, then use it with a compatible
printer, accessory, slicer, or community project.

##### Supported Printers

<!-- prettier-ignore -->
| Logo | Printer | Support | Link | Notes |
| ---- | ------- | ------- | ---- | ----- |
| <img class="support-logo" src="/assets/images/logos/bambu-lab.png" alt="Bambu Lab logo"> | Bambu Lab Series Printers | Via Community Mods | [BambuTagger](https://www.bambutagger.de/en/bt), [OpenSpool (with custom firmware)](https://github.com/spuder/OpenSpool/pull/80), [SpoolSense](https://spoolsense.org/installation/bambu-ams/) | |
| <img class="support-logo" src="/assets/images/logos/snapmaker.svg" alt="Snapmaker logo"> | Snapmaker U1 | Via Community Mods | [SpoolSense](https://spoolsense.org/installation/snapmaker-u1/) | |
| <img class="support-logo" src="/assets/images/logos/prusa.png" alt="Prusa logo"> | Prusa MK4 / MMU3 | Via Community Mods | [SpoolSense](https://spoolsense.org/installation/prusa/) | |
| <img class="support-logo" src="/assets/images/logos/klipper.svg" alt="Klipper logo"> | Other Klipper-based Printers | Via Community Mods | [SpoolSense](https://spoolsense.org/installation/middleware/) | |
{: .support-table}

For more details on the filament brands, projects, and companies that support
the standard, see the current [supporters and implementation status](/about#supporters).

##### Supported Filament Brands

<!-- prettier-ignore -->
| Logo | Brand | Filament Sold with Pre-programmed Tags | Online OpenTag3D Exports |
| ---- | ----- | --------------------------------------- | ------------------------ |
| <img class="support-logo support-logo--wide" src="/assets/images/logos/polar-filament-color.png" alt="Polar Filament logo"> | [Polar Filament](https://polarfilament.com/) | Planned Q4 2026 | [Yes](https://pfil.us/rfid) |
{: .support-table}

#### 2. Write your own tags

Buy compatible NFC tags, enter the spool information in
[Make a Tag](/make), and write the result using one of the methods below. The
specification is designed around **NTAG215** tags; **NTAG216** tags are also
supported.

If the filament manufacturer offers an online OpenTag3D export, use it to fill
in the product data automatically. Otherwise, you can enter the information
yourself.

<img class="getting-started__overview-image getting-started__overview-image--compact" src="/assets/images/nfc-reader-options.png" alt="Examples of NFC and RFID readers that can work with filament tags">

##### With a phone (recommended)

On Android, open the [Make a Tag](/make) webpage in a [Web NFC-compatible browser](https://caniuse.com/webnfc). You can create, read, and write a tag directly from the page.

On iPhone, OpenTag3D data can be read and written via third-party native apps. We recommend [SpoolSense](https://spoolsense.org/) as it has the best coverage of the spec fields.

Other mobile applications are available for reading and writing OpenTag3D data. Here is a list:

<!-- prettier-ignore -->
| Logo | Application | Platform(s) | Features | Spec Version | Notes |
| ---- | ----------- | ----------- | -------- | ------------ | ----- |
| <img class="support-logo" src="/assets/favicon/android-chrome-512x512.png" alt="OpenTag3D spool logo"> | [OpenTag3D Make Page](/make) | Android | Read, Write | v2 | This can be installed like an app via Google Chrome on Android. |
| <img class="support-logo" src="/assets/images/logos/spoolsense.jpg" alt="SpoolSense logo"> | [SpoolSense](https://spoolsense.org/) | iPhone | Read, Write | v1, v2 | |
| <img class="support-logo" src="/assets/images/logos/spoolflux.png" alt="SpoolFlux logo"> | [SpoolFlux](https://spoolflux.dingdongclick.de/) | iPhone | Read | v1, v2 | |
{: .support-table}

Building an app? [Let us know](/about#contact) so it can be added here.

##### With a computer (advanced)

- **NFC Tools Desktop:** Use a USB NFC reader such as the ACR122U (typically
  around $30) to read and write tags. Follow Polar Filament’s
  [OpenTag3D NFC Tools guide](https://pfil.us/opentag3d.php).
- **Proxmark3:** Use this popular RFID development toolkit with the Proxmark3
  export provided by [Make a Tag](/make).

##### With a Flipper Zero

The hardware is capable of reading and writing compatible tags, but the full
OpenTag3D workflow is not finished yet. This is not currently a recommended
getting-started path.

## For developers

OpenTag3D is openly documented and its source is available on GitHub. Start with
the specification, then use the existing source and community projects as
implementation references.

<div class="getting-started__actions">
  <a class="btn btn--primary" href="/spec">Read the specification</a>
  <a class="btn" href="https://github.com/GooborgStudios/OpenTag3D">View the source on GitHub</a>
</div>

The [reader implementation guidelines](/spec#reader-implementation-guidelines)
cover the details most hardware and firmware integrations need first.

## For manufacturers

OpenTag3D is free to adopt. There are **no licensing fees, required vendors, or
certification requirements**. You can source tags and readers entirely on your
own, manufacture your own solution, and implement as much of the open standard
as your product needs.

There is no central service that your product must depend on. The essential
filament data lives on the tag and works offline; optional web lookups can be
hosted by the manufacturer or another provider. OpenTag3D is both open source
and decentralized.

Please feel free to [contact the project maintainers](/about#contact) to discuss implementation. We can walk through the getting-started documentation, answer integration questions, and help you avoid common hardware and data-format pitfalls.

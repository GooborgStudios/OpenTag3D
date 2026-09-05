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
printer, accessory, slicer, or community project. See the current
[supporters and implementation status](/about#supporters).

#### 2. Write your own tags

Buy compatible NFC tags, enter the spool information in
[Make a Tag](/make), and write the result using one of the methods below. The
specification is designed around **NTAG215** tags; **NTAG216** tags are also
supported.

Some filament companies provide a lookup that fills in product data for you:

- [Polar Filament](https://pfil.us/rfid)

If the manufacturer does not offer a lookup, you can enter the information
yourself.

##### With a phone (recommended)

- **Android:** Open [Make a Tag](/make) in a [Web NFC-compatible browser](https://caniuse.com/webnfc). You can
  create, read, and write a tag directly from the page.
- **iPhone:** A native app is required. OpenTag3D-compatible iPhone apps are in
  development, but none are available yet.

###### OpenTag3D phone apps

| Platform | Available apps                                               |
| -------- | ------------------------------------------------------------ |
| Android  | None yet. Use the [Web NFC tag tool](/make) in the meantime. |
| iPhone   | None yet.                                                    |

Building an app? Let us know so it can be added here.

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

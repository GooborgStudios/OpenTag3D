---
title: Specification
layout: single
toc: true
description: The details of the OpenTag3D specification.
---

# OpenTag3D Standard

Current Version: {{ site.data.spec.version }}

## Hardware Standard

The OpenTag3D standard is designed to work on any NFC tag that is compliant with the ISO/IEC 14443 Type A communication protocol, is compatible with NDEF Type 2, and has at least 504 bytes of writable capacity. These kinds of tags are plentiful and can be read and written with smartphones and PN532 modules, making them low-cost and easy to integrate.

In particular, the standard is tailored towards the NTAG215 13.56MHz NFC chips. These tags are cheap and common, and have plenty of space to store all of the required and optional information.

| Tag Type | Total Onboard Memory | Usable Memory | Maximum OpenTag3D Payload |
| -------- | -------------------- | ------------- | ------------------------- |
| NTAG215  | 540 bytes            | 504 bytes     | 471 bytes                 |
| NTAG216  | 924 bytes            | 888 bytes     | 835 bytes                 |

Usable memory excludes manufacturer data, configuration data, lock bytes, and the capability container. The maximum OpenTag3D payload also accounts for the required NDEF record overhead.

<img src="./assets/images/ntag-sticker.jpg" width="200">

### NTAG vs. MIFARE 1K Classic

The NTAG215 tags were chosen over MIFARE 1K Classic tags, which is what the Bambu Lab AMS uses, for the following reasons:

- Cheap and Easy to Source: NTAG215 tags are readily available at a low cost through any online retailer
- Smartphone Support: NTAG215 tags can be read from smartphones, while MF1K requires a dedicated reader
- Backwards Compatible: The RFID hardware used for reading MF1K tags typically supports NTAG tags as well
- Non-Encrypted: MF1K uses 25% of its memory to encrypt the data, which is unsuitable for an open source standard

## Mechanical Standard

The NFC tags should be placed on the spools as follows:

- The center should be roughly 60.0mm away from the center of the spool
  - The tag may be placed closer or further to the center of the spool, as long as some part of the tag intersects with the 60.0mm radius
- The tag should never be more than 4.0mm away from the external surface of the spool
  - For spool sides thicker than 4mm, there must be a cutout to embed the tag, or the tag should be fixed to the outside of the spool
- Two tags should be used, one on each end of the spool, directly across from each other

## Data Structure Standard

The data is to be stored as a payload within an NDEF record of MIME type `{{ site.data.spec.mime_type }}`. The data must remain unencrypted to be compliant with the spec.

All strings are UTF-8 unless specified otherwise. All integers are unsigned, big endian, unless specified otherwise.

Temperatures are stored in Celsius, divided by 5.

Below is list of data that will live on the RFID chip. All **REQUIRED** data must be populated to be compliant with the spec.

> [!NOTE]
> Spec implementers: the memory maps for OpenTag3D are also available in [JSON format](https://opentag3d.info/spec.json).

### Memory Map

The data is designed to fit within the 504 bytes of writable space on the NTAG215, the most common NFC tag type around.

{% include spec_table.md set="core" %}

### Web API Standard

> [!IMPORTANT]
> OpenTag3D is designed to work entirely offline. The Web API is optional and may only provide supplemental information; no operational data may be stored exclusively in the Web API. All data required to use the material must remain available on the tag.

The Web API complements the data stored on the tag in two ways:

1. **Provide additional resources.** The API can provide assets, data, and links that cannot fit on the tag itself, including:
   - Product photos
   - Slicer print profiles
   - Purchase links and current prices
   - Advanced manufacturing data, such as diameter and ovality graphs
2. **Keep tag data up to date.** The API can provide an online copy of the data stored on the tag. A reader can compare the two sources and update the tag when the manufacturer:
   - Changes its recommended settings
   - Adds specification data for parameters that were previously left blank

The "Online Data URL" field should be populated with the URL that responds with the web API data. The URL must return JSON data when the `Accept` HTTP header is set to `application/json`. Implementers are welcome to create a user-friendly UI if the `Accept` header is set to anything else, but it _must_ return JSON format if the client calls for it.

The URL should respond with JSON formatted like the following:

```json
{
  "opentag_version": "{{ site.data.spec.version }}",
  "has_ui": true,
  "price": {
    "us": "$15.99",
    "eu": "€14.99",
    "uk": "£16.99",
    "global": "$15.99"
  },
  "product_url": {
    "us": [
      "https://www.amazon.com/dp/*",
      "https://example.com/filament-manufacturer-website"
    ],
    "eu": ["https://example.com"]
  }
}
```

Except for `opentag_version`, all fields are optional.

The `opentag_version` must be set as the current OpenTag3D version the API has been updated to support. This field is required.

The `has_ui` field is a boolean field to indicate whether the API URL has a user-friendly UI available. This lets implementers know that they can see a friendly webpage if they access the API URL without using the `application/json` header.

The `price` field should be the current prices for the material and color, separated by country or region. Each country or region should be represented by its two-letter ISO 3166-1 code, including any exceptional reservations such as EU for European Union. A `global` area may be defined as well.

The `product_url` field should be links to product pages where the user can repurchase the filament, separated by country or region. The representations of countries/regions will be identical to that of the `price` field. For each country/region, a list of URLs may be specified in order to provide multiple places the user can buy new filament. The order of URLs may be specified however the filament maker desires. (Implementers should honor the filament maker's ordering.)

## Reader Implementation Guidelines

While every implementation for reading OpenTag3D RFID tags will be different, this specification aims to set a few requirements to ensure that functionality is consistent across printers and other hardware -- we'll call these the "reader" for continuity.

When attempting to read an RFID tag, the reader should check for an NDEF record of the type `{{ site.data.spec.mime_type }}`. This record will include all of the tag data. It may ignore any other NDEF records. If there is no `{{ site.data.spec.mime_type }}` record, it is not an OpenTag3D tag.

The reader should then check the tag version. If the tag version is a newer _minor_ version than the reader expects, display a warning to the user and attempt to parse anyways. If the tag version is a newer _major_ version, the reader should display an error to the user and not attempt to parse the data.

When accessing the web API URL provided by the tag, the reader _must_ set the `Accept` HTTP header to `application/json`. The exception to this is if the reader is attempting to display the webpage to the user, in which the `Accept` HTTP header may be set to either `text/html` or `*/*`.

## Branding Guidelines

Adding the OpenTag3D logo or any OpenTag3D branding is entirely optional, but is recommended to show that your filament or hardware uses or supports the OpenTag3D specification. With that said, if you decide to include OpenTag3D branding, there are a few guidelines on how to do so.

When including OpenTag3D branding, you may:

- Include either variation of logo in printed or digital media
- Change the logo color as desired (although black or white is recommended)
- Specify the name in plain text in place of the logo
- _Slightly_ modify the logo for thematic effect (such as adding drips to fit branding)

You may NOT:

- Crop, scale, warp, flip or otherwise distort the logo
- Heavily modify the logo, such as changing the font used
- Use the logo or OpenTag3D name to imply endorsement of your product

OpenTag3D has both full-size and small logos available:

[<img src="./assets/images/logo-small.svg" width="80">](./assets/images/logo-small.svg)\| [<img src="./assets/images/logo.svg" width="400">](./assets/images/logo.svg)

## Previous Considerations

These are topics that were heavily discussed during the development of OpenTag3D. Below is a quick summary of each topic, and why we decided to settle on the standards we defined.

- NTAG vs MIFARE 1K Classic
  - NTAG215 tags are easy to source
  - NTAG216 has slightly more usable memory than MIFARE tags
    - This was later determined to not be important, as the core data could be fit within significantly less capacity
  - MIFARE 1K Classic uses about 25% of memory to encrypt data, preventing read/write operations, which is not applicable for OpenTag3D because of the open-source nature
  - The hardware used for reading MIFARE 1K Classic tags is typically compatible with NTAG/SLIX2 tags, meaning existing RFID printer hardware would not need replacement
    - In contrast, smartphones can't typically read MIFARE 1K Classic tags
- JSON vs Memory Map
  - Formats such as JSON (human-readable text) take up considerably more memory than memory mapped
    - For example, defining something like Printing Temperature would be `PrintTemp:225` which is 13 bytes, instead of storing a memory mapped 2-byte number. Tokens could be reduced, but that also defeats the purpose of using JSON in the first place, which is often for readability
  - NTAG215 tags only have 504 bytes of usable memory, which would be eaten up quickly
    - With memory mapping, the essential data was able to easily fit in 144 bytes
- Lookup Tables
  - **They undermine decentralization.** A lookup table requires someone to maintain a central map of IDs to values, such as `1 = PLA`. This would give one organization control over which values receive an entry, contrary to the decentralized purpose of OpenTag3D.
  - **They complicate implementations.** A printer or other tag reader would need either an internet connection for on-demand lookups or a local copy of every lookup table. These could include lists of all 3D-printing materials and brands. Local tables also consume unnecessary storage and must be kept up to date.
  - **They are unsuitable for operational data.** A generic label such as `PLA` does not describe how every PLA filament should be used. Formulations vary between brands and products. Values such as print temperature, bed temperature, and maximum volumetric print speed describe the material's operating requirements more accurately than its name alone.
- NDEF Records vs Direct Writing
  - In an early version of the spec, it was designed for the bytes to be written directly to the tag instead of using NDEF records
  - Although NDEF records consume more memory on the tag, the choice to switch to them was made for the following reasons
    - NDEF records make it possible to store more data on the tag than OpenTag3D, such as a website record, or even another tag format
    - NDEF records help specify that the data is OpenTag3D data
    - Web NFC is designed to read and write NDEF records, making it possible to provide a webpage for Android read/write capabilities
      - iOS does not support Web NFC; if it did then it would also make iOS read/write possible

## Changelog

- 2.000
  - Drop NTAG213 and SLIX2 as spec compliant options
  - Drop "Core" and "Extended" terminology, as there are no more fields in the "Extended" space
    - "Core" is now just the OpenTag3D format
    - An "Extended" format could be revisited at a later time as the need arises
  - Rearrange all fields' memory mapping
  - Add `sku`, `barcode`, `chamber_temp` and `nozzle_diameter` fields to memory mapping
  - Double serial number field size from 16 bytes to 32 bytes
  - Reduce Transmission Distance from 2 bytes to 1 byte
    - After discussion with filament manufacturers and users, 25.0mm of TD seems to be a reasonable upper limit
- 1.003
  - Made all fields (except for `opentag_version`) in the web API optional
- 1.002
  - Adjusted tag placement guidelines to allow more flexibility
  - Updated a few IDs for spec fields for better consistency
- 1.001
  - Add `has_ui` field to web API
- 1.000
  - Initial release

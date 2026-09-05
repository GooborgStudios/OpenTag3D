---
title: OpenTag3D
logo: ./assets/images/logo.svg
layout: splash
permalink: /
header:
  og_image: /assets/images/og_image.jpg
  overlay_color: "#d4c0e7"
  overlay_filter: "0.6"
  overlay_image: /assets/images/background.jpg
  actions:
    - label: "View Spec"
      url: "/spec"
  announcement: "[OpenTag3D v2.0](./articles/v2-already) is out now!"
  caption: "Placeholder Background by [**morgaannn23**](https://wallpapercave.com/w/wp6945227)"
excerpt: "An open source standard for 3D printer filament RFID tags. Designed from the ground up for compatibility between printers, filament manufacturers, and accessories, implementation is simple and low-cost."
intro:
  - excerpt: "Proprietary locks you in. Open sets you free. — [Tim Berners-Lee](https://www.w3.org/People/Berners-Lee/)"
feature_row:
  - title: "Low-Cost, Off-the-Shelf Hardware"
    excerpt: "OpenTag3D uses standard NFC tags (NTAG215/216). These tags are readable and writable by smartphones, compatible with most off-the-shelf RFID/NFC readers (including low-cost PN532 modules), and require no proprietary hardware. This allows everyone, from corporations to hobbyists, to implement the standard into their applications, printers or accessories."
    image_path: /assets/images/icons8-request_money.svg
    alt: ""
  - title: "Compact Format, Complete Data"
    excerpt: "All the critical data a 3D printer needs, including manufacturer, material and print settings, and the optional data that helps, like serial number, melt flow index and transmission distance, fits in a quarter of a megabyte. Dynamic data, such as current filament price, can also be provided via a web API."
    image_path: /assets/images/icons8-archive.svg
    alt: ""
  - title: "Open Standard, Open To All"
    excerpt: "OpenTag3D is 100% open source and designed to work across 3D printer brands, filament makers, accessories, and hobbyist projects. The memory map is openly documented, with no encryption or vendor lock-in, so anyone can build, read, and write compatible tags. All of the critical data is 100% offline, with a web API standard for extremely advanced or realtime data (such as current price)."
    image_path: assets/images/icons8-open_source.svg
    alt: ""
---

{% include feature_row id="intro" type="center" %}

{% include feature_row %}

RFID tags for 3D printer filament is becoming more prevalent, with every printer manufacturer trying to launch their own RFID standard. With the ever-growing list of conflicting formats, the 3D printing industry needs an open standard that is not controlled by any single company, more than ever. As a community-driven specification, OpenTag3D strives to be that standard.

OpenTag3D defines standards for the following:

- **Hardware** - The specific underlying RFID technology
- **Mechanical Requirements** - Positioning of tag on the spool
- **Data Structure** - What data should be stored on the RFID tag, and how that data should be formatted
- **Web API** - How extended data should be formatted when an optional online spool lookup is requested

OpenTag3D is supported by the following projects/companies:

{% include supporters_list.html details=false %}

## Add RFID support to your printer

This standard was designed to be simple to implement in firmware. You will need to add custom firmware and potentially an RFID reader (if your printer doesn't already have one). Make sure to read the [reader implementation guidelines](./spec.md#reader-implementation-guidelines)!

RFID support can theoretically be added to any printer using off-the-shelf RFID Modules such as the PN532 (as low as $3). This module communicates over SPI.

Did you make a design to add RFID to your printer? Let us know so we can link to it here! Designs can be 3D models, or firmware.

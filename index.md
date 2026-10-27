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
    - label: "Get Started"
      url: "/getting-started/"
    - label: "View Spec"
      url: "/spec"
  # announcement: "[OpenTag3D v2.0](./articles/v2-already) is out now!"
  caption: "Placeholder Background by [**morgaannn23**](https://wallpapercave.com/w/wp6945227)"
excerpt: "An open source standard for 3D printer filament RFID tags. Designed from the ground up for compatibility between printers, filament manufacturers, and accessories, implementation is simple and low-cost."
intro:
  - excerpt: "Proprietary locks you in. Open sets you free. [Tim Berners-Lee](https://www.w3.org/People/Berners-Lee/)"
feature_row:
  - title: "Low-Cost, Off-the-Shelf Hardware"
    excerpt: "OpenTag3D uses standard NFC tags (NTAG215/216). These tags are readable and writable by smartphones, compatible with most off-the-shelf RFID/NFC readers (including low-cost PN532 modules), and require no proprietary hardware. This allows everyone, from corporations to hobbyists, to implement the standard into their applications, printers or accessories."
    image_path: /assets/images/icons/icons8-request_money.svg
    alt: ""
  - title: "Compact Format, Complete Data"
    excerpt: "All the critical data a 3D printer needs, including manufacturer, material and print settings, and the optional data that helps, like serial number, melt flow index and transmission distance, fits in a quarter of a kilobyte. Dynamic data, such as current filament price, can also be provided via a web API. No wasted space by adding keys to each value or requiring database updates for lookup tables."
    image_path: /assets/images/icons/icons8-archive.svg
    alt: ""
  - title: "Open Standard, Open To All"
    excerpt: "OpenTag3D is 100% open source and designed to work across 3D printer brands, filament makers, accessories, and hobbyist projects. The memory map is openly documented, with no encryption or vendor lock-in, so anyone can build, read, and write compatible tags. All of the critical data and most of the advanced data is 100% offline, with a web API standard for super-nerdy stats or realtime data (such as current price)."
    image_path: assets/images/icons/icons8-open_source.svg
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

---

OpenTag3D is supported by the following projects/companies:

<!-- prettier-ignore-start -->

<div class="supporters-grid">
  {%- assign items = site.data.supporters.supporters -%}
  {%- for s in items -%}
    <div>
      <a href="{{ s.url }}" target="_blank" rel="nofollow">
        {%- if s.logo -%}
          <img src="/assets/images/logos/{{ s.logo }}" alt="{{ s.name }}" {% if s.showcaption %}class="withcaption"{% endif %} />
          {%- if s.showcaption -%}<p class="caption">{{ s.name }}</p>{%- endif -%}
        {%- else -%}
          {{ s.name }}
        {%- endif -%}
      </a>
    </div>
  {%- endfor -%}
</div>

<!-- prettier-ignore-end -->

## Get Started

Ready to use OpenTag3D or implement it into your project? Check out the [Getting Started](./getting-started.md) page for details on the filament manufacturers and printers that support OpenTag3D, how to write your own tags, and/or how to start implementing reader/writer support in your own project.

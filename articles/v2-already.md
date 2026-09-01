---
title: v2.0 Already!?
layout: single
description: Why is v2.0 already coming out, when v1.0 hasn't been around for that long?
---

We're excited to announce that v2.0 of OpenTag3D is just around the corner, which introduces a better organized data structure and new inventory fields like SKU and UPC13/GTIN barcode. Of course, reorganizing the data means breaking backwards compatibility, which may seem strange to do so quickly after v1.0 was released.

v1.0 was intended to establish a practical proof of concept and get the standard into the hands of early implementers. As adoption has grown, so has the number of people reviewing, testing, and contributing to the specification. v2.0 reflects that broader input and is intended to provide a significantly more stable foundation for the future.

We always anticipated that some early lessons might eventually require a break in backwards compatibility. With adoption accelerating, we believe it is better to make those necessary changes now, while the ecosystem is still relatively young, rather than later when substantially more manufacturers, hardware, and software depend on the existing format.

## Why restructure the data format?

After reviewing the placement of bytes in v1.0 of the format, it was realized that there was a major inefficiency in the usage of space. Polar Filament wrote a helpful tool that visualizes the memory map, which showed this inefficiency very well.

![A diagram showing how the memory bytes are structured, explained below.](../assets/images/v1-memory-map.png)

There is a large gap between the Material Modifiers and Filament Manufacturer parameters, as well as a byte gap between color 1 and color 2. These gaps were _not_ intentional, and were an artifact of the restructuring process between pre-v1.0 and v1.0. While this did not make v1.0 unusable by any means, we felt that if there was any time to fix it, it would be now while implementation is still in early stages, rather than months or years later when OpenTag3D tags are already deployed.

Restructuring the data allowed us to improve a couple of existing fields -- such as the Transmission Distance field, which we learned only needed one byte; and the serial number, as filament manufacturers may want more than 16 characters.

## If v2.0 is coming out now, will v3.0 come out in another half year?

NO!

v2.0 is only releasing this quickly because OpenTag3D implementation is still in the very early stages. If implementation was established and v1.0 tags were widely deployed, we would not be releasing v2.0 so soon. In other words, we're trying to get ahead of the ball by making these changes early on, when the timing is just right.

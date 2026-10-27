---
title: Response to OpenPrintTag
layout: single
description: What does the release of OpenPrintTag mean for OpenTag3D?
---

In late October 2025, Prusa announced a new open source standard for 3D printer filament RFID tags called [OpenPrintTag](https://openprinttag.org/). This standard was announced and published after OpenTag3D, but seems to have the same mission: to break the cycle of proprietary RFID tags for filament. While it is still in early development stages, it has gained widespread interest from many parties.

Of course, now that this new standard has been announced, this begs the question: what does this mean for OpenTag3D?

In summary, at this time, I don't plan to stop development on the OpenTag3D specification. I'm still going to be updating and improving it, if only to provide a potential alternative to OpenPrintTag. Ultimately, my hope is that the 3D printing industry and community will agree on a single standard, whether that's OpenTag3D, OpenPrintTag, or something else -- after all, nothing can become _the_ standard if we're all competing.

－ Vinyl Da.i'gyu

---

Update November 16, 2025 (edited):

After carefully reviewing the OpenPrintTag specification, we have surmised that OpenPrintTag will be difficult to implement for printers and manufacturers. While OpenPrintTag uses NDEF records, is refers to a custom circular tag layout. It does not define the physical tag in the specification, so since ~~both specifications are still in early development~~ the OpenPrintTag standard is still in early development, this may change down the line.

---

Update October 27, 2026:

It has been a year since OpenPrintTag was launched, and so far, there have not been any new printers or filament brands that have implemented it. At this time, only Prusa has implemented it into their own spools and printers. And in talking with the manufacturers of filament, there's a pretty good reason why.

The filament manufacturers we have spoken to are disappointed with the custom circular tag design and have mentioned the difficulties in integrating it. One of them has even mentioned that "OpenPrintTag's NFC tags are so custom, even Prusa couldn't implement them without changing their spool design." Additionally, placing the tag on only one side invalidates some existing material switching boxes (AMSes).

This has motivated us more to continue developing OpenTag3D, with the intent to provide the best solution for everyone.

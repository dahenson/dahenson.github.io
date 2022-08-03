---
title: Swap Caps Lock with Escape
layout: default
---

I can never seem to remember how to swap caps lock and the escape key in gnome. I don't want
gnome tweaks, and there doesn't seem to be a switch in the GUI. elementary OS got this right...
but I digress.

The secret incantation for your terminal goes like this:

`gsettings set org.gnome.desktop.input-sources xkb-options "['caps:swapescape']"`

### [Subtitle Cat](https://github.com/warren-bank/crx-subtitlecat/tree/userscript/es6)

[Userscript](https://github.com/warren-bank/crx-subtitlecat/raw/userscript/es6/userscript/subtitlecat.user.js) to run in:
* the [WebMonkey](https://github.com/warren-bank/Android-WebMonkey) application
  - for Android
* the [Tampermonkey](https://www.tampermonkey.net/) web browser extension
  - for [Firefox/Fenix](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
  - for [Chrome/Chromium](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
* the [Violentmonkey](https://violentmonkey.github.io/) web browser extension
  - for [Firefox/Fenix](https://addons.mozilla.org/firefox/addon/violentmonkey/)
  - for [Chrome/Chromium](https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag)

#### Purpose

* determine the best matching subtitle on [subtitlecat.com](https://www.subtitlecat.com/)
* rewrite the page DOM to include:
  - a link to directly download the .SRT file
  - a form that is a minimal subset of [this AirPlay sender form](http://webcast-reloaded.frii.site/airplay_sender.html)
    * which includes the "Network Address" fields and the "Load Captions" button
    * its purpose is to push the .SRT file to a remote instance of [ExoAirPlayer](https://github.com/warren-bank/Android-ExoPlayer-AirPlay-Receiver) that is already playing a video&hellip; and could use better text captions

#### Legal

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)

## Kodi support for Homey
Adds Kodi support to your Homey!

Currently working:
- Adding multiple Kodi instances as a device
- Playing movies via speech
- Playing music via speech
  - By artist
- Playing tv shows via speech
  - Latest unwatched episode of a tv show
- Play / pause / stop through speech
- Starting addons
- Various flow triggers / actions
- Auto reconnection when Kodi has shutdown
- Multi device support

### Speech support
EN
* "Play movie Finding Nemo"
* "Play music by artist Armin van Buuren"
* "Play the latest episode of The Walking Dead"
* "Pause"
* "Resume" (prevent interference with 'play')
* "Stop"
* "Shutdown / Hibernate / Reboot Kodi"
* "I want to watch a movie"
* "Start addon / program Exodus"
* "Any new movies?"
* "Any new episodes?"

NL
* "Start film / Speel film Finding Nemo"
* "Speel muziek van artiest Armin van Buuren"
* "Volgende"
* "Vorige"
* "Speel / Start de laatste aflevering van The Walking Dead"
* "Pauze"
* "Speel / Hervat" 
* "Stop"
* "Slaap kodi"
* "Kodi afsluiten / herstarten"
* "Ik wil een film kijken"
* "Start addon / programma Exodus"
* "Zijn er nieuwe films?"
* "Zijn er nieuwe afleveringen?"

### Flow support
*Triggers*
* On movie start (doesn't work with every version of Kodi)
* On movie stop (when a movie ends, including credits)
* On episode start (doesn't work with every version of Kodi)
* On episode stop (when an episode, including credits)
* On playback start (anything starts playing)
* On pause  
* On resume 
* On stop (when you press stop)
* On reboot
* On shutdown
* On hibernate
* On wake
* On Homey reconnect to Homey
* On song start

*Actions*
* Start a movie
* Play / Pause
* Play the latest episode of
* Play music by artist
* Stop
* Reboot
* Hibernate
* Shutdown
* Mute
* Unmute
* Subtitle on
* Subtitle off
* Set party mode on
* Set Volume

Flows are triggered whenever something happens on Kodi, whether this has been triggered by Homey or any other remote control.

### Donate
Consider buying me a beer if you like this app :-)

[![Paypal donate][pp-donate-image]][pp-donate-link]

[pp-donate-link]: https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=D7H2GG32VETVW&lc=AU&item_number=homey%2dapps&currency_code=AUD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted
[pp-donate-image]: https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif

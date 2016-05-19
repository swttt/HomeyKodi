## Kodi support for Homey
Adds Kodi support to your Homey!

Currently working:
- Adding a Kodi instance as a device
- Playing movies via speech
- Playing music via speech
  - By artist
- Playing tv shows via speech
  - Latest unwatched episode of a tv show
- Play / pause / stop through speech
- Various flow triggers / actions
- Auto reconnection when Kodi has shutdown

Note: Only adding 1 device is currently supported

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

### Flow support
*Triggers*
* On movie start
* On episode start
* On pause  
* On resume 
* On stop 
* On reboot
* On shutdown
* On hibernate
* On wake (experimental)

*Actions*
* Start a movie
* Play / Pause
* Play the latest episode of
* Stop
* Reboot
* Hibernate
* Shutdown

Flows are now triggered whenever something happens on Kodi, whether this has been triggered by Homey or any other remote control.
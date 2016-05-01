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
* "Play movie Finding Nemo"
* "Play music by artist Armin van Buuren"
* "Play the latest episode of The Walking Dead"
* "Pause"
* "Resume" (prevent interference with 'play')
* "Stop"

### Flow support
*Triggers*
* On movie start
* On episode start
* On pause  
* On resume 
* On stop 

*Actions*
* Start a movie
* Play / Pause
* Stop

Flows are now triggered whenever something happens on Kodi, whether this has been triggered by Homey or any other remote control.
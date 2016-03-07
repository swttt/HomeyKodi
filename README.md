## Kodi support for Homey
Adds Kodi support to your Homey!

Currently working:
- Adding a Kodi instance as a device
- Playing movies via speech
- Playing music via speech (EXPERIMENTAL. Only artist is currently implemented)
- Play / pause / stop through speech
- Various flow triggers / actions

Note: Only adding 1 device is currently supported

### Speech support
* "Play movie Finding Nemo"
* "Play music by artist Armin van Buuren"
* "Pause"
* "Resume" (prevent interference with 'play')
* "Stop"

### Flow support
*Triggers*
* On movie start
* On pause  (only triggered when pausing through Homey)
* On resume (only triggered when resuming through Homey)
* On stop (only triggered when stopping through Homey)

*Actions*
* Start a movie
* Play / Pause
* Stop
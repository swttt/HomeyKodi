'use strict'

// Require dependencies
var Xbmc = require('xbmc-listener')
var Fuse = require('fuse.js')

var registeredDevices = []

// Export capabilities
module.exports.capabilities = {}

module.exports.init = function (devices, callback) {
	// Initiate a Kodi instance for each registered device
  devices.forEach(function (device) {
		// Build Xbmc objects
		module.exports.getSettings(device, function (err, settings) {
			// Parse settings
      var params = {
        host: settings.host,
        httpPort: settings.http_port,
        username: settings.username,
        password: settings.password
      }

      var xbmc = new Xbmc(params)

      // Register the device
      registeredDevices.push(xbmc)
		})
  })

  callback()
}

// Pairing functionality
module.exports.pair = function (socket) {
    // Link the configure function to the front end
  socket.on('configure_kodi', function (data, callback) {
	// data contains connections data of kodi
    var xbmc = new Xbmc(data)

    xbmc.notify(__('pair.feedback.succesfully_connected'), 5000, function (error, result) {
      if (error) {
        callback(__('pair.feedback.could_not_connect'))
      }
      else {
        registeredDevices.push(xbmc)
        callback(null, __('pair.feedback.succesfully_connected'))
		  }
    })
  })

  socket.on('disconnect', function () {
    // Don't care what happens
  })
}

// START EXPORTING DRIVER SPECIFIC FUNCTIONS
// NOTE: No callbacks are defined since this drivers makes use of the Promise API
module.exports.searchMovie = function (deviceName, movieTitle) {
  return new Promise(function (succesFn, errorFn) {
    console.log('searchMovie()', deviceName, movieTitle)

		// search Kodi instance by devicename
    getKodiInstance(deviceName)
      .then(function (xbmc) {
			// Kodi API: VideoLibrary.GetMovies
        xbmc.method('VideoLibrary.GetMovies', '',
					function (error, result) {
            if (error) {
              return errorFn(error)
            }

						// Parse the result and look for movieTitle
						// Set option for fuzzy search
            var options = {
              caseSensitive: false, // Don't care about case whenever we're searching titles by speech
              includeScore: false, // Don't need the score, the first item has the highest probability
              shouldSort: true, // Should be true, since we want result[0] to be the item with the highest probability
              threshold: 0.4, // 0 = perfect match, 1 = match all..
              location: 0,
              distance: 100,
              maxPatternLength: 64,
              keys: ['label']
            }

						// Create the fuzzy search object
            var fuse = new Fuse(result.movies, options)
            var searchResult = fuse.search(movieTitle.trim())

						// If there's a result
            if (searchResult.length > 0) {
              succesFn(searchResult[0]) // Always use searchResult[0], this is the result with the highest probability (setting shouldSort = true)
            }
						// Movie not found
            else {
              errorFn(__('talkback.movie_not_found'))
            }
				})
      })
			.catch(errorFn)
  })
}

module.exports.playMovie = function (deviceName, movieId) {
	// Kodi API: Player.Open
  return new Promise(function (succesFn, errorFn) {
    console.log('playMovie()', deviceName, movieId)
		// search Kodi instance by devicename
    getKodiInstance(deviceName)
			.then(function (xbmc) {
				// Build the parameter to play a movie
        var param = {
          item: {
            movieid: movieId
          }
        }

        xbmc.method('Player.Open', param, function (error, result) {
          if (error) {
            errorFn(error)
          }

					// Movie started succesfully
          succesFn()
        })
			})
      .catch(errorFn)
  })
}

module.exports.playPause = function (deviceName) {
	// Kodi API: Player.Open
  return new Promise(function (succesFn, errorFn) {
    console.log('playPause()', deviceName)
		// search Kodi instance by devicename
    getKodiInstance(deviceName)
      .then(function (xbmc) {
        // Get the active player so we can pause it
        xbmc.method('Player.GetActivePlayers', {}, function (error, result) {
          if (error) {
            errorFn(error)
          }

          // Build request parameters and supply the player
          var param = {
            playerid: result[0].playerid
          }

          xbmc.method('Player.PlayPause', param, function (error, result) {
            if (error) {
              errorFn(error)
            }
            succesFn()
          })
        })
      })
      .catch(errorFn)
  })
}

// Return the Kodi device by device name or id
function getKodiInstance (deviceId) {
  return new Promise(function (succesFn, errorFn) {
    console.log('getKodiInstance', deviceId)
    // If only 1 registered device, just return it
		// @TODO fix multiple devices support
    var device = registeredDevices.length === 1 ? registeredDevices[0] : registeredDevices[deviceId]

    if (device) {
      succesFn(device)
    }
    else {
      errorFn(__('talkback.device_not_found'))
    }
  })
}

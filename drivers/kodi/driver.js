'use strict'

// Require dependencies
var Xbmc = require('xbmc-listener')
var Fuse = require('fuse.js')
var Utils = require('../../libs/utils')

var registeredDevices = []

// Export capabilities
module.exports.capabilities = {}

module.exports.init = function (devices, callback) {
  // Initiate a Kodi instance for each registered device
  devices.forEach(function (device) {
    // Build Xbmc objects
    module.exports.getSettings(device, function (err, settings) {
      if (err) {
        callback(err, null)
      }

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
    // Try to send a notification to Kodi
    xbmc.notify(__('pair.feedback.succesfully_connected'), 5000, function (error, result) {
      if (error) {
        callback(__('pair.feedback.could_not_connect'))
      } else {
        registeredDevices.push(xbmc)
        callback(null, __('pair.feedback.succesfully_connected'))
      }
    })
  })

  socket.on('disconnect', function () {
    // Don't care what happens
  })
}

// Device gets deleted
module.exports.deleted = function (device_data) {  
  // Create a new array without the deleted device
  registeredDevices = registeredDevices.filter(function (item) {
    return item.host !== device_data.id
  })
}

// START EXPORTING DRIVER SPECIFIC FUNCTIONS
// NOTE: No callbacks are defined since this drivers makes use of the Promise API

/* **********************************
  SEARCH MOVIE
************************************/
module.exports.searchMovie = function (deviceName, movieTitle) {
  return new Promise(function (resolve, reject) {
    console.log('searchMovie()', deviceName, movieTitle)

    // search Kodi instance by devicename
    getKodiInstance(deviceName)
      .then(function (xbmc) {
        // Kodi API: VideoLibrary.GetMovies
        xbmc.method('VideoLibrary.GetMovies', '',
          function (error, result) {
            if (error) {
              return reject(error)
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
              resolve(searchResult[0]) // Always use searchResult[0], this is the result with the highest probability (setting shouldSort = true)
            } else {
              reject(__('talkback.movie_not_found'))
            }
          })
      })
      .catch(reject)
  })
}

/* **********************************
  PLAY MOVIE
************************************/
module.exports.playMovie = function (deviceName, movieId) {
  // Kodi API: Player.Open
  return new Promise(function (resolve, reject) {
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
            reject(error)
          }

          // Movie started succesfully
          resolve()
        })
      })
      .catch(reject)
  })
}

/* **********************************
  PLAY PAUSE
************************************/
module.exports.playPause = function (deviceName) {
  // Kodi API: Player.Open
  return new Promise(function (resolve, reject) {
    console.log('playPause()', deviceName)
    // search Kodi instance by devicename
    getKodiInstance(deviceName)
      .then(function (xbmc) {
        // Get the active player so we can pause it
        xbmc.method('Player.GetActivePlayers', {}, function (error, result) {
          if (error) {
            reject(error)
          }

          // Build request parameters and supply the player
          var param = {
            playerid: result[0].playerid
          }

          xbmc.method('Player.PlayPause', param, function (error, result) {
            if (error) {
              reject(error)
            }
            var newState = result.speed === 0 ? 'paused' : 'resumed'
            resolve(newState)
          })
        })
      })
      .catch(reject)
  })
}

/* **********************************
  STOP
************************************/
module.exports.stop = function (deviceName) {
  // Kodi API: Player.Open
  return new Promise(function (resolve, reject) {
    console.log('stop()', deviceName)
    // search Kodi instance by devicename
    getKodiInstance(deviceName)
      .then(function (xbmc) {
        // Get the active player so we can pause it
        xbmc.method('Player.GetActivePlayers', {}, function (error, result) {
          if (error) {
            reject(error)
          }

          // Build request parameters and supply the player
          var param = {
            playerid: result[0].playerid
          }

          xbmc.method('Player.Stop', param, function (error, result) {
            if (error) {
              reject(error)
            }
            resolve()
          })
        })
      })
      .catch(reject)
  })
}

/* **********************************
  SEARCH MUSIC
************************************/
module.exports.searchMusic = function (deviceName, queryProperty, searchQuery) {
  return new Promise(function (resolve, reject) {
    console.log('searchMusic()', deviceName, queryProperty, searchQuery)

    // search Kodi instance by devicename
    getKodiInstance(deviceName)
      .then(function (xbmc) {
        // Determine whether to search by artist or ALBUM
        var searchMethod = ''
        var fuzzyLookupKey = ''
        switch (queryProperty) {
          case 'ARTIST':
            searchMethod = 'AudioLibrary.GetArtists'
            fuzzyLookupKey = 'artist'
            break
          case 'ALBUM' :
            searchMethod = 'AudioLibrary.GetAlbums'
            break
        }
        // Call kodi for artist / albums
        xbmc.method(searchMethod, '',
          function (error, result) {
            if (error) {
              reject(error)
            }

            // Parse the result and look for artist or album
            // Set option for fuzzy search
            var options = {
              caseSensitive: false, // Don't care about case whenever we're searching titles by speech
              includeScore: false, // Don't need the score, the first item has the highest probability
              shouldSort: true, // Should be true, since we want result[0] to be the item with the highest probability
              threshold: 0.4, // 0 = perfect match, 1 = match all..
              location: 0,
              distance: 100,
              maxPatternLength: 64,
              keys: [fuzzyLookupKey] // Set to either 'artist' or 'album'
            }

            // Create the fuzzy search object
            var fuse = new Fuse(result[fuzzyLookupKey + 's'], options) // + 's' since the root tag is always plural (artistS and albumS)
            var searchResult = fuse.search(searchQuery.trim())

            // If there's a result
            if (searchResult.length > 0) {
              var artistOrAlbum = searchResult[0] // Always use searchResult[0], this is the result with the highest probability (setting shouldSort = true)

              // Build parameter filter to obtain filtered songs
              var params = { filter: {} }
              params.filter[fuzzyLookupKey + 'id'] = artistOrAlbum.artistid

              // Call Kodi for songs by artist/albums
              xbmc.method('AudioLibrary.GetSongs', params,
                function (error, result) {
                  if (error) {
                    reject(error)
                  }
                  // Return the array of songs
                  resolve(result.songs)
                }
              )
            } else {
              // Artist/Album not found
              switch (queryProperty) {
                case 'ARTIST':
                  reject(__('talkback.artist_not_found'))
                  break
                case 'ALBUM' :
                  reject(__('talkback.album_not_found'))
                  break
              }
            }
          })
      })
      .catch(reject)
  })
}

/* **********************************
  PLAY MUSIC
************************************/
/*
  - Clears playlist
  - Adds songs
  - Starts playing
*/
module.exports.playMusic = function (deviceName, songsToPlay, shuffle) {
  return new Promise(function (resolve, reject) {
    console.log('playMusic()', deviceName, songsToPlay)

    // search Kodi instance by devicename
    getKodiInstance(deviceName)
      .then(function (xbmc) {
        // Clear the playlist
        var params = {
          playlistid: 0
        }
        xbmc.method('Playlist.Clear', params,
          function (error, result) {
            if (error) {
              reject(error)
            }

            // Create an array of songids
            var songs = songsToPlay.map(function (item) {
              return {songid: item.songid}
            })

            // Shuffle the array
            if (shuffle) {
              songs = Utils.shuffle(songs)
            }

            var params = {
              playlistid: 0,
              item: songs
            }
            // Add the songs to the playlist
            xbmc.method('Playlist.Add', params,
              function (error, result) {
                if (error) {
                  reject(error)
                }

                // Play the playlist
                var params = {
                  item: {
                    playlistid: 0
                  },
                  options: {
                    repeat: 'all'
                  }
                }

                xbmc.method('Player.Open', params,
                  function (error, result) {
                    console.log(error)
                    if (error) {
                      reject(error)
                    } else {
                      // Succesfully played the playlist
                      resolve()
                    }
                  }
                )
              }
            )
          }
        )
      })
  })
}

/* **********************************
  NEXT / PREVIOUS TRACK
************************************/
module.exports.nextOrPreviousTrack = function (deviceName, previousOrNext) {
  return new Promise(function (resolve, reject) {
    console.log('nextOrPreviousTrack()', deviceName, previousOrNext)

    // search Kodi instance by devicename
    getKodiInstance(deviceName)
      .then(function (xbmc) {
        // Get the active player so we can next/previous it
        xbmc.method('Player.GetActivePlayers', {}, function (error, result) {
          if (error) {
            reject(error)
          }

          // Build request parameters and supply the player
          var params = {
            playerid: result[0].playerid,
            to: previousOrNext
          }

          xbmc.method('Player.GoTo', params,
            function (error, result) {
              if (error) {
                reject(error)
              } else {
                resolve(previousOrNext)
              }
            }
          )
        })
      })
  })
}

/* **********************************
  SEARCH LATEST EPISODE
************************************/
module.exports.getLatestEpisode = function (deviceName, seriesName) {
  return new Promise(function (resolve, reject) {
    console.log('getLatestEpisode()', deviceName, seriesName)

    // search Kodi instance by devicename
    getKodiInstance(deviceName)
      .then(function (xbmc) {
        // Get all the series and fuzzy search for the one we need
        xbmc.method('VideoLibrary.GetTVShows', {},
          function (error, result) {
            if (error) {
              return reject(error)
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
            var fuse = new Fuse(result.tvshows, options)
            var searchResult = fuse.search(seriesName.trim())

            // If there's a result
            if (searchResult.length > 0) {
              // e.g. { label: 'Narcos', tvshowid: 43 }
              var seriesResult = searchResult[0] // Always use searchResult[0], this is the result with the highest probability (setting shouldSort = true)

              // Build filter to search unwatched episodes
              var param = {
                tvshowid: seriesResult.tvshowid,
                properties: ['playcount', 'showtitle', 'season', 'episode']
              }
              xbmc.method('VideoLibrary.GetEpisodes', param,
                function (error, result) {
                  if (error) {
                    reject(error)
                  }

                  // Check whether we have seen this episode already
                  var firstUnplayedEpisode = result.episodes.filter(function (item) {
                    return item.playcount === 0
                  })
                  if (firstUnplayedEpisode.length > 0) {
                    resolve(firstUnplayedEpisode[0]) // Resolve the first unplayed episode
                  } else {
                    reject(__('talkback.no_latest_episode_found'))
                  }
                }
              )
            } else {
              reject(__('talkback.series_not_found'))
            }
          }
        )
      })
  })
}

/* **********************************
  PLAY EPISODE
************************************/
module.exports.playEpisode = function (deviceName, episode) {
  // Kodi API: Player.Open
  return new Promise(function (resolve, reject) {
    console.log('playEpisode()', deviceName, episode)
    // search Kodi instance by devicename
    getKodiInstance(deviceName)
      .then(function (xbmc) {
        // Build the parameter to play a movie
        var param = {
          item: {
            episodeid: episode.episodeid
          }
        }

        xbmc.method('Player.Open', param, function (error, result) {
          if (error) {
            reject(__('talkback.something_went_wrong'))
          }

          // Episode started playing succesfully
          resolve()
        })
      })
      .catch(reject)
  })
}

// Return the Kodi device by device name or id
function getKodiInstance (deviceId) {
  return new Promise(function (resolve, reject) {
    console.log('getKodiInstance', deviceId)
    // If only 1 registered device, just return it
    // @TODO fix multiple devices support
    var device = registeredDevices.length === 1 ? registeredDevices[0] : registeredDevices[deviceId]

    if (device) {
      resolve(device)
    } else {
      reject(__('talkback.device_not_found'))
    }
  })
}

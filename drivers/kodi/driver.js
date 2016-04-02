'use strict'

// Require dependencies
var KodiWs = require('node-kodi-ws')
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
      // Try to connect and register device using websockets
      KodiWs(settings.host, settings.tcpport).then(function (connection) {
        // Keep track of the device id
        connection.id = settings.host
        // Register the device
        registeredDevices.push(connection)
        // Start listening for Kodi events
        startListeningForEvents(connection)
      })
    })
  })

  callback()
}

// Pairing functionality
module.exports.pair = function (socket) {
  // Link the configure function to the front end
  socket.on('configure_kodi', function (data, callback) {
    // data contains connections data of kodi
    // Try to connect and register device
    KodiWs(data.host, data.tcpPort)
    .then(function (connection) {
      // Register the device
      registeredDevices.push(connection)
      // Start listening for Kodi events
      startListeningForEvents(connection)
      callback(null, __('pair.feedback.succesfully_connected'))
    })
    .catch(function (err) {
      callback(__('pair.feedback.could_not_connect') + ' ' + err)
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

// A user has updated settings, update the device object
module.exports.settings = function (device_data, newSettingsObj, oldSettingsObj, changedKeysArr, callback) {
  // TO IMPLEMENT
  callback(null, true)
}

// START EXPORTING DRIVER SPECIFIC FUNCTIONS
// NOTE: No callbacks are defined since this drivers makes use of the Promise API

/* **********************************
  SEARCH MOVIE
************************************/
module.exports.searchMovie = function (deviceSearchParameters, movieTitle) {
  return new Promise(function (resolve, reject) {
    console.log('searchMovie()', deviceSearchParameters, movieTitle)

    // search Kodi instance by deviceSearchParameters
    getKodiInstance(deviceSearchParameters)
      .then(function (kodi) {
        // Kodi API: VideoLibrary.GetMovies
        kodi.run('VideoLibrary.GetMovies', {})
          .then(function (result) {
            if (result.movies) { // Check if there are movies in the media library
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
            } else {
              // No movies in media libary, throw an error
              reject(__('talkback.no_movies_in_library'))
            }
          })
      })
      .catch(reject)
  })
}

/* **********************************
  PLAY MOVIE
************************************/
module.exports.playMovie = function (deviceSearchParameters, movieId) {
  // Kodi API: Player.Open
  return new Promise(function (resolve, reject) {
    console.log('playMovie()', deviceSearchParameters, movieId)
    // search Kodi instance by deviceSearchParameters
    getKodiInstance(deviceSearchParameters)
      .then(function (kodi) {
        // Build the parameter to play a movie
        var param = {
          item: {
            movieid: movieId
          }
        }

        kodi.run('Player.Open', param)
          .then(function () {
            resolve(kodi)
          })
      })
      .catch(reject)
  })
}

/* **********************************
  PLAY PAUSE
************************************/
module.exports.playPause = function (deviceSearchParameters) {
  // Kodi API: Player.Open
  return new Promise(function (resolve, reject) {
    console.log('playPause()', deviceSearchParameters)
    // search Kodi instance by deviceSearchParameters
    getKodiInstance(deviceSearchParameters)
      .then(function (kodi) {
        // Get the active player so we can pause it
        kodi.run('Player.GetActivePlayers', {})
          .then(function (result) {
            if (result[0]) { // Check whether there is an active player to stop
              // Build request parameters and supply the player
              var param = {
                playerid: result[0].playerid
              }
              kodi.run('Player.PlayPause', param)
                .then(function (result) {
                  var newState = result.speed === 0 ? 'paused' : 'resumed'
                  // Paused succesfully, return the new state and the device that has been paused
                  resolve(newState, kodi)
                })
            }
          })
      })
      .catch(reject)
  })
}

/* **********************************
  STOP
************************************/
module.exports.stop = function (deviceSearchParameters) {
  // Kodi API: Player.Open
  return new Promise(function (resolve, reject) {
    console.log('stop()', deviceSearchParameters)
    // search Kodi instance by deviceSearchParameters
    getKodiInstance(deviceSearchParameters)
      .then(function (kodi) {
        // Get the active player so we can pause it
        kodi.run('Player.GetActivePlayers', {})
          .then(function (result) {
            if (result[0]) { // Check whether there is an active player to stop
              // Build request parameters and supply the player
              var param = {
                playerid: result[0].playerid
              }
              kodi.run('Player.Stop', param)
                .then(function (result) {
                  // Stopped succesfully, return the device that has been stopped
                  resolve(kodi)
                })
            }
          })
      })
      .catch(reject)
  })
}

/* **********************************
  SEARCH MUSIC
************************************/
module.exports.searchMusic = function (deviceSearchParameters, queryProperty, searchQuery) {
  return new Promise(function (resolve, reject) {
    console.log('searchMusic()', deviceSearchParameters, queryProperty, searchQuery)

    // search Kodi instance by deviceSearchParameters
    getKodiInstance(deviceSearchParameters)
      .then(function (kodi) {
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
        kodi.run(searchMethod, {})
          .then(
            function (result) {
              if (result[fuzzyLookupKey + 's']) { // Check if there is music in the library
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
                  kodi.run('AudioLibrary.GetSongs', params)
                    .then(function (result) {
                      // Return the array of songs
                      resolve(result.songs)
                    })
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
              } else {
                // No music in library
                reject(__('talkback.no_music_in_library'))
              }
            }
          )
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
module.exports.playMusic = function (deviceSearchParameters, songsToPlay, shuffle) {
  return new Promise(function (resolve, reject) {
    console.log('playMusic()', deviceSearchParameters, songsToPlay)

    // search Kodi instance by deviceSearchParameters
    getKodiInstance(deviceSearchParameters)
      .then(function (kodi) {
        // Clear the playlist
        var params = {
          playlistid: 0
        }
        kodi.run('Playlist.Clear', params)
          .then(function () {
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
            kodi.run('Playlist.Add', params)
              .then(function (result) {
                // Play the playlist
                var params = {
                  item: {
                    playlistid: 0
                  },
                  options: {
                    repeat: 'all'
                  }
                }

                kodi.run('Player.Open', params)
                  .then(function (result) {
                    // Succesfully played the playlist, return the device for flow handling
                    resolve(kodi)
                  })
              })
          })
      })
  })
}

/* **********************************
  NEXT / PREVIOUS TRACK
************************************/
module.exports.nextOrPreviousTrack = function (deviceSearchParameters, previousOrNext) {
  return new Promise(function (resolve, reject) {
    console.log('nextOrPreviousTrack()', deviceSearchParameters, previousOrNext)

    // search Kodi instance by deviceSearchParameters
    getKodiInstance(deviceSearchParameters)
      .then(function (kodi) {
        // Get the active player so we can next/previous it
        kodi.run('Player.GetActivePlayers', {})
        .then(function (result) {
          if (result[0]) { // Check whether there is an active player to stop
            // Build request parameters and supply the player
            var params = {
              playerid: result[0].playerid,
              to: previousOrNext
            }

            kodi.run('Player.GoTo', params)
              .then(function (result) {
                resolve(previousOrNext)
              })
          }
        })
      })
  })
}

/* **********************************
  SEARCH LATEST EPISODE
************************************/
module.exports.getLatestEpisode = function (deviceSearchParameters, seriesName) {
  return new Promise(function (resolve, reject) {
    console.log('getLatestEpisode()', deviceSearchParameters, seriesName)

    // search Kodi instance by deviceSearchParameters
    getKodiInstance(deviceSearchParameters)
      .then(function (kodi) {
        // Get all the series and fuzzy search for the one we need
        kodi.run('VideoLibrary.GetTVShows', {})
          .then(function (result) {
            if (result.tvshows) { // Check whether there are TV shows in the library
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
                  properties: ['playcount', 'showtitle', 'season', 'episode'],
                  // Sort the result so we can grab the first unwatched episode
                  sort: {
                    order: 'ascending',
                    method: 'episode',
                    ignorearticle: true
                  }
                }
                kodi.run('VideoLibrary.GetEpisodes', param)
                  .then(function (result) {
                    // Check if there are episodes for this TV show
                    if (result.episodes) {
                      // Check whether we have seen this episode already
                      var firstUnplayedEpisode = result.episodes.filter(function (item) {
                        return item.playcount === 0
                      })
                      if (firstUnplayedEpisode.length > 0) {
                        resolve(firstUnplayedEpisode[0]) // Resolve the first unplayed episode
                      } else {
                        reject(__('talkback.no_latest_episode_found'))
                      }
                    } else {
                      reject(__('talkback.no_latest_episode_found'))
                    }
                  })
              } else {
                reject(__('talkback.series_not_found'))
              }
            } else {
              // No TV Shows in the library
              reject(__('talkback.no_tvshows_in_library'))
            }
          })
      })
  })
}

/* **********************************
  PLAY EPISODE
************************************/
module.exports.playEpisode = function (deviceSearchParameters, episode) {
  // Kodi API: Player.Open
  return new Promise(function (resolve, reject) {
    console.log('playEpisode()', deviceSearchParameters, episode)
    // search Kodi instance by searchParameters
    getKodiInstance(deviceSearchParameters)
      .then(function (kodi) {
        // Build the parameter to play a movie
        var param = {
          item: {
            episodeid: episode.episodeid
          }
        }

        kodi.run('Player.Open', param)
          .then(function (result) {
            // Episode started playing succesfully, return device for flow handling
            resolve(kodi)
          })
      })
      .catch(reject)
  })
}

// Return the Kodi device specified by the search parameters
function getKodiInstance (searchParameters) {
  return new Promise(function (resolve, reject) {
    console.log('getKodiInstance', searchParameters)
    // If only 1 registered device, just return it
    // @TODO fix multiple devices support
    var device = registeredDevices.length === 1 || searchParameters === null ? registeredDevices[0] : registeredDevices[searchParameters]

    if (device) {
      resolve(device)
    } else {
      reject(__('talkback.device_not_found'))
    }
  })
}

/* **********************************
  KODI EVENT LISTENERS
    - All functions related to event handling
************************************/
function startListeningForEvents (device) {
  console.log('startListeningForEvents()')
  // Map supported Kodi events to indidual functions and pass the device connection to trigger the appropriate flows
  device.notification('Player.OnPause', function (result) { onKodiPause(result, device) })
  device.notification('Player.OnPlay', function (result) { onKodiPlay(result, device) })
  device.notification('Player.OnStop', function (result) { onKodiStop(result, device) })
}

function onKodiPause (result, device) {
  console.log('onKodiPause()')
  // Trigger the flow
  console.log('Triggering flow kodi_pause')
  Homey.manager('flow').triggerDevice('kodi_pause', null, null, device.id)
}

function onKodiStop (result, device) {
  console.log('onKodiStop()')
  // Trigger the flow
  console.log('Triggering flow kodi_stop')
  Homey.manager('flow').triggerDevice('kodi_stop', null, null, device.id)
}

function onKodiPlay (result, device) {
  console.log('onKodiPlay()')
  // Check if there's a new song/movie/episode playback or a resume action (player % > 1)
  // Build request parameters and supply the player
  var params = {
    playerid: result.data.player.playerid,
    properties: ['percentage']
  }
  device.run('Player.GetProperties', params)
    .then(function (playerResult) {
      // If the percentage is above 0.1, we have a resume-action
      if (playerResult) {
        if (playerResult.percentage >= 0.1) {
          console.log('Triggering flow kodi_resume')
          Homey.manager('flow').triggerDevice('kodi_resume', null, null, device.id)
          // Check the playback type (movie or episode)
        } else if (result.data.item.type === 'movie' || result.data.item.type === 'movies') {
          // Get movie title
          var movieParams = {
            movieid: result.data.item.id,
            properties: ['title']
          }
          device.run('VideoLibrary.GetMovieDetails', movieParams)
            .then(function (movieResult) {
              // Trigger appropriate flows
              Homey.log('Triggering flow kodi_movie_start, movie_title: ', movieResult.moviedetails.label)
              // Trigger flows and pass variables
              Homey.manager('flow').triggerDevice('kodi_movie_start', {
                // Pass movie title as flow token
                movie_title: movieResult.moviedetails.label
              }, null, device.id)
            })
        } else if (result.data.item.type === 'episode' || result.data.item.type === 'episodes') {
          // Get Episode details
          var episodeParams = {
            episodeid: result.data.item.id,
            properties: ['showtitle', 'season', 'episode', 'title']
          }
          device.run('VideoLibrary.GetEpisodeDetails', episodeParams)
            .then(function (episodeResult) {
              // Trigger action kodi_episode_start
              Homey.log('Triggering flow kodi_episode_start, tvshow_title: ', episodeResult.episodedetails.showtitle, 'episode_title: ', episodeResult.episodedetails.label, 'season: ', episodeResult.episodedetails.season, 'episode: ', episodeResult.episodedetails.episode)
              Homey.manager('flow').triggerDevice('kodi_episode_start', {
                tvshow_title: episodeResult.episodedetails.showtitle,
                episode_title: episodeResult.episodedetails.label,
                season: episodeResult.episodedetails.season,
                episode: episodeResult.episodedetails.episode
              }, null, device.id)
            })
        }
      }
    })
}

'use strict'

var Utils = require('../../libs/utils')

function init () {
  Homey.log('init()')

  // Register functions to Homey
  Homey.manager('speech-input').on('speech', parseSpeach)
  Homey.manager('flow').on('action.play_movie_kodi', onFlowActionPlayMovieKodi)
  Homey.manager('flow').on('action.pause_resume_kodi', onFlowActionPauseResumeKodi)
  Homey.manager('flow').on('action.stop_kodi', onFlowActionStopKodi)
  Homey.manager('flow').on('action.play_latest_episode_kodi', onFlowActionPlayLatestEpisode)
  Homey.manager('flow').on('action.hibernate_kodi', onFlowActionHibernate)
  Homey.manager('flow').on('action.reboot_kodi', onFlowActionReboot)
  Homey.manager('flow').on('action.shutdown_kodi', onFlowActionShutdown)
  Homey.manager('flow').on('action.play_music_by_artist', onFlowActionPlayMusicByArtist)
}
module.exports.init = init

/* ******************
	SPEECH FUNCTIONS
******************* */
function parseSpeach (speech, callback) {
  Homey.log('parseSpeach()', speech)
  console.log(speech)
  speech.triggers.some(function (trigger) {
    switch (trigger.id) {
      case 'kodi_play_movie' :
        // Parse the movie title from speech transcript
        var movieTitle = speech.transcript.replace(trigger.text, '')

        // Try to lookup the movie
        // NOTE:	no multiple device support yet, pass null as device so 1st registered device gets picked
        searchAndPlayMovie(null, movieTitle).catch(
          function (err) {
            // Driver should throw user friendly errors
            Homey.manager('speech-output').say(err)
          }
        )

        // Only execute 1 trigger
        return true

      case 'kodi_play_tvshow' :
        Homey.manager('speech-output').say(__('talkback.not_implemented'))
        // Only fire 1 trigger
        return true

      case 'kodi_play_music' :
        var musicTranscriptWithoutTrigger = speech.transcript.replace(trigger.text, '')
        // Check how to search for music
        if (musicTranscriptWithoutTrigger.indexOf(__('speech.by')) > -1 || musicTranscriptWithoutTrigger.indexOf(__('speech.artist')) > -1) {
          var artistSearchQuery = musicTranscriptWithoutTrigger.replace(__('speech.by'), '').replace(__('speech.artist'), '')
          // NOTE:	no multiple device support yet, pass null as device so 1st registered device gets picked
          searchAndPlayMusic(null, 'ARTIST', artistSearchQuery)
            .catch(
              function (err) {
                // Driver should throw user friendly errors
                Homey.manager('speech-output').say(err)
              }
          )
        } else if (1 === 0) {
          // Add search by album / genre
        }
        // Only fire 1 trigger
        return true

      case 'kodi_play_pause' :
        Homey.manager('drivers').getDriver('kodi').playPause(null)
          .catch(
            function (err) {
              // Driver should throw user friendly errors
              Homey.manager('speech-output').say(err)
            }
        )
        return true // Only fire one trigger

      case 'kodi_stop' :
        Homey.manager('drivers').getDriver('kodi').stop(null)
        .catch(
          function (err) {
            // Driver should throw user friendly errors
            Homey.manager('speech-output').say(err)
          }
        )
        return true // Only fire one trigger

      case 'kodi_next' :
        Homey.manager('drivers').getDriver('kodi').nextOrPreviousTrack(null, 'next')
        .catch(
          function (err) {
            // Driver should throw user friendly errors
            Homey.manager('speech-output').say(err)
          }
        )
        return true // Only fire one trigger

      case 'kodi_previous' :
        Homey.manager('drivers').getDriver('kodi').nextOrPreviousTrack(null, 'previous')
        .catch(
          function (err) {
            // Driver should throw user friendly errors
            Homey.manager('speech-output').say(err)
          }
        )
        return true // Only fire one trigger

      case 'kodi_play_latest_episode' :
        var episodeTranscriptWithoutTrigger = speech.transcript.replace(trigger.text, '').replace(__('of'), '')

        playLatestEpisode(null, episodeTranscriptWithoutTrigger)
        .catch(
          function (err) {
            // Driver should throw user friendly errors
            Homey.manager('speech-output').say(err)
            // 1 Retry
            Homey.manager('speech-input').ask(__('question.latest_episode_retry'), function (err, result) {
              if (err) {
                Homey.manager('speech-output').say(__('talkback.something_went_wrong') + ' ' + err)
              } else {
                console.log('result:', result)
                playLatestEpisode(null, result)
                .catch(
                  function (err) {
                    // Driver should throw user friendly errors
                    Homey.manager('speech-output').say(err)
                  }
                )
              }
            })
          }
        )
        return true // Only fire one trigger

      case 'kodi_watch_movie' :
        Homey.manager('speech-input').ask(__('question.what_movie'), function (err, result) {
          if (err) {
            Homey.manager('speech-output').say(__('talkback.something_went_wrong') + ' ' + err)
          } else {
            // Try to lookup the movie (result = movietitle)
            // NOTE:	no multiple device support yet, pass null as device so 1st registered device gets picked
            searchAndPlayMovie(null, result).catch(
              function (err) {
                // Driver should throw user friendly errors
                Homey.manager('speech-output').say(err)
              }
            )
          }
        })
        return true // Only fire  one trigger

      case 'kodi_hibernate' :
        // Confirm whether to hibernate
        Homey.manager('speech-input').confirm(__('question.confirm_hibernate'), function (err, confirmed) {
          if (err) {
            Homey.manager('speech-output').say(__('talkback.something_went_wrong') + ' ' + err)
          } else if (confirmed) {
            // Hibernate Kodi
            Homey.manager('drivers').getDriver('kodi').hibernateKodi(null)
            .catch(
              function (err) {
                // Driver should throw user friendly errors
                Homey.manager('speech-output').say(err)
              }
            )
          } else {
            // Don't do anything
          }
        })
        return true // Only fire one trigger

      case 'kodi_reboot' :
        // Confirm whether to reboot
        Homey.manager('speech-input').confirm(__('question.confirm_reboot'), function (err, confirmed) {
          if (err) {
            Homey.manager('speech-output').say(__('talkback.something_went_wrong') + ' ' + err)
          } else if (confirmed) {
            // Reboot Kodi
            Homey.manager('drivers').getDriver('kodi').rebootKodi(null)
            .catch(
              function (err) {
                // Driver should throw user friendly errors
                Homey.manager('speech-output').say(err)
              }
            )
          } else {
            // Don't do anything
          }
        })
        return true // Only fire trigger

      case 'kodi_shutdown' :
        // Confirm whether to reboot
        Homey.manager('speech-input').confirm(__('question.confirm_shutdown'), function (err, confirmed) {
          if (err) {
            Homey.manager('speech-output').say(__('talkback.something_went_wrong') + ' ' + err)
          } else if (confirmed) {
            // Reboot Kodi
            Homey.manager('drivers').getDriver('kodi').shutdownKodi(null)
            .catch(
              function (err) {
                // Driver should throw user friendly errors
                Homey.manager('speech-output').say(err)
              }
            )
          } else {
            // Don't do anything
          }
        })
        return true // Only fire trigger

      case 'kodi_start_addon' :
        // Parse the addon title from speech transcript
        var addon = speech.transcript.replace(trigger.text, '')

        // Try to lookup the movie
        // NOTE:	no multiple device support yet, pass null as device so 1st registered device gets picked
        searchAndStartAddon(null, addon).catch(
          function (err) {
            // Driver should throw user friendly errors
            Homey.manager('speech-output').say(err)
          }
        )

        return true // Only fire trigger

      case 'kodi_new_movies' :
        // Get the setting for # of days to looks back
        let daysSince = Homey.manager('settings').get('days_since')
        // Use default value when no proper setting is found
        if (!Utils.isNumeric(daysSince)) {
          daysSince = 7
        }
        // Try to look up any new movies
        Homey.manager('drivers').getDriver('kodi').getNewestMovies(null, daysSince)
          .then(function (movies) {
            Homey.manager('speech-output').say(__('talkback.found_following_movies', { 'days_since': daysSince }))
            movies.forEach(function (movie) {
              Homey.manager('speech-output').say(movie.label)
            })
          })
          .catch(
            function (err) {
              console.log('error', err)
              // Driver should throw user friendly errors
              Homey.manager('speech-output').say(err)
            }
          )

        return true // Only fire trigger

      case 'kodi_new_episodes' :
        // Get the setting for # of days to looks back
        let daysSinceEpisode = Homey.manager('settings').get('days_since')
        // Use default value when no proper setting is found
        if (!Utils.isNumeric(daysSinceEpisode)) {
          daysSinceEpisode = 7
        }
        // Try to look up any new movies
        Homey.manager('drivers').getDriver('kodi').getNewestEpisodes(null, daysSinceEpisode)
          .then(function (episodes) {
            Homey.manager('speech-output').say(__('talkback.found_following_episodes', { 'days_since': daysSinceEpisode }))
            episodes.forEach(function (episode) {
              Homey.manager('speech-output').say(__('talkback.found_episode', {
                'showtitle': episode.showtitle,
                'season': episode.season,
                'episode': episode.episode,
                'episode_title': episode.title
              }))
            })
          })
          .catch(
            function (err) {
              console.log('error', err)
              // Driver should throw user friendly errors
              Homey.manager('speech-output').say(err)
            }
          )

        return true // Only fire trigger
    }
  })

  callback(null, true)
}

/* ******************
	FLOW ACTIONS / TRIGGER FUNCTIONS
********************/
function onFlowActionPlayMovieKodi (callback, args) {
  Homey.log('onFlowActionPlayMovieKodi', args)
  searchAndPlayMovie(args.id, args.movie_title)
    .then(function () { callback(null, true) })
    .catch(function (error) { callback(error) })
}

function onFlowActionPauseResumeKodi (callback, args) {
  Homey.log('onFlowActionPauseResumeKodi()', args)
  Homey.manager('drivers').getDriver('kodi').playPause(args.id)
    .then(function () { callback(null, true) })
    .catch(function (error) { callback(error) })
}

function onFlowActionStopKodi (callback, args) {
  Homey.log('onFlowActionStopKodi()', args)
  Homey.manager('drivers').getDriver('kodi').stop(args.id)
    .then(function () { callback(null, true) })
    .catch(function (error) { callback(error) })
}

function onFlowActionPlayLatestEpisode (callback, args) {
  Homey.log('onFlowActionPlayLatestEpisode()', args)
  playLatestEpisode(args.id, args.series_title)
    .then(function () { callback(null, true) })
    .catch(function (error) { callback(error) })
}

function onFlowActionHibernate (callback, args) {
  Homey.log('onFlowActionHibernate()', args)
  Homey.manager('drivers').getDriver('kodi').hibernateKodi(args.id)
    .then(function () { callback(null, true) })
    .catch(function (error) { callback(error) })
}

function onFlowActionReboot (callback, args) {
  Homey.log('onFlowActionReboot()', args)
  Homey.manager('drivers').getDriver('kodi').rebootKodi(args.id)
    .then(function () { callback(null, true) })
    .catch(function (error) { callback(error) })
}

function onFlowActionShutdown (callback, args) {
  Homey.log('onFlowActionShutdown()', args)
  Homey.manager('drivers').getDriver('kodi').shutdownKodi(args.id)
    .then(function () { callback(null, true) })
    .catch(function (error) { callback(error) })
}

function onFlowActionPlayMusicByArtist (callback, args) {
  Homey.log('onFlowActionPlayMusicByArtist()', args)
  searchAndPlayMusic(args.id, 'ARTIST', args.artist)
    .then(function () { callback(null, true) })
    .catch(function (error) { callback(error) })
}

/* ******************
	COMMON FUNCTIONS
********************/
function searchAndPlayMovie (device, movieTitle) {
  return new Promise(function (resolve, reject) {
    Homey.log('searchAndPlayMovie', device, movieTitle)

    // Get device from driver and play the movie
    var KodiDriver = Homey.manager('drivers').getDriver('kodi')

    KodiDriver.searchMovie(device, movieTitle)
      .then(
        // Play movie and trigger flows
        function (movie) {
          KodiDriver.playMovie(device, movie.movieid)
          resolve()
        }
    )
    .catch(reject)
  })
}

function searchAndStartAddon (device, addon) {
  return new Promise(function (resolve, reject) {
    Homey.log('searchAndStartAddon', device, addon)

    // Get device from driver and play the movie
    var KodiDriver = Homey.manager('drivers').getDriver('kodi')

    KodiDriver.searchAddon(device, addon)
      .then(
        // Start the addon
        function (addon) {
          KodiDriver.startAddon(device, addon.addonid)
          resolve()
        }
    )
    .catch(reject)
  })
}

// queryProperty can be ARTIST or ALBUM
function searchAndPlayMusic (device, queryProperty, searchQuery) {
  return new Promise(function (resolve, reject) {
    Homey.log('searchAndPlayMusic()', device, queryProperty, searchQuery)
    // Get the device from driver and search for music
    var KodiDriver = Homey.manager('drivers').getDriver('kodi')
    KodiDriver.searchMusic(device, queryProperty, searchQuery)
      .then(
        function (songsToPlay) {
          KodiDriver.playMusic(device, songsToPlay, true)
          resolve()
        }
      )
      .catch(reject)
  })
}

function playLatestEpisode (device, seriesName) {
  return new Promise(function (resolve, reject) {
    Homey.log('playLatestEpisode()', device, seriesName)
    // Get the device from driver and search for the latest episode of the series
    var KodiDriver = Homey.manager('drivers').getDriver('kodi')
    KodiDriver.getLatestEpisode(device, seriesName)
      .then(
        function (episodeToPlay) {
          KodiDriver.playEpisode(device, episodeToPlay)
          resolve()
        }
      )
      .catch(reject)
  })
}

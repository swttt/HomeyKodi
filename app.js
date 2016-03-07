/* global __ */
/* global Homey */
'use strict'

function init () {
  Homey.log('init()')

  // Register functions
  Homey.manager('speech-input').on('speech', parseSpeach)
  Homey.manager('flow').on('action.playMovieKodi', onFlowActionPlayMovieKodi)
  Homey.manager('flow').on('action.pauseResumeMovieKodi', onFlowActionPauseResumeKodi)
}
module.exports.init = init

/* ******************
	SPEECH FUNCTIONS
******************* */
function parseSpeach (speech, callback) {
  Homey.log('parseSpeach()', speech)

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
        var transcriptWithoutTrigger = speech.transcript.replace(trigger.text, '')
        // Check how to search for music
        if (transcriptWithoutTrigger.indexOf(__('by')) > -1 || transcriptWithoutTrigger.indexOf(__('artist')) > -1) {
          var artistSearchQuery = transcriptWithoutTrigger.replace(__('by'), '').replace(__('artist'), '')
          // NOTE:	no multiple device support yet, pass null as device so 1st registered device gets picked
          searchAndPlayMusic(null, 'ARTIST', artistSearchQuery)
            .then(console.log)
            .catch(
              function (err) {
                // Driver should throw user friendly errors
                Homey.manager('speech-output').say(err)
              }
          )
        }
        // Only fire 1 trigger
        return true

      case 'kodi_play_pause' :
        Homey.manager('drivers').getDriver('kodi').playPause(null)
          .then(function () {
            Homey.log('Triggering flow kodi_pause_resume')
            Homey.manager('flow').trigger('kodi_pause_resume')
          })
          .catch(
            function (err) {
              // Driver should throw user friendly errors
              Homey.manager('speech-output').say(err)
            }
        )
        return true
    }
  })

  callback(null, true)
}

/* ******************
	FLOW ACTIONS
********************/
function onFlowActionPlayMovieKodi (callback, args) {
  Homey.log('onFlowActionPlayMovieKodi', args)
  searchAndPlayMovie(args.id, args.movie_title)
    .then(callback)
    .catch(console.error)
}

function onFlowActionPauseResumeKodi (callback, args) {
  Homey.log('onFlowActionPauseResumeKodi()', args)
  Homey.manager('drivers').getDriver('kodi').playPause(args.id)
    .then(callback)
    .catch(console.error)
}

/* ******************
	COMMON FUNCTIONS
********************/
function searchAndPlayMovie (device, movieTitle) {
  return new Promise(function (succesFn, errorFn) {
    Homey.log('searchAndPlayMovie', device, movieTitle)

    // Get device from driver and play the movie
    var KodiDriver = Homey.manager('drivers').getDriver('kodi')

    KodiDriver.searchMovie(device, movieTitle)
      .then(
        // Play movie and trigger flows
        function (movie) {
          KodiDriver.playMovie(device, movie.movieid)
            .then(succesFn)
            .catch(errorFn)
          Homey.log('Triggering flow kodi_movie_start, movie_title: ', movie.label)
          // Trigger flows and pass variables
          Homey.manager('flow').trigger('kodi_movie_start', {
            movie_title: movie.label
          })
        }
    )
      .catch(errorFn)
  })
}

// queryProperty can be ARTIST or ALBUM
function searchAndPlayMusic (device, queryProperty, searchQuery) {
  return new Promise(function (succesFn, errorFn) {
    Homey.log('searchAndPlayMusic()', device, queryProperty, searchQuery)
    // Get the device from driver and search for music
    var KodiDriver = Homey.manager('drivers').getDriver('kodi')
    KodiDriver.searchMusic(device, queryProperty, searchQuery)
      .catch(errorFn)
  })
}

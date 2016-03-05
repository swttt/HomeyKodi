"use strict";

function init() {	
	Homey.log("init()");
	
	//Register functions
	Homey.manager('speech-input').on('speech', parseSpeach);
	
	Homey.manager('flow').on('action.playMovieKodi', onFlowActionPlayMovieKodi);
}

/*******************
	SPEECH FUNCTIONS
********************/
function parseSpeach(speech, callback){
	Homey.log("parseSpeach()",speech);
	
	speech.triggers.some(function(trigger){
		switch(trigger.id){
			case "kodi_play_movie" : 
				//Parse the movie title from speech transcript
				var movieTitle = speech.transcript.replace(trigger.text,"");
				
				//Try to lookup the movie
				//NOTE:	no multiple device support yet, pass null as device so 1st registered device gets picked
				searchAndPlayMovie(null, movieTitle)				
					.catch
					(
						function(err)
						{
							//Driver should throw user friendly errors
							Homey.manager('speech-output').say(err);
						}
					);
					
				//Only exeute 1 trigger
				return true;

			case "kodi_play_tvshow" : 
				Homey.manager('speech-output').say(__("talkback.not_implemented"));
				//Only fire 1 trigger
				return true;
				
			case "kodi_play_music" :
				Homey.manager('speech-output').say(__("talkback.not_implemented"));
				//Only fire 1 trigger
				return true;
		}	
	});
		
	callback(null, true);
}

/*******************
	FLOW ACTIONS
********************/
function onFlowActionPlayMovieKodi(callback, args){
	Homey.log("onFlowActionPlayMovieKodi", args);	
	searchAndPlayMovie(args.id, args.movie_title)
		.then(callback)
		.catch(console.error);
}

module.exports.init = init;

/*******************
	COMMON FUNCTIONS
********************/
function searchAndPlayMovie(device, movieTitle){
	return new Promise(function(succesFn, errorFn){

		Homey.log("searchAndPlayMovie", device, movieTitle);
		
		//Get device from driver and play the movie
		var KodiDriver = Homey.manager('drivers').getDriver('kodi');
		
		KodiDriver.searchMovie(device, movieTitle)
			.then(
				//Play movie and trigger flows
				function(movie)
				{
					KodiDriver.playMovie(device,movie.movieid)
						.then(succesFn)
						.catch(errorFn);
					Homey.log('Triggering flow kodi_movie_start, movie_title: ',movie.label);
					//Trigger flows and pass variables
					Homey.manager('flow').trigger('kodi_movie_start',{
						movie_title: movie.label
					});
				}
			)
			.catch(errorFn);		
	});
}
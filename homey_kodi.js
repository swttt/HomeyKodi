"use strict"

//Require dependencies
var Xbmc = require('xbmc-listener');
var Fuse = require('fuse.js');

//Declare manager
var HomeyKodi;

//Constuctor for HomeyKodi
module.exports = HomeyKodi = function(kodiConf)
{
	Xbmc = new Xbmc(kodiConf); 
};

/*************************************************
****	START WRAPPER OF KODI METHODS		 *****
*************************************************/
//Send messages to Kodi
HomeyKodi.prototype.message = function(message, duration)
{
	//Parameter defaults
	duration = duration || 5000;
	
	Xbmc.notify(message, duration, function (error, result) {
	  if (error) {
		return console.log(error);
	  }
	});
}

/////////////////////////////
//	SEARCH FUNCTIONS
/////////////////////////////

//Search for movies
// Returns the JSON response of the movie 
HomeyKodi.prototype.searchMovie = function(movieTitle)
{
	return new Promise(function(succesFn, errorFn){
		//Kodi API: VideoLibrary.GetMovies
		Xbmc.method('VideoLibrary.GetMovies', '', 
			function (error, result) {
				if (error) {
					return errorFn(error);
				}			
								
				//Parse the result and look for movieTitle
				// Set option for fuzzy search
				var options = {
				  caseSensitive: false, //Don't care about case whenever we're searching titles by speech
				  includeScore: false, //Don't need the score, the first item has the highest probability
				  shouldSort: true, //Should be true, since we want result[0] to be the item with the highest probability
				  threshold: 0.4, // 0 = perfect match, 1 = match all.. 
				  location: 0,
				  distance: 100,
				  maxPatternLength: 64,
				  keys: ["label"]
				};
				// Create the fuzzy search object	
				var fuse = new Fuse(result.movies, options); 				
				var searchResult = fuse.search(movieTitle.trim());				
				//If there's a result				
				if(searchResult.length > 0)
				{					
					succesFn(searchResult[0]); //Always use searchResult[0], this is the result with the highest probability (setting shouldSort = true)					
				}
				//Movie not found
				else 
				{
					errorFn("Movie not found");
				}				
			});	
	});
}

//Search for TV shows
//
HomeyKodi.prototype.searchTVShow = function(tvShow)
{
	return new Promise(function(succesFn, errorFn){
		//Kodi API: VideoLibrary.GetTVShows
		Xbmc.method('VideoLibrary.GetTVShows', '', 
			function (error, result) {
				if (error) {
					return errorFn(error);
				}			
								
				//Parse the result and look for showTitle				
				// Set option for fuzzy search
				var options = {
				  caseSensitive: false, //Don't care about case whenever we're searching titles by speech
				  includeScore: false, //Don't need the score, the first item has the highest probability
				  shouldSort: true, //Should be true, since we want result[0] to be the item with the highest probability
				  threshold: 0.4, // 0 = perfect match, 1 = match all.. 
				  location: 0,
				  distance: 100,
				  maxPatternLength: 64,
				  keys: ["label"]
				};
				// Create the fuzzy search object		
				var fuse = new Fuse(result.tvshows, options); 				
				var searchResult = fuse.search(tvShow.trim());				
				
				//If there's a result				
				if(searchResult.length > 0)
				{					
					succesFn(searchResult[0]); //Always use searchResult[0], this is the result with the highest probability (setting shouldSort = true)					
				}
				//TV Show not found
				else 
				{
					errorFn("TV Show not found");
				}				
			});	
	});
}

//Search for an episode


/////////////////////////////
//	PLAY FUNCTIONS
/////////////////////////////
HomeyKodi.prototype.playMovie = function(movieId)
{
	
	//Kodi API: Player.Open	
	return new Promise(function(succesFn, errorFn){					
					
		//Build the parameter to play a movie
		var param = {
			item : {
				movieid: movieId
			}
		};						
		
		Xbmc.method('Player.Open',param,function(error, result){
			if (error) {
				return errorFn(error);
			}
			
			//Movie started succesfully
			succesFn("Playing movie " + movieId);
		});
			
	});			
}
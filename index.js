const rp = require('request-promise');
const cheerio = require('cheerio');

//url needs to be input (todo when in API)
var url = 'https://classics.autotrader.com/classic-cars/1972/datsun/240z/100975163';
var jsonData = {};
var images = [];

const options = {
	uri: url,
	transform: function(body) {
		return cheerio.load(body);
	}

};

rp(options)
	.then(($) => {
		var listingTitle = $(".title-gray .container .row .col-6 h1").text();
		var segmentedTitle = listingTitle.split(" ");
		var yearString = segmentedTitle[0];
		jsonData['year'] = parseInt(yearString);
		jsonData['model'] = segmentedTitle[2];

		var priceString = $("h2.price").text();
		jsonData['price'] = parseInt(priceString.replace( /(\D|,)/g, ''));
		
		var locationString = $("#back-to-top > div.page-content > div.page-content > div.section.front.tight-top > div.container > div:nth-child(2) > div.col-8 > div:nth-child(3) > div.mbl-expand-content.padded > div > div > small").text();
		var locationSegmented = locationString.split(", ");
		var cityName = toTitleCase(locationSegmented[0]);
		var stateCode = locationSegmented[1];
		jsonData['location'] = cityName + ", " + stateCode;

		$("ul.specs-list li h4").each(function() {
			var headingText = $(this).text();
			var parentOfCurr = $(this).parent();

			if(headingText == "Transmission") {
				parentOfCurr.find("h4").remove(); 
				jsonData['transmission'] = parentOfCurr.text();
			} else if(headingText == "Exterior Color") {
				parentOfCurr.find("h4").remove(); 
				jsonData['color'] = parentOfCurr.text();
			}
		});

		var descriptionInit = $("#back-to-top > div.page-content > div.page-content > div.section.front.tight-top > div.container > div:nth-child(2) > div.col-8 > div:nth-child(3) > div.mbl-expand-content.padded > div");
		descriptionInit.find("div.h6").remove();
		jsonData['description'] = descriptionInit.text().trim();
		
		var counter = 0;

		$("#thumbnail-slideshow li").each(function() {
			if(counter < 4) {
				var imgUrl = encodeURI($(this).find('a img').attr('src'));

				var rU1 = removeURLParameter(imgUrl, 'r');
				var rU2 = removeURLParameter(rU1, 'w');
				var rU3 = removeURLParameter(rU2, 'h');
				var finalImgUrl = removeURLParameter(rU3, 's');

				images.push(finalImgUrl);
				jsonData['images'] = images;
			}

			counter++;
		});

		var jsonString = JSON.stringify(jsonData);
		console.log(jsonString);

	})

	.catch((err) => {
		console.log(err);
	});

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

/* From StackOverflow: https://stackoverflow.com/questions/1634748/how-can-i-delete-a-query-string-parameter-in-javascript */
function removeURLParameter(url, parameter) {
    //prefer to use l.search if you have a location/link object
    var urlparts= url.split('?');   
    if (urlparts.length>=2) {

        var prefix= encodeURIComponent(parameter)+'=';
        var pars= urlparts[1].split(/[&;]/g);

        //reverse iteration as may be destructive
        for (var i= pars.length; i-- > 0;) {    
            //idiom for string.startsWith
            if (pars[i].lastIndexOf(prefix, 0) !== -1) {  
                pars.splice(i, 1);
            }
        }

        url= urlparts[0] + (pars.length > 0 ? '?' + pars.join('&') : "");
        return url;
    } else {
        return url;
    }
}
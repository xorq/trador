var FOLDER = '/Users/dandan/Documents/Projects/trador'

var request = require('request');
var _ = require('underscore');
var express = require('express');
var app = express();
var $ = require('jquery');
var Backbone = require('backbone');
var rp = require('request-promise');


app.get('/thbusd',function(req, res){
	request.get('http://apilayer.net/api/live?access_key=c60f3e8c41a9313bc52f1279d9fa9cb6&currencies=THB&source=USD&format=1', function(error, data){
		res.send(data.body)
	})
})

app.get('/underscore.js', function(req, res){
	res.sendFile( FOLDER + '/node_modules/underscore/underscore-min.js')
})

app.get('/backbone.js', function(req, res){
	res.sendFile( FOLDER + '/node_modules/backbone/backbone-min.js')
})

app.get('/jquery.js', function(req, res){
	res.sendFile( FOLDER + '/node_modules/jquery/dist/jquery.min.js')
})

app.get('/trador.js', function(req,res){
	res.sendFile( FOLDER + '/trador.js')
})

app.get('/', function(req, res){
	res.sendFile( FOLDER + '/index.html')
})


var updateTHBUSD = function(){
	return $.getJSON('/thbusd', function(a,b){
	})
}


var quotation = Backbone.Model.extend({
	defaults: {
		rates : null,
		BXOrderbook: null,
		BFXOrderbook: null,
	},
	initialize : function(){
		//On production change this to : this.updateRate();
		this.set('rates', {usd: 1, thb: 35.16});
		this.updateBX();
		this.updateBFX();
	},
	updateRate : function(){
		var master = this;
		updateTHBUSD().done(function(a){
			var newRates = master.get('rates');
			newRates.thb = a.quotes.USDTHB;
			master.set('rates', newRates);
		})
	},
	updateBX : function(){
		var master = this;
		return rp.get('https://bx.in.th/api/orderbook/?pairing=1', function(error, data){
			master.set('BXOrderbook', JSON.parse(data.body))
		})

	},
	updateBFX : function(){
		var master = this;
		var payload = {
			"limit_bids": 4,
			"limit_asks": 4,
			"group": 0
		};
		var options = {
			url: 'https://api.bitfinex.com/v1/book/BTCUSD',
			qs: payload
		};
		return rp.get(options, function(error, response, body) {
			master.set('BFXOrderbook', JSON.parse(body));
		});
	},
	getBXBest : function(bidAsk, currency){
		var master = this;
		var rate = currency == 'USD' ? master.get('rates').thb : currency == 'THB' ? 1 : null;
		if (rate == null) {
			throw 'you must specify a currency'
		}
		var bx = master.get('BXOrderbook')
		return {
			Bprice: bx[bidAsk][0][0] / rate,
			Bquantity: bx[bidAsk][0][1]
		}
	},
	getBFXBest: function(bidAsk){
		var master = this;
		var bfx = master.get('BFXOrderbook')
		if (bfx[bidAsk] && bfx[bidAsk][0] && bfx[bidAsk][0].price && bfx[bidAsk][0].amount){
			return {
				Bprice: bfx[bidAsk][0].price * 1,
				Bquantity: bfx[bidAsk][0].amount * 1
			}	
		} else {
			return {
				Bprice: null,
				Bquantity: null
			}
		}
	},
	opportunityBXBFX: function(){
		return {
			oppBuyBX : Math.round(10 * (this.getBFXBest('bids').Bprice - this.getBXBest('asks', 'USD').Bprice)) / 10,
			oppBuyBFX : Math.round(10 * (this.getBXBest('bids', 'USD').Bprice - this.getBFXBest('asks').Bprice)) / 10,
			buyBXat : this.getBXBest('asks', 'THB').Bprice,
			sellBFXat : this.getBFXBest('bids', 'USD').Bprice,
			buyBFXat : this.getBFXBest('asks', 'USD').Bprice,
			sellBXat : this.getBXBest('bids', 'THB').Bprice
		}
	},
	refreshData: function(){
		var master = this;
		master.updateBX().then(function(){
			master.updateBFX().then(function(a){
				console.log('updated')
				//console.log(master.opportunityBXBFX())
			})
		})
	}
})

var loop = function(quote){
	setInterval(function(){
		console.log('refreshed')
		quote.refreshData()	
	}, 60000)
}



var quote = new quotation();
quote.refreshData();

loop(quote);

app.get('/refreshData', function(req, res){
	quote.refreshData();
	//res.send(quote.opportunityBXBFX())
})

app.get('/checkopp', function(req, res){
	res.send(quote.opportunityBXBFX())
})

app.listen(9000);
console.log('listening on port 9000')



var request = require('request');
var _ = require('underscore');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var sha256 = require('js-sha256')

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var $ = require('jquery');
var Backbone = require('backbone');
var rp = require('request-promise');
//var PushBullet = require('pushbullet');
// pushbullet access token o.yDQLdbO495JpGdV3aQPVprmv4dzkZf3S
//var pusher = new PushBullet('o.yDQLdbO495JpGdV3aQPVprmv4dzkZf3S');
var subscribers = [
	{name: 'dandan', email: 'xorque@gmail.com', alertes: [
		{symbol: 'BX', level: 15, supinf: '>'}
	]},
	{name: 'ygarnir', email: 'ygarnir2@gmail.com', alertes: [
		{symbol: 'BX', level: 20, supinf: '>'}
	]}
];
var bitfinex = require('bitfinex');
var request = require('request');
var mysql = require('mysql');



var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport('smtps://xorque%40gmail.com:jdhtjyvfxsfyrixv@smtp.gmail.com');

var sendMail = function(address, title, textMessage, htmlMessage, callback){
	var mailOptions = {
		from: '"xorq EC2" <xorque@gmail.com>', // sender address 
		to: address, // list of receivers 
		subject: title, // Subject line 
		text: textMessage, // plaintext body 
		html: htmlMessage // html body 
	};
	// send mail with defined transport object 
	transporter.sendMail(mailOptions, function(error, info){
		if(error){
			return console.log(error);
		}
		console.log('Message sent: ' + info.response);
		callback();
	});
}


//mail trador jdhtjyvfxsfyrixv

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '123123',
  database : 'trador'
});
app.use(cookieParser('jean a de longues moustaches'));
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/userdata', function(req, res){
	res.send(req.signedCookies)
})

var round2 = function(n){
	return Math.round(n*100)/100
}

app.get('/alertes', function(req, res){
	connection.query('SELECT * FROM alertes WHERE user_id = ANY (SELECT id FROM users WHERE user_id="' + req.signedCookies.id + '"', function(err, rows){
		console.log(rows);
		/*res.send( 
			_.map(rows, function(d){
				return {bxLevel : d.}
			}
		)*/
	})
})

app.get('/underscore.js', function(req, res){
	res.sendFile( __dirname + '/node_modules/underscore/underscore-min.js')
});
app.get('/backbone.js', function(req, res){
	res.sendFile( __dirname + '/node_modules/backbone/backbone-min.js')
});
app.get('/jquery.js', function(req, res){
	res.sendFile( __dirname + '/node_modules/jquery/dist/jquery.min.js')
});
app.get('/trador.js', function(req,res){
	res.sendFile( __dirname + '/trador.js')
});
app.get('/sha256.js', function(req,res){
	res.sendFile( __dirname + '/sha256.js')
});
app.get('/socket.io.js', function(req,res){
	res.sendFile( __dirname + '/node_modules/socket.io-client/socket.io.js')
});
app.get('/datatables.css', function(req,res){
	res.sendFile(__dirname + '/datatables.css')
});
app.get('/datatables.js', function(req,res){
	res.sendFile(__dirname + '/datatables.js')
});
app.get('/', function(req, res){
	res.sendFile( __dirname + '/index.html')
});
app.get('/index.html', function(req, res){
	res.sendFile( __dirname + '/index.html')
});
app.get('/getemailconf', function(req, res){

});

app.post('/userregister', function(req, res){
	var q = 'SELECT * FROM users WHERE email="' + req.body.email + '";';
	console.log(q)
	connection.query(q, function(err, rows){
		console.log('err ',err);
		console.log('rows' , rows)
		if (!rows || !rows.length){
			if (req.body.passhash){
				var confNumber = sha256('les poils du genoux de la duchesse' + req.body.email + req.body.passhash).slice(0,20);
				var query = 'INSERT INTO users (email, passhash, confcode) VALUES ("' + req.body.email + '","' + req.body.passhash + '","' + confNumber + '")'
				connection.query(query, function(err2){
					sendMail(req.body.email, 'Password confirmation for xorq', '', '<a href="http://localhost:9000/verify?email=' + req.body.email + '&conf=' + confNumber + '">Click to confirm')
					res.send('{"id":0, "description":"user added and email sent"}')
				})
			}
		} else if (rows[0] && rows[0].passhash == req.body.passhash){
			console.log(rows)
			if (rows && rows[0] && rows[0].verified == 1){
				//res.cookie('email', req.body.email, {signed: true});
				res.cookie('email', req.body.email, {signed: true});
				res.cookie('id', rows[0].id, {signed: true});
				res.send('{"id":2, "description": "user logged in"}');
				connection.query('UPDATE users SET email_sent=CURDATE() WHERE email="' + req.body.email + '"')
			} else {
				res.send('{"id":1, "description": "email not confirmed"}')
			}
		}
	})
})

app.get('/verify', function(req, res){
	var email = req.query['email'];
	var verNum = req.query['conf'];
	var query = 'UPDATE users SET verified=true WHERE (email = "' + email + '") AND (confcode="' + verNum + '")';
	connection.query(query, function(err, result){
		res.redirect('/index.html?verifieduser=' + email)
	})
})


io.on('connection', function(socket){
});

var quotation = Backbone.Model.extend({
	defaults: {
		rates : null,
		BXOrderbook: null,
		BFXOrderbook: null,
	},
	initialize : function(){
		//On production change this to : this.updateRate();
		this.set('rates', {usd: 1, thb: 35.16});
		this.updateRate();
		this.updateBX();
		this.updateBFX();
	},
	updateRate : function(){
		var master = this;
		return rp.get('http://apilayer.net/api/live?access_key=c60f3e8c41a9313bc52f1279d9fa9cb6&currencies=THB&source=USD&format=1', function(error, data){
			var newRates = master.get('rates');
			newRates.thb = JSON.parse(data.body).quotes.USDTHB;
			master.set('rates', newRates);
		});
			/*var newRates = master.get('rates');
			newRates.thb = 35;
			master.set('rates', newRates);*/
	},
	updateBX : function(then){
		var master = this;
		return rp.get('https://bx.in.th/api/orderbook/?pairing=1', function(error, data){
				master.set('BXOrderbook', JSON.parse(data.body));
				if (typeof then == 'function') {
					then();
				}
			})
		
	},
	updateBFX : function(then){
		var master = this;
		var webSocket = require('ws');
		var w = new webSocket("wss://api2.bitfinex.com:3000/ws");
		w.onmessage = function(msg) {
			var msg = JSON.parse(msg.data);
			if (msg && msg.length > 4) {
				var orderbook = {
					bids:[{price: msg[7], amount:msg[8]}],
					asks:[{price: msg[3], amount:msg[4]}]
				}
			
				master.set('BFXOrderbook', orderbook)
			}	
			if (typeof then == 'function') {
				then();
			}
		};
		w.on('open', function(){
			w.send(JSON.stringify({
			    "event": "subscribe",
			    "channel": "ticker",
			    "pair": "BTCUSD"
			}))
		})
	},
	getBXBest : function(bidAsk, currency){
		var master = this;
		var rate = currency == 'USD' ? master.get('rates').thb : currency == 'THB' ? 1 : null;
		if (rate == null) {
			console.log('you must sepcify a currency')
			return
		}
		var bx = master.get('BXOrderbook')
		return {
			Bprice: bx[bidAsk] && bx[bidAsk][0][0] / rate,
			Bquantity: bx[bidAsk] && bx[bidAsk][0][1]
		}
	},
	getBFXBest: function(bidAsk, currency){
		var master = this;
		var bfx = master.get('BFXOrderbook');
		var rate = currency == 'THB' ? master.get('rates').thb : currency == 'USD' ? 1 : null;
		if (bfx[bidAsk] && bfx[bidAsk][0] && bfx[bidAsk][0].price && bfx[bidAsk][0].amount){
			return {
				Bprice: bfx[bidAsk][0].price * rate,
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
			oppBuyBX : round2(this.getBFXBest('bids', 'USD').Bprice - this.getBXBest('asks', 'USD').Bprice),
			oppBuyBFX : round2(this.getBXBest('bids', 'USD').Bprice - this.getBFXBest('asks', 'USD').Bprice),
			buyBXat : round2(this.getBXBest('asks', 'THB').Bprice),
			sellBFXat : round2(this.getBFXBest('bids', 'USD').Bprice),
			buyBFXat : round2(this.getBFXBest('asks', 'USD').Bprice),
			sellBXat : round2(this.getBXBest('bids', 'THB').Bprice)
		}
	},
	refreshData: function(then){
		var master = this;
		return master.updateBX(then)
	}
});

var loop = function(quote, subscribers){
	var callback = function(){
		io.emit('new quote', '')
		var opp = quote.opportunityBXBFX();
		var maxOpp = Math.max(opp.oppBuyBX, opp.oppBuyBFX);
			var sentence = [
				'Buy', 
				opp.oppBuyBFX > opp.oppBuyBFX ? 'BFX' : 'BX',
				'at',
				opp.oppBuyBFX > opp.oppBuyBFX ? opp.buyBFXat : opp.buyBXat,
				'SELL',
				opp.oppBuyBFX > opp.oppBuyBFX ? 'BX' : 'BFX',
				'at',
				opp.oppBuyBFX > opp.oppBuyBFX ? opp.sellBXat : opp.sellBFXat,
				'Profit',
				maxOpp,
				'$'
			].join(' ');
		var now = new Date();
		_.each(subscribers, function(subscribee){
			if (maxOpp > subscribee.alertLevel) {
				var timeDiff = now - (subscribee.alertTime || 0)
				if (timeDiff > 3600000){
					sendMail(subscribee.address, 'ALERTE', '', '<b>' +  + '</b>', function(){console.log('email sent to ' + subscriber.address)})
				}
			}
		})

	}
	quote.updateBFX(function(){
		io.emit('new quote', '')
	});
	setInterval(function(){
		quote.refreshData(callback)
	}, 30000)
};

var checkAlert = function(subscribers, message){

}
			/*

			pusher.note(subscribee.email, 'Alert for ' + subscribee.name, message, function(error, response){
				console.log('alert for ' + subscribee.name + ' sent')
			})
			subscribee['alertTime'] = now;
		}
	})
}*/

app.get('/refreshData', function(req, res){
	quote.refreshData();
	res.send(quote.opportunityBXBFX())
})

app.get('/checkopp', function(req, res){
	res.send(quote.opportunityBXBFX())
})

app.get('/rates', function(req, res){
	res.send(quote.get('rates'))
})

app.get('/deleteaccount', function(req, res){
	var query = 'DELETE FROM users WHERE id="' + req.signedCookies.id + '"';
	console.log(query);
	connection.query(query, function(){
		res.send('deleted')
	})
})

var quote = new quotation();
quote.refreshData();
quote.updateRate();
setInterval(quote.updateRate, 86400000)
loop(quote, subscribers);

http.listen(9000, function(){
	console.log('listening 9000')
})



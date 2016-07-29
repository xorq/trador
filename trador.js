var opportunities = Backbone.Model.extend({
	initialize: function(){
		return this.update();
	},
	update: function(){
		var master = this;
		return $.getJSON('/checkOpp', function(a){
			master.set(a)
		})
	}
});

var viewOpps = Backbone.View.extend({
	model: opportunities,
	template: _.template('\
		<table id="opps" class="compact stripe oops">\
			<thead>\
				<tr>\
					<th>Operation</th>\
					<th>Profit</th>\
					<th>Achat</th>\
					<th>Vente</th>\
				</tr>\
			</thead>\
			<tbody>\
				<tr>\
					<td>Buy BX</td>\
					<td><%=oppBuyBX%></td>\
					<td><%=buyBXat%></td>\
					<td><%=sellBFXat%></td>\
				</tr>\
				<tr>\
					<td>Buy BFX</td>\
					<td><%=oppBuyBFX%></td>\
					<td><%=buyBFXat%></td>\
					<td><%=sellBXat%></td>\
				</tr>\
			</tbody>\
		</table>\
	'),
	initialize: function(){
		
	},
	render: function(){
		var master = this;
		this.$el.html(this.template(this.model.toJSON()));
		$('#opps', master.$el).DataTable({
			"paging":     false,
			"ordering":   false,
			"info":       false,
			"searching":  false
		});
		return this
	}
})



var user = Backbone.Model.extend({
	default: {
		email: null
	},
	initialize: function(){
		return this.getEmail();
	},
	getEmail: function(){
		var master = this;
		return $.getJSON('/userdata', function(userData){
			master.set('email', userData.email);
		})
	},
	email: function(){
		return this.get('email');
	}
})

var loginView = Backbone.View.extend({
	template: _.template('\
		<%=!email ? "<input id=email>email</input>\
		<input id=password>Password</input>\
		<button id=submit>Submit</button>" : \
		"<button id=logout>Log Out</button><button id=delete-account>Delete Account</button>"%> \
		<b>Email: <%=email%>\
		'),
	events: {
		'click #submit' : 'submit',
		'click #logout' : 'logOut',
		'click #delete-account' : 'deleteAccount',
	},
	initialize: function(){
		console.log(this.model)
		var verifiedUser = window.location.search.split('verifieduser=') && window.location.search.split('verifieduser=')[1] && window.location.search.split('verifieduser=')[1].split('&')[0];
		if (verifiedUser){
			window.alert('email verified, please login');
			window.location = ('/');
		}
	},
	render: function(){
		this.$el.html(this.template({email: this.model.email()}));
		return this
	},
	submit: function(){
		var master = this;
		$.post('/userregister', {email:$('#email').val(), passhash: sha256($('#password').val() + $('#email').val())}).done(function(answer){
			var answer = JSON.parse(answer).id;
			if (answer == 2){
				master.model.getEmail().done(function(){master.render()})
			} else if (answer == 0){
				window.alert('Email sent, please confirm email');
			} else if (answer == 1){
				window.alert('You haven\'t confirmed your email yet')
			}
		})
	},
	logOut: function(){
		document.cookie = 'email=; id=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		document.signedCookies = 'email=; id=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		$.get('/logout', function(){
			location.reload();
		})
	},
	deleteAccount: function(){
		var master = this;
		var a = window.confirm('Are you sure to want to delete your account?');
		if (a) {
			$.get('/deleteaccount', function(result){
				if (result == 'deleted') {
					master.logOut();
					master.render();
				}
			})
		}
	}
})


var alertesModel = Backbone.Model.extend({
	default:{
		alertes : {bfxLevel: 100, bxLevel: 100, bfxDirection: 0, bxDirection: 0}
	},
	getAlertes: function(){
		var master = this;
		return $.getJSON('/alertes', function(result){
			master.set('alertes', result)
		})
	}
});

var alertLineModel = Backbone.Model.extend({
	default:{
		market: null,
		level: null, 
		direction: null,
	}, 
	setData: function(data){
		this.market = data.market;
		this.level = data.level;
		this.direction = data.direction ? 1 : -1;
	},
	getData: function(){
		return {
			market: this.get('market'),
			level: this.get('level'),
			direction: this.get('direction')
		}
	}
})

var alertLineView = Backbone.View.extend({
	template: _.template('\
		<div class=row1 col-xs-12>Alerte sur <%=market%>  si <%=direction ? ">" : "<"%> à <%= level %> </div>\
		<div class=row1 col-xs-3><button>Edit</button></div>\
		'),
	render: function(){
		this.$el.html(this.template(this.model.getData()));
		return this;
	}
})

var alertesView = Backbone.View.extend({
	template: _.template('\
		<div id=alertes></div>\
	'),
	render: function(){
		var master = this;
		this.$el.html(this.template({
			alertes: this.model.get('alertes')
		}));

		var alertes = master.model.get('alertes');

		
		var alerteLineBXModel = new alertLineModel({market: 'BX', level: alertes.bxLevel, direction: alertes.bxDirection})
		var alerteLineBFXModel = new alertLineModel({market: 'BFX', level: alertes.bfxLevel, direction: alertes.bfxDirection})

		var alerteLineViewBX = new alertLineView({model:alerteLineBXModel});
		var alerteLineViewBFX = new alertLineView({model:alerteLineBFXModel});

		alerteLineViewBX.render().$el.appendTo('#alertes', this.$el);
		alerteLineViewBFX.render().$el.appendTo('#alertes', this.$el);

		return this
	}
})



var currentUser = new user();
var userView = new loginView({model: currentUser});

currentUser.getEmail().done(function(){
	userView.render().$el.appendTo($('#user_pannel'))
});

var oppModel = new opportunities();
var socket = io();
var oppView = new viewOpps({model:oppModel})


var refresh = function(){
	oppModel.update();

}
oppModel.on('change', function(){
	$('#info').empty();
	oppView.render().$el.appendTo($('#info'));
});

oppModel.initialize().done(function(){
	refresh();
})


var alertesModel1 = new alertesModel();
var alertesView = new alertesView({model:alertesModel1});

alertesModel1.getAlertes().done(function(a){
	$('#alertes').empty();
	alertesView.render().$el.appendTo('#alertes');
	alertesView.delegateEvents();
})


socket.on('new quote', function(msg){
	refresh()
})

alertesModel1.on('change', function(){
	$('#alertes').empty();
	alertesView.render().$el.appendTo('#alertes');
})

currentUser.on('change', function(){
	alertesModel1.getAlertes();
})

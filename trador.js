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
				master.model.getEmail().done(function(){master.model.trigger('change');})
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
		level: null
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
		<div class=inline>Alerte sur <%=market%>  si <%=direction ? ">" : "<"%> à <%= level %> </div>\
		<div class=inline><button id=edit>Edit</button></div>\
		'),
	events: {
		'click #edit' : 'edit'
	},
	edit: function(){
		var master = this;
		var data = this.model.getData();
		var newLevel = window.prompt('New Level?');
		if (newLevel){
			$.post('/modifyalert', {market: data.market, level: newLevel, direction: newLevel < 0 ? 0 : 1}).done(function(){
				master.trigger('change');
			})
		}
	},
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

		
		var alerteLineBXModel = new alertLineModel({market: 'BX', level: alertes && alertes.bxLevel, direction: alertes && alertes.bxDirection})
		var alerteLineBFXModel = new alertLineModel({market: 'BFX', level:  alertes && alertes.bfxLevel, direction: alertes && alertes.bfxDirection})

		var alerteLineViewBX = new alertLineView({model:alerteLineBXModel});
		var alerteLineViewBFX = new alertLineView({model:alerteLineBFXModel});

		alerteLineViewBX.render().$el.appendTo('#alertes', this.$el);
		alerteLineViewBFX.render().$el.appendTo('#alertes', this.$el);

		var updateLines = function(){
			$('#alertes').empty();
			master.model.getAlertes().done(function(a){
				alerteLineBXModel.setData({market: 'BX', level: alertes.bxLevel, direction: alertes.bxDirection})
			})
		}

		this.listenTo(alerteLineViewBX, 'change', function(){
			updateLines()
		})
		this.listenTo(alerteLineViewBFX, 'change', function(){
			updateLines()
		})
		
		return this
	}
})



var currentUser = new user();
var userView = new loginView({model: currentUser});

var alertesModel1 = new alertesModel();
var alertesView1 = new alertesView({model:alertesModel1});

var makeAlertes = function(){
	alertesModel1.getAlertes().done(function(a){
		$('#alertes').empty();
		alertesView1.render().$el.appendTo('#alertes');
		alertesView1.delegateEvents();
	})
}

var showUser = function(){
	currentUser.getEmail().done(function(a){
		userView.render().$el.appendTo($('#user_pannel'))
		if (a.email){
			makeAlertes();
		}
		currentUser.on('change', showUser);
	});
}

showUser();

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

alertesModel1.on('change', function(){
	makeAlertes();
})

currentUser.on('change', function(){
	alertesModel1.getAlertes()
})


socket.on('new quote', function(msg){
	refresh()
})




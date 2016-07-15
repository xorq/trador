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
		<table id="opps" class="compact stripe">\
			<thead>\
				<tr>\
					<th>Operation</th>\
					<th>Profit $</th>\
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

var oppModel = new opportunities();
oppModel.initialize().done(function(){
	var oppView = new viewOpps({model:oppModel})
	oppView.render().$el.appendTo($('#info'))

})
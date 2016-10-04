var owner = "tungnk1993";
var repo = "scrapy";
var url = "http://api.github.com/repos/" + owner + "/" + repo + "/stats/contributors";
var limit = 10;

function getEdit(obj, editType) {
	var sum = 0;
	for (var i = 0; i < obj.weeks.length; ++i) {
		sum += obj.weeks[i][editType];
	}
	return sum;
}

function getAuthorUrl(author) {
	if (author.html_url) {
		return "<a href=" + author.html_url + ">"  + author.login + "</a>"; 
	} else {
		return "Others"
	}
}

function stackedChart(data) {
	var editTypes = ["addition", "deletion"];

	var margin = {top: 20, right: 100, bottom: 30, left: 20},
		width = 960 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;

	var x = d3.scale.ordinal()
		.rangeRoundBands([0, width]);

	var y = d3.scale.linear()
		.rangeRound([height, 0]);

	var z = d3.scale.ordinal()
		.range(["#6cc644", "#bd2c00"]);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("right");

	d3.select("body")
		.append("h3")
		.text("List of contributors by additions and deletions")

	var svg = d3.select("body").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var layers = d3.layout.stack()(editTypes.map(function(e) {
		return data.map(function(d) {
			return { x: d.author.login, y: d[e] };
		});
	}));

	x.domain(layers[0].map(function(d) { return d.x; }));
	y.domain([0, d3.max(layers[layers.length - 1], function(d) { return d.y0 + d.y; })]).nice();

	var layer = svg.selectAll(".layer")
		.data(layers)
		.enter().append("g")
		.attr("class", "layer")
		.style("fill", function(d, i) { return z(i); });

	layer.selectAll("rect")
		.data(function(d) { return d; })
		.enter().append("rect")
		.attr("x", function(d) { return x(d.x); })
		.attr("y", function(d) { return y(d.y + d.y0); })
		.attr("height", function(d) { return y(d.y0) - y(d.y + d.y0); })
		.attr("width", x.rangeBand() - 1);

	svg.append("g")
		.attr("class", "axis axis--x")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

	svg.append("g")
		.attr("class", "axis axis--y")
		.attr("transform", "translate(" + width + ",0)")
		.call(yAxis);

	svg.select(".axis--x").selectAll("text")
}

function query() {
	d3.json(url, function (error, data) {
		if (error) return query();
		data.sort(function(a, b){ return b.total - a.total });
		var others = null;
		for (var i = 0; i < data.length; ++i) {
			var obj = data[i];
			if (i > limit) {
				if (!others) {
					others = {
						author: { login: "Others" },
						commit: 0,
						addition: 0,
						deletion: 0
					};
				}
				others.commit += obj.total;
				others.addition += getEdit(obj, "a");
				others.deletion += getEdit(obj, "d");
			} else {
				data[i].commit = obj.total;
				data[i].addition = getEdit(obj, "a");
				data[i].deletion = getEdit(obj, "d");
			}
		}
		data = data.splice(0, limit);
		if (others) {
			data[data.length] = others;
		}
		console.log(data);
		// pieChart(data);
		stackedChart(data);
	});
}

d3.json("");
query();

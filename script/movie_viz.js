(function () {
    var movie_tsv_file = 'data/movie_name_rating_genre.tsv';
    var starYear = 1930;
    var year = 2018;
    var moviesByYearGenre;
    var numberOfMoviesInBar = 5;
    var movieRatingBarHeight = 25;

    // design specific global variables
    var width = 1300
    var height = 3000
    var nodeRadius = 3;

    // svg global variables
    var svg, g, votesDiv;

    d3.tsv(movie_tsv_file).then(function (movies) {
        movies = movies.filter(function (d) {
            return d.genres != "\\N";
        });

        year = +(d3.select("#yearSlider").property('value'));

        console.log(movies);

        var sMovies = movies.filter(function (d) {
            var year = +(d.startYear);
            return year >= starYear;
        });

        setupSVG();
        moviesByYearGenre = d3.group(sMovies, d => +(d.startYear), d => d.genres);
        createDendrogram(moviesByYearGenre.get(year), year);


    });

    d3.select("#yearSlider")
        .on("change", function () {
            year = +(d3.select(this).property('value'));
            //console.log(year);

            d3.select("#yearText").text(year);
            createDendrogram(moviesByYearGenre.get(year), year);
        })

    function setupSVG() {
        // append the svg object to the body of the page
        svg = d3.select("#my_dataviz")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            //.attr("viewBox", [0, 0, 400, 500])
            .append("g")
            .attr("transform", "translate(40,20)");  // bit of margin on the left = 40

        g = svg.append("g")
            .attr("class", "dendro-g")
            .attr("transform", "translate(5,5)");

        votesDiv = d3.select("#my_dataviz")
            .append("div")
            .attr("id", "legend1")
            .attr("class", "legend1");
    }


    function createDendrogram(genreMovies, year) {
        var name = year;
        var children = [];

        var index = 0;

        var maxVote = 0;
        var minVote = Infinity;

        Array.from(genreMovies.keys()).sort().forEach(function (genre) {

            var movies = genreMovies.get(genre);

            movies.sort(function (m1, m2) {
                var rating1 = +(m1.averageRating);
                var rating2 = +(m2.averageRating);
                return rating2 - rating1;
            });

            var topMovies = movies.slice(0, numberOfMoviesInBar);

            maxVote = topMovies.reduce((acc, item) => {
                return Math.max(acc, +(item.numVotes));
            }, maxVote);


            minVote = topMovies.reduce((acc, item) => {
                return Math.min(acc, +(item.numVotes));
            }, minVote);




            //console.log(movies.slice(0, 10));
            var obj = {
                "name" : genre,
                "children": topMovies.map(function (m) {
                    return {
                        "name" : m.primaryTitle,
                        "rating" : m.averageRating,
                        "votes" : +(m.numVotes),
                        "tconst": m.tconst
                    }
                } )
            }

            children.push(obj);
        });

        var colorScale = d3.scaleLinear()
            .domain([minVote, maxVote])
            .range("white", "blue");

        var mostVoteColorScale = d3.scaleSequential(d3.interpolateYlGn)
            .domain([minVote, maxVote]);


        //console.log(mostVotedMovie);

        var dendogramData = {
            "name": year,
            "children": children
        };

        g.html("");


        var cluster = d3.cluster()
            .size([height, width - 500]);  // 500 is the margin I will have on the right side

        // Give the data to this cluster layout:
        var root = d3.hierarchy(dendogramData, function(d) {
            return d.children;
        });


        cluster(root);

        // Add the links between nodes:
        var link = g.selectAll('.d-link')
            .data( root.descendants().slice(1) );

        link.enter()
            .append('path')
            .merge(link)
            .attr('class', 'd-link')
            .attr("d", function(d) {
                return "M" + (d.y - nodeRadius) + "," + (d.x)
                    + "C" + (d.parent.y + 100) + "," + d.x
                    + " " + (d.parent.y + 150) + "," + d.parent.x
                    + " " + (d.parent.y + nodeRadius) + "," + d.parent.x;
            })
            .style("fill", 'none')
            .attr("stroke", '#ccc');

        link.exit().remove();


        // Add a circle for each node.
        var node = g.selectAll(".node")
            .data(root.descendants());

        node.enter().append("g")
            .merge(node)
            .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });


        node.exit().remove();

        var circle = g.selectAll(".circle").data(root.descendants());

        circle.enter()
            .append("circle")
            .merge(circle)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
            .attr("class", "circle")
            .attr("r", 3);

        circle.exit().remove();

        //console.log(circle);


        // Setup G for every leaf datum.
        g.selectAll(".node--leaf").selectAll("g.node--leaf-g").remove();

        var leafNodeG = g.selectAll(".node--leaf")
            .append("g")
            .attr("class", "node--leaf-g")
            .attr("transform", "translate(" + 8 + "," + -10 + ")");

        var xScale =  d3.scaleLinear()
            .domain([2.5, 10.0])
            .range([0, 450]);

        var xAxis = d3.axisTop()
            .scale(xScale)
            .ticks(5)
            .tickFormat(formatSkillPoints);

        leafNodeG.append("rect")
            .attr("class","shadow")
            .style("fill", function (d) {
                //console.log(d.data.votes);
                var value = d.data.votes / maxVote; // normalizing
                return mostVoteColorScale(d.data.votes);
                //return d3.interpolateYlGn(value);
            })
            .attr("height", movieRatingBarHeight)
            //.attr("rx", 2)
            //.attr("ry", 2)
            //.attr("stroke", "black")
            //.attr("stroke-width", "0.5px")
            .transition()
            .duration(300)
            .attr("width", function (d) {
                return xScale(d.data.rating);
            });


        leafNodeG.append("line")
            .attr("class", "right-line")
            .attr("x1", function (d) {
                return xScale(d.data.rating);
            })
            .attr("y1", 0)
            .attr("x2", function (d) {
                return xScale(d.data.rating);
            })
            .attr("y2", movieRatingBarHeight)
            .style("stroke", "black")
            .style("stroke-dasharray", ("2, 3"));





        leafNodeG.append("svg:a")
            .attr("xlink:href", function(d){
                return "https://www.imdb.com/title/" + d.data.tconst;
            })
            .attr("xlink:target", "_blank")
            .append("text")
            .attr("dy", 19.5)
            .attr("x", 8)
            .style("text-anchor", "start")
            .text(function (d) {
                return d.data.name;
            })
            .attr("font-weight", "bold")
            .style("fill", "#b84774");


        // Write down text for every parent datum
        var internalNode = g.selectAll(".node--internal");

        internalNode.selectAll("text.year-genre-text").remove();

        internalNode.append("text")
            .attr("class", "year-genre-text")
            .attr("y", -10)
            .style("text-anchor", "middle")
            .text(function (d) {
                return d.data.name;
            })
            .attr("font-weight", "bold")
            .attr("font-size", "1.5em");


        // x-scale and x-axis

        var experienceName = ["", "","","","",""];
        var formatSkillPoints = function (d) {
            return experienceName[d % 6];
        }


        // Attach axis on top of the first leaf datum.
        var firstEndNode = g.select(".node--leaf");

        firstEndNode.insert("g")
            .attr("class","xAxis")
            .attr("transform", "translate(" + 10 + "," + -15 + ")")
            .call(xAxis);

        continuous("#legend1", mostVoteColorScale);


    }

    // create continuous color legend
    function continuous(selector_id, colorscale) {
        var legendheight = 400,
            legendwidth = 80,
            margin = {top: 10, right: 60, bottom: 10, left: 2};

        var canvas = d3.select(selector_id)
            .style("height", legendheight + "px")
            .style("width", legendwidth + "px")
            //.style("position", "relative")
            .append("canvas")
            .attr("height", legendheight - margin.top - margin.bottom)
            .attr("width", 1)
            .style("height", (legendheight - margin.top - margin.bottom) + "px")
            .style("width", (legendwidth - margin.left - margin.right) + "px")
            .style("border", "1px solid #000")
            .style("position", "absolute")
            .style("top", (margin.top) + "px")
            .style("left", (margin.left) + "px")
            .node();

        var ctx = canvas.getContext("2d");

        var legendscale = d3.scaleLinear()
            .range([1, legendheight - margin.top - margin.bottom])
            .domain(colorscale.domain());

        // image data hackery based on http://bl.ocks.org/mbostock/048d21cf747371b11884f75ad896e5a5
        var image = ctx.createImageData(1, legendheight);
        d3.range(legendheight).forEach(function(i) {
            var c = d3.rgb(colorscale(legendscale.invert(i)));
            image.data[4*i] = c.r;
            image.data[4*i + 1] = c.g;
            image.data[4*i + 2] = c.b;
            image.data[4*i + 3] = 255;
        });
        ctx.putImageData(image, 0, 0);

        // A simpler way to do the above, but possibly slower. keep in mind the legend width is stretched because the width attr of the canvas is 1
        // See http://stackoverflow.com/questions/4899799/whats-the-best-way-to-set-a-single-pixel-in-an-html5-canvas
        /*
        d3.range(legendheight).forEach(function(i) {
          ctx.fillStyle = colorscale(legendscale.invert(i));
          ctx.fillRect(0,i,1,1);
        });
        */

        var legendaxis = d3.axisRight()
            .scale(legendscale)
            .tickSize(6)
            .ticks(8);

        var svg = d3.select(selector_id)
            .append("svg")
            .attr("height", (legendheight) + "px")
            .attr("width", (legendwidth) + "px")
            .style("position", "absolute")
            .style("left", "0px")
            .style("top", "0px")

        svg
            .append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + (legendwidth - margin.left - margin.right + 3) + "," + (margin.top) + ")")
            .call(legendaxis);
    };
})();
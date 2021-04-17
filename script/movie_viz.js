(function () {
    var movie_tsv_file = 'data/movie_name_rating_genre.tsv';
    var starYear = 1930;
    var year = 2018;
    var moviesByYearGenre;

    // design specific global variables
    var width = 1300
    var height = 2500
    var nodeRadius = 3;

    // svg global variables
    var svg, g;

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
            console.log(year);

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
            .attr("transform", "translate(40,0)");  // bit of margin on the left = 40

        g = svg.append("g")
            .attr("class", "dendro-g")
            .attr("transform", "translate(5,5)");
    }


    function createDendrogram(genreMovies, year) {
        var name = year;
        var children = [];

        var index = 0;

        Array.from(genreMovies.keys()).sort().forEach(function (genre) {

            var movies = genreMovies.get(genre);

            movies.sort(function (m1, m2) {
                var rating1 = +(m1.averageRating);
                var rating2 = +(m2.averageRating);
                return rating2 - rating1;
            })

            //console.log(movies.slice(0, 10));
            var obj = {
                "name" : genre,
                "children": movies.slice(0, 5).map(function (m) {
                    return {
                        "name" : m.primaryTitle,
                        "rating" : m.averageRating,
                        "votes" : m.numVotes,
                        "tconst": m.tconst
                    }
                } )
            }

            children.push(obj);
        });

        var dendogramData = {
            "name": year,
            "children": children
        };

        g.html("");


        var cluster = d3.cluster()
            .size([height, width - 500]);  // 450 is the margin I will have on the right side

        // Give the data to this cluster layout:
        var root = d3.hierarchy(dendogramData, function(d) {
            return d.children;
        });

        //console.log(root.descendants());

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
            .domain([3, 10.0])
            .range([0, 450]);

        var xAxis = d3.axisTop()
            .scale(xScale)
            .ticks(5)
            .tickFormat(formatSkillPoints);

        leafNodeG.append("rect")
            .attr("class","shadow")
            .style("fill", function (d) {return "gray"})
            .attr("height", 25)
            .attr("rx", 2)
            .attr("ry", 2)
            .transition()
            .duration(300)
            .attr("width", function (d) {
                return xScale(d.data.rating);
            });

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
            });

        /*
        leafNodeG.append("text")
            .attr("dy", 19.5)
            .attr("x", 8)
            .style("text-anchor", "start")
            .text(function (d) {
                return d.data.name;
            });

         */

        // Write down text for every parent datum
        var internalNode = g.selectAll(".node--internal");

        internalNode.selectAll("text.year-genre-text").remove();

        internalNode.append("text")
            .attr("class", "year-genre-text")
            .attr("y", -10)
            .style("text-anchor", "middle")
            .text(function (d) {
                return d.data.name;
            });


        // x-scale and x-axis

        var experienceName = ["", "","","","",""];
        var formatSkillPoints = function (d) {
            return experienceName[d % 6];
        }


        // Attach axis on top of the first leaf datum.
        var firstEndNode = g.select(".node--leaf");

        firstEndNode.insert("g")
            .attr("class","xAxis")
            .attr("transform", "translate(" + 10 + "," + -9 + ")")
            .call(xAxis);






    }
})();
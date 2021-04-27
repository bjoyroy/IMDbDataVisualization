(function () {

    var colors = [{
        "type": "Director",
        "color": "#CE1246"
        },
        {
            "type": "Actor",
            "color": "lightblue"
        },
        {
            "type": "Actress",
            "color": "lightgreen"
        },
    ];

    var startYear, endYear, minVote = 50000, minRating = 6.0;

    var allActorDirectors;

    var width = 2000, height = 1200;
    var forceG, legendG, svg;

    d3.tsv("data/title_rating_principals_actor_director.tsv").then(function (ad) {
        startYear = 1981;
        endYear = 1990;

        allActorDirectors = ad;

        var actorDirector = allActorDirectors.filter(function (d) {
            return +(d.startYear) >= startYear && +(d.startYear) <= endYear && +(d.numVotes) >= minVote && +(d.averageRating) >= minRating;
        });

        svgAndLegendSetup();

        filterDataAndDraw(actorDirector, startYear, endYear);



        });

        d3.select("#decade_select").on("change", function() {
            var value = +(d3.select(this).property("value"));
            startYear = value - 9;
            endYear = value;

            var actorDirector = allActorDirectors.filter(function (d) {
                return +(d.startYear) >= startYear && +(d.startYear) <= endYear && +(d.numVotes) >= minVote && +(d.averageRating) >= minRating;
            });


            filterDataAndDraw(actorDirector, startYear, endYear);
            //console.log(value);
        });
        
        function svgAndLegendSetup() {
            svg = d3.select("#ad-force")
                .append("svg")
                .attr("width", width)
                .attr("height", height);

            forceG = svg.append("g")
                .attr("class", "force-g");

            legendG = svg.append("g")
                .attr("transform", "translate(100,100)")
                .attr("class", 'legend-g');

            // setup legend
            var legendRects = colors.length;
            var rectDimension = 30;
            var legendWidth = 110;
            var rectSpacing = 5;
            var legendHeight = (rectDimension + rectSpacing) * legendRects + 25 ;


            legendG.append('rect')
                .attr('fill', 'none')
                .attr('stroke', 'black')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', legendWidth)
                .attr('height', legendHeight);

            legendG.selectAll('.legend-rect').data(colors)
                .enter().append('rect')
                .attr('x', 5)
                .attr('y', function (d, i) {
                    return (rectDimension + rectSpacing) * i + 5;
                })
                .attr('width', rectDimension)
                .attr('height', rectDimension)
                .attr('fill', function (d) {
                    return d.color;
                });

            legendG.selectAll('.legends-text').data(colors)
                .enter().append('text')
                .attr('x', 5 + rectDimension + 5)
                .attr('y', function (d, i) {
                    return (rectDimension + rectSpacing) * i + rectDimension / 2;
                })
                .attr("dy", ".35em")
                .text(function(d) { return d.type;})



        }




        function filterDataAndDraw(actorDirector, startYear, endYear) {
            var directorMovies = d3.group(actorDirector.filter(function (d) {
                return d.category == "director";
            }), d => d.nconst, d => d.tconst);



            var adNodesDict = d3.rollup(actorDirector,
                v => {
                    return {
                        noMovies: v.length,
                        name: v[0].primaryName,
                        averageRating: +((v.reduce((acc, c) => acc + +(c.averageRating), 0)/v.length).toFixed(2)),
                        averageVotes: +((v.reduce((acc, c) => acc + +(c.numVotes), 0)/v.length).toFixed(2)),
                        numDirected: v.reduce((acc, c) => acc + (c.category == "director"? 1: 0), 0),
                        actor: v.reduce((acc, c) => acc + (c.category == "actor"? 1: 0), 0),
                        actress: v.reduce((acc, c) => acc + (c.category == "actress"? 1: 0), 0),
                        id: v[0].nconst
                    }
                },
                d => d.nconst
            );

            var nodes = Array.from(adNodesDict.values());

            var moviesActors = d3.group(actorDirector.filter(function (d) {
                return d.category != "director";
            }), d => d.tconst);

            var links = [];

            //console.log(moviesActors);


            var directors = Array.from(directorMovies.keys());

            directors.forEach(function (d) {
                var directorActorDict = {};
                var movies = Array.from(directorMovies.get(d).keys());



                movies.forEach(function (m) {
                    //console.log(m);
                    //console.log(moviesActors.get(m));
                    //console.lolg(m);
                    //console.log(moviesActors);

                    try{
                        var actors = moviesActors.get(m).map(function (minfo) {
                            return minfo.nconst;
                        });

                        actors.forEach(function (a) {
                            if(directorActorDict[a] == null){
                                directorActorDict[a] = 1;
                            } else {
                                directorActorDict[a] = directorActorDict[a] + 1;
                            }
                        });
                    } catch(error){

                    }

                });

                Object.keys(directorActorDict).forEach(function (a) {
                    var val = directorActorDict[a];
                    var obj = {
                        "source" : d,
                        "target": a,
                        "value": val
                    };

                    links.push(obj);
                })
            });

            //console.log(nodes);
            //console.log(links);


            //.attr("viewBox", [0, 0, width, height]);

            const simulation = d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links).id(d => d.id))
                .force("charge", d3.forceManyBody().strength(-150).distanceMin(20).distanceMax(50))
                //.force("strength", d3.forceManyBody(100))
                //.force("gravity", 0.5)
                .force("center", d3.forceCenter(width / 2, height / 2));

            forceG.html("");

            var div = d3.select(".tooltip");

            //
            var link = forceG.append("g")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .selectAll("line")
                .data(links)
                .join("line")
                .attr("stroke-width", d => d.value * 2);

            var node = forceG.append("g")
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5)
                .selectAll("circle")
                .data(nodes)
                .join("circle")
                .attr("r", 7)
                .attr("fill", function (d) {
                    if(d.numDirected >= d.actor + d.actress){
                        return colors[0]["color"]; // color of director
                    }

                    if(d.actor >= d.numDirected + d.actress){
                        return colors[1]["color"]; // actor color
                    }
                    //console.log(d);
                    return colors[2]["color"]; // actress color
                })
                .on("mouseover", function (d) {
                    div.transition()
                        .duration(200)
                        .style("opacity", .9);
                    //console.log(d);
                    var text = "Name: " + d.name + "<br>Average Rating: " + d.averageRating + "<br>Average Votes: " + d.averageVotes;
                    //var text = "Hello, world!";
                    div.html(text) // state name mouseover
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                })
                .on("mouseout", ()=> {
                    div.transition()
                        .duration(200)
                        .style("opacity", 0);
                    }
                );
            //.call(drag(simulation));

            simulation.on("tick", () => {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);

                node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);
            });
        }
    }


)();
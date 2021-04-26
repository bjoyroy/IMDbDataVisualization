(function () {
    var width = 2500, height = 1500;
        d3.tsv("data/title_rating_principals_actor_director.tsv").then(function (ad) {
            var startYear = 2000;
            var endYear = 2010;
            var minVote = 50000;
            var minRating = 7;

            var actorDirector = ad.filter(function (d) {
                return +(d.startYear) >= startYear && +(d.startYear) <= endYear && +(d.numVotes) >= minVote && +(d.averageRating) >= minRating;
            });

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

            var svg = d3.select("#ad-force")
                .append("svg")
                .attr("width", width)
                .attr("height", height);
                //.attr("viewBox", [0, 0, width, height]);

            const simulation = d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links).id(d => d.id))
                .force("charge", d3.forceManyBody(100000))
                //.force("strength", d3.forceManyBody(100))
                //.force("gravity", 0.5)
                .force("center", d3.forceCenter(width / 2, height / 2));

            //
            var link = svg.append("g")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .selectAll("line")
                .data(links)
                .join("line")
                .attr("stroke-width", d => d.value * 2);

            var node = svg.append("g")
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5)
                .selectAll("circle")
                .data(nodes)
                .join("circle")
                .attr("r", 5)
                .attr("fill", "blue");
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

            //invalidation.then(() => simulation.stop());




        });

        /*
        drag = simulation => {

            function dragstarted(event) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            function dragged(event) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }

            function dragended(event) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }

            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }

         */
    }
)();
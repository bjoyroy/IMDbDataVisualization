(function () {
    var director_tsv_file = 'data/title_rating_principals_director.tsv';
    var directors;
    var directorFirstLatestAndBest;

    const padding = 25;
    const scatterplot_size = 500;
    const scatterplot_radius = 5;
    const svg_width = scatterplot_size + 2 * padding;
    const svg_height = svg_width;
    const breathing_space = 5;

    const types = ["HighestRated", "FirstMovie", "LatestMovie"];
    var age_scale, rating_scale;

    var svg, d_scatter_g;

    d3.tsv(director_tsv_file).then(function (allDirectors) {
        //console.log(allDirectors);
        directors = allDirectors.filter(function (d) {
            return +(d.birthYear) > 0 && +(d.startYear) > 0;
        });

        //console.log(directors);

        // add age during release
        directors.forEach(function (d, i) {
            directors[i].age = +(d.startYear) - +(d.birthYear);
        })

        //console.log(directors);

        var directorMovies = d3.group(directors, d => d.nconst);

        console.log(directorMovies);

        directorFirstLatestAndBest = getFirstAndBest(directorMovies);
        //console.log(directorFirstLatestAndBest);
        setupScatterPlot();

        drawScatterPlot(directorFirstLatestAndBest);

    });
    
    function setupScatterPlot() {
        svg = d3.select('#director_scatter').append('svg')
            .attr('width', svg_width)
            .attr('height', svg_height);

        // draw scatterplot borders
        svg.append('rect')
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('x', padding)
            .attr('y', padding)
            .attr('width', scatterplot_size)
            .attr('height', scatterplot_size)
            .style('background-color', '#ADD8E6');

        d_scatter_g = svg.append('g');

        age_scale = d3.scaleLinear()
            .range([0 + padding + breathing_space, scatterplot_size])
            .domain([10, 90]);

        rating_scale = d3.scaleLinear()
            .range([0 + padding + breathing_space, scatterplot_size])
            .domain([0, 10]);

        color_scale = d3.scaleOrdinal(d3.schemeCategory10);

        // make scatterplot point groups
        var life_exp_scatterplot = svg.append('g')
            .attr('class', 'life_exp')
            .attr('transform', `translate(${padding},${padding})`);

        life_exp_scatterplot.append('text')
            .attr('x', scatterplot_size - 80)
            .attr('y', scatterplot_size - 5)
            .attr('font-weight', 'bold')
            .text('Age');

        life_exp_scatterplot.append('text')
            .attr('transform', "rotate(90)")
            .attr('x', 10)
            .attr('y', -10)
            .attr('font-weight', 'bold')
            .text('Rating');

        // axis
        le_xAxis = d3.axisBottom().scale(age_scale);
        le_yAxis = d3.axisLeft().scale(rating_scale);

        svg.append('g')
            .attr('transform', `translate(${padding},${padding+scatterplot_size})`)
            .call(le_xAxis);

        svg.append('g')
            .attr('transform', `translate(${padding},${padding})`)
            .call(le_yAxis);

        // legend
        var legendX = scatterplot_size * (4/5);
        var legendY = scatterplot_size * (4/5);
        var legend_width = 110;
        var legend_height = 150;
        var rect_dimension = 30;
        var rect_spacing = 5;
        // draw legends
        var legend = svg.append('g')
            .attr('transform', `translate(${legendX},${legendY})`);;

        legend.append('rect')
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', legend_width)
            .attr('height', legend_height);

        var legendg = legend.append('g');

        legendg.selectAll('.legend-rect').data(types)
            .enter().append('rect')
            .attr('x', 5)
            .attr('y', function (d, i) {
                return (rect_dimension + rect_spacing) * i + 5;
            })
            .attr('width', rect_dimension)
            .attr('height', rect_dimension)
            .attr('fill', function (d) {
                return color_scale(d);
            });

        legendg.selectAll('.legends-text').data(types)
            .enter().append('text')
            .attr('x', 5 + rect_dimension + 5)
            .attr('y', function (d, i) {
                return (rect_dimension + rect_spacing) * i + rect_dimension / 2;
            })
            .attr("dy", ".35em")
            .text(function(d) { return d;})

        year_g = svg.append('g')
            .attr('class', 'year-g');




    }
    
    function drawScatterPlot(data) {
        console.log(data);
        var cirlce_sp = d_scatter_g.selectAll('circle').data(data);

        cirlce_sp.enter().append('circle').merge(cirlce_sp)
            .attr('cx',function(d){
                return age_scale(d.age);
            })
            .attr('cy', function(d){
                return rating_scale(d.rating);
            })
            .attr('r', function (d) {
                return 3;
                //return population_scale(d.population);
            })
            .attr('fill',function(d){
                return color_scale(d.type);
                //return "green";
            })
            .attr('opacity',  function (d) {
                if(d.typeValue == 0){
                    return 0.7;
                }
                if(d.typeValue == 1){
                    return 0.3;
                }
                if(d.typeValue == 2){
                    return 0.1;
                }
            })
            .attr('class', function(d){
                return d.type;
            });

        cirlce_sp.exit().remove();

    }

    function getFirstAndBest(directorMovies) {
        var directorTwoMovies = new Array();
        Array.from(directorMovies.keys()).forEach(function (directorID) {

            var movies = directorMovies.get(directorID);

            movies.sort(function (m1, m2) {
                var rating1 = +(m1.averageRating);
                var rating2 = +(m2.averageRating);
                return rating2 - rating1;
            });

            /*
            var obj = {
                "directorID" : directorID,
                "directorName" : movies[0].primaryName,
                "ageAtBestMovie": movies[0].age,
                "bestRating": movies[0].averageRating,
                "bestMovieVotes": movies[0].numVotes,
                "bestMovieID": movies[0].tconst
            }
            */


            var obj1 = {
                "directorID": directorID,
                "directorName" : movies[0].primaryName,
                "age": movies[0].age,
                "rating": movies[0].averageRating,
                "numVotes": movies[0].numVotes,
                "movieID": movies[0].tconst,
                "type": "HighestRated",
                "typeValue": 0
            }

            movies.sort(function (m1, m2) {
                var age1 = +(m1.age);
                var age2 = +(m2.age);
                return age1 - age2;
            });

            var obj2 = {
                "directorID": directorID,
                "directorName" : movies[0].primaryName,
                "age": movies[0].age,
                "rating": movies[0].averageRating,
                "numVotes": movies[0].numVotes,
                "movieID": movies[0].tconst,
                "type": "FirstMovie",
                "typeValue": 1
            }

            var obj3 = {
                "directorID": directorID,
                "directorName" : movies[movies.length - 1].primaryName,
                "age": movies[movies.length - 1].age,
                "rating": movies[movies.length - 1].averageRating,
                "numVotes": movies[movies.length - 1].numVotes,
                "movieID": movies[movies.length - 1].tconst,
                "type": "LatestMovie",
                "typeValue": 2
            }

            /*
            obj["ageAtFirstMovie"] = movies[0].age;
            obj["firstMovieRating"] =  movies[0].averageRating;
            obj["firstMovieVotes"] = movies[0].numVotes;
            obj["firstMovieID"] = movies[0].tconst

            obj["ageAtLatestMovie"] = movies[movies.length - 1].age;
            obj["latestMovieRating"] =  movies[movies.length - 1].averageRating;
            obj["latestMovieVotes"] = movies[movies.length - 1].numVotes;
            obj["firstMovieID"] = movies[0].tconst
            */


            directorTwoMovies.push(obj1, obj2);
            //directorTwoMovies.push(obj1);
        });

        return directorTwoMovies;
    }
})();
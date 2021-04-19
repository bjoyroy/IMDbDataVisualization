(function () {
    var movie_tsv_file = 'data/movie_name_rating_genre.tsv';
    var startYear = 1930, endYear = 2020;

    var width = 1800;
    var height = 1000;
    var rankData, data;
    var svg, xScale, yScale, pathg, infog, legendG;

    //var genresForAnimation = ["Drama", "Comedy", "Romance", "Action", "Sci-Fi", "Western", "Animation", "War", "Adventure", "Crime"];
    var genresForAnimation = ["Action", "Adult", "Adventure", "Animation", "Biography", "Comedy", "Crime", "Documentary", "Drama", "Family",
        "Fantasy", "Film-Noir", "History", "Horror", "Music", "Musical", "Mystery", "News", "Reality-TV", "Romance", "Sci-Fi", "Short", "Sport",
        "Thriller", "War", "Western"];
    var genreToView;



    d3.tsv(movie_tsv_file).then(function (movies) {
        processData(movies);
        setupSVG();

        /*
        genreToView = ["Action", "Comedy",
            "Romance",
            "Western"];

         */
        genreToView = readCheckbox();
        doTheGraph(genreToView);


    });

    function readCheckbox() {
        var checkedValues = [];
        var checkboxes = d3.selectAll(".checkbox-genre").each(function () {
            //console.log(this);
            var isChecked = d3.select(this).property("checked");
            if(isChecked){
                //console.log(this.value);
                checkedValues.push(this.value);
            }
            //console.log(isChecked);
        });
        //console.log(checkboxes);
        //d3.selectAll(".checkbox-genre").property("disabled", true);

        return checkedValues;


    }

    d3.select("#btn_animation").on("click", animationWork);

    function animationWork() {
        //console.log("do animation!");
        genreToView = readCheckbox();
        doTheGraph(genreToView);

    }

    function transition(path) {
        var transitionTime = document.getElementById("slider").value;
        path.transition()
            .duration(transitionTime)
            .ease(d3.easeLinear)
            .attrTween("stroke-dasharray", tweenDash)
            .on("start", (d) => {
                //console.log("start");
            })
            .on("end", (d) => {
                //console.log(d);
                drawEndTextCircle(d);
                //console.log("end");
                //d3.select(this).call(transition);
            });
    }

    function drawEndTextCircle(dd) {
        //pathg.selectAll(".end-circle").remove();
        //pathg.selectAll(".end-text").remove();

        infog
            .selectAll("circle")
            .data(data.series)
            .join("circle")
            .attr("cx", function (d) {
                return xScale(endYear);
            })
            .attr("cy", function (d, i) {
                return yScale(d.values[d.values.length - 1]);
            })
            .attr("r", 5)
            .attr("fill", "black");

        infog
            .selectAll("text")
            .data(data.series)
            .join("text")
            .text(function (d) {
                return d.name;
            })
            .attr("dy", "1em")
            .attr("x", function (d) {
                return xScale(endYear) + 10;
            })
            .attr("y", function (d, i) {
                return yScale(d.values[d.values.length - 1]) - 10;
            });




        /*
        var genre = data.name;
        var rank = data.values[data.values.length - 1];
        var cx = xScale(endYear);
        var cy = yScale(rank);
        var color = colorFunc(data.index);

        console.log(cx);
        console.log(cy);



        pathg.append("circle")
            .attr("class", "end-circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", 5)
            .attr("fill", color);

        pathg.append("text")
            .attr("class", "end-text")
            .text(genre)
            .attr("dy", "1em")
            .attr("x", cx + 10)
            .attr("y", cy - 10);

        */

        //console.log(data);
    }



    function tweenDash() {
        //console.log(this);
        const l = this.getTotalLength(),
            i = d3.interpolateString("0," + l, l + "," + l);
        return function(t) { return i(t) };
    }

    function processData(movies){
        movies = movies.filter(function (d) {
            return d.genres != "\\N";
        });




        var moviesByYearGenre = d3.group(movies, d => +(d.startYear), d => d.genres);

        var genreMovieNumberYear = [];

        for(var i = startYear; i <= endYear; i++){
            var moviesByGenre = moviesByYearGenre.get(i);
            var genreMovieNumber = [];

            var total = Array.from(moviesByGenre).reduce((acc, item) => {
                //console.log(item[1].length);
                var subtotal = acc + item[1].length;
                return subtotal;
            }, 0);


            var uniqueMovieNumberSet = new Set();
            var movieNumbers = [];

            genresForAnimation.forEach(function (d) {
                var movieGenre = moviesByGenre.get(d);


                var lnth = movieGenre != null ? movieGenre.length : 0;
                uniqueMovieNumberSet.add(lnth);

                //console.log(movieCount);
                var obj = {
                    "genre": d,
                    "movies": lnth
                };

                genreMovieNumber.push(obj);
                movieNumbers.push(lnth);
            });

            var uniqueMovieNumber = Array.from(uniqueMovieNumberSet);

            uniqueMovieNumber.sort(function (a, b) {
                return a - b;
            });

            movieNumbers.sort(function (a, b) {
                return b - a;
            });

            genreMovieNumber.forEach(function (d, i) {
                var index = movieNumbers.indexOf(d.movies);
                genreMovieNumber[i]["rank"] =  index + 1; // start from 1
                if(d.movies == 0){
                    genreMovieNumber[i]["rank"] = genresForAnimation.length; // hardcoded. If # movies are zero, then rank last
                }
            });

            genreMovieNumberYear.push(genreMovieNumber);
        }

        rankData = {};

        var years = d3.range(startYear, endYear + 1);

        rankData.y = "Genre Popularity";
        rankData.years = years;
        rankData.series = [];


        genreMovieNumberYear.forEach(function (mi, j) {
            genresForAnimation.forEach(function (d, i) {
                if(rankData.series[i] == null){
                    rankData.series.push({
                        name: d,
                        index: genresForAnimation.indexOf(d),
                        values: []
                    });
                }
                rankData.series[i].values.push(mi[i].rank);
            })
        })

        //
        //
        // console.log(rankData);


    }

    function setupSVG(){
        svg = d3.select("#line")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("id", "visualization")
            .style("background-color", "light-gray")
            .attr("xmlns", "http://www.w3.org/2000/svg");

        var margin =  {
            top: 50,
            right: 500,
            bottom: 50,
            left: 100
        }

        xScale = d3.scaleLinear()
            .domain([startYear, endYear])
            .range([margin.left, width - margin.right]);

        yScale = d3.scaleLinear()
            //.domain([0, d3.max(data.series, d => d3.max(d.values))]).nice()
            .domain([26, 0])
            .range([height - margin.bottom, margin.top])

        var xAxis = g => g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            //.call(d3.axisBottom(x));
            .call(d3.axisBottom(xScale).ticks(width / 80).tickSizeOuter(0));

        var yAxis = g => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(yScale))
            .call(g => g.select(".domain").remove())
            .call(g => g.select(".tick:last-of-type text").clone()
                //.attr("x", 3)
                .attr("text-anchor", "start")
                .attr("font-weight", "bold"));
        //.text(data.y));

        svg.append("g")
            .call(xAxis);

        svg.append("g")
            .call(yAxis);

        svg.append("text")
            .attr('x', (width - margin.right) / 2)
            .attr('y', height - 10)
            .attr('font-weight', 'bold')
            .text('Year');

        svg.append("text")
            .attr('x', -height / 2)
            .attr('y', 70)
            .attr('font-weight', 'bold')
            .text('Genre Rank')
            .attr("transform", "rotate(270)");



        pathg = svg.append("g")
            .attr("class", "isline")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5);

        infog = svg.append("g")
            .attr("class", "info-g");

        legendG = svg.append("g")
            .attr("class", "legend-g")
            .attr("transform", `translate(${width - margin.right + 75},150)`);
    }

    function doTheGraph(genreToView) {
        //var years = d3.range(startYear, endYear + 1);

        data = {};

        data.y = rankData.y;
        data.years = rankData.years;
        data.series = [];



        data.series = rankData.series.filter(function (obj) {
            return genreToView.indexOf(obj.name) >=0;
        });

        //console.log(data);
        infog.html("");

        var line = d3.line()
            .defined(d => !isNaN(d))
            .x((d, i) => xScale(data.years[i]))
            .y(d => yScale(d));

        const path = pathg
            .selectAll("path")
            .data(data.series)
            .join("path")
            .style("mix-blend-mode", "multiply")
            .attr("d", d => line(d.values))
            .attr("stroke", (d,i) => {
                //console.log(d.index);
                return colorFunc(d.index)
            })
            .call(transition);

        setupLegend(data);

    }

    function setupLegend(data) {
        var legendRects = data.series.length;
        var legendWidth = 110;
        var legendHeight = (rectDimension + rectSpacing) * legendRects + 50;
        var rectDimension = 30;
        var rectSpacing = 5;


        legendG.html("");
        legendG.append('rect')
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', legendWidth)
            .attr('height', legendHeight);

        legendG.selectAll('.legend-rect').data(data.series)
            .enter().append('rect')
            .attr('x', 5)
            .attr('y', function (d, i) {
                return (rectDimension + rectSpacing) * i + 5;
            })
            .attr('width', rectDimension)
            .attr('height', rectDimension)
            .attr('fill', function (d) {
                return colorFunc(d.index);
            });

        legendG.selectAll('.legends-text').data(data.series)
            .enter().append('text')
            .attr('x', 5 + rectDimension + 5)
            .attr('y', function (d, i) {
                return (rectDimension + rectSpacing) * i + rectDimension / 2;
            })
            .attr("dy", ".35em")
            .text(function(d) { return d.name;})
    }

    function colorFunc(i){
        var color = d3.scaleSqrt()
            .interpolate(() => d3.interpolateTurbo)
            .domain([0, 26])
        //.range("#000000", "#FFFFFF");

        return color(i);
    }
})();
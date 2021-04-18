(function () {
    var movie_tsv_file = 'data/movie_name_rating_genre.tsv';
    var startYear = 1930, endYear = 2020;

    var width = 1500;
    var height = 1000;

    var genresForAnimation = ["Drama", "Comedy", "Romance", "Action", "Sci-Fi", "Western", "Animation", "War", "Adventure", "Crime"];

    d3.tsv(movie_tsv_file).then(function (movies) {

        movies = movies.filter(function (d) {
            return d.genres != "\\N";
        });

        console.log(movies);

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

            //console.log(total);

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

            console.log(uniqueMovieNumber);

            genreMovieNumber.forEach(function (d, i) {
                var index = movieNumbers.indexOf(d.movies);
                genreMovieNumber[i]["rank"] =  index ;
                if(d.movies == 0){
                    genreMovieNumber[i]["rank"] = genresForAnimation.length; // hardcoded
                }
            });



            genreMovieNumberYear.push(genreMovieNumber);
        }

        console.log(genreMovieNumberYear);

        // just get everything of comedy
        var comedyRank = [];
        var comedyIndex = genresForAnimation.indexOf("Romance");
        genreMovieNumberYear.forEach(function (d) {
            comedyRank.push(d[comedyIndex]["rank"]);
        })

        console.log(comedyRank);

        var w = 700;
        var h = 300;

        var svg = d3.select("#line")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("id", "visualization")
            .attr("xmlns", "http://www.w3.org/2000/svg");

        var data = d3.range(11).map(function(){return Math.random()*10});
        console.log(data);
        var x = d3.scaleLinear().domain([0, endYear - startYear]).range([0, width]);
        var y = d3.scaleLinear().domain([0, 10]).range([10, height]);
        var line = d3.line()
            //.interpolate("cardinal")
            .x(function(d,i) {return x(i);})
            .y(function(d) {return y(d);})
            .curve(d3.curveLinear);

        var path = svg.append("path")
            .attr("d", line(comedyRank))
            .attr("stroke", "steelblue")
            .attr("stroke-width", "2")
            .attr("fill", "none");

        var totalLength = path.node().getTotalLength();

        path
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(10000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);

        svg.on("click", function(){
            path
                .transition()
                .duration(10000)
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", totalLength);
        })


    })
})();
(function () {
    var movie_tsv_file = 'data/movie_name_rating_genre.tsv';
    var mhSvgDim = 400;
    d3.tsv(movie_tsv_file).then(function (movies) {
        console.log(movies);
        var moviesByYear = d3.group(movies, d => d.startYear);
        console.log(moviesByYear);
        var movieYears = Array.from(moviesByYear.keys());
        console.log(movieYears);
        var minYear = d3.min(movieYears);
        var maxYear = d3.max(movieYears);
        console.log(minYear);
        console.log(maxYear);

        d3.select("#movie_histogram").append("svg")
            .attr('width', 2* mhSvgDim)
            .attr('height', mhSvgDim)
            .style(
                'background-color','bisque'
            )



    });
})();
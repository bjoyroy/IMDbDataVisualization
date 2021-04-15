(function () {
        d3.tsv("data/title_rating_principals_actor_director.tsv").then(function (ad) {
            var startYear = 2000;
            var endYear = 2010;
            var minVote = 100000;
            var minRating = 7.5;

            var actorDirector = ad.filter(function (d) {
                return +(d.startYear) >= startYear && +(d.startYear) <= endYear && +(d.numVotes) >= minVote && +(d.averageRating) >= minRating;
            });

            var nodesAD = d3.rollup(actorDirector,
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

            var adNodes = Array.from(nodesAD.values())
        });
    }
)();
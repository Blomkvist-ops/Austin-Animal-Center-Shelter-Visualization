let data;


// load the intakes data
d3.csv('data/aac_intakes.csv').then(_data => {
    data = _data;
    data.forEach(d => {
        d.datetime = +d.datetime;
        // console.log(d)
    });

});

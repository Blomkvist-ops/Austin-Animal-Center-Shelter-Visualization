const parseTime = d3.timeParse("%m-%d");
// load the intakes data
d3.csv("data/aac_intakes_outcomes.csv").then((data) => {
  data.forEach((d) => {
    // Preprocess age
    if (d.age_upon_outcome.includes("months")) {
      const months = parseInt(d.age_upon_outcome);
      d.age_upon_outcome = months <= 6 ? 0 : 1;
    } else {
      const years = parseInt(d.age_upon_outcome);
      d.age_upon_outcome = years;
    }

    if (d.age_upon_outcome < 3) d.age_group = 'Baby';
    else if (d.age_upon_outcome < 5) d.age_group = 'Young';
    else if (d.age_upon_outcome < 10) d.age_group = 'Mature';
    else d.age_group = 'Elder';


    // Preprocess days
    const days = parseInt(d.time_in_shelter.split(" ")[0]);
    d.time_in_shelter = days;
  });

  let bubble = new BubbleChart({ parentElement: "#bubble-chart" }, data);
  let barChart = new BarChart({ parentElement: "#bar-chart" }, data);
  bubble.updateVis();
  barChart.updateVis();

  d3.selectAll('.legend-btn').on('click', function (event) {

    // toggle status
    d3.select(this).classed('inactive', !d3.select(this).classed('inactive'));

    let selected = [];

    d3.selectAll('.legend-btn:not(.inactive)').each(function (d) {
      selected.push(d3.select(this).attr('data-category'));
    });

    console.log(selected);

    bubble.data = data.filter(d => {
      return selected.includes(d.animal_type)
    });

    barChart.data = data.filter(d => {
      return selected.includes(d.animal_type)
    });

    // All categories are shown when no categories are active
    if (selected.length == 0) {
      bubble.data = data;
      barChart.data = data;
    }

    bubble.updateVis();
    barChart.updateVis();

  });


});



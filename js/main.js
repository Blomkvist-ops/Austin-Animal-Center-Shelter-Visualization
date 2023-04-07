const parseTime = d3.timeParse("%m-%d");

let selectBreed;
let selectAge;
let selectTime;
let dispatcher = d3.dispatch('filterBreed', 'filterAge', 'filterTime');



// create line chart
d3.csv("data/aac_intakes.csv").then((data) => {
  d3.csv("data/aac_outcomes.csv").then((data2) => {
    let timeline = new timeLine({ parentElement: "#timeline" }, data, data2,
        selectBreed, selectAge, dispatcher);
    timeline.updateVis();




    let lines = new Line({ parentElement: "#line-chart" }, data, data2, selectBreed, selectAge, selectTime, dispatcher);
    lines.updateVis();
    dispatcher.on('filterTime', time => {
      if (time == null) {
        lines.data = data;
        lines.data2 = data2;
        lines.selectTime = undefined;
      }
      else {
        // console.log(time)
        selectTime = time;
        lines.selectTime = time;
      }
      lines.updateVis();
    });


  });
});


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

    // Preprocess age group
    if (d.age_upon_outcome < 3) d.age_group = "Baby";
    else if (d.age_upon_outcome < 5) d.age_group = "Young";
    else if (d.age_upon_outcome < 10) d.age_group = "Mature";
    else d.age_group = "Elder";

    // Preprocess days
    const days = parseInt(d.time_in_shelter.split(" ")[0]);
    d.time_in_shelter = days;
  });

  // create graphs
  let bubble = new BubbleChart({ parentElement: "#bubble-chart" }, data, selectAge, dispatcher);
  let barChart = new BarChart({ parentElement: "#bar-chart" }, data, selectBreed, dispatcher);
  let heatMap = new HeatMap({ parentElement: "#heat-map" }, data, selectBreed, selectAge, dispatcher);
  bubble.updateVis();
  barChart.updateVis();
  heatMap.updateVis();

  d3.selectAll(".legend-btn").on("click", function (event) {
    // toggle status
    d3.select(this).classed("inactive", !d3.select(this).classed("inactive"));

    let selected = [];

    d3.selectAll(".legend-btn:not(.inactive)").each(function (d) {
      selected.push(d3.select(this).attr("data-category"));
    });

    bubble.data = data.filter((d) => {
      return selected.includes(d.animal_type);
    });

    barChart.data = data.filter((d) => {
      return selected.includes(d.animal_type);
    });

    heatMap.data = data.filter((d) => {
      return selected.includes(d.animal_type);
    });

    // All categories are shown when no categories are active
    if (selected.length == 0) {
      bubble.data = data;
      barChart.data = data;
      heatMap.data = data;
    }

    bubble.updateVis();
    barChart.updateVis();
    heatMap.updateVis();
  });

  dispatcher.on('filterBreed', breed => {
    if (breed == null) {

      barChart.data = data;
      barChart.selectBreed = undefined;

      heatMap.data = data;
      heatMap.selectBreed = undefined;

      // lines.data = data;
      // lines.data2 = data;
      // lines.selectBreed = undefined;
    }
    else {
      selectBreed = breed;
      barChart.selectBreed = breed;
      heatMap.selectBreed = breed;
      //lines.selectBreed = breed;
    }
    barChart.updateVis();
    heatMap.updateVis();
    //lines.updateVis();
  });

  dispatcher.on('filterAge', age => {
    if (age == null) {

      bubble.data = data;
      barChart.selectAge = undefined;

      heatMap.data = data;
      heatMap.selectAge = undefined;

      // lines.data = data;
      // lines.data2 = data;
      // lines.selectBreed = undefined;
    }
    else {
      selectBreed = age;
      bubble.selectAge = age;
      heatMap.selectAge = age;
      //lines.selectBreed = breed;
    }
    bubble.updateVis();
    heatMap.updateVis();
    //lines.updateVis();
  });

});



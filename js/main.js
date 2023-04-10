const parseTime = d3.timeParse("%m-%d");

let selectBreed;
let selectAge;
let selectTime = [0,0];
let dispatcher = d3.dispatch('filterBreed', 'filterAge', 'filterTime');
let selectType = [];




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

  // create line chart
  d3.csv("data/aac_intakes.csv").then((data1) => {
    d3.csv("data/aac_outcomes.csv").then((data2) => {
      let lines = new Line({ parentElement: "#line-chart" }, data1, data2, selectBreed, selectAge, dispatcher);

      let timeline = new timeLine({ parentElement: "#timeline" }, data1, data2,
          selectBreed, selectAge, selectTime, dispatcher);

      // create graphs
      let bubble = new BubbleChart(
        { parentElement: "#bubble-chart" },
        data,
        selectAge,
        dispatcher
      );
      let barChart = new BarChart(
        { parentElement: "#bar-chart" },
        data,
        selectBreed,
        dispatcher
      );
      let heatMap = new HeatMap(
        { parentElement: "#heat-map" },
        data,
        selectBreed,
        selectAge,
        dispatcher
      );
      lines.updateVis();
      timeline.updateVis();
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

        selectedType = selected;

        bubble.data = data.filter((d) => {
          return selected.includes(d.animal_type);
        });

        barChart.data = data.filter((d) => {
          return selected.includes(d.animal_type);
        });

        heatMap.data = data.filter((d) => {
          return selected.includes(d.animal_type);
        });

        let tmpData1 = data1.filter((d) => {
          return selected.includes(d.animal_type);
        });
        let tmpData2 = data2.filter((d) => {
          return selected.includes(d.animal_type);
        });

        lines.data = tmpData1;
        lines.data2 = tmpData2;
        timeline.data = tmpData1;
        timeline.data2 = tmpData2;



        // All categories are shown when no categories are active
        if (selected.length == 0) {
          timeline.data = data1;
          timeline.data2 = data2;
          lines.data = data1;
          lines.data2 = data2;
          bubble.data = data;
          barChart.data = data;
          heatMap.data = data;
        }
        else {
          if (selectBreed != null) {
            if (!selected.includes(selectBreed.type)) {
              selectBreed = null;
              barChart.selectBreed = null;
              heatMap.selectBreed = null;
            }
          }
        }

        lines.updateVis();
        timeline.updateVis();
        bubble.updateVis();
        barChart.updateVis();
        heatMap.updateVis();
      });

      dispatcher.on("filterBreed", (breed) => {
        if (breed == null) {
          selectBreed = null;
          barChart.selectBreed = undefined;
          heatMap.selectBreed = undefined;

          console.log(selectType);

          if (selectType.length != 0) {
            barChart.data = data.filter((d) => {
              return selectType.includes(d.animal_type);
            });
            heatMap.data = data.filter((d) => {
              return selectType.includes(d.animal_type);
            });
          }
          else {
            console.log('here');
            barChart.data = data;
            heatMap.data = data;
          }
          // lines.data = data;
          // lines.data2 = data;
          // lines.selectBreed = undefined;
        } else {
          selectBreed = breed;
          barChart.selectBreed = breed;
          heatMap.selectBreed = breed;
          //lines.selectBreed = breed;

          selectAge = null;
          //   selectType = null;
          //   selectCondition = null;
          //   selectTime = null;

          // unselect all the filters
          heatMap.selectAge = null;
          //   heatMap.selectTime = null;
          //   barChart.selectType = null;
          //   barChart.selectCondition = null;
          //   barChart.selectTime = null;
          //   lines.selectAge = null;
          //   lines.selectType = null;
          //   lines.selectCondition = null;
        }
        barChart.updateVis();
        heatMap.updateVis();
        //lines.updateVis();
      });

      dispatcher.on("filterAge", (age) => {
        if (age == null) {
          selectAge = null;
          bubble.selectAge = undefined;
          heatMap.selectAge = undefined;

          if (selectType.length != 0) {
            bubble.data = data.filter((d) => {
              return selectType.includes(d.animal_type);
            });
            heatMap.data = data.filter((d) => {
              return selectType.includes(d.animal_type);
            });
          }
          else {
            bubble.data = data;
            heatMap.data = data;
          }

          // lines.data = data;
          // lines.data2 = data;
          // lines.selectBreed = undefined;
        } else {
          selectAge = age;
          bubble.selectAge = age;
          heatMap.selectAge = age;
          //lines.selectBreed = breed;

          selectBreed = null;
          //   selectType = null;
          //   selectCondition = null;
          //   selectTime = null;

          // unselect all the filters
          heatMap.selectBreed = null;
          //   heatMap.selectTime = null;
          //   bubble.selectType = null;
          //   bubble.selectCondition = null;
          //   bubble.selectTime = null;
          //   lines.selectBreed = null;
          //   lines.selectType = null;
          //   lines.selectCondition = null;
        }
        bubble.updateVis();
        heatMap.updateVis();
        //lines.updateVis();
      });

      dispatcher.on('filterTime', time => {
        if (time == null) {
          // timeline.data = data1;
          // timeline.data2 = data2;
          timeline.selectTime = undefined;
        }
        else {
          // timeline.data = data1;
          // timeline.data2 = data2;
          selectTime = time;
          timeline.selectTime = time;
        }
        // lines.updateVis();
        timeline.updateVis();
      });
    });
  });
});




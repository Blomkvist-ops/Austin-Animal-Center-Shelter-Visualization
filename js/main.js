const parseTime = d3.timeParse("%m-%d");

let selectBreed;
let selectAge;
let selectTypeCondition;
let selectTime = [0, 0];
let dispatcher = d3.dispatch(
  "filterBreed",
  "filterAge",
  "filterTypeCondition",
  "filterTime"
);
let selectAnimalType = [];


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
  let bubble = new BubbleChart(
    { parentElement: "#bubble-chart" },
    data,
    selectAge,
    selectTypeCondition,
    selectTime,
    dispatcher
  );
  let barChart = new BarChart(
    { parentElement: "#bar-chart" },
    data,
    selectBreed,
    selectTypeCondition,
    selectTime,
    dispatcher
  );
  let heatMap = new HeatMap(
    { parentElement: "#heat-map" },
    data,
    selectBreed,
    selectAge,
    selectTime,
    dispatcher
  );
  bubble.updateVis();
  barChart.updateVis();
  heatMap.updateVis();


  // create line chart
  d3.csv("data/aac_intakes.csv").then((data1) => {
    d3.csv("data/aac_outcomes.csv").then((data2) => {
      let timeline = new timeLine(
        { parentElement: "#timeline" },
        data1,
        data2,
        selectBreed,
        selectAge,
        selectTime,
        dispatcher
      );
      timeline.updateVis();

      let lines = new Line(
        { parentElement: "#line-chart" },
        data1,
        data2,
        selectBreed,
        selectAge,
        dispatcher
      );
      lines.updateVis();


      dispatcher.on("filterTime", (time) => {
        if (time == null) {
          timeline.data = data1;
          timeline.data2 = data2;
          timeline.selectTime = undefined;
          bubble.data = data;
          bubble.selectTime = undefined;
          barChart.data = data;
          barChart.selectTime = undefined;
          heatMap.data = data;
          heatMap.selectTime = undefined;
        } else {
          selectTime = time;
          timeline.selectTime = time;
          bubble.selectTime = time;
          barChart.selectTime = time;
          heatMap.selectTime = time;
        }
        timeline.updateVis();
        bubble.updateVis();
        barChart.updateVis();
        heatMap.updateVis();
      });


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
        })

        let tmpData2 = data2.filter((d) => {
          return selected.includes(d.animal_type);
        })

        // lines.data = tmpData1;
        // lines.data2 = tmpData2;
        timeline.data = tmpData1;
        timeline.data2 = tmpData2;

        // All categories are shown when no categories are active
        if (selected.length == 0) {
          bubble.data = data;
          barChart.data = data;
          heatMap.data = data;
          // lines.data = data1;
          // lines.data2 = data2;
          timeline.data = data1;
          timeline.data2 = data2;
        } else {
          if (selectBreed != null) {
            if (!selected.includes(selectBreed.type)) {
              selectBreed = null;
              barChart.selectBreed = null;
              heatMap.selectBreed = null;
            }
          }
        }

        // lines.updateVis();
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

          if (selectAnimalType.length != 0) {
            barChart.data = data.filter((d) => {
              return selectAnimalType.includes(d.animal_type);
            });
            heatMap.data = data.filter((d) => {
              return selectAnimalType.includes(d.animal_type);
            });
          } else {
            barChart.data = data;
            heatMap.data = data;
          }
        } else {
          selectBreed = breed;
          barChart.selectBreed = breed;
          heatMap.selectBreed = breed;

          selectAge = null;
          selectTypeCondition = null;

          // unselect all the filters
          heatMap.selectAge = null;
          barChart.selectTypeCondition = null;
        }
        barChart.updateVis();
        heatMap.updateVis();
      });

      dispatcher.on("filterAge", (age) => {
        if (age == null) {
          selectAge = null;
          bubble.selectAge = undefined;
          heatMap.selectAge = undefined;

          if (selectAnimalType.length != 0) {
            bubble.data = data.filter((d) => {
              return selectAnimalType.includes(d.animal_type);
            });
            heatMap.data = data.filter((d) => {
              return selectAnimalType.includes(d.animal_type);
            });
          } else {
            bubble.data = data;
            heatMap.data = data;
          }

        } else {
          selectAge = age;
          bubble.selectAge = age;
          heatMap.selectAge = age;

          selectBreed = null;
          selectTypeCondition = null;

          // unselect all the filters
          heatMap.selectBreed = null;
          bubble.selectTypeCondition = null;
        }
        bubble.updateVis();
        heatMap.updateVis();
      });

      dispatcher.on("filterTypeCondition", (typeCondition) => {
        if (typeCondition == null) {
          selectTypeCondition = null;
          bubble.selectTypeCondition = undefined;
          barChart.selectTypeCondition = undefined;

          if (selectAnimalType.length != 0) {
            bubble.data = data.filter((d) => {
              return selectAnimalType.includes(d.animal_type);
            });
            barChart.data = data.filter((d) => {
              return selectAnimalType.includes(d.animal_type);
            });
          } else {
            bubble.data = data;
            barChart.data = data;
          }

        } else {
          selectTypeCondition = typeCondition;
          bubble.selectTypeCondition = typeCondition;
          barChart.selectTypeCondition = typeCondition;

          selectBreed = null;
          selectAge = null;

          // unselect all the filters
          barChart.selectBreed = null;
          barChart.selectTime = null;
          bubble.selectAge = null;
          bubble.selectTime = null;
        }
        bubble.updateVis();
        barChart.updateVis();
      });

      // dispatcher.on('filterTime', time => {
      //   if (time == null) {
      //     timeline.selectTime = undefined;
      //   }
      //   else {
      //     selectTime = time;
      //     timeline.selectTime = time;
      //   }
      //   timeline.updateVis();
      // });


    });


  });
});

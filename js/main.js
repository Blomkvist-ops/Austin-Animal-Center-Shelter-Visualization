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

    // Preprocess days
    const days = parseInt(d.time_in_shelter.split(" ")[0]);
    d.time_in_shelter = days;

    //     d.uid = +d.animal_id_intake;
    //     d.intake_number = +d.intake_number;
    //     d.animal_type = +d.animal_type;
    //     d.intake_condition = +d.intake_condition;
    //     d.intake_type = +d.intake_type;
    //     d.intake_age = +d.age_upon_intake_age_group;
    //     d.intake_date = parseTime(d.intake_monthyear);
    //     d.time_in_shelter_days = +d.time_in_shelter_days;
    //     d.outcome_type = +d.outcome_type;
    //     d.outcome_age = +d.age_upon_outcome_age_group;
    //     d.outcome_date = parseTime(d.outcome_monthyear);
    //     d.breed = +d.breed;
  });

  let bubble = new BubbleChart({ parentElement: "#bubble-chart" }, data);
  bubble.updateVis();

  let barChart = new BarChart({ parentElement: "#bar-chart" }, data);
  barChart.updateVis();
});

class Line {
    /**
     * Class constructor with initial configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data, _data2, _selectBreed, _selectAge, _dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 1300,
            containerHeight: 250,
            margin: { top: 15, right: 60, bottom: 30, left: 100 },
            tooltipPadding: 15,
            colors: ["#F9F3B9", "#E5CD6C", "#ba7f4e", "#8C6239", "#2F1313"],
        }
        this.data = _data;
        this.data2 = _data2;
        this.selectBreed = _selectBreed;
        this.selectAge = _selectAge;
        this.selectTime = null;
        this.dispatcher = _dispatcher;
        this.initVis();
    }
    initVis() {
        let vis = this;

        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .append("g")
            .attr("transform",
                "translate(" + vis.config.margin.left + "," + vis.config.margin.top + ")");

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.keys = ["intake", "outcome"]

        vis.colorScale = d3.scaleOrdinal()
            .domain(vis.keys)
            .range([vis.config.colors[1], vis.config.colors[2]])

        vis.xScale = d3.scaleTime()
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.yScaleR = d3.scaleLinear()
            .range([vis.height, 0]);

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale)

        vis.yAxis = d3.axisLeft(vis.yScale)
            .tickPadding(10);

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // SVG Group containing the actual chart; D3 margin convention
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.clip = vis.chart.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", vis.config.containerWidth )
            .attr("height", vis.config.containerHeight )
            .attr("x", 0)
            .attr("y", 0);

        vis.areaChart = vis.chart.append('g')
            .attr("clip-path", "url(#clip)")

        // Initialize brush component
        vis.brushG = vis.chart.append('g')
            .attr('class', 'brush x-brush');

        vis.defaultSelection = [0,0]
        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.height]])
            .on('end', function({selection}) {
                if (selection) {
                    if (selection[0] != 0 && selection[1] != 0) {
                        vis.selectedDomain = selection.map(vis.xScale.invert, vis.xScale);
                        vis.selectTime = selection.map(vis.xScale.invert, vis.xScale);
                        vis.dispatcher.call("filterTime", this, vis.selectedDomain);
                        vis.updateVis();
                    }
                }
                if (!selection) {
                    vis.selectTime = [0,0]
                    vis.dispatcher.call("filterTime",this, null);
                    vis.updateVis();
                }
            });


        let idleTimeout
        function idled() { idleTimeout = null; }

        // Append empty x-axis group and move it to the bottom of the chart
        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`)
            .call(vis.xAxis)

        // Append y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        // Append both axis titles
        vis.chart.append('text')
            .attr('class', 'axis-title')
            .attr('y', 5)
            .attr('x', vis.width + 150)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text('Net Number');

        vis.chart.append('text')
            .attr('class', 'axis-title')
            .attr('x', 0)
            .attr('y', 5)
            .attr('dy', '.71em')
            .text('Number of Intake/outcome');

        let size = 20
        vis.mygroup = [0, 1]
        vis.chart.selectAll("myarea")
            .data(vis.mygroup)
            .join("rect")
            .attr("x", vis.width - 150)
            .attr("y", function (d, i) { return 10 + i * (size + 5) - 25 }) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("width", size)
            .attr("height", size)
            .style("fill", function (d) {
                name = vis.keys[d]; return vis.colorScale(name);
            })

        vis.chart.selectAll("mylabels")
            .data(vis.mygroup)
            .join("text")
            .attr("x", vis.width - size * 1.2 - 100)
            .attr("y", function (d, i) { return 10 + i * (size + 5) + (size / 2) + 5 - 25 })
            .text(function (d) {
                if (d == 0) {
                    return "Intake"
                } else {
                    return "Outcome"
                }
            })



        vis.updateVis();

    }


    updateVis() {
        let vis = this;

        // selectTime = [new Date("2013-05-01"), new Date("2018-10-01")]



        // if (vis.selectBreed != null) {
        //     vis.filtereddata = vis.data.filter(d => d.breed == vis.selectBreed.breed);
        //     vis.filtereddata2 = vis.filtereddata2.filter(d => d.breed == vis.selectBreed.breed);
        //
        // }
        //
        // if (vis.selectAge != null) {
        //     vis.filtereddata = vis.filtereddata.filter(d => d.age_group == vis.selectAge.age);
        //     vis.filtereddata2 = vis.filtereddata2.filter(d => d.age_group == vis.selectAge.age);
        // }

        // const tmpTimeFormat = d3.timeParse("%Y-%m-%dT%H:%M:%S.%L");
        // const tmpTimeFormat2 = d3.timeParse("%Y-%m-%dT%H:%M:%S");

        const getMinDate = function (d1, d2) {
            if (d1 > d2) return d2
            else return d1
        }
        const getMaxDate = function (d1, d2) {
            if (d1 < d2) return d2
            else return d1
        }


        vis.filtereddata = vis.data;
        vis.filtereddata2 = vis.data2;

        let groupByDate = d3.group(vis.filtereddata, g => {
            return g.datetime.substring(0, 10);
        });

        vis.intakeArr = Array.from(groupByDate.entries());
        vis.intakeArr.forEach(e => {
            e[1] = e[1].length
        })

        // get outcome data group by date
        let groupByDate2 = d3.group(this.filtereddata2, g => {
            return g.datetime.substring(0, 10);
        });

        vis.outcomeArr = Array.from(groupByDate2.entries());
        vis.outcomeArr.forEach(e => {
            e[1] = e[1].length
        })

        // get net data
        let groupByDate3 = new Map()
        vis.intakeArr.forEach(e => {
            if (groupByDate2.get(e[0]) != null) {
                let cnt = 0;
                for (let k in groupByDate2.get(e[0])) {
                    cnt++;
                }
                let num = e[1] - cnt;
                groupByDate3.set(e[0], [num, e[1], cnt])
            } else {
                groupByDate3.set(e[0], [e[1], e[1], 0])
            }
        })

        vis.outcomeArr.forEach(e => {
            if (groupByDate3.get(e[0]) == null) {
                groupByDate3.set(e[0], [-e[1], 0, e[1]])
            }
        })


        const parseTime = d3.timeParse("%Y-%m-%d")
        // const parseTime = d3.timeParse("%Y-%m")
        vis.netArr = Array.from(groupByDate3.entries());
        let groupData = [];
        vis.netArr.forEach(e => {
            let netNum = e[1][0]
            let intakeNum = e[1][1]
            let outcomeNum = e[1][2]
            groupData.push({
                "key": e[0],
                "values": [
                    { "year": e[0], "name": "outcome", "val": outcomeNum },
                    { "year": e[0], "name": "intake", "val": intakeNum }
                ]
            })
        })

        vis.sortedNet = []
        vis.netArr.forEach(e => {
            vis.sortedNet.push({ "year": parseTime(e[0]), "value": e[1] })
        })

        vis.sortedNet.sort(function (a, b) { return a.year - b.year })



        vis.intakeArr.sort(function (a, b) {
                return parseTime(a[0]) - parseTime(b[0])
            }
        )
        vis.outcomeArr.sort(function (a, b) {
                return parseTime(a[0]) - parseTime(b[0])
            }
        )

        // vis.mygroup = [0, 1]
        vis.stackedData = d3.stack()
            .keys(vis.mygroup)
            .value(function (d, key) {
                return d.values[key].val
            })(groupData)

        // sort stacked data to get correct stacked line chart
        this.stackedData.forEach(arr => {
            arr.sort(function (a, b) {
                return parseTime(a.data.key) - parseTime(b.data.key)
            })
        })

        // if (vis.selectTime != null && vis.selectTime[0] != vis.selectTime[1]) {
        //     let minDate = getMinDate(vis.selectTime[0], vis.selectTime[1])
        //     let maxDate = getMaxDate(vis.selectTime[0], vis.selectTime[1])
        //     vis.filtereddata = vis.filtereddata.filter(d => {
        //         let currDate = tmpTimeFormat(d.datetime)
        //         return currDate >= minDate && currDate <= maxDate
        //     });
        //     vis.filtereddata2 = vis.filtereddata2.filter(d => {
        //         let currDate = tmpTimeFormat2(d.datetime)
        //         return currDate >= minDate && currDate <= maxDate
        //     });
        // }

        // get intake data group by date


        if (vis.selectTime != null && vis.selectTime[0] != vis.selectTime[1]) {
            let minDate = getMinDate(vis.selectTime[0], vis.selectTime[1])
            let maxDate = getMaxDate(vis.selectTime[0], vis.selectTime[1])
            vis.xScale.domain([minDate, maxDate]);
        } else {
            vis.xScale.domain([new Date('2013-10-01'), new Date('2018-05-01')]);
        }
        vis.yScale.domain([0, 260]);
        vis.yScaleR.domain([-1500, 1500]);

        vis.renderVis();
    }


    renderVis() {
        let vis = this;

        const parseTime = d3.timeParse("%Y-%m-%d")
        // const parseTime = d3.timeParse("%Y-%m")
        let area = d3.area()
            .x(function (d, i) {
                return vis.xScale(parseTime(d.data.key));
            })
            .y0(function (d) {
                return vis.yScale(d[0]);
            })
            .y1(function (d) { return vis.yScale(d[1]); })

        vis.areaChart.selectAll("mylayers")
            .data(vis.stackedData)
            .join("path")
            .style("fill", function (d) { name = vis.keys[d.key]; return vis.colorScale(name); })
            .attr("d", area)

        vis.areaChart
            .append("g")
            .attr("class", "brush")
            .call(vis.brush);

        // Update axis and area position
        vis.xAxisG.transition().duration(1000).call(d3.axisBottom(vis.xScale).ticks(12))
        vis.areaChart
            .selectAll("path")
            .transition().duration(1000)
            .attr("d", area)

        vis.brushG
            .call(vis.brush)
            .call(vis.brush.move, this.defaultSelection);

        vis.xAxisG
            .call(vis.xAxis)
            .call(g => g.select('.lines').remove());

        vis.yAxisG
            .call(vis.yAxis)
            .call(g => g.select('.domain').remove())

    }
}

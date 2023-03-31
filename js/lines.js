class Line {
    /**
     * Class constructor with initial configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data, _data2) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 800,
            containerHeight: 500,
            margin: { top: 15, right: 10, bottom: 70, left: 60 },
            tooltipPadding: 15,
        }
        this.data = _data;
        this.data2 = _data2;
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
            .range(['#e41a1c','#377eb8'])

        vis.xScale = d3.scaleTime()
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(6)
            .tickFormat(d => {
                return formatDate(new Date(d))
            });

        vis.yAxis = d3.axisLeft(vis.yScale)
            .tickPadding(10);

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // SVG Group containing the actual chart; D3 margin convention
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // Append empty x-axis group and move it to the bottom of the chart
        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`);

        // Append y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', 0)
            .attr('y', 0)
            .attr('dy', '.71em');

    }

    updateVis() {
        let vis = this;

        // get intake data group by date
        let groupByDate = d3.group(this.data, g => {
            return g.datetime.substring(0, 4);
        });

        vis.intakeArr = Array.from(groupByDate.entries());
        vis.intakeArr.forEach(e => {
            e[1] = e[1].length
        })


        // get outcome data group by date
        let groupByDate2 = d3.group(this.data2, g => {
            return g.datetime.substring(0, 4);
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
                groupByDate3.set(e[0], num)
            } else {
                groupByDate3.set(e[0], e[1])
            }
        })

        vis.outcomeArr.forEach(e => {
            if (groupByDate3.get(e[0]) == null) {
                groupByDate3.set(e[0], -e[1])
            }
        })


        // const parseTime = d3.timeParse("%Y-%m-%d")
        const parseTime = d3.timeParse("%Y")
        vis.netArr = Array.from(groupByDate3.entries());
        let groupData = [];
        vis.netArr.forEach(e => {
            let intakeNum = groupByDate.get(e[0]) != null ? groupByDate.get(e[0]).length : 0
            let outcomeNum = groupByDate2.get(e[0]) != null ? groupByDate2.get(e[0]).length : 0
            groupData.push({
                "key": e[0],
                "values":[{"year": e[0], "name": "outcome", "val": outcomeNum},
                    {"year": e[0], "name": "intake", "val": intakeNum}]
            })
        })

        vis.testArr = []
        vis.intakeArr.forEach(e => {

            vis.testArr.push({"year":parseTime(e[0]), "value": e[1]})
        })
        // console.log(vis.testArr)

        vis.xScale.domain(d3.extent(groupData, function(d) { return parseTime(d.key); }));
        vis.yScale.domain([0, 30000]);

        vis.renderVis();
    }


    renderVis() {
        let vis = this;

        console.log(vis.testArr)
        // Add the line
        vis.svg.append("path")
            .datum(vis.testArr)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 3)
            .attr("d", d3.line()
                .x(function(d) {
                    //console.log(d)
                    return vis.xScale(d.year) })
                .y(function(d) { return vis.yScale(d.value) })
            )

        vis.xAxisG
            .call(vis.xAxis)
            .call(g => g.select('.domain').remove());

        vis.yAxisG
            .call(vis.yAxis)
            .call(g => g.select('.domain').remove())

    }


}

function formatDate(date) {
    let d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year].join('-');
}

## Vertical.js

vertical.js is a lightweight javascript framework drawing resources allocation hierarchy using HTML5 canvas.

Example output

![Example](https://raw.githubusercontent.com/deathspeeder/vertical.js/master/example/index.png)

### Setup

vertical.js requires [jQuery](https://jquery.com/), [moment.js](https://momentjs.com) and [paper.js](http://paperjs.org/). Includes them before vertical.js

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.10.3/paper-full.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.17.1/moment.min.js"></script>
  <script src="src/vertical.js"></script>
</head>
<body>
	<canvas id="myCanvas" resize></canvas>
</body>
</html>
```

### Draw

Draw your resources allocation hierarchy with vertical.js

```javascript
$('#myCanvas').verticalResource({
  calendar: {
    start: moment('2017-03-08 11:00:00'),
    end: moment('2017-03-08 23:00:00')
  },
  resources: ['Node01','Node02','Node03','Node04','Node05'],
  verticals: [
    {
      name: "Gray Sort",
      owner: "jun.wang",
      shareType: "Exclusive",
      resources: ['Node01','Node02','Node03', 'Node05'],
      beginTime: moment('2017-03-08 12:00:00'),
      endTime: moment('2017-03-08 17:00:00'),
      services: [
        {
          name: "Hadoop 2.7.0"
        },
        {
          name: "Spark 1.5.1"
        }
      ]
    },
    {
      name: "MySQL",
      owner: "jun.wang",
      shareType: "Share",
      resources: ['Node02','Node03','Node04', 'Node05'],
      beginTime: moment('2017-03-08 17:00:00'),
      endTime: moment('2017-03-08 20:00:00'),
      services: []
    },
    {
      name: "Web",
      owner: "jun.wang",
      shareType: "Share",
      resources: ['Node01','Node02','Node03', 'Node04'],
      beginTime: moment('2017-03-08 19:00:00'),
      endTime: moment('2017-03-08 22:00:00'),
      services: []
    }
  ]
});
```

### options

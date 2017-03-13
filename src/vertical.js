(function ( $ ) {
  'use strict';

  function VerticalResource(canvas, settings) {
    var minWidth = 80;
    var minHeight = 60;

    // Asserts make sure canlendar can be properly drawn
    settings.width = settings.width < minWidth ? minWidth : settings.width;
    settings.height = settings.height < minHeight ? minHeight : settings.height;
    var maxPadding = Math.min(settings.width, settings.height) / 2;
    settings.padding = settings.padding > maxPadding ? maxPadding : settings.padding;

    this.settings = settings;
    this.canvas = canvas;

    paper.setup(canvas);
  };

  VerticalResource.prototype.draw = function() {
    this.createCalendar();
    this.createResources();
    this.createVerticals();

    this.layerBorder.strokeColor = this.settings.calendar.strokeColor;
    // this.layerVertical.fillColor = '#e9e9ff';
    paper.view.draw();
  };

  VerticalResource.prototype.lengthOf = function(str, style) {
    var text = new paper.PointText();
    text.content = str;
    if (style) {
        text.style = style;
    }
    var ctx = this.canvas.getContext('2d');
    ctx.font = text.fontSize + text.font;
    return ctx.measureText(text).width;
  };

  VerticalResource.prototype.createHeader = function(width) {
    this.layerLabel = new paper.Layer();

    var c = this.settings.calendar;
    var hours = moment.duration(c.end.diff(c.start)).asHours();
    // console.log("hours=" + hours);
    var oneStepMinWidth = Math.ceil(this.lengthOf("XXAM", c.fontStyle)) + c.labelMinMargin;
    // console.log("oneStepMinWidth=" + oneStepMinWidth);
    var maxNumberOfColumns = Math.floor(width / oneStepMinWidth);
    var maxNumberOfSteps = maxNumberOfColumns - 1;
    // console.log("maxNumberOfSteps=" + maxNumberOfSteps);

    var possibleStepHours = [1, 2, 4, 6, 8, 12, 24, 48];
    var stepHourIndex = 0;
    for (; stepHourIndex<possibleStepHours.length; stepHourIndex++) {
      var stepsNeeded = Math.ceil(hours / possibleStepHours[stepHourIndex]);
      if (stepsNeeded < maxNumberOfSteps) {
        break;
      }
    }
    var stepHour;
    if (stepHourIndex == possibleStepHours.length) {
      stepHour = 24 * Math.ceil((hours / maxNumberOfSteps) / 24);
    } else {
      stepHour = possibleStepHours[stepHourIndex];
    }
    var numberOfSteps = Math.ceil(hours / stepHour);

    // console.log("stepHour=" + stepHour);
    // console.log("numberOfSteps=" + numberOfSteps);
    var stepLength = width / (numberOfSteps + 1);
    // console.log("stepLength=" + stepLength);

    var startMoment;
    var format = 'ha';
    var header1Format = 'MMM Do, YYYY';
    if (stepHour % 24 == 0) { // display labels as days
      startMoment = c.start.startOf('day');
      format = 'Do';
      header1Format = 'MMM YYYY';
      if (stepHour * numberOfSteps / 24 > 30) {
        format = 'MMM Do';
        header1Format = 'YYYY';
      }
    } else { // display as hour
      startMoment = c.start.startOf('hour');
    }

    var m = startMoment.clone();
    var x = stepLength;
    var y = 2 * c.headerHeight + this.settings.padding - 5;
    for (var i=0; i<numberOfSteps; i++) {
      var text = new paper.PointText();
      text.content = m.format(format);
      if (c.fontStyle) {
        text.style = c.fontStyle;
      }
      text.point = new paper.Point(x, y);
      x += stepLength;
      m = m.add(stepHour, 'hour');
    }

    var header1 = new paper.PointText();
    header1.content = startMoment.clone().add(Math.ceil(hours / 2)).format(header1Format);
    if (c.fontStyle) {
      header1.style = c.fontStyle;
    }
    header1.style.fontSize = 25;
    header1.point = new paper.Point(width / 2 + this.settings.padding, y - c.headerHeight);

    this.numberOfSteps = numberOfSteps;
    this.stepLength = stepLength;
    this.startMoment = startMoment;
    this.stepHour = stepHour;
  };

  VerticalResource.prototype.createCalendar = function() {
    var s = this.settings;
    var calendarWidth = s.width - 2 * s.padding;
    var calendarHeight = s.height - 2 * s.padding;

    this.layerBorder = paper.project.activeLayer;

    var pathHeader0Line = new paper.Path({
      segments: [
        [s.padding, s.padding],
        [s.padding + calendarWidth, s.padding]
      ]
    });
    // var outBorderRec = new paper.Rectangle(s.padding, s.padding, calendarWidth, calendarHeight);
    // var recOutBorder = new paper.Path.Rectangle(outBorderRec);
    var pathHeader1Line = new paper.Path({
      segments: [
        [s.padding, s.padding + s.calendar.headerHeight],
        [s.padding + calendarWidth, s.padding + s.calendar.headerHeight]
      ]
    });
    var pathHeader2Line = new paper.Path({
      segments: [
        [s.padding, s.padding + 2 * s.calendar.headerHeight],
        [s.padding + calendarWidth, s.padding + 2 * s.calendar.headerHeight]
      ]
    });

    this.createHeader(calendarWidth);

  };

  VerticalResource.prototype.createResources = function() {
    var s = this.settings;
    var r = this.settings.resources;
    var c = this.settings.calendar;
    if (r.length == 0) {
      return;
    }

    var longestResourceName = "";
    for (var i=0; i<r.length; i++) {
      if (r[i].length > longestResourceName.length) {
        longestResourceName = r[i];
      }
    }
    var resourceNameLength =
      this.lengthOf(longestResourceName, c.fontStyle);

    var minRowHeight = c.fontStyle.fontSize + 2;
    this.rowHeight = (s.height - 2 * s.padding - 2 * c.headerHeight) / r.length;
    if (this.rowHeight < minRowHeight) {
      this.rowHeight = minRowHeight;
    }
    this.rotateResourceLabel = false;
    if (resourceNameLength + c.labelMinMargin > this.stepLength &&
        resourceNameLength + c.labelMinMargin < this.rowHeight) {
      this.rotateResourceLabel = true;
    }

    // row lines
    var lx = s.padding + this.stepLength / 2;
    var rx = s.padding;
    var ly = s.padding + 2 * c.headerHeight + this.rowHeight / 2 + c.fontStyle.fontSize / 2;
    var ry = s.padding + 2 * c.headerHeight + this.rowHeight;
    var calendarWidth = s.width - 2 * s.padding;
    for (var i=0; i<r.length; i++) {
      this.layerLabel.activate();
      var text = new paper.PointText();
      text.content = r[i];
      if (c.fontStyle) {
        text.style = c.fontStyle;
      }
      text.point = new paper.Point(lx, ly);
      if (this.rotateResourceLabel) {
        text.rotate(-90);
      }

      this.layerBorder.activate();
      var rowLine = new paper.Path({
        segments: [
          [rx, ry],
          [rx + calendarWidth, ry]
        ]
      });

      ly += this.rowHeight;
      ry += this.rowHeight;
    }

    var finalCanvasHeight = ry - this.rowHeight + s.padding;
    if (finalCanvasHeight > s.height) {
      $(this.canvas).height(finalCanvasHeight);
      this.canvas.height = finalCanvasHeight;
    }

    // column lines
    this.layerBorder.activate();
    var x = this.stepLength;
    var y = ry - this.rowHeight;
    for (var i=0; i<this.numberOfSteps; i++) {
      var columnLine = new paper.Path({
        segments: [
          [x, s.padding + 2 * s.calendar.headerHeight],
          [x, y]
        ]
      });
      x += this.stepLength;
    }
    var columnLineLeft = new paper.Path({
      segments: [
        [s.padding, s.padding],
        [s.padding, y]
      ]
    });
    var columnLineRight = new paper.Path({
      segments: [
        [s.padding + calendarWidth, s.padding],
        [s.padding + calendarWidth, y]
      ]
    });
  };

  VerticalResource.prototype.groupResources = function(requestedResources) {
    var r = this.settings.resources;
    if (requestedResources.length == 0) {
      return new Array();
    }

    var sorted = requestedResources.sort(function(a, b) {
      return r.indexOf(a) - r.indexOf(b);
    });

    var groups = [];
    for (var i=0; i<sorted.length; i++) {
      if (groups.length == 0) {
        groups.push([sorted[i]]);
      } else {
        var last = groups[groups.length-1];
        if (r.indexOf(last[last.length-1]) + 1 == r.indexOf(sorted[i])) {
          last.push(sorted[i]);
        } else {
          groups.push([sorted[i]]);
        }
      }
    }
    return groups;
  }

  /**
    Draw lines y = x + b
  */
  VerticalResource.prototype.fillDownwardDiagonal = function(pathRectangle, color) {
    // console.log(pathRectangle.bounds);
    var x = pathRectangle.bounds.x;
    var y = pathRectangle.bounds.y;
    var width = pathRectangle.bounds.width;
    var height = pathRectangle.bounds.height;
    // (x, y+height) -> (x+width, y)
    var startB = y + height - x;
    var endB = y - x - width;
    var step = 5;
    var stepB = Math.sqrt(2) * step;
    function intersect(point) {
      return point.x >= x && point.x <= x + width &&
             point.y >= y && point.y <= y + height;
    }
    for (var b = startB; b > endB; b -= stepB) {
      var intersections = [
        {x: x, y: x + b},
        {x: x + width, y: x + width + b},
        {x: y - b, y: y},
        {x: y + height - b, y: y + height}
      ];

      var validIntersections = [];
      for (var i=0; i<intersections.length; i++) {
        if (intersect(intersections[i])) {
          validIntersections.push(intersections[i]);
        }
      }

      // var intersectionX = intersect(intersectionX1) ? intersectionX1 : intersectionX2;
      // var intersectionY = intersect(intersectionY1) ? intersectionY1 : intersectionY2;

      if (validIntersections.length > 1) {
        var line = new paper.Path({
          segments: [
            [validIntersections[0].x, validIntersections[0].y],
            [validIntersections[1].x, validIntersections[1].y]
          ]
        });
        line.strokeColor = color;
      }
    }
  }

  VerticalResource.prototype.createVerticals = function() {
    function getRandomColor() {
      var letters = '0123456789ABCDEF';
      var color = '#';
      for (var i = 0; i < 6; i++ ) {
          color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }
    this.layerVertical = new paper.Layer();
    var s = this.settings;
    var v = s.verticals;
    for(var i=0; i<v.length; i++) {
      var groups = this.groupResources(v[i].resources);
      var fillColor = getRandomColor();
      for(var j=0; j<groups.length; j++) {
        var y = s.padding + 2 * s.calendar.headerHeight +
                s.resources.indexOf(groups[j][0]) * this.rowHeight;
        var height = groups[j].length * this.rowHeight;
        var x = this.stepLength * moment.duration(v[i].beginTime.diff(this.startMoment)).asHours() / this.stepHour + this.stepLength;
        var width = this.stepLength * moment.duration(v[i].endTime.diff(v[i].beginTime)).asHours() / this.stepHour;
        var recPadding = 1;
        x += recPadding;
        y += recPadding;
        width -= 2 * recPadding;
        height -= 2 * recPadding;
        var borderRec = new paper.Rectangle(x, y, width, height);
        var cornerSize = new paper.Size(5, 5);
        var recBorder = new paper.Path.Rectangle(borderRec, cornerSize);
        if (v[i].shareType == "Exclusive") {
          recBorder.fillColor = fillColor;
        } else {
          recBorder.strokeColor = fillColor;
          this.fillDownwardDiagonal(recBorder, fillColor);
        }
        recBorder.opacity = 0.7;

        var text = new paper.PointText();
        text.content = v[i].name;
        if (s.vertical.fontStyle) {
          text.style = s.vertical.fontStyle;
        }
        text.point = new paper.Point(x + width / 2, y + height / 2);

        var owner = new paper.PointText();
        owner.content = v[i].owner;
        if (s.vertical.fontStyle) {
          owner.style = s.vertical.fontStyle;
          owner.style.fontSize -= 3;
        }
        owner.point = new paper.Point(x + width / 2, y + height / 2 + owner.style.fontSize);
      }
    }
  };

  $.fn.verticalResource = function( options ) {

      // This is the easiest way to have default options.
      var settings = $.extend(true, {
          // These are the defaults.
          width: 800,
          height: 600,
          padding: 5,
          calendar: {
            start: moment().startOf('day'),
            end: moment().endOf('day'),
            strokeColor: '#D3D3D3',
            headerHeight: 30,
            fontStyle: {
              fontFamily: 'Calibri',
              fontWeight: 'normal',
              fontSize: 12,
              fillColor: 'black',
              justification: 'center'
            },
            labelMinMargin: 20

          },
          vertical: {
            fontStyle: {
              fontFamily: 'Calibri',
              fontWeight: 'normal',
              fontSize: 15,
              fillColor: 'black',
              justification: 'center'
            }
          },
          resources: [],
          verticals: []
      }, options );

      var canvas = this[0];
      $(canvas).width(settings.width);
      $(canvas).height(settings.height);

      // paper.setup(canvas);
      // var text = new paper.PointText(paper.view.center);
      // text.content = "Hello Weight";
      // text.style = {
      //   fontFamily: 'Courier New',
      //   fontWeight: 'bold',
      //   fontSize: 30,
      //   fillColor: 'red',
      //   justification: 'center'
      // };

      var vs = new VerticalResource(canvas, settings);
      vs.draw();
  };

}( jQuery ));

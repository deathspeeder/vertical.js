(function ( $ ) {
  'use strict';

  // Pure duck-typing implementation taken from Underscore.js.
  function isFunction(object) {
    return !!(object && object.constructor && object.call && object.apply);
  }

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

    this.initStart = this.settings.calendar.start.clone();
    this.initEnd = this.settings.calendar.end.clone();

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

  VerticalResource.prototype.setTimeRange = function(start, end) {
    this.settings.calendar.start = start;
    this.settings.calendar.end = end;
    paper.project.clear();
    this.draw();
  }

  VerticalResource.prototype.lengthOf = function(str, style) {
    var ctx = this.canvas.getContext('2d');
    ctx.font = style.fontWeight + " " + style.fontSize + "pt " + style.fontFamily;
    // ctx.font = "bold 12pt arial"
    return ctx.measureText(str).width;
  };

  VerticalResource.prototype.defaultTooltipCreator = function(event, fontStyle) {
    var vertical = event.currentTarget.vertical;
    var title = vertical.name + " (" + vertical.shareType + ")";
    var subtitle = vertical.owner
    var format = "YYYY-MM-DD HH:mm:ss";
    var subtitle2 = vertical.beginTime.format(format) + " ~ " + vertical.endTime.format(format);
    var width =  Math.max(Math.max(title.length, subtitle.length), subtitle2.length) * 7;
    var height = 80;

    var x = event.point.x;
    var y = event.point.y;
    if (x + width > paper.view.size.width) {
      x -= width;
    }
    if (y + height > paper.view.size.height) {
      y -= height;
    }

    var tooltipGroup = new paper.Group();
    var tooltipRect = new paper.Rectangle(new paper.Point(x, y), new paper.Size(width, height));
    var tooltip = new paper.Path.Rectangle(tooltipRect, new paper.Size(10, 10));
    tooltip.fillColor = 'white';
    tooltip.strokeColor = 'black';

    var yStart = y + height / 2 - 10;
    var textTitle = new paper.PointText();
    textTitle.content = title;
    textTitle.style = fontStyle;
    textTitle.point = new paper.Point(x + width / 2, yStart);
    var textSubtitle = new paper.PointText();
    textSubtitle.content = subtitle;
    textSubtitle.style = fontStyle;
    textSubtitle.style.fontSize -= 3;
    textSubtitle.point = new paper.Point(x + width / 2, yStart + fontStyle.fontSize);
    var textSubtitle2 = new paper.PointText();
    textSubtitle2.content = subtitle2;
    textSubtitle2.style = fontStyle;
    textSubtitle2.style.fontSize -= 3;
    textSubtitle2.point = new paper.Point(x + width / 2, yStart + 2*fontStyle.fontSize);

    tooltipGroup.addChild(tooltip);
    tooltipGroup.addChild(textTitle);
    tooltipGroup.addChild(textSubtitle);
    tooltipGroup.addChild(textSubtitle2);
    return tooltipGroup;
  }

  VerticalResource.prototype.createButton = function(x, y, title, onclick) {
    this.layerLabel.activate();
    var width = this.lengthOf(title, this.settings.calendar.fontStyle) + 4;
    var height = this.settings.calendar.fontStyle.fontSize + 6;
    var border = new paper.Rectangle(x, y, width, height);
    var button = new paper.Path.Rectangle(border);
    button.fillColor = '#f7f7f7';
    button.name = "button";

    var text = new paper.PointText();
    text.point = new paper.Point(x + width / 2, y + height / 2 + 2);
    text.content = title;
    text.style = this.settings.calendar.fontStyle;

    var group = new paper.Group();
    group.addChild(button);
    group.addChild(text);
    group.onMouseEnter = function(event) {
      event.target.children['button'].fillColor = '#e6e6e6';
      document.body.style.cursor = "pointer";
    };
    group.onMouseLeave = function(event) {
      event.target.children['button'].fillColor = '#f7f7f7';
      document.body.style.cursor = "default";
    };
    group.onClick = function(event) {
      onclick(event);
    };
    return group;
  }

  VerticalResource.prototype.createHeader = function(width) {
    this.layerLabel = new paper.Layer();

    var c = this.settings.calendar;
    var hours = moment.duration(c.end.diff(c.start)).asHours();
    // console.log("hours=" + hours);
    var longestLabel = "XXAM";
    for (var i=0; i<this.settings.resources.length; i++) {
      if (this.settings.resources[i].length > longestLabel.length) {
        longestLabel = this.settings.resources[i];
      }
    }
    var oneStepMinWidth = Math.ceil(this.lengthOf(longestLabel, c.fontStyle)) + c.labelMinMargin;
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
    // console.log("width=" + width);

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
    var x = stepLength + this.settings.padding;
    var y = 2 * c.headerHeight + this.settings.padding;
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

    if (c.zoomButtons.length > 0) {
      var bx = this.settings.padding * 2;
      var by = this.settings.padding + c.fontStyle.fontSize/2 + this.header1HeightOffset;
      var zoom = new paper.PointText();
      zoom.content = "Zoom";
      zoom.style = c.fontStyle;
      var zoomLength = this.lengthOf(zoom.content, c.fontStyle);
      zoom.point = new paper.Point(bx + zoomLength/2, by + c.fontStyle.fontSize);
      bx += zoomLength;
      for (var i=0; i<c.zoomButtons.length; i++) {
        var onclick = function(event) {
          var data = event.target.data;
          var start = data.start;
          if (start == null) {
            start = event.target.vr.initStart;
          }
          var end = data.end;
          if (end == null) {
            end = event.target.vr.initEnd;
          }
          event.target.vr.setTimeRange(start, end);
        }
        var group = this.createButton(bx, by, c.zoomButtons[i].title, onclick);
        group.data = c.zoomButtons[i];
        group.vr = this;
        bx += (this.lengthOf(c.zoomButtons[i].title, c.fontStyle) + 8);
      }
    }

    this.numberOfSteps = numberOfSteps;
    this.stepLength = stepLength;
    this.startMoment = startMoment;
    this.stepHour = stepHour;
    this.displayLength = width - stepLength;
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
    this.header1HeightOffset = 15;
    var pathHeader1Line = new paper.Path({
      segments: [
        [s.padding, s.padding + s.calendar.headerHeight + this.header1HeightOffset],
        [s.padding + calendarWidth, s.padding + s.calendar.headerHeight + this.header1HeightOffset]
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
    var ly = s.padding + 2 * c.headerHeight + this.rowHeight / 2 + c.fontStyle.fontSize / 2 - 2;
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
      paper.view.setViewSize(paper.view.size.width, finalCanvasHeight)
    }

    // column lines
    this.layerBorder.activate();
    var x = this.stepLength + s.padding;
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

    if (c.showCurrentTimeline) {
      this.layerLabel.activate();
      var diffHours = moment().diff(this.startMoment, 'seconds') / 3600;
      var lineX = s.padding + this.stepLength + this.stepLength * diffHours / this.stepHour;
      var currentTimeline = new paper.Path({
        segments: [
          [lineX, s.padding + 2 * s.calendar.headerHeight],
          [lineX, y]
        ]
      });
      currentTimeline.strokeColor = new paper.Color(0, 1, 0);
      currentTimeline.strokeWidth = 2;

      var text = new paper.PointText();
      text.content = "Now";
      if (c.fontStyle) {
        text.style = c.fontStyle;
      }
      text.style.fontSize -= 2;
      text.point = new paper.Point(lineX, s.padding + 2 * s.calendar.headerHeight + 2);
    }
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
  VerticalResource.prototype.fillDownwardDiagonal = function(pathRectangle, color, dashArray) {
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
        line.opacity = this.settings.vertical.opacity;
        if (dashArray) {
          line.dashArray = dashArray;
        }
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
    var v = s.verticals.sort(function(a, b) {
      var merge = [];
      for (var i = 0; i < a.resources.length; i++) {
        merge.push(a.resources[i]);
      }
      for (var i = 0; i < b.resources.length; i++) {
        merge.push(b.resources[i]);
      }
      merge = merge.sort();
      var duplicate = false;
      if (merge.length > 0) {
        for (var i = 1; i < merge.length; i++) {
          if (merge[i] == merge[i-1]) {
            duplicate = true;
            break;
          }
        }
      }
      var overlap = (a.beginTime.isAfter(b.beginTime) && a.beginTime.isBefore(b.endTime)) ||
            (a.endTime.isAfter(b.beginTime) && a.endTime.isBefore(b.endTime)) ||
            (b.beginTime.isAfter(a.beginTime) && b.beginTime.isBefore(a.endTime)) ||
            (b.endTime.isAfter(a.beginTime) && b.endTime.isBefore(a.endTime));

      // these two verticals will be drawn overlap, to avoid the larger one covers
      // the smaller one, we make the smaller drawn after larger. That is smaller
      // one > larger one
      if (duplicate && overlap) {
        var areaA = a.resources.length * a.endTime.diff(a.beginTime, 'hours');
        var areaB = b.resources.length * b.endTime.diff(b.beginTime, 'hours');
        return areaB - areaA;
      } else {
        var ran = Math.random() - 0.5;
        return ran < 0 ? -1 : 1;
      }
    });

    for(var i=0; i<v.length; i++) {
      var groups = this.groupResources(v[i].resources);
      var fillColor = getRandomColor();
      for(var j=0; j<groups.length; j++) {
        var y = s.padding + 2 * s.calendar.headerHeight +
                s.resources.indexOf(groups[j][0]) * this.rowHeight;
        var height = groups[j].length * this.rowHeight;
        var x = this.stepLength * moment.duration(v[i].beginTime.diff(this.startMoment)).asHours() / this.stepHour + this.stepLength + s.padding;
        var width = this.stepLength * moment.duration(v[i].endTime.diff(v[i].beginTime)).asHours() / this.stepHour;
        var xmin = this.stepLength + s.padding;
        if (x < xmin && x + width > xmin) {
          width -= (xmin - x);
          x = xmin;
        } else if (x + width < xmin) {
          continue;
        }
        var xmax = this.displayLength + this.stepLength + s.padding;
        if (x + width > xmax && x < xmax) {
          width = xmax - x;
        } else if (x > xmax) {
          continue;
        }
        var recPadding = 1;
        x += recPadding;
        y += recPadding;
        width -= 2 * recPadding;
        height -= 2 * recPadding;
        var borderRec = new paper.Rectangle(x, y, width, height);
        var cornerSize = new paper.Size(5, 5);
        var recVertical = new paper.Path.Rectangle(borderRec, cornerSize);
        recVertical.strokeColor = fillColor;
        recVertical.opacity = s.vertical.opacity;
        recVertical.strokeWidth = 2;
        if (v[i].shareType == "Exclusive") {
          recVertical.fillColor = fillColor;
        } else if (v[i].shareType == "Share") {
          recVertical.fillColor = 'white';
          this.fillDownwardDiagonal(recVertical, fillColor);
        } else {
          recVertical.fillColor = 'white';
          recVertical.strokeWidth = 1;
        }

        if (v[i].endTime.isBefore(moment())) {
          recVertical.dashArray = s.vertical.dashArray;
        }

        var group = new paper.Group();
        group.vertical = v[i];
        group.addChild(recVertical);

        var displayName = v[i].name;
        var displayOwner = v[i].owner.replace(/@.*/, "");
        var lengthName = this.lengthOf(displayName, s.vertical.fontStyle);
        var lengthOwner = this.lengthOf(displayOwner, s.vertical.fontStyle);
        if (Math.max(lengthName, lengthOwner) < width && s.vertical.fontStyle.fontSize * 2 < height) {
          var text = new paper.PointText();
          text.content = displayName;
          if (s.vertical.fontStyle) {
            text.style = s.vertical.fontStyle;
          }
          text.point = new paper.Point(x + width / 2, y + height / 2);
          group.addChild(text);

          var owner = new paper.PointText();
          owner.content = displayOwner;
          if (s.vertical.fontStyle) {
            owner.style = s.vertical.fontStyle;
            owner.style.fontSize -= 3;
          }
          owner.point = new paper.Point(x + width / 2, y + height / 2 + owner.style.fontSize);
          group.addChild(owner);
        }

        if (s.vertical.tooltip.enable) {
          var defaultCreator = this.defaultTooltipCreator;
          group.onMouseEnter = function(event) {
            if (!isFunction(s.vertical.tooltip.creator)) {
              s.vertical.tooltip.creator = defaultCreator;
            }
            var tooltip = s.vertical.tooltip.creator(event, s.vertical.fontStyle);
            tooltip.name = 'tooltip';
            // Add the tooltip to the parent (group)
            this.parent.addChild(tooltip);
          }

          group.onMouseMove = function(event) {
            this.parent.children['tooltip'].translate(event.delta);
          }

          group.onMouseLeave = function(event) {
            // We retrieve the tooltip from its name in the parent node (group) then remove it
            this.parent.children['tooltip'].remove();
          }
        }

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
            labelMinMargin: 0,
            showCurrentTimeline: false,
            zoomButtons: [
              {
                title: 'day',
                start: moment().startOf('day'),
                end: moment().endOf('day'),
              },{
                title: 'all',
                start: null,
                end: null,
              }
            ]
          },
          vertical: {
            fontStyle: {
              fontFamily: 'Calibri',
              fontWeight: 'normal',
              fontSize: 15,
              fillColor: 'black',
              justification: 'center'
            },
            tooltip: {
              enable: false,
              // creator: function(event, fontStyle) {...}
            },
            opacity: 0.5,
            dashArray: [10, 4]
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
      return vs;
  };

}( jQuery ));

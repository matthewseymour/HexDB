"use strict";

var EdgeEnds = {
    ACUTE: 1,
    OBTUSE: 2,
    PERPENDICULAR: 3,
};

var Colors = {
    NONE : 0,
    BLACK: 1,
    WHITE: 2
};

var Directions = {
    NONE: -1,
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

function invertColor(c) {
    if(c == Colors.WHITE) {
        return Colors.BLACK;
    } else if(c == Colors.BLACK) {
        return Colors.WHITE;
    } else {
        return c;
    }
}


var UPSCALE = 45;
var LABEL_OFFSET = UPSCALE * 0.16;
var STONE_SIZE = 12;
var ROTATE = true;

function getInitBoundingBox() {
    return {
        left: Number.MAX_VALUE,
        right: -Number.MAX_VALUE,
        top: Number.MAX_VALUE,
        bottom: -Number.MAX_VALUE
    };
}

function expandBoundingBox(bb, amt) {
    bb.left -= amt;
    bb.top -= amt;
    bb.bottom += amt;
    bb.right += amt;
}

function updateBoundingBox(bb, x, y) {
    bb.left = Math.min(bb.left, x);
    bb.right = Math.max(bb.right, x);
    bb.top = Math.min(bb.top, y);
    bb.bottom = Math.max(bb.bottom, y);
}

function updateBoundingBoxPoints(bb, points) {
    for(var i = 0; i < points.length; i++) {
        updateBoundingBox(bb, points[i].x, points[i].y);
    }
}

function transform(points, rotateDegrees, rotateX, rotateY) {
    var rotateRad = rotateDegrees * Math.PI / 180;
    var transformed = [];
    for(var i = 0; i < points.length; i++) {
        var point = points[i];
        var x = point.x - rotateX;
        var y = point.y - rotateY;
        var rx = Math.cos(rotateRad) * x - Math.sin(rotateRad) * y + rotateX;
        var ry = Math.sin(rotateRad) * x + Math.cos(rotateRad) * y + rotateY;
        transformed.push({x: rx, y: ry});
    }
    return transformed;
}


function getId(row, col) {
    var rowPre = row < 0 ? "m" : "";
    var colPre = col < 0 ? "m" : "";
    var rowPos = Math.abs(row);
    var colPos = Math.abs(col);
    return "s_" + rowPre + rowPos.toString() + "_" + colPre + colPos.toString();
}


function getXSub(subRow, subCol) {
    if(ROTATE)
        return (0.5 * subCol) * UPSCALE + .5;
    else
        return (.8660254 * 0.5 * subCol + .5 * 0.57735 * (subRow - subCol / 2.0)) * UPSCALE + .5;
}

function getYSub(subRow, subCol) {
    if(ROTATE)
        return (0.57735 * (subRow - subCol / 2.0)) * UPSCALE + .5;
    else
        return (-.5 * 0.5 * subCol + .8660254 * 0.57735 * (subRow - subCol / 2.0)) * UPSCALE + .5;
}    
    
function getX(row, col) {
    if(ROTATE)
        return (col + row / 2.0) * UPSCALE + .5;
    else
        return (.8660254 * (col + row / 2.0) + .5 * row * 0.8660254) * UPSCALE + .5;
}
    
function getY(row, col) {
    if(ROTATE)
        return (row * 0.8660254) * UPSCALE + .5;
    else
        return (-.5 * (col + row / 2.0) + .8660254 * row * 0.8660254) * UPSCALE + .5;
}

function getSubRow(row, col) {
    return col + 2 * row;
}

function getSubCol(row, col) {
    return 2 * col + row;
}





var xmlns = "http://www.w3.org/2000/svg";
function getBuilder(topLevelElem) {
    var builder = {};
    if(topLevelElem) {
        builder.svgElem = topLevelElem;
    } else {
        builder.svgElem = document.createElementNS(xmlns, "svg");
    }

    var stack = [builder.svgElem];

    function appendSvgNode(name, properties, eventHandlers) {
        var node = document.createElementNS(xmlns, name);
        
        for(var prop in properties) {
            node.setAttributeNS(null, prop, properties[prop]);
        }
    
        if(eventHandlers) {
            for(var eventName in eventHandlers) {
                node.addEventListener(eventName, eventHandlers[eventName]);
            }
        }
    
        stack[stack.length - 1].appendChild(node);
        
        return node;
    }
    

    builder.startGroup = function (properties, eventHandlers) {
        stack.push(appendSvgNode("g", properties, eventHandlers));
    }

    builder.endGroup = function() {
        stack.pop();
    }

    builder.line = function(rowStart, colStart, rowEnd, colEnd, properties, eventHandlers) {
        var xStart = getX(rowStart, colStart);
        var yStart = getY(rowStart, colStart);
        var xEnd = getX(rowEnd, colEnd);
        var yEnd = getY(rowEnd, colEnd);

        properties["x1"] = xStart.toString();
        properties["y1"] = yStart.toString();
        properties["x2"] = xEnd.toString();
        properties["y2"] = yEnd.toString();

        appendSvgNode("line", properties, eventHandlers);
    }

    builder.polygon = function(points, properties, eventHandlers) {
        var pointsStrings = [];
    
        for(var i = 0; i < points.length; i++) {
            pointsStrings.push(points[i].x.toString() + "," + points[i].y.toString());
        }
        
        properties["points"] = pointsStrings.join(" ");

        appendSvgNode("polygon", properties, eventHandlers);
    }

    builder.circle = function(row, col, radius, properties, eventHandlers) {
        var x = getX(row, col);
        var y = getY(row, col);
        var r = radius * UPSCALE / 28;
        
        builder.startGroup({"transform": "translate(" + x + " " + y + ")"});
        properties["cx"] = "0";
        properties["cy"] = "0";
        properties["r"] = r.toString();
        appendSvgNode("circle", properties, eventHandlers);
        builder.endGroup();
    }

    builder.stone = function(row, col, properties, eventHandlers) {
        builder.circle(row, col, STONE_SIZE, properties, eventHandlers);
    }

    builder.hex = function(row, col, properties, eventHandlers) {
        var subrow = getSubRow(row, col);
        var subcol = getSubCol(row, col);
        var points = [];

        var corners = [{r: 0,  c:  1}, {r: 1,  c:  1}, {r: 1,  c:  0}, {r: 0,  c: -1}, {r: -1, c: -1}, {r: -1, c:  0}];
        for (var i = 0; i < corners.length; i++) {
            points.push({x: getXSub(subrow + corners[i].r, subcol + corners[i].c), y: getYSub(subrow + corners[i].r, subcol + corners[i].c)});
        }

        builder.polygon(points, properties, eventHandlers);
    }

    builder.edge = function(rotate, row, col, n, color, startType, endType, properties, eventHandlers) {
        var obtuseDist = Math.sqrt(3);
        var acuteDist = obtuseDist * Math.sqrt(3) * .5 * Math.cos(Math.PI / 6) / Math.cos(Math.PI / 3);
        var perDist = obtuseDist * Math.sqrt(3) * .5 * Math.cos(Math.PI / 6);
        
        var initRow = getSubRow(row, col);
        var initCol = getSubCol(row, col);
        
        var points = [];
        
        if(startType == EdgeEnds.ACUTE) {
            points.push({x: getXSub(initRow - acuteDist, initCol - acuteDist), y: getYSub(initRow - acuteDist, initCol - acuteDist)});
            points.push({x: getXSub(initRow - 1, initCol - 1), y: getYSub(initRow - 1, initCol - 1)});
        } else if(startType == EdgeEnds.OBTUSE) {
            points.push({x: getXSub(initRow - obtuseDist, initCol - obtuseDist / 2), y: getYSub(initRow - obtuseDist, initCol - obtuseDist / 2)});
            points.push({x: getXSub(initRow - 1, initCol - .5), y: getYSub(initRow - 1, initCol - .5)});
        } else if(startType == EdgeEnds.PERPENDICULAR) {
            points.push({x: getXSub(initRow - perDist - .5, initCol - 1), y: getYSub(initRow - perDist - .5, initCol - 1)});
            points.push({x: getXSub(initRow - 1           , initCol - 1), y: getYSub(initRow - 1           , initCol - 1)});
        }

        for(var i = 1; i < n * 2; i++) {
            col = i + initCol - 1;
            row = Math.floor(i / 2) + initRow - 1;
            points.push({x: getXSub(row, col), y: getYSub(row, col)});
        }
        
        if(endType == EdgeEnds.ACUTE) {
            points.push({x: getXSub(initRow + n - 1, initCol + (n - 1) * 2 + 1), y: getYSub(initRow + n - 1, initCol + (n - 1) * 2 + 1)});
            points.push({x: getXSub(initRow + n - 1, initCol + (n - 1) * 2 + acuteDist), y: getYSub(initRow + n - 1, initCol + (n - 1) * 2 + acuteDist)});
        } else if(endType == EdgeEnds.OBTUSE) {
            points.push({x: getXSub(initRow + n - 1.5, initCol + (n - 1) * 2 + 0.5), y: getYSub(initRow + n - 1.5, initCol + (n - 1) * 2 + 0.5)});
            points.push({x: getXSub(initRow + n - 1 - obtuseDist / 2, initCol + (n - 1) * 2 + obtuseDist / 2), y: getYSub(initRow + n - 1 - obtuseDist / 2 , initCol + (n - 1) * 2 + obtuseDist / 2)});
        } else if(endType == EdgeEnds.PERPENDICULAR) {
            points.push({x: getXSub(initRow + n - 1,                    initCol + (n - 1) * 2 + 1), y: getYSub(initRow + n - 1                   , initCol + (n - 1) * 2 + 1)});
            points.push({x: getXSub(initRow + n - 1 + 1 - perDist - .5, initCol + (n - 1) * 2 + 1), y: getYSub(initRow + n - 1 + 1 - perDist - .5, initCol + (n - 1) * 2 + 1)});
        }
        
        var rotateDegrees = rotate * 60;
        var rotateX = getXSub(initRow, initCol);
        var rotateY = getYSub(initRow, initCol);
        
        properties["class"] = (color == Colors.BLACK ? "edge blackEdge" : "edge whiteEdge");
        properties["transform"] = "rotate(" + rotateDegrees + " " + rotateX + " " + rotateY + ")";
        properties["stroke-miterlimit"] = (1 / Math.sin(Math.PI / 4)).toString();
        builder.polygon(points, properties, eventHandlers);
    }

    builder.text = function(text, x, y, properties, eventHandlers) {
        properties["x"] = x.toString();
        properties["y"] = y.toString();
        var textNode = appendSvgNode("text", properties, eventHandlers);
        textNode.textContent = text;
    }

    builder.drawLabel = function(text, row, col, properties, eventHandlers) {
        var x = getX(row, col);
        var y = getY(row, col);
        if(!properties["class"] === undefined) {
            properties["class"] = "";
        }
        properties["class"] += " label";
    
        builder.text(text, x, y, properties, eventHandlers);
    }

    builder.drawLabelTop = function(text, row, col, properties, eventHandlers) {
        //function drawText(text, x, y, text_anchor, dominant_baseline, options) {
    //return "<text x = '"+ x +"' y = '"+ y +"' text-anchor = '"+text_anchor+"' dominant-baseline = '"+dominant_baseline+"' "+options+" >"+text+"</text>\n";
        /*
        function drawLabel(row, col, text, stoneColor, boundingBox) {
    var labelIdText = getIdLabel(row, col);
    
    
    var returnString = "";
    var style = "font-size ='16' font-family='sans-serif' ";
    if (stoneColor == Colors.BLACK) {
        style += "fill='#ffffff'";
    } else if (stoneColor == Colors.WHITE) {
        style += "fill='#242424'";
    }
    
    //ugly hack, browsers seem to put in letter spacing even after the last letter, so to center shift x by half the letter spacing:
    var options = "letter-spacing = '" + LABEL_LETTER_SPACING.toString() + "px' " + style;
    returnString += drawText(text, x + LABEL_LETTER_SPACING / 2, y + LABEL_Y_OFFSET, "middle", "central", options);
    return returnString;
        */
        var x = getX(row, col);
        var y = getY(row, col) - LABEL_OFFSET;
        //var LABEL_LETTER_SPACING = -.5;
        //properties["letter-spacing"] = LABEL_LETTER_SPACING.toString() + "px";
        if(!properties["class"] === undefined) {
            properties["class"] = "";
        }
        properties["class"] += " labelSmall";
    
        builder.text(text, x, y, properties, eventHandlers);
    }

    builder.drawLabelBottom = function(text, row, col, properties, eventHandlers) {
        var x = getX(row, col);
        var y = getY(row, col) + LABEL_OFFSET;
        if(!properties["class"] === undefined) {
            properties["class"] = "";
        }
        properties["class"] += " labelSmall";
    
        builder.text(text, x, y, properties, eventHandlers);
    }


    return builder;
}


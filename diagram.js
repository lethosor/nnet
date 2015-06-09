$(function() {
    var row_dist = 25,
        col_dist = 150,
        circle_size = 20;
    var canvas = $('canvas:first');
    stage = new createjs.Stage(canvas[0]);
    var cwidth = canvas.width(),
        cheight = canvas.height();
    stage.clear();
    var dims = [20, 15, 10];
    coords = [];
    iter(dims, function (col, dim) {
        coords[col] = [];
        iter(dim, function (row) {
            coords[col][row] = {
                x: col_dist * (col + 1),
                y: (cheight / 2) - (dim * row_dist / 2) + row_dist * row
            };
        });
    });
    var layer1 = new createjs.Shape();
    layer1.graphics.beginStroke('black');
    iter(coords, function (i, col) {
        if (i > 0) {
            iter(col, function (_, cur) {
                iter(coords[i-1], function (_, prev) {
                    layer1.graphics.moveTo(prev.x, prev.y).lineTo(cur.x, cur.y);
                });
            });
        }
    });
    stage.addChild(layer1);
    iter(coords, function (_, col) {
        iter(col, function (_, cur) {
            var circle = new createjs.Shape();
            circle.graphics.beginStroke('black').beginFill('white').drawCircle(cur.x, cur.y, circle_size/2);
            stage.addChild(circle);
        })
    })
    stage.update();
});

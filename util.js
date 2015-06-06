function _toNum (handler, msg) {
    return function (orig, default_) {
        var val = handler(orig);
        if (isNaN(val)) {
            if (default_ === undefined)
                throw new TypeError((msg || 'Invalid number') + ': "' + orig + '"');
            else
                val = default_;
        }
        return val;
    }
}
toInt = _toNum(parseInt, 'Invalid integer');
toFloat = _toNum(parseFloat, 'Invalid decimal');

function randInt (a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

function roundTo (n, decimals) {
    return Math.round(n * Math.pow(10, decimals)) /  Math.pow(10, decimals);
}

function distance (x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function IterBreak() {};
function iter (obj, cb) {
    var max = obj.length || obj;
    for (var i = 0; i < max; i++) {
        try {
            cb(i, obj[i]);
        }
        catch (e) {
            if (!(e instanceof IterBreak))
                throw e;
            break;
        }
    }
}

function cloneArray (arr) {
    return [].slice.apply(arr);
}

function makeDialogInput(value) {
    return $('<div>').addClass('row').append(
        $('<span>').addClass('col-sm-12').append(
            $('<input type="text">').addClass("form-control").val(value)
        )
    );
}

function showMessageBox(title, contents, type) {
    BootstrapDialog.show({
        type: 'type-' + (type || 'default'),
        title: title,
        message: contents,
        buttons: [{
            label: "Ok",
            action: function (dialog) {
                dialog.close();
            }
        }],
    });
}

function Circle (x, y, r, fill) {
    this.x = x; this.y = y; this.r = r;
    var s = new createjs.Shape();
    this.shape = s;
    var _stage;
    s.x = x;
    s.y = y;
    this.setFill = function (color) {
        s.graphics.clear();
        s.graphics.setStrokeStyle(1);
        s.graphics.beginStroke('#555');
        s.graphics.beginFill(color);
        s.graphics.drawCircle(0, 0, r);
    }
    if (fill)
        this.setFill(fill);
    this.addTo = function (stage) {
        stage.addChild(s);
        _stage = stage;
    }
}

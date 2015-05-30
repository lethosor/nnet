function Context(selector) {
    var elt = $(selector);
    var ctx = $(selector)[0].getContext('2d');
    var wrapper = {ctx: ctx};

    wrapper.clear = function() {
        ctx.clearRect(0, 0, elt.width(), elt.height())
    }

    wrapper.drawText = function (text, x, y, color, font) {
        if (color)
            ctx.fillStyle = color;
        if (font)
            ctx.font = font;
        else if (wrapper.defaultFont)
            ctx.font = wrapper.defaultFont;
        ctx.fillText(text, x, y);
    }

    return wrapper;
}

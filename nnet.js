nnet = (function() {
    function Break() {};
    function iter (obj, cb) {
        var max = obj.length || obj;
        for (var i = 0; i < max; i++) {
            try {
                cb(i, obj[i]);
            }
            catch (e) {
                if (!(e instanceof Break))
                    throw e;
                break;
            }
        }
    }

    function Neuron() {

    }

    function Layer (count) {
        this.neurons = [];
        iter(count, function(i) {
            this.neurons[i] = new Neuron();
        });
    }

    function Network (dims) {
        this.layers = [];
        iter(dims, function(i, count) {
            this.layers[i] = new Layer(count);
        });
    }

    return {
        Neuron: Neuron,
        Layer: Layer,
        Network: Network,
    };
})();

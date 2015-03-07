(function () {
function Chain(arr) {
	this._arr = arr;
	this._chain = [];
}
var Chp = Chain.prototype;
Chp.filter = function (cb) {
	this._chain.push({fn: 'filter', cb: cb}); return this;
}
Chp.map = function (cb) {
	this._chain.push({fn: 'map', cb: cb}); return this;
}
Chp.flatMap = function (cb) {
	this._chain.push({fn: 'flatMap', cb: cb}); return this;
}
function evalNext(item, restChain) {
	if (!restChain.length) return;
	var link = restChain[0];
	if (link.fn === 'filter') {
		if (link.cb(item)) evalNext(item, restChain.slice(1));
	} else if (link.fn === 'map') {
		evalNext(link.cb(item), restChain.slice(1));
	} else if (link.fn === 'flatMap') {
		link.cb(item).each(function (item) { evalNext(item, restChain.slice(1)); });
	} else if (link.fn === 'each') {
		link.cb(item); // todo: should this be end of iteration?
	} else {
		throw "Unrecognized fn " + link.fn;
	}
}
Chp.each = function (cb) {
	var self = this;
	this._chain.push({fn: 'each', cb: cb});
	this._arr.each(function (item) { evalNext(item, self._chain); });
}
Chp.value = function () {
	var arr = [];
	this.each(function (item) {
		arr.push(item);
	});
	return arr;
}
Chp.toString = function () { return "[Chain Object]"; }
return Chain;
})();
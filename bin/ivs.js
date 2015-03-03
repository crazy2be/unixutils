var shell = WScript.CreateObject("WScript.Shell");
var fs = WScript.CreateObject("Scripting.FileSystemObject");
function require(path) { fs.OpenTextFile(path, 1).ReadAll(); }
function pl(/*...*/) {
	var args = [].slice.apply(arguments), str = '';
	for (var i = 0; i < args.length; i++) {
		str += (i > 0 ? ' ' : '') + '"' + args[i] + '"'; }
	// This throws errors in the GUI version of WSH.
	try { WScript.StdOut.WriteLine(str); } catch (e) {} }
function assert(condition) {
	if (!condition) {
		throw new Error("Assertion failed!");
		WScript.Quit(1);}}
function Path(arg) { if (typeof arg == "string") this.init(arg); else this._parts = arg.slice(); }
var Pp = Path.prototype;
Pp.init = function (str) { this._parts = str.split('\\'); }
Pp.clone = function (str) { return new Path(this._parts); }
Pp.parent = function () { var p = this.clone(); p._parts.pop(); return p; }
Pp.join = function (path) { return new Path(this._parts.concat(path._parts)); }
Pp.add = function (piece) { return this.join(new Path(piece)); }
Pp.toString = function () { return this._parts.join('\\'); }
Pp.last = function () { return this._parts[this._parts.length - 1]; }

Array.prototype.each = function (cb) { for (var i = 0; i < this.length; i++) cb(this[i], i, this); };
String.prototype.startsWith = function (s) { return this.indexOf(s) === 0; };

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
// TODO: Do something special when commands crash!
function Cmd(cmdLine) {
	this._cmdLine = cmdLine;
}
var Cmdp = Cmd.prototype;
Cmdp.each = function (cb) {
	var cmd = shell.Exec(this._cmdLine);
	while (!cmd.StdOut.AtEndOfStream) {
		var line = cmd.StdOut.ReadLine();
		cb(line);
	}
};

function squeaky() {
	var tortoiseCleanup = "TortoiseProc /command:cleanup /path:.";
	shell.Exec("TortoiseProc /command:cleanup /path:.");
}
function writeLine(line) {
	if (line[line.length - 1] != "\n") WScript.StdOut.Write(line + "\n");
}
function /*filter*/blankLines(line) {
	// http://stackoverflow.com/questions/1418050/string-strip-for-javascript
	return line.replace(/^\s+|\s+$/g, '').length > 0;
}
function update() {
	var externalLine = "";
	new Chain(new Cmd("svn update"))
		.flatMap(function (line) {
			if (line.startsWith("Fetching external item into '")) {
				assert(!externalLine); externalLine = line; return [];
			} else if (line.startsWith("External at revision")) {
				assert(externalLine); externalLine = ""; return [];
			} else if (externalLine !== false) {
				var r = [externalLine, line]; externalLine = false; return r;
			} else return [line];
		}).filter(blankLines).each(writeLine);
	new Chain(new Cmd("src\\post-update.bat")).filter(blankLines).each(writeLine);
}
function status() {
	var externals = {};
	new Chain(new Cmd("svn status")).filter(blankLines).filter(function (line) {
		if (line.startsWith("X")) {
			var external = line.split(" ").slice(-1).pop();
			assert(!externals[external]); externals[external] = true;
			return false;
		} else if (line.startsWith("Performing status on external item at '")) {
			var external = line.split("'")[1];
			assert(externals[external]); externals[external] = false;
			return false;
		} else {
			return true;
		}
	}).each(writeLine);
}

var commands = {status: status, st: status,
	squeaky: squeaky, sq: squeaky,
	update: update, up: update};
function parseArgs() {
	function toArray(wsArgs) {
		var args = [];
		for (var i = 0; i < wsArgs.Length; i++) {
			args[i] = wsArgs.Item(i);
		}
		return args;
	}
	var args = toArray(WScript.Arguments);
	if (args.length < 1) {
		pl("Usage: ivs [command]");
		WScript.Quit(1);
	}
	var command = args[0];
	if (!commands[command]) {
		new Chain(new Cmd('svn ' + args.join(' '))).each(writeLine);
		WScript.Quit(0);
	}
	return function () {
		commands[command](args.slice(1));
	}
}
parseArgs()();
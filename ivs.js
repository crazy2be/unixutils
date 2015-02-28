var shell = WScript.CreateObject("WScript.Shell");
var fs = WScript.CreateObject("Scripting.FileSystemObject");
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

function squeaky() {
	var tortoiseCleanup = "TortoiseProc /command:cleanup /path:.";
	shell.Exec("TortoiseProc /command:cleanup /path:.");
}
function writeLine(line) {
	if (line[line.length - 1] != "\n") WScript.StdOut.Write(line + "\n");
}
function update() {
	var svn = shell.Exec("svn update");
	var externalLine = "";
	while (!svn.StdOut.AtEndOfStream) {
		var line = svn.StdOut.ReadLine();
		if (line.length === 0) {
			continue;
		} else if (line.indexOf("Fetching external item into '") === 0) {
			assert(!externalLine); externalLine = line;
		} else if (externalLine && line.indexOf("External at revision") === 0) {
			assert(externalLine); externalLine = "";
		} else {
			if (externalLine) {
				writeLine(externalLine); externalLine = "";
			}
			writeLine(line);
		}
	}
	WScript.StdOut.Write(shell.Exec("src\\post-update.bat").StdOut.ReadAll());
}
function status() {
	var svn = shell.Exec("svn status");
	var externals = {};
	while (!svn.StdOut.AtEndOfStream) {
		var line = svn.StdOut.ReadLine();
		if (line.length === 0) {
			continue;
		} else if (line.indexOf("X") === 0) {
			var external = line.split(" ").slice(-1).pop();
			assert(!externals[external]); externals[external] = true;
		} else if (line.indexOf("Performing status on external item at '") === 0) {
			var external = line.split("'")[1];
			assert(externals[external]); externals[external] = false;
		} else {
			writeLine(line);
		}
	}
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
		pl("Usage: ivs [status]");
		WScript.Quit(1);
	}
	var command = args[0];
	if (!commands[command]) {
		pl("Unrecognized command", command);
		WScript.Quit(1);
	}
	return function () {
		commands[command](args.slice(1));
	}
}
parseArgs()();
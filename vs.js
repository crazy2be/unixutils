var VISUAL_STUDIO = "C:\\Program Files (x86)\\Microsoft Visual Studio 12.0\\Common7\\IDE\\devenv.exe";

var shell = WScript.CreateObject("WScript.Shell");
var fs = WScript.CreateObject("Scripting.FileSystemObject");
function pl(/*...*/) {
	var args = [].slice.apply(arguments), str = '';
	for (var i = 0; i < args.length; i++) {
		str += (i > 0 ? ' ' : '') + '"' + args[i] + '"'; }
	// This throws errors in the GUI version of WSH.
	try { WScript.StdOut.WriteLine(str); } catch (e) {} }
function Path(arg) { if (typeof arg == "string") this.init(arg); else this._parts = arg.slice(); }
var Pp = Path.prototype;
Pp.init = function (str) { this._parts = str.split('\\'); }
Pp.clone = function (str) { return new Path(this._parts); }
Pp.parent = function () { var p = this.clone(); p._parts.pop(); return p; }
Pp.join = function (path) { return new Path(this._parts.concat(path._parts)); }
Pp.add = function (piece) { return this.join(new Path(piece)); }
Pp.toString = function () { return this._parts.join('\\'); }
Pp.last = function () { return this._parts[this._parts.length - 1]; }

function svnRoot(path) {
	var maybe = path.add('.svn').toString();
	pl("Checking for ", maybe);
	return fs.FolderExists(maybe);
}
var path = new Path(shell.CurrentDirectory);
while (!svnRoot(path)) {
	var parent = path.parent();
	pl(path, parent);
	if (parent.toString() == path.toString()) {
		throw new Error("Not in a subversion repository!");
	}
	path = parent;
}
pl("Found root:", path);

if (fs.FileExists(path.add('src').add('Intents(' + path.last() + ').opensdf'))) {
	WScript.Echo("Visual studio project is already open! Exiting...");
	WScript.Quit();
}

var cmd = '"' + VISUAL_STUDIO + '" "' + path.add('src').add('Intents(' + path.last() + ').sln') + '"';
pl(cmd);
shell.Run(cmd);
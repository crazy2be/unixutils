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

Array.prototype.each = function (cb) { for (var i = 0; i < this.length; i++) cb(this[i], i, this); };
String.prototype.startsWith = function (s) { return this.indexOf(s) === 0; };
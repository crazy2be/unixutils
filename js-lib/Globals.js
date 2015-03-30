var shell = WScript.CreateObject("WScript.Shell");
var fs = WScript.CreateObject("Scripting.FileSystemObject");

function pl(/*...*/) {
	var args = [].slice.apply(arguments), str = '';
	for (var i = 0; i < args.length; i++) {
		str += (i > 0 ? ' ' : '') + '"' + args[i] + '"'; }
	// This throws errors in the GUI version of WSH.
	try { WScript.StdOut.WriteLine(str); } catch (e) {} }
	
function assert(condition, message) {
	if (!condition) {
		throw new Error("Assertion failed! " + (message || "(no details provided)"));
		WScript.Quit(1);}}

Array.prototype.each = function (cb) { for (var i = 0; i < this.length; i++) cb(this[i], i, this); };
Array.prototype.map = function (cb) { var a = []; for (var i = 0; i < this.length; i++) a[i] = cb(this[i], i, this); return a; };
String.prototype.startsWith = function (s) { return this.indexOf(s) === 0; };
String.prototype.endsWith = function (s) { return this.lastIndexOf(s) === this.length - s.length; };
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
String.prototype.trim = function () { return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '') };
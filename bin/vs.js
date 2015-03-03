function require(path) { return WScript.CreateObject("Scripting.FileSystemObject")
		.OpenTextFile("C:\\UnxUtils\\js-lib\\" + path + ".js", 1).ReadAll(); }

eval(require("Globals"));
var Path = eval(require("Path"));

var root = Path.findSvnRoot();
pl("Found root:", root);
var proj = 'Intents(' + root.last() + ')';
var src = root.add('src');

if (src.add(proj + '.opensdf').fileExists()) {
	WScript.Echo("Visual studio project is already open! Exiting...");
	WScript.Quit();
}

var VISUAL_STUDIO = "C:\\Program Files (x86)\\Microsoft Visual Studio 12.0\\Common7\\IDE\\devenv.exe";
var cmd = '"' + VISUAL_STUDIO + '" "' + src.add(proj + '.sln') + '"';
pl(cmd);
shell.Run(cmd);
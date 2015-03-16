function require(path) { return WScript.CreateObject("Scripting.FileSystemObject")
		.OpenTextFile("C:\\UnxUtils\\js-lib\\" + path + ".js", 1).ReadAll(); }

eval(require("Globals"));
var Chain = eval(require("Chain"));
var Path = eval(require("Path"));

function findNearestSln() {
	function slnInDirectory(path) {
		var sln = path.files().filter(function (file) { return file.Name.endsWith('.sln'); }).value();
		return sln.length >= 1 && sln;
	}
	var path = Path.currentDirectory();
	while (!slnInDirectory(path)) {
		var parent = path.parent();
		if (parent.toString() == path.toString()) {
			throw new Error("Could not find a visual studio solution!");
		}
		path = parent;
	}
	return new Path(slnInDirectory(path));
}

var blah = findIntentsSln();
if (blah) {
	var folder = blah[0], name = blah[1];
	openProject(folder, name);
} else {
	var sln = findNearestSln();
	var folder = sln.folder();
	var name = sln.basename();
	openProject(folder, name);
}

function findIntentsSln() {
	try {
		var root = Path.findSvnRoot();
	} catch (e) { return null; }
	pl("Found root:", root);
	var proj = 'Intents(' + root.last() + ')';
	var src = root.add('src');
	var sln = src.add(proj + '.sln');

	if (!sln.fileExists()) {
		var waitForExit = true;
		shell.Run(Path.findSvnRoot().add("src").add("post-update.bat"), 0, waitForExit);
	}
	return [src, proj];
}
function openProject(folder, name) {
	if (folder.add(name + '.opensdf').fileExists()) {
		WScript.Echo("Visual studio project is already open! Exiting...");
		WScript.Quit();
	}
	var VISUAL_STUDIO = "C:\\Program Files (x86)\\Microsoft Visual Studio 12.0\\Common7\\IDE\\devenv.exe";
	var cmd = '"' + VISUAL_STUDIO + '" "' + folder.add(name + '.sln') + '"';
	pl(cmd);
	shell.Run(cmd);
}